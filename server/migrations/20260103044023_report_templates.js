exports.up = function(knex) {
  return knex.schema.createTable('report_templates', (table) => {
    table.increments('id').primary();
    table.integer('investigation_id').unsigned().references('id').inTable('categorytest').onDelete('CASCADE');
    table.string('template_name').notNullable(); 
    table.json('parameter_values').notNullable();    
    table.text('addedBy');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('report_templates');
};