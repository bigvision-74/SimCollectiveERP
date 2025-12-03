
exports.up = function(knex) {
  return knex.schema.alterTable('patient_records', (table) => {
    table.string('date_of_birth', 50).alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('patient_records', (table) => {
    table.date('date_of_birth').alter();
  });
};