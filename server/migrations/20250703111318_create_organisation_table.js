exports.up = async function (knex) {
    await knex.schema.createTable('organisations', function (table) {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.text('organisation_id', 255).notNullable();
        table.string('org_email', 255).notNullable().unique();
        table.text('organisation_icon', 255).notNullable();
        table.text('organisation_deleted', 20).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};
 
exports.down = function (knex) {
    return knex.schema.dropTable('organisations');
};