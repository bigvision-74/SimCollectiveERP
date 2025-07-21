exports.up = async function (knex) {
    await knex.schema.createTable('test_parameters', function (table) {
        table.increments('id').primary();
        table.text('investigation_id', 255).notNullable();
        table.text('name', 255).notNullable();
        table.text('normal_range', 255).notNullable();
        table.text('units', 255).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};
 
exports.down = function (knex) {
    return knex.schema.dropTable('test_parameters');
};