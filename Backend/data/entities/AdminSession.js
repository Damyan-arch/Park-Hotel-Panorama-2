const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "AdminSession",
  tableName: "admin_sessions",
  columns: {
    token: { type: "varchar", primary: true, length: 64 },
    expiresAt: { type: "timestamptz", name: "expires_at" }
  }
});
