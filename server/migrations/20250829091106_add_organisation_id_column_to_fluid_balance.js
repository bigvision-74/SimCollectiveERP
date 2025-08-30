
exports.up = function (knex) {
  return knex.schema.table("fluid_balance", function (table) {
    table.integer("organisation_id").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("fluid_balance", function (table) {
    table.dropColumn("organisation_id");
  });
};
