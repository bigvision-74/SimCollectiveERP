exports.up = function (knex) {
  return knex.schema.table("patient_records", function (table) {
    table.date("dob").nullable();
    table.string("patient_reference_id", 100).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("patient_records", function (table) {
    table.dropColumn("dob");
    table.dropColumn("patient_reference_id");
  });
};
