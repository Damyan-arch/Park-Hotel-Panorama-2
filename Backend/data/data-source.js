require("reflect-metadata");
require("dotenv").config({ quiet: true });
const path = require("path");
const { DataSource } = require("typeorm");

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "park_hotel_panorama",
  // DigitalOcean Managed Postgres requires SSL; local dev/pgAdmin doesn't use it.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, "entities", "*.js")],
  migrations: [path.join(__dirname, "migrations", "*.js")]
});

module.exports = { AppDataSource };
