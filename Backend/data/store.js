const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "db.json");

function read() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function write(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
  getSettings() {
    return read().settings;
  },
  updateSettings(patch) {
    const db = read();
    db.settings = { ...db.settings, ...patch };
    write(db);
    return db.settings;
  },

  getRooms() {
    return read().rooms;
  },
  addRoom(room) {
    const db = read();
    db.rooms.push(room);
    write(db);
    return room;
  },
  updateRoom(id, patch) {
    const db = read();
    const room = db.rooms.find((r) => r.id === id);
    if (!room) return null;
    Object.assign(room, patch);
    write(db);
    return room;
  },
  deleteRoom(id) {
    const db = read();
    const index = db.rooms.findIndex((r) => r.id === id);
    if (index === -1) return false;
    db.rooms.splice(index, 1);
    write(db);
    return true;
  },

  getGallery() {
    return read().gallery;
  },
  addGalleryImage(image) {
    const db = read();
    db.gallery.push(image);
    write(db);
    return image;
  },
  updateGalleryImage(id, patch) {
    const db = read();
    const image = db.gallery.find((g) => g.id === id);
    if (!image) return null;
    Object.assign(image, patch);
    write(db);
    return image;
  },
  deleteGalleryImage(id) {
    const db = read();
    const index = db.gallery.findIndex((g) => g.id === id);
    if (index === -1) return false;
    db.gallery.splice(index, 1);
    write(db);
    return true;
  },

  getAmenities() {
    return read().amenities;
  },
  addAmenity(amenity) {
    const db = read();
    db.amenities.push(amenity);
    write(db);
    return amenity;
  },
  updateAmenity(id, patch) {
    const db = read();
    const amenity = db.amenities.find((a) => a.id === id);
    if (!amenity) return null;
    Object.assign(amenity, patch);
    write(db);
    return amenity;
  },
  deleteAmenity(id) {
    const db = read();
    const index = db.amenities.findIndex((a) => a.id === id);
    if (index === -1) return false;
    db.amenities.splice(index, 1);
    write(db);
    return true;
  }
};
