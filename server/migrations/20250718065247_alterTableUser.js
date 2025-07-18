exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("users", function (table) {
      table.text("planType");
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.alterTable("users", function (table) {
      table.dropColumn("planType");
    }),
  ]);
};