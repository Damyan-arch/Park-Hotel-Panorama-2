require("dotenv").config({ quiet: true });

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const compression = require("compression");
const sharp = require("sharp");

const { AppDataSource } = require("./data/data-source");
const store = require("./data/store");
const translate = require("./services/translate");
const spaces = require("./services/spaces");

sharp.cache(false);

const PORT = process.env.PORT || 3002;
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || "http://localhost:4202")
  .split(",")
  .map((s) => s.trim())
  .concat([`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`]);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "damian.tsvetkov@hermeses.com,ganka.orh@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD must be set in the environment — refusing to start without it.");
  process.exit(1);
}
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // same-origin / non-browser requests
      if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
      try {
        if (/\.devtunnels\.ms$/.test(new URL(origin).hostname)) return callback(null, true);
      } catch {
        // ignore malformed origin header
      }
      return callback(null, false);
    }
  })
);
app.use(compression());
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "public/images"), { maxAge: "1d" }));

const FRONTEND_DIST = path.join(__dirname, "../Frontend/dist");

app.use("/assets", express.static(path.join(FRONTEND_DIST, "assets"), { maxAge: "1y", immutable: true }));
app.use(express.static(FRONTEND_DIST));

// Sessions are persisted in Postgres (not an in-memory Map) — App Platform can
// restart or redeploy the process at any time, which would otherwise silently
// log every admin out.
async function issueToken() {
  const token = crypto.randomBytes(32).toString("hex");
  await store.createAdminSession(token, new Date(Date.now() + SESSION_TTL_MS));
  return token;
}

async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const session = token && (await store.getAdminSession(token));

  if (!session || session.expiresAt < new Date()) {
    if (token) await store.deleteAdminSession(token);
    return res.status(401).json({ error: "Not authenticated." });
  }

  next();
}

// Buffered in memory, not written to local disk — App Platform's filesystem
// doesn't persist between deploys/restarts, so uploads go to Spaces instead.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) return cb(new Error("Only image files are allowed."));
    cb(null, true);
  }
});

/* ---------- Public content endpoints (read from the persisted store) ---------- */

app.get("/api", (_req, res) => {
  res.json({ message: "Park Hotel Panorama API", status: "ok" });
});

app.get("/api/settings", async (_req, res) => {
  res.json(await store.getSettings());
});

app.get("/api/rooms", async (_req, res) => {
  res.json(await store.getRooms());
});

app.get("/api/amenities", async (_req, res) => {
  res.json(await store.getAmenities());
});

app.get("/api/gallery", async (_req, res) => {
  res.json((await store.getGallery()).sort((a, b) => a.sortOrder - b.sortOrder));
});

app.get("/api/events", async (_req, res) => {
  res.json((await store.getEvents()).sort((a, b) => new Date(a.date) - new Date(b.date)));
});

/* ---------- Public form submissions ---------- */

app.post("/api/contact", async (req, res) => {
  const { name, email, phone, message, roomName } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  const inquiry = await store.addInquiry({
    name,
    email,
    phone: phone || null,
    roomName: roomName || null,
    message,
    status: "new"
  });

  console.log("New inquiry received:", inquiry);

  res.status(201).json({
    success: true,
    message: "Thank you! Your message has been received — we reply within a few hours."
  });
});

app.post("/api/bookings", async (req, res) => {
  const { roomId, roomName, checkIn, checkOut, name, email, phone } = req.body || {};

  if (!roomId || !checkIn || !checkOut || !name || !email) {
    return res.status(400).json({ error: "Room, dates, name and email are required." });
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    return res.status(400).json({ error: "Check-out date must be after check-in date." });
  }

  const rooms = await store.getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return res.status(400).json({ error: "Selected room could not be found." });
  }

  const bookingRoomName = roomName || room.name;
  const booking = await store.addBooking({
    roomId,
    roomName: bookingRoomName,
    checkIn,
    checkOut,
    name,
    email,
    phone: phone || null,
    status: "new"
  });

  console.log("New booking request:", booking);

  res.status(201).json({
    success: true,
    message: `Thank you, ${name}! Your request for the ${bookingRoomName} has been received — we'll confirm availability shortly.`
  });
});

/* ---------- Admin auth ---------- */

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !ADMIN_EMAILS.includes(email.trim().toLowerCase()) || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.json({ token: await issueToken() });
});

app.post("/api/admin/logout", requireAdmin, async (req, res) => {
  const token = req.headers.authorization.slice(7);
  await store.deleteAdminSession(token);
  res.json({ success: true });
});

/* ---------- Admin: leads ---------- */

app.get("/api/admin/bookings", requireAdmin, async (_req, res) => {
  res.json(await store.getBookings());
});

app.get("/api/admin/inquiries", requireAdmin, async (_req, res) => {
  res.json(await store.getInquiries());
});

app.patch("/api/admin/bookings/:id", requireAdmin, async (req, res) => {
  if (!req.body?.status) return res.status(400).json({ error: "Status is required." });
  const booking = await store.updateBookingStatus(Number(req.params.id), req.body.status);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  res.json(booking);
});

