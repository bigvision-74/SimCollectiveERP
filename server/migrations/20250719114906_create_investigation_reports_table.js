exports.up = async function (knex) {
    await knex.schema.createTable('investigation_reports', function (table) {
        table.increments('id').primary();
        table.text('investigation_id', 255).notNullable();
        table.text('parameter_id', 255).notNullable();
        table.text('patient_id', 255).notNullable();
        table.text('value', 255).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};
 
exports.down = function (knex) {
    return knex.schema.dropTable('investigation_reports');
};