exports.up = function (knex) {
  return knex.schema.table("test_parameters", function (table) {
    table.text("state").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("test_parameters", function (table) {
    table.dropColumn("state");
  });
};

