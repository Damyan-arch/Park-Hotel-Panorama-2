const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Event",
  tableName: "events",
  columns: {
    id: { type: "varchar", primary: true },
    title: { type: "jsonb" },
    date: { type: "date" },
    time: { type: "varchar", default: "" },
    description: { type: "jsonb" },
    imageUrl: { type: "text", name: "image_url", default: "" },
    infoUrl: { type: "text", name: "info_url", default: "" }
  }
});
