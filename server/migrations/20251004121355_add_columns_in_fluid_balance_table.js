exports.up = function (knex) {
  return knex.schema.table("fluid_balance", function (table) {
    table.text("type").nullable();
    table.text("units").nullable();
    table.text("duration").nullable();
    table.text("route").nullable();
    table.text("timestamp").nullable();
    table.text("notes").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("fluid_balance", function (table) {
    table.dropColumn("type");
    table.dropColumn("units");
    table.dropColumn("duration");
    table.dropColumn("route");
    table.dropColumn("timestamp");
    table.dropColumn("notes");
  });
};
