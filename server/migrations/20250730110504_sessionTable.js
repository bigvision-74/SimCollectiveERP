exports.up = function (knex) {
    return knex.schema.createTable('session', function (table) {
        table.increments('id').primary();
        table.text('name');
        table.text('patient');
        table.text('createdBy');
        table.text('duration');
        table.text('participants');
        table.text('startTime');      
        table.text('endTime');      
        table.text("state");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('settings');
};
