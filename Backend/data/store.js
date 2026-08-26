const { AppDataSource } = require("./data-source");

const rooms = () => AppDataSource.getRepository("Room");
const gallery = () => AppDataSource.getRepository("GalleryImage");
const events = () => AppDataSource.getRepository("Event");
const amenities = () => AppDataSource.getRepository("Amenity");
const settingsRepo = () => AppDataSource.getRepository("Settings");
const bookingsRepo = () => AppDataSource.getRepository("BookingRequest");
const inquiriesRepo = () => AppDataSource.getRepository("ContactInquiry");
const adminSessionsRepo = () => AppDataSource.getRepository("AdminSession");

const SETTINGS_ID = 1;

module.exports = {
  async getSettings() {
    const row = await settingsRepo().findOneBy({ id: SETTINGS_ID });
    if (!row) {
      const created = settingsRepo().create({ id: SETTINGS_ID, data: {} });
      await settingsRepo().save(created);
      return created.data;
    }
    return row.data;
  },
  async updateSettings(patch) {
    const row = await settingsRepo().findOneBy({ id: SETTINGS_ID });
    const merged = { ...(row ? row.data : {}), ...patch };
    await settingsRepo().save({ id: SETTINGS_ID, data: merged });
    return merged;
  },

  async getRooms() {
    return rooms().find();
  },
  async addRoom(room) {
    const saved = await rooms().save(rooms().create(room));
    return saved;
  },
  async updateRoom(id, patch) {
    const room = await rooms().findOneBy({ id });
    if (!room) return null;
    Object.assign(room, patch);
    return rooms().save(room);
  },
  async deleteRoom(id) {
    const result = await rooms().delete({ id });
    return result.affected > 0;
  },

  async getGallery() {
    return gallery().find();
  },
  async addGalleryImage(image) {
    return gallery().save(gallery().create(image));
  },
  async updateGalleryImage(id, patch) {
    const image = await gallery().findOneBy({ id });
    if (!image) return null;
    Object.assign(image, patch);
    return gallery().save(image);
  },
  async deleteGalleryImage(id) {
    const result = await gallery().delete({ id });
    return result.affected > 0;
  },

  async getEvents() {
    return events().find();
  },
  async addEvent(event) {
    return events().save(events().create(event));
  },
  async updateEvent(id, patch) {
    const event = await events().findOneBy({ id });
    if (!event) return null;
    Object.assign(event, patch);
    return events().save(event);
  },
  async deleteEvent(id) {
    const result = await events().delete({ id });
    return result.affected > 0;
  },

  async getAmenities() {
    return amenities().find();
  },
  async addAmenity(amenity) {
    return amenities().save(amenities().create(amenity));
  },
  async updateAmenity(id, patch) {
    const amenity = await amenities().findOneBy({ id });
    if (!amenity) return null;
    Object.assign(amenity, patch);
    return amenities().save(amenity);
  },
  async deleteAmenity(id) {
    const result = await amenities().delete({ id });
    return result.affected > 0;
  },

  async getBookings() {
    return bookingsRepo().find({ order: { id: "DESC" } });
  },
  async addBooking(booking) {
    return bookingsRepo().save(bookingsRepo().create(booking));
  },
  async updateBookingStatus(id, status) {
    const booking = await bookingsRepo().findOneBy({ id });
    if (!booking) return null;
    booking.status = status;
    return bookingsRepo().save(booking);
  },

  async getInquiries() {
    return inquiriesRepo().find({ order: { id: "DESC" } });
  },
  async addInquiry(inquiry) {
    return inquiriesRepo().save(inquiriesRepo().create(inquiry));
  },
  async updateInquiryStatus(id, status) {
    const inquiry = await inquiriesRepo().findOneBy({ id });
    if (!inquiry) return null;
    inquiry.status = status;
    return inquiriesRepo().save(inquiry);
  },

  // Persisted so an admin stays logged in across deploys/restarts — a serverless
  // or auto-scaled host doesn't guarantee an in-memory session Map survives.
  async createAdminSession(token, expiresAt) {
    return adminSessionsRepo().save({ token, expiresAt });
  },
  async getAdminSession(token) {
    return adminSessionsRepo().findOneBy({ token });
  },
  async deleteAdminSession(token) {
    await adminSessionsRepo().delete({ token });
  }
};
