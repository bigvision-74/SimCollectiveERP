exports.up = function (knex) {
    return knex.schema.createTable('settings', function (table) {
        table.increments('id').primary();
        table.text('title').nullable();
        table.text('description').nullable();
        table.text('keywords').nullable();
        table.text('favicon').nullable();
        table.text('logo').nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('settings');
};
