
exports.up = function(knex) {
  return knex.schema.createTable('activity_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().index(); 
    table.string('action_type', 50).notNullable().index();
    table.string('entity_name', 100).notNullable().index();
    table.integer('entity_id').nullable();
    table.jsonb('details').nullable(); 
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('activity_logs');
};