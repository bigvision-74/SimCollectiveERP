exports.up = function (knex) {
  return knex.schema.table("patient_records", function (table) {
    table.text("allergies").nullable();
    table.text("medical_history").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("patient_records", function (table) {
    table.dropColumn("allergies");
    table.dropColumn("medical_history");
  });
};

