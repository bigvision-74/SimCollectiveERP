exports.up = function(knex) {
  return knex.schema.table('organisations', function(table) {
    table.timestamp('PlanEnd');
  });
};

exports.down = function(knex) {
  return knex.schema.table('organisations', function(table) {
    table.dropColumn('PlanEnd');
  });
};