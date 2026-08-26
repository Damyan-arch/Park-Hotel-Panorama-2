const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ContactInquiry",
  tableName: "contact_inquiries",
  columns: {
    id: { type: "int", primary: true, generated: "increment" },
    name: { type: "varchar" },
    email: { type: "varchar" },
    phone: { type: "varchar", nullable: true },
    roomName: { type: "text", name: "room_name", nullable: true },
    message: { type: "text" },
    status: { type: "varchar", default: "new" },
    receivedAt: { type: "timestamptz", name: "received_at", createDate: true }
  }
});
