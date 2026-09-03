exports.up = function (knex) {
  return knex.schema.table("prescriptions", function (table) {
    table.text("dose_schedule").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("prescriptions", function (table) {
    table.dropColumn("dose_schedule");
  });
};
