
exports.up = function (knex) {
  return knex.schema.table("observations", function (table) {
    table.integer("organisation_id").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("observations", function (table) {
    table.dropColumn("organisation_id");
  });
};