app.patch("/api/admin/inquiries/:id", requireAdmin, async (req, res) => {
  if (!req.body?.status) return res.status(400).json({ error: "Status is required." });
  const inquiry = await store.updateInquiryStatus(Number(req.params.id), req.body.status);
  if (!inquiry) return res.status(404).json({ error: "Inquiry not found." });
  res.json(inquiry);
});

/* ---------- Admin: media upload ---------- */

app.post("/api/admin/upload", requireAdmin, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No image file was provided." });

    // Normalize every upload to a size- and format-optimized WebP, so a
    // full-resolution phone photo doesn't ship to visitors at full size.
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.webp`;

    try {
      const optimized = await sharp(req.file.buffer, { limitInputPixels: false })
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
      const url = await spaces.uploadImage(filename, optimized, "image/webp");
      res.status(201).json({ url });
    } catch (uploadErr) {
      console.error("Image upload failed:", uploadErr.message);
      res.status(500).json({ error: "Failed to process the uploaded image." });
    }
  });
});

/* ---------- Admin: settings (Hotel Info) ---------- */

app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  res.json(await store.updateSettings(req.body || {}));
});

/* ---------- Admin: rooms ---------- */

app.post("/api/admin/rooms", requireAdmin, async (req, res) => {
  const { name, type, description, capacity, sizeSqm, basePricePerNight, currency, imageUrl } = req.body || {};

  if (!name || !type || !imageUrl) {
    return res.status(400).json({ error: "Name, type and image are required." });
  }

  const [nameI18n, descriptionI18n] = await Promise.all([
    translate.translateToAllLanguages(name),
    translate.translateToAllLanguages(description || "")
  ]);

  const room = {
    id: crypto.randomUUID(),
    name: nameI18n,
    type,
    description: descriptionI18n,
    capacity: Number(capacity) || 1,
    sizeSqm: Number(sizeSqm) || 0,
    basePricePerNight: Number(basePricePerNight) || 0,
    currency: currency || "EUR",
    imageUrl
  };

  res.status(201).json(await store.addRoom(room));
});

app.put("/api/admin/rooms/:id", requireAdmin, async (req, res) => {
  const existing = (await store.getRooms()).find((r) => r.id === req.params.id);
  if (!existing) return res.status(404).json({ error: "Room not found." });

  const patch = { ...req.body };
  if (patch.capacity != null) patch.capacity = Number(patch.capacity);
  if (patch.sizeSqm != null) patch.sizeSqm = Number(patch.sizeSqm);
  if (patch.basePricePerNight != null) patch.basePricePerNight = Number(patch.basePricePerNight);
  if (patch.name !== undefined) patch.name = await translate.translateIfChanged(patch.name, existing.name);
  if (patch.description !== undefined) {
    patch.description = await translate.translateIfChanged(patch.description, existing.description);
  }

  const room = await store.updateRoom(req.params.id, patch);
  if (!room) return res.status(404).json({ error: "Room not found." });
  res.json(room);
});

app.delete("/api/admin/rooms/:id", requireAdmin, async (req, res) => {
  const removed = await store.deleteRoom(req.params.id);
  if (!removed) return res.status(404).json({ error: "Room not found." });
  res.status(204).end();
});

/* ---------- Admin: gallery ---------- */

app.post("/api/admin/gallery", requireAdmin, async (req, res) => {
  const { imageUrl, alt, sortOrder } = req.body || {};
  if (!imageUrl) return res.status(400).json({ error: "Image is required." });

  const image = {
    id: crypto.randomUUID(),
    imageUrl,
    alt: alt || "",
    sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : (await store.getGallery()).length
  };

  res.status(201).json(await store.addGalleryImage(image));
});

app.put("/api/admin/gallery/:id", requireAdmin, async (req, res) => {
  const patch = { ...req.body };
  if (patch.sortOrder != null) patch.sortOrder = Number(patch.sortOrder);

  const image = await store.updateGalleryImage(req.params.id, patch);
  if (!image) return res.status(404).json({ error: "Image not found." });
  res.json(image);
});

app.delete("/api/admin/gallery/:id", requireAdmin, async (req, res) => {
  const removed = await store.deleteGalleryImage(req.params.id);
  if (!removed) return res.status(404).json({ error: "Image not found." });
  res.status(204).end();
});

/* ---------- Admin: amenities ---------- */

app.post("/api/admin/amenities", requireAdmin, async (req, res) => {
  const { icon, title, text, underMaintenance } = req.body || {};
  if (!icon || !title) return res.status(400).json({ error: "Icon and title are required." });

  const [titleI18n, textI18n] = await Promise.all([
    translate.translateToAllLanguages(title),
    translate.translateToAllLanguages(text || "")
  ]);

  const amenity = { id: crypto.randomUUID(), icon, title: titleI18n, text: textI18n, underMaintenance: !!underMaintenance };
  res.status(201).json(await store.addAmenity(amenity));
});

app.put("/api/admin/amenities/:id", requireAdmin, async (req, res) => {
  const existing = (await store.getAmenities()).find((a) => a.id === req.params.id);
  if (!existing) return res.status(404).json({ error: "Amenity not found." });

  const patch = { ...req.body };
  if (patch.title !== undefined) patch.title = await translate.translateIfChanged(patch.title, existing.title);
  if (patch.text !== undefined) patch.text = await translate.translateIfChanged(patch.text, existing.text);

  const amenity = await store.updateAmenity(req.params.id, patch);
  if (!amenity) return res.status(404).json({ error: "Amenity not found." });
  res.json(amenity);
});

app.delete("/api/admin/amenities/:id", requireAdmin, async (req, res) => {
  const removed = await store.deleteAmenity(req.params.id);
  if (!removed) return res.status(404).json({ error: "Amenity not found." });
  res.status(204).end();
});

/* ---------- Admin: events ---------- */

app.post("/api/admin/events", requireAdmin, async (req, res) => {
  const { title, date, time, description, imageUrl, infoUrl } = req.body || {};
  if (!title || !date) return res.status(400).json({ error: "Title and date are required." });

  const [titleI18n, descriptionI18n] = await Promise.all([
    translate.translateToAllLanguages(title),
    translate.translateToAllLanguages(description || "")
  ]);

  const event = {
    id: crypto.randomUUID(),
    title: titleI18n,
    date,
    time: time || "",
    description: descriptionI18n,
    imageUrl: imageUrl || "",
    infoUrl: infoUrl || ""
  };

  res.status(201).json(await store.addEvent(event));
});

app.put("/api/admin/events/:id", requireAdmin, async (req, res) => {
  const existing = (await store.getEvents()).find((e) => e.id === req.params.id);
  if (!existing) return res.status(404).json({ error: "Event not found." });

  const patch = { ...req.body };
  if (patch.title !== undefined) patch.title = await translate.translateIfChanged(patch.title, existing.title);
  if (patch.description !== undefined) {
    patch.description = await translate.translateIfChanged(patch.description, existing.description);
  }

  const event = await store.updateEvent(req.params.id, patch);
  if (!event) return res.status(404).json({ error: "Event not found." });
  res.json(event);
});

app.delete("/api/admin/events/:id", requireAdmin, async (req, res) => {
  const removed = await store.deleteEvent(req.params.id);
  if (!removed) return res.status(404).json({ error: "Event not found." });
  res.status(204).end();
});

// Fills in missing language versions for rooms/events/amenities that were
// saved before a DEEPL_API_KEY existed (or while a previous key was invalid).
// Runs once at boot; once every language slot is filled, subsequent restarts
// find nothing left to do and skip straight past this without using the API.
async function backfillTranslations() {
  if (!translate.isConfigured()) return;

  const needsBackfill = (localized) =>
    localized && typeof localized === "object" && translate.LANGUAGES.some((lang) => !localized[lang]);
  const pickSourceText = (localized) => translate.LANGUAGES.map((lang) => localized[lang]).find(Boolean) || "";

  let backfilled = 0;

  for (const room of await store.getRooms()) {
    const patch = {};
    if (needsBackfill(room.name)) patch.name = await translate.translateToAllLanguages(pickSourceText(room.name));
    if (needsBackfill(room.description)) {
      patch.description = await translate.translateToAllLanguages(pickSourceText(room.description));
    }
    if (Object.keys(patch).length) {
      await store.updateRoom(room.id, patch);
      backfilled++;
    }
  }

  for (const event of await store.getEvents()) {
    const patch = {};
    if (needsBackfill(event.title)) patch.title = await translate.translateToAllLanguages(pickSourceText(event.title));
    if (needsBackfill(event.description)) {
      patch.description = await translate.translateToAllLanguages(pickSourceText(event.description));
    }
    if (Object.keys(patch).length) {
      await store.updateEvent(event.id, patch);
      backfilled++;
    }
  }

  for (const amenity of await store.getAmenities()) {
    const patch = {};
    if (needsBackfill(amenity.title)) patch.title = await translate.translateToAllLanguages(pickSourceText(amenity.title));
    if (needsBackfill(amenity.text)) patch.text = await translate.translateToAllLanguages(pickSourceText(amenity.text));
    if (Object.keys(patch).length) {
      await store.updateAmenity(amenity.id, patch);
      backfilled++;
    }
  }

  if (backfilled) console.log(`DeepL: backfilled translations for ${backfilled} existing item(s).`);
}

AppDataSource.initialize()
  .then(() => {
    console.log("Postgres: connected.");
    app.listen(PORT, () => {
      console.log(`Park Hotel Panorama API listening on http://localhost:${PORT}`);
      backfillTranslations().catch((err) => console.warn("Translation backfill failed:", err.message));
    });
  })
  .catch((err) => {
    console.error("Failed to connect to Postgres:", err.message);
    process.exit(1);
  });
