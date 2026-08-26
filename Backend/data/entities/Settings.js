const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Settings",
  tableName: "settings",
  columns: {
    id: { type: "int", primary: true },
    data: { type: "jsonb", default: () => "'{}'" }
  }
});
