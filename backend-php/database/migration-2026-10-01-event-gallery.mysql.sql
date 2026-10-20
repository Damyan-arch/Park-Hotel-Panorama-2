-- Adds a photo gallery to events, so a past event can show a set of pictures
-- instead of just its single cover image.
--
-- Nullable with no default because MySQL doesn't allow DEFAULT on a JSON
-- column — EventRepository::toArray() reads NULL (every pre-migration row) as
-- an empty list.
--
-- Run ONCE against the live database:
--   php database/apply-schema.php migration-2026-10-01-event-gallery.mysql.sql

ALTER TABLE events ADD COLUMN gallery JSON NULL;
