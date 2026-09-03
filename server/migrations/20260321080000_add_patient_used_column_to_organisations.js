exports.up = function(knex) {
  return knex.schema.table('organisations', (table) => {
    table.integer('patient_used').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.table('organisations', (table) => {
    table.dropColumn('patient_used');
  });
};