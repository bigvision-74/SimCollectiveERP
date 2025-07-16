exports.up = function (knex) {
    return knex.schema.createTable('investigation', function (table) {
        table.increments('id').primary();
        table.string("category").nullable();
        table.string("test_name").nullable();
        table.string("status").nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('investigation');
};
