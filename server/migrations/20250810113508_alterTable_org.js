exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("users", function (table) {
      table.dropColumn("planType");
    }),
    knex.schema.alterTable("organisations", function (table) {
      table.string("planType");
    }),
  ]);
};

exports.down = function (knex) {
  return knex.schema.table("organisations", function (table) {
    table.dropColumn("planType");
  });
};
