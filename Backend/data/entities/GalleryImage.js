const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "GalleryImage",
  tableName: "gallery_images",
  columns: {
    id: { type: "uuid", primary: true },
    imageUrl: { type: "text", name: "image_url" },
    alt: { type: "text", default: "" },
    sortOrder: { type: "int", name: "sort_order", default: 0 }
  }
});
