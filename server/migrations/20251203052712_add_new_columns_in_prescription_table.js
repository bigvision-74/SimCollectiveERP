exports.up = function (knex) {
  return knex.schema.table("prescriptions", function (table) {
    table.text("Unit").nullable();
    table.text("Way").nullable();
    table.text("Frequency").nullable();
    table.text("Instructions").nullable();
    table.text("Duration").nullable();
    table.text("DrugGroup").nullable();
    table.text("DrugSubGroup").nullable();
    table.text("TypeofDrug").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("prescriptions", function (table) {
    table.dropColumn("Unit");
    table.dropColumn("Way");
    table.dropColumn("Frequency");
    table.dropColumn("Instructions");
    table.dropColumn("Duration");
    table.dropColumn("DrugGroup");
    table.dropColumn("DrugSubGroup");
    table.dropColumn("TypeofDrug");
  });
};
