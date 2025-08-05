exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("investigation", function (table) {
      table.text("addedBy");
    }),
    knex.schema.alterTable("test_parameters", function (table) {
      table.text("addedBy");
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.alterTable("investigation", function (table) {
      table.dropColumn("addedBy");
    }),
    knex.schema.alterTable("test_parameters", function (table) {
      table.dropColumn("addedBy");
    }),
  ]);
};