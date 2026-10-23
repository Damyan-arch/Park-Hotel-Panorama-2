-- Booking requests now record the quoted stay price: number of nights, the
-- room's nightly rate at the time of the request, and the total. Nullable
-- because rows created before this migration have no quote.
--
-- Run ONCE against the live database:
--   php database/apply-schema.php migration-2026-10-21-booking-price.mysql.sql

ALTER TABLE booking_requests
  ADD COLUMN nights INT UNSIGNED NULL AFTER phone,
  ADD COLUMN price_per_night NUMERIC(10,2) NULL AFTER nights,
  ADD COLUMN total_price NUMERIC(10,2) NULL AFTER price_per_night,
  ADD COLUMN currency VARCHAR(8) NULL AFTER total_price;
