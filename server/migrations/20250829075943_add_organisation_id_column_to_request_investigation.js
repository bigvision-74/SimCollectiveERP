
exports.up = function (knex) {
  return knex.schema.table("request_investigation", function (table) {
    table.integer("organisation_id").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("request_investigation", function (table) {
    table.dropColumn("organisation_id");
  });
};

