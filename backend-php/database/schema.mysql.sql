-- MySQL/MariaDB fallback schema, only needed if the provisioned SiteGround plan
-- doesn't offer native PostgreSQL. Equivalent to schema.postgres.sql with:
--   jsonb -> JSON, uuid-shaped columns -> CHAR(36), SERIAL -> AUTO_INCREMENT,
--   timestamptz -> DATETIME (app writes UTC explicitly, see Database.php).
-- Not wired up in the application yet — see app/src/Db/Database.php for the
-- two isolated spots (id retrieval, settings upsert) that would need a
-- DB_DRIVER branch if this schema is ever used instead of Postgres.

CREATE TABLE settings (
  id INT PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE rooms (
  id CHAR(36) PRIMARY KEY,
  name JSON NOT NULL,
  type VARCHAR(255) NOT NULL,
  description JSON NOT NULL,
  capacity INT NOT NULL,
  size_sqm INT NOT NULL,
  base_price_per_night NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  image_url TEXT NOT NULL
);

CREATE TABLE gallery_images (
  id CHAR(36) PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  title JSON NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(255) NOT NULL DEFAULT '',
  description JSON NOT NULL,
  image_url TEXT NOT NULL,
  info_url TEXT NOT NULL
);

CREATE TABLE amenities (
  id VARCHAR(255) PRIMARY KEY,
  icon VARCHAR(255) NOT NULL,
  title JSON NOT NULL,
  text JSON NOT NULL,
  under_maintenance BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE booking_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id CHAR(36),
  room_name TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  status VARCHAR(255) NOT NULL DEFAULT 'new',
  received_at DATETIME NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE contact_inquiries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  room_name TEXT,
  message TEXT NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'new',
  received_at DATETIME NOT NULL
);

CREATE TABLE admin_sessions (
  token VARCHAR(64) PRIMARY KEY,
  expires_at DATETIME NOT NULL
);
