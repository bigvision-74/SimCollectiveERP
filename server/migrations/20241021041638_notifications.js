exports.up = function(knex) {
    return knex.schema.createTable('notifications', function(table) {
      table.bigIncrements('id').unsigned().notNullable().primary();
      table.integer('notify_by').nullable();
      table.integer('notify_to').nullable();
      table.string("title", 255).defaultTo("null");
      table.string('message', 255).notNullable();
      table.enu('status', ['seen', 'unseen']).notNullable().defaultTo('unseen');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('notifications');
  };
  