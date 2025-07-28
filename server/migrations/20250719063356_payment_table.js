exports.up = function (knex) {
    return knex.schema.createTable('payment', function (table) {
        table.increments('id').primary();
        table.string("payment_id").nullable();
        table.string("amount").nullable();
        table.string("currency").nullable();
        table.string("method").nullable();
        table.string("userId").nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('payment');
};
