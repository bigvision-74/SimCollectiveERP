exports.up = function (knex) {
    return knex.schema.createTable('assign_patient', function (table) {
        table.increments('id').primary();
        table.integer('user_id').nullable();
        table.integer('patient_id').nullable();
        table.integer('assigned_by').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('assign_patient');
};
