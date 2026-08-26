module.exports = class InitSchema1755680000000 {
  name = "InitSchema1755680000000";

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE "settings" (
        "id" int PRIMARY KEY,
        "data" jsonb NOT NULL DEFAULT '{}'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "rooms" (
        "id" uuid PRIMARY KEY,
        "name" jsonb NOT NULL,
        "type" varchar NOT NULL,
        "description" jsonb NOT NULL,
        "capacity" int NOT NULL,
        "size_sqm" int NOT NULL,
        "base_price_per_night" numeric(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'EUR',
        "image_url" text NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "gallery_images" (
        "id" uuid PRIMARY KEY,
        "image_url" text NOT NULL,
        "alt" text NOT NULL DEFAULT '',
        "sort_order" int NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" varchar PRIMARY KEY,
        "title" jsonb NOT NULL,
        "date" date NOT NULL,
        "time" varchar NOT NULL DEFAULT '',
        "description" jsonb NOT NULL,
        "image_url" text NOT NULL DEFAULT '',
        "info_url" text NOT NULL DEFAULT ''
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "amenities" (
        "id" varchar PRIMARY KEY,
        "icon" varchar NOT NULL,
        "title" jsonb NOT NULL,
        "text" jsonb NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "booking_requests" (
        "id" SERIAL PRIMARY KEY,
        "room_id" uuid REFERENCES "rooms"("id") ON DELETE SET NULL,
        "room_name" text NOT NULL,
        "check_in" date NOT NULL,
        "check_out" date NOT NULL,
        "name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "phone" varchar,
        "status" varchar NOT NULL DEFAULT 'new',
        "received_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "contact_inquiries" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "phone" varchar,
        "room_name" text,
        "message" text NOT NULL,
        "status" varchar NOT NULL DEFAULT 'new',
        "received_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE "contact_inquiries"`);
    await queryRunner.query(`DROP TABLE "booking_requests"`);
    await queryRunner.query(`DROP TABLE "amenities"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "gallery_images"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TABLE "settings"`);
  }
};
