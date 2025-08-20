exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("requests", function (table) {
      table.text("type");
    }),
  ]);
};

exports.down = function (knex) {
  return knex.schema.table("requests", function (table) {
    table.dropColumn("type");
  });
};
