-- Booking requests now record when they last changed (new, status or payment
-- update), so the integration API can hand Mistral's Zamboo only what changed
-- since its last check. Existing rows start at their received_at.
--
-- Run ONCE against the live database:
--   php database/apply-schema.php migration-2026-10-26-booking-updated-at.mysql.sql

ALTER TABLE booking_requests
  ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER received_at,
  ADD INDEX booking_requests_updated_at (updated_at, id);

UPDATE booking_requests SET updated_at = received_at;
