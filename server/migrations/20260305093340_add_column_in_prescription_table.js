exports.up = function (knex) {
  return knex.schema.table("prescriptions", function (table) {
    table.text("validate_status").nullable();
    table.text("validate_by").nullable();
    table.text("validate_reason").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("prescriptions", function (table) {
    table.dropColumn("validate_status");
    table.dropColumn("validate_by");
    table.dropColumn("validate_reason");
  });
};
