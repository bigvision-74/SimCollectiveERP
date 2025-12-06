exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.text('isTempMail');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('isTempMail');
  });
};