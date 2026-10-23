-- Postgres counterpart of migration-2026-10-21-booking-payment.mysql.sql, for
-- local dev (production is MySQL on SiteGround).
--
--   php database/apply-schema.php migration-2026-10-21-booking-payment.postgres.sql

ALTER TABLE booking_requests
  ADD COLUMN payment_intent_id varchar UNIQUE,
  ADD COLUMN deposit_amount numeric(10,2),
  ADD COLUMN payment_status varchar;
