exports.up = function(knex) {
  return knex.schema.table('virtual_section', (table) => {
    table.text('sessionId');
  });
};

exports.down = function(knex) {
  return knex.schema.table('virtual_section', (table) => {
    table.dropColumn('sessionId');
  });
};