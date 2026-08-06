const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const store = require("./data/store");

const PORT = process.env.PORT || 3002;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:4202";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "damian.tsvetkov@hermeses.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Lumen-Balkan-2179%";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

const inquiries = [];
const bookings = [];
const adminSessions = new Map(); // token -> expiresAt

function issueToken() {
  const token = crypto.randomBytes(32).toString("hex");
  adminSessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const expiresAt = token && adminSessions.get(token);

  if (!expiresAt || expiresAt < Date.now()) {
    if (token) adminSessions.delete(token);
    return res.status(401).json({ error: "Not authenticated." });
  }

  next();
}

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "public/images/uploads"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
    }
  }),
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

app.get("/api/settings", (_req, res) => {
  res.json(store.getSettings());
});

app.get("/api/rooms", (_req, res) => {
  res.json(store.getRooms());
});

app.get("/api/amenities", (_req, res) => {
  res.json(store.getAmenities());
});

app.get("/api/gallery", (_req, res) => {
  res.json([...store.getGallery()].sort((a, b) => a.sortOrder - b.sortOrder));
});

/* ---------- Public form submissions ---------- */

app.post("/api/contact", (req, res) => {
  const { name, email, phone, message, roomName } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  const inquiry = {
    id: inquiries.length + 1,
    name,
    email,
    phone: phone || null,
    roomName: roomName || null,
    message,
    status: "new",
    receivedAt: new Date().toISOString()
  };
  inquiries.push(inquiry);

  console.log("New inquiry received:", inquiry);

  res.status(201).json({
    success: true,
    message: "Thank you! Your message has been received — we reply within a few hours."
  });
});

app.post("/api/bookings", (req, res) => {
  const { roomId, roomName, checkIn, checkOut, name, email, phone } = req.body || {};

  if (!roomId || !checkIn || !checkOut || !name || !email) {
    return res.status(400).json({ error: "Room, dates, name and email are required." });
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    return res.status(400).json({ error: "Check-out date must be after check-in date." });
  }

  const room = store.getRooms().find((r) => r.id === roomId);
  if (!room) {
    return res.status(400).json({ error: "Selected room could not be found." });
  }

  const booking = {
    id: bookings.length + 1,
    roomId,
    roomName: roomName || room.name,
    checkIn,
    checkOut,
    name,
    email,
    phone: phone || null,
    status: "new",
    receivedAt: new Date().toISOString()
  };
  bookings.push(booking);

  console.log("New booking request:", booking);

  res.status(201).json({
    success: true,
    message: `Thank you, ${name}! Your request for the ${booking.roomName} has been received — we'll confirm availability shortly.`
  });
});

/* ---------- Admin auth ---------- */

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.json({ token: issueToken() });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const token = req.headers.authorization.slice(7);
  adminSessions.delete(token);
  res.json({ success: true });
});

/* ---------- Admin: leads ---------- */

app.get("/api/admin/bookings", requireAdmin, (_req, res) => {
  res.json([...bookings].reverse());
});

app.get("/api/admin/inquiries", requireAdmin, (_req, res) => {
  res.json([...inquiries].reverse());
});

app.patch("/api/admin/bookings/:id", requireAdmin, (req, res) => {
  const booking = bookings.find((b) => b.id === Number(req.params.id));
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (req.body?.status) booking.status = req.body.status;
  res.json(booking);
});

app.patch("/api/admin/inquiries/:id", requireAdmin, (req, res) => {
  const inquiry = inquiries.find((i) => i.id === Number(req.params.id));
  if (!inquiry) return res.status(404).json({ error: "Inquiry not found." });
  if (req.body?.status) inquiry.status = req.body.status;
  res.json(inquiry);
});

/* ---------- Admin: media upload ---------- */

app.post("/api/admin/upload", requireAdmin, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No image file was provided." });
    res.status(201).json({ url: `/images/uploads/${req.file.filename}` });
  });
});

/* ---------- Admin: settings (Hotel Info) ---------- */

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  res.json(store.updateSettings(req.body || {}));
});

/* ---------- Admin: rooms ---------- */

app.post("/api/admin/rooms", requireAdmin, (req, res) => {
  const { name, type, description, capacity, sizeSqm, basePricePerNight, currency, imageUrl } = req.body || {};

  if (!name || !type || !imageUrl) {
    return res.status(400).json({ error: "Name, type and image are required." });
  }

  const room = {
    id: crypto.randomUUID(),
    name,
    type,
    description: description || "",
    capacity: Number(capacity) || 1,
    sizeSqm: Number(sizeSqm) || 0,
    basePricePerNight: Number(basePricePerNight) || 0,
    currency: currency || "EUR",
    imageUrl
  };

  res.status(201).json(store.addRoom(room));
});

app.put("/api/admin/rooms/:id", requireAdmin, (req, res) => {
  const patch = { ...req.body };
  if (patch.capacity != null) patch.capacity = Number(patch.capacity);
  if (patch.sizeSqm != null) patch.sizeSqm = Number(patch.sizeSqm);
  if (patch.basePricePerNight != null) patch.basePricePerNight = Number(patch.basePricePerNight);

  const room = store.updateRoom(req.params.id, patch);
  if (!room) return res.status(404).json({ error: "Room not found." });
  res.json(room);
});

app.delete("/api/admin/rooms/:id", requireAdmin, (req, res) => {
  const removed = store.deleteRoom(req.params.id);
  if (!removed) return res.status(404).json({ error: "Room not found." });
  res.status(204).end();
});

/* ---------- Admin: gallery ---------- */

app.post("/api/admin/gallery", requireAdmin, (req, res) => {
  const { imageUrl, alt, sortOrder } = req.body || {};
  if (!imageUrl) return res.status(400).json({ error: "Image is required." });

  const image = {
    id: crypto.randomUUID(),
    imageUrl,
    alt: alt || "",
    sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : store.getGallery().length
  };

  res.status(201).json(store.addGalleryImage(image));
});

app.put("/api/admin/gallery/:id", requireAdmin, (req, res) => {
  const patch = { ...req.body };
  if (patch.sortOrder != null) patch.sortOrder = Number(patch.sortOrder);

  const image = store.updateGalleryImage(req.params.id, patch);
  if (!image) return res.status(404).json({ error: "Image not found." });
  res.json(image);
});

app.delete("/api/admin/gallery/:id", requireAdmin, (req, res) => {
  const removed = store.deleteGalleryImage(req.params.id);
  if (!removed) return res.status(404).json({ error: "Image not found." });
  res.status(204).end();
});

/* ---------- Admin: amenities ---------- */

app.post("/api/admin/amenities", requireAdmin, (req, res) => {
  const { icon, title, text } = req.body || {};
  if (!icon || !title) return res.status(400).json({ error: "Icon and title are required." });

  const amenity = { id: crypto.randomUUID(), icon, title, text: text || "" };
  res.status(201).json(store.addAmenity(amenity));
});

app.put("/api/admin/amenities/:id", requireAdmin, (req, res) => {
  const amenity = store.updateAmenity(req.params.id, req.body || {});
  if (!amenity) return res.status(404).json({ error: "Amenity not found." });
  res.json(amenity);
});

app.delete("/api/admin/amenities/:id", requireAdmin, (req, res) => {
  const removed = store.deleteAmenity(req.params.id);
  if (!removed) return res.status(404).json({ error: "Amenity not found." });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Park Hotel Panorama API listening on http://localhost:${PORT}`);
});
