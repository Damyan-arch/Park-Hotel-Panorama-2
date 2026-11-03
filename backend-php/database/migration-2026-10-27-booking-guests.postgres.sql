-- Postgres counterpart of migration-2026-10-27-booking-guests.mysql.sql, for
-- local dev (production is MySQL on SiteGround).
--
--   php database/apply-schema.php migration-2026-10-27-booking-guests.postgres.sql

ALTER TABLE booking_requests
  ADD COLUMN adults smallint,
  ADD COLUMN children smallint,
  ADD COLUMN babies smallint;
