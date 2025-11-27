exports.up = function (knex) {
  return knex.schema.table("investigation", function (table) {
    table.text("state").nullable();
    table.text("testAddedBy").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("investigation", function (table) {
    table.dropColumn("state");
    table.dropColumn("testAddedBy");
  });
};

