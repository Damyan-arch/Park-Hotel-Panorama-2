-- booking_requests.received_at and contact_inquiries.received_at were declared
-- NOT NULL with no DEFAULT in the MySQL schema, while the Postgres schema used
-- DEFAULT now(). The repositories never set the column, relying on that default
-- — so on MySQL every row landed as '0000-00-00 00:00:00', which the admin
-- panel renders as "Invalid Date". Postgres-based local dev never showed it.
--
-- Run ONCE against the live database:
--   php database/apply-schema.php migration-2026-10-14-received-at-default.mysql.sql

ALTER TABLE booking_requests MODIFY received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE contact_inquiries MODIFY received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
