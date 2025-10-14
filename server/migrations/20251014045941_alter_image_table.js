exports.up = function(knex) {
  return knex.schema.table('image_library', function(table) {
    table.bigInteger('size');
  });
};

exports.down = function(knex) {
  return knex.schema.table('image_library', function(table) {
    table.dropColumn('size');
  });
};