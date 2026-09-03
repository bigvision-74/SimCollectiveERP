exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.boolean('eula_accepted').notNullable().defaultTo(false);
    table.timestamp('eula_accepted_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('eula_accepted');
    table.dropColumn('eula_accepted_at');
  });
};
