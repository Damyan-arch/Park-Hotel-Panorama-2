-- Postgres counterpart of migration-2026-10-26-booking-updated-at.mysql.sql,
-- for local dev (production is MySQL on SiteGround). Whole seconds, like
-- MySQL's DATETIME, so the integration API's cursor compares exactly.
--
--   php database/apply-schema.php migration-2026-10-26-booking-updated-at.postgres.sql

ALTER TABLE booking_requests ADD COLUMN updated_at timestamptz(0) NOT NULL DEFAULT now();

UPDATE booking_requests SET updated_at = received_at;

CREATE INDEX booking_requests_updated_at ON booking_requests (updated_at, id);
