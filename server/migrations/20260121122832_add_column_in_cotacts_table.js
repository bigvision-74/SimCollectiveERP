exports.up = function(knex) {
  return knex.schema.table('contacts', (table) => {
    table.text('is_seen');
  });
};

exports.down = function(knex) {
  return knex.schema.table('contacts', (table) => {
    table.dropColumn('is_seen');
  });
};