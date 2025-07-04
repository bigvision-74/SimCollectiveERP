exports.up = function (knex) {
    return knex.schema.createTable('settings', function (table) {
      table.bigIncrements('id').unsigned(); // Automatically increments and sets as primary key
      table.text('favicon').nullable(); // Nullable text field for favicon
      table.timestamp('created_at').nullable().defaultTo(knex.fn.now()); // Nullable timestamp for creation
      table.timestamp('updated_at').nullable().defaultTo(knex.fn.now()); // Nullable timestamp for update
      table.text('site_logo').nullable(); // Nullable text field for site logo
      table.text('description').nullable(); // Nullable text field for description
      table.text('keywords').nullable(); // Nullable text field for keywords
      table.text('meta_title').nullable(); // Nullable text field for meta title
      table.text('site_colored_logo').nullable(); // Nullable text field for colored logo
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('settings');
  };
  