-- Booking requests now record the card deposit placed on hold when the request
-- was submitted: the Stripe PaymentIntent id, the held amount and its status.
-- Nullable because requests made without a deposit have none. The unique index
-- stops one authorised payment from being attached to two bookings (MySQL
-- allows many NULLs in a unique index).
--
-- Run ONCE against the live database:
--   php database/apply-schema.php migration-2026-10-21-booking-payment.mysql.sql

ALTER TABLE booking_requests
  ADD COLUMN payment_intent_id VARCHAR(255) NULL AFTER currency,
  ADD COLUMN deposit_amount NUMERIC(10,2) NULL AFTER payment_intent_id,
  ADD COLUMN payment_status VARCHAR(32) NULL AFTER deposit_amount,
  ADD UNIQUE KEY uq_booking_payment_intent (payment_intent_id);
