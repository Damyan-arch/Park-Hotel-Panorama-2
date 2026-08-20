require("reflect-metadata");
require("dotenv").config();
const path = require("path");
const { DataSource } = require("typeorm");

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "park_hotel_panorama",
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, "entities", "*.js")],
  migrations: [path.join(__dirname, "migrations", "*.js")]
});

module.exports = { AppDataSource };
