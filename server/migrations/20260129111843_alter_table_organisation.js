exports.up = function(knex) {
  return knex.schema.table('organisations', (table) => {
    table.text('credits');
    table.text('usedCredits');
  });
};

exports.down = function(knex) {
  return knex.schema.table('organisations', (table) => {
    table.dropColumn('credits');
    table.dropColumn('usedCredits');
  });
};