exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("users", function (table) {
      table.timestamp("lastLogin");
    }),
  ]);
};

exports.down = function (knex) {
  return knex.schema.table("users", function (table) {
    table.dropColumn("lastLogin");
  });
};
