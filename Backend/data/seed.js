// One-off import of the legacy data/db.json content into Postgres.
// Safe to re-run: existing rows are upserted by primary key.
const fs = require("fs");
const path = require("path");
const { AppDataSource } = require("./data-source");

async function seed() {
  const dbJsonPath = path.join(__dirname, "db.json");
  const legacy = JSON.parse(fs.readFileSync(dbJsonPath, "utf-8"));

  await AppDataSource.initialize();

  const settingsRepo = AppDataSource.getRepository("Settings");
  await settingsRepo.save({ id: 1, data: legacy.settings || {} });
  console.log("Seeded settings.");

  const roomsRepo = AppDataSource.getRepository("Room");
  for (const room of legacy.rooms || []) {
    await roomsRepo.save(room);
  }
  console.log(`Seeded ${legacy.rooms?.length || 0} room(s).`);

  const galleryRepo = AppDataSource.getRepository("GalleryImage");
  for (const image of legacy.gallery || []) {
    await galleryRepo.save(image);
  }
  console.log(`Seeded ${legacy.gallery?.length || 0} gallery image(s).`);

  const eventsRepo = AppDataSource.getRepository("Event");
  for (const event of legacy.events || []) {
    await eventsRepo.save(event);
  }
  console.log(`Seeded ${legacy.events?.length || 0} event(s).`);

  const amenitiesRepo = AppDataSource.getRepository("Amenity");
  for (const amenity of legacy.amenities || []) {
    await amenitiesRepo.save(amenity);
  }
  console.log(`Seeded ${legacy.amenities?.length || 0} amenity(ies).`);

  await AppDataSource.destroy();
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
