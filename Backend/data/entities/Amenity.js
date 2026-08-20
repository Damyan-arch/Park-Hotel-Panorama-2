const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Amenity",
  tableName: "amenities",
  columns: {
    id: { type: "varchar", primary: true },
    icon: { type: "varchar" },
    title: { type: "jsonb" },
    text: { type: "jsonb" }
  }
});
