// migration file: add_authUser_org_id_to_patient_notes.js

exports.up = function (knex) {
  return knex.schema.table("patient_notes", function (table) {
    table.integer("organisation_id").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("patient_notes", function (table) {
    table.dropColumn("organisation_id");
  });
};
