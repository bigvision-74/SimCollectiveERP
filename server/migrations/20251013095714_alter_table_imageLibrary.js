exports.up = function (knex) {
  return knex.schema.table("image_library", function (table) {
    table.text("orgId");
    table.text("type");
  });
};

exports.down = function (knex) {
  return knex.schema.table("image_library", function (table) {
    table.dropColumn("orgId");
    table.dropColumn("type");
  });
};
