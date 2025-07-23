exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("settings", function (table) {
      table.text("keyType");
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.alterTable("settings", function (table) {
      table.dropColumn("keyType");
    }),
  ]);
};