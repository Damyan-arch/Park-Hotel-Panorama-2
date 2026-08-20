const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Room",
  tableName: "rooms",
  columns: {
    id: { type: "uuid", primary: true },
    name: { type: "jsonb" },
    type: { type: "varchar" },
    description: { type: "jsonb" },
    capacity: { type: "int" },
    sizeSqm: { type: "int", name: "size_sqm" },
    basePricePerNight: {
      type: "numeric",
      precision: 10,
      scale: 2,
      name: "base_price_per_night",
      transformer: { to: (v) => v, from: (v) => Number(v) }
    },
    currency: { type: "varchar", length: 3, default: "EUR" },
    imageUrl: { type: "text", name: "image_url" }
  }
});
