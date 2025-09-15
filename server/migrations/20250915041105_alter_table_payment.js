exports.up = function (knex) {
  return knex.schema.table("payment", function (table) {
    table.integer("orgId ").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("payment", function (table) {
    table.dropColumn("orgId");
  });
};
