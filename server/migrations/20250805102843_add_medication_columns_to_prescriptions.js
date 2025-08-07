
exports.up = function(knex) {
  return knex.schema.table('prescriptions', function(table) {
    table.json('days_given').nullable(); 
    table.string('administration_time').nullable(); 
  });
};

exports.down = function(knex) {
  return knex.schema.table('prescriptions', function(table) {
    table.dropColumn('days_given');
    table.dropColumn('administration_time');
  });
};
