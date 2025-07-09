/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('patient_records', function(table) {
    table.renameColumn('organisation_icon', 'patient_thumbnail');
    table.string('additional_orgs', 100);
    table.text('organisation_id');
  });
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('patient_records', function(table) {
    table.renameColumn('patient_thumbnail', 'organisation_icon');
    table.dropColumn('additional_orgs');
    table.dropColumn('organisation_id');
  });
};
