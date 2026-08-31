# Park Hotel Panorama — PHP backend (SiteGround)

Replaces `Backend/` (Node/Express) for deployment on SiteGround, which cannot run a
persistent Node.js process. The existing Vite frontend (`Frontend/`) needs **zero
changes** — this reproduces the exact same `/api/*` contract.

`Backend/` stays in the repo untouched for reference until this is verified working
on SiteGround Staging.

## One-time local setup

1. `cp app/config.example.php app/config.local.php` and fill in real values (DB
   credentials, admin email/password, DeepL key, `uploads_dir`).
2. Install a local PHP environment if you don't have one — [Laragon](https://laragon.org/)
   (Windows, one-click, bundles PHP + Apache + MySQL; Postgres can be added) is the
   easiest way to actually run and test this before uploading anywhere.

## Database

**Primary: PostgreSQL.** Confirm SiteGround Site Tools → Databases offers PostgreSQL
on your plan (GrowBig/GoGeek tiers, per earlier research), create one, then:

```
php database/apply-schema.php schema.postgres.sql
```

If your plan is MySQL-only, use `schema.mysql.sql` instead and set
`db.driver = 'mysql'` in `config.local.php` — the app already branches on this in
the two places that differ (`App\Db\Database::insertReturningId()` and
`SettingsRepository::update()`'s upsert).

## Migrating existing content

1. Locally: `php database/export-legacy-data.php` — reads `Backend/.env`'s DB
   credentials directly, writes `database/legacy-data.json` (settings, rooms,
   gallery, events, amenities — **not** bookings/inquiries/sessions, which are
   operational data, not content).
2. Upload `legacy-data.json` to `database/` on SiteGround via SFTP.
3. On SiteGround (SSH, or a temporary admin-only route if your plan has no SSH):
   `php database/import-legacy-data.php` — inserts through the same Repository
   classes the live app uses (not raw SQL), preserving the original ids.
4. Upload images: merge `Backend/public/images/*` and `Frontend/public/images/*`
   into `public_html/images/` via SFTP, keeping `uploads/` as the persistent
   subfolder untouched by future frontend redeploys.

## Deploying

Two independent channels — there's no Node build tooling on SiteGround:

- **This backend** (`backend-php/`): Site Tools → Devs → Git, deployed straight
  from the repo. No build step for plain PHP.
- **Frontend** (`Frontend/dist/`, built locally or in CI via `npm run build`):
  upload via SFTP to `public_html/`. Never touches `public_html/api/` or
  `public_html/images/uploads/`.

Deployed layout on SiteGround:

```
public_html/
  .htaccess              <- copy from deploy/root.htaccess (renamed)
  index.html, assets/, admin/, events/    <- Frontend/dist
  images/                <- merged Backend+Frontend images, uploads/ persistent
  api/                   <- backend-php/public/*
  app/                   <- backend-php/app/* (config.local.php lives here, SFTP only)
```

Checklist:
- PHP Manager: PHP 8.1+, extensions `pdo_pgsql` (or `pdo_mysql`), `gd`, `curl`,
  `mbstring`, `fileinfo`.
- `config.local.php` uploaded via SFTP only — never committed, never deployed by Git.
- `uploads_dir` in `config.local.php` set to the real absolute path on this
  account (e.g. `/home/<account>/public_html/images/uploads`) — check via File
  Manager/SSH, it varies per account.
- Use SiteGround's Staging tool to verify the full surface before cutover; keep
  the Node deployment reachable in parallel until Staging passes.

## Running tests

An automated test suite lives in `tests/` — no PHPUnit/Composer, just a small
custom runner (`tests/TestCase.php` + `tests/run.php`), matching the rest of
this backend's zero-dependency style.

1. `cp tests/config.example.php tests/config.local.php` — same DB server/role
   as `app/config.local.php`.
2. `php tests/run.php` — runs everything. `php tests/run.php Repositories/RoomRepositoryTest`
   runs just one class.

Each run drops and recreates a dedicated `test_suite` **schema** inside the same
database (not a separate database — the dev DB role doesn't have `CREATEDB`
privilege) and points the test connection's `search_path` at it, so tests never
touch real data in the `public` schema. Verified this session: 57 tests, all
passing, real data confirmed untouched before/after.

DeepL's real API is deliberately **not** called by the automated suite (no
network, no quota use, no flakiness) — `TranslateService` is initialized with
an empty key, which exercises its own graceful same-text-everywhere fallback
path. The real API call was verified manually this session instead, which is
also how a real bug was found: DeepL now requires the key via an
`Authorization: DeepL-Auth-Key <key>` header, not the `auth_key` body field
older docs describe — already fixed in `TranslateService::callDeepL`.

Two other real (non-test) bugs surfaced and were fixed by writing these tests:
- `Database.php` wasn't forcing the Postgres session timezone to UTC — on a
  server whose default session timezone isn't UTC (confirmed non-UTC here),
  `AdminAuth`'s naive `gmdate()` session-expiry writes were silently
  misinterpreted, shifting every admin session's real expiry by the server's
  UTC offset. Now forced explicitly in `Database::init()`.
- `Response::json()` calling `header()` is now skipped under the CLI SAPI
  (only ever the test suite or `database/*.php` scripts — the real deployed
  app always runs under Apache/PHP-FPM) since CLI has no real headers to send.

## Manual verification (still worth doing once, live)

The automated suite covers the PHP application logic in isolation; it does
**not** exercise Apache's `.htaccess` rewrite rules (`php tests/run.php` calls
`Router` directly, bypassing them entirely) or anything SiteGround-specific.
Do this once, for real, before trusting a deploy:

- Homepage loads: settings/rooms/amenities/gallery/events all render.
- Submit a booking and a contact form.
- Admin: login → create/edit/delete a room → upload an image → confirm it
  renders → toggle a booking status → logout → confirm the old token now gets
  `401`.
- Spot-check a few imported rooms/gallery items/events against the current
  live site's content.

## Optional housekeeping

`php database/cleanup-sessions.php` (wire to a nightly SiteGround Cron Job) prunes
expired `admin_sessions` rows. Not required for correctness — expired sessions are
already rejected and deleted lazily on lookup — just keeps the table small.

`php database/backfill-translations.php` — run manually (or via Cron) after adding
or changing `deepl_api_key`, to fill in any room/event/amenity language slots that
were saved before a key existed. Node ran this automatically at boot; PHP has no
equivalent long-lived process to hook that into.
