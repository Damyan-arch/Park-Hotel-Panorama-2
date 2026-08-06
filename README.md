# Park Hotel Panorama — Redesign Mockup #2

A new visual design for the Park Hotel Panorama website (Tryavna, Bulgaria). Same content as the current build — rooms, photos, amenities, gallery, map and contact details — with a completely new look: pine-green/gold palette, Fraunces + Manrope typography, and a faster, mobile-first layout with sticky click-to-call.

## Structure

- `Backend/` — Express API. Content (rooms, gallery, settings, amenities) is persisted to `Backend/data/db.json` and edited via the admin dashboard; uploaded/existing photos are served from `Backend/public/images`.
- `Frontend/` — Vite + vanilla JS site that renders the new design and calls the API

## Run locally

**Backend** (port `3002`):

```bash
cd Backend
npm install
npm start
```

**Frontend** (port `4202`):

```bash
cd Frontend
npm install
npm run dev
```

Then open **http://localhost:4202**.

The frontend fetches rooms/gallery/settings from `http://localhost:3002/api/*` on load, with built-in fallback content if the API is briefly unreachable, and posts the contact form to `POST /api/contact`.

## Staff / admin access

There is no "Admin" link anywhere on the public site or in its bundled code. Front-desk staff view booking requests and contact messages by going directly to:

**http://localhost:4202/admin/**

Default credentials (change the password before this ever goes near a real deployment):

- Email: `damian.tsvetkov@hermeses.com`
- Password: `Lumen-Balkan-2179%`

To change them, set environment variables before starting the backend:

```powershell
$env:ADMIN_EMAIL="you@example.com"
$env:ADMIN_PASSWORD="a-strong-password"
npm start
```

Logging in returns a session token (valid 12 hours) used to call the protected `/api/admin/*` endpoints. Sessions are stored in memory on the backend, so they reset whenever the backend restarts.

The dashboard has six tabs:

- **Booking Requests** / **Contact Messages** — leads submitted through the site, with a "mark as contacted" toggle.
- **Rooms** — add, edit, delete rooms (name, type, description, capacity, size, price, photo).
- **Gallery** — add, edit, delete gallery photos (image + caption + sort order).
- **Amenities** — add, edit, delete the "Things To Do" cards (any [Material Symbols](https://fonts.google.com/icons) icon name, title, description).
- **Hotel Info** — edit contact details, restaurant hours, the English homepage copy (hero/about text), and the four site photos (hero, about, about-floating, restaurant).

All of it is live immediately on the public site — no rebuild or restart needed. Photo uploads go through `POST /api/admin/upload` and are stored under `Backend/public/images/uploads`.
