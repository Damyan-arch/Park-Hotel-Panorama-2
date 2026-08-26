const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "BookingRequest",
  tableName: "booking_requests",
  columns: {
    id: { type: "int", primary: true, generated: "increment" },
    roomId: { type: "uuid", name: "room_id", nullable: true },
    roomName: { type: "text", name: "room_name" },
    checkIn: { type: "date", name: "check_in" },
    checkOut: { type: "date", name: "check_out" },
    name: { type: "varchar" },
    email: { type: "varchar" },
    phone: { type: "varchar", nullable: true },
    status: { type: "varchar", default: "new" },
    receivedAt: { type: "timestamptz", name: "received_at", createDate: true }
  }
});
