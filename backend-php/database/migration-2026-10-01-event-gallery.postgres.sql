-- Postgres counterpart of migration-2026-10-01-event-gallery.mysql.sql, for
-- local dev (production is MySQL on SiteGround).
--
--   php database/apply-schema.php migration-2026-10-01-event-gallery.postgres.sql

ALTER TABLE events ADD COLUMN gallery jsonb NOT NULL DEFAULT '[]';
