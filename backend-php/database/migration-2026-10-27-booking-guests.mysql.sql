-- Booking requests now record who the stay is for: adults (18+), children
-- (4–17) and babies (0–3). Requests made before this have no counts (NULL).
--
-- Run ONCE against the live database, BEFORE deploying the code that writes it:
--   php database/apply-schema.php migration-2026-10-27-booking-guests.mysql.sql

ALTER TABLE booking_requests
  ADD COLUMN adults SMALLINT UNSIGNED AFTER phone,
  ADD COLUMN children SMALLINT UNSIGNED AFTER adults,
  ADD COLUMN babies SMALLINT UNSIGNED AFTER children;
