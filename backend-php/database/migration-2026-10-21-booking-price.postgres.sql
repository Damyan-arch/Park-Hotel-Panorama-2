-- Postgres counterpart of migration-2026-10-21-booking-price.mysql.sql, for
-- local dev (production is MySQL on SiteGround).
--
--   php database/apply-schema.php migration-2026-10-21-booking-price.postgres.sql

ALTER TABLE booking_requests
  ADD COLUMN nights integer,
  ADD COLUMN price_per_night numeric(10,2),
  ADD COLUMN total_price numeric(10,2),
  ADD COLUMN currency varchar;
