exports.up = function(knex) {
    return knex.schema.createTable('language', function(table) {
      table.increments('id').primary(); 
      table.string('name', 255).notNullable(); 
      table.string('code', 255).notNullable(); 
      table.string('flag', 255).notNullable(); 
      table.string('status', 255).notNullable(); 
    })
    .then(() => {
      // Insert initial data
      return knex('language').insert([
        { name: 'English', code: 'en', flag: 'GB', status: 'active' },
        { name: 'French', code: 'fr', flag: 'FR', status: 'active' },
        { name: 'Spanish', code: 'es', flag: 'ES', status: 'active' }
      ]);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('language');
  };
  
