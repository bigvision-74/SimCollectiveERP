
exports.up = function (knex) {
    return knex.schema.createTable("scheduled_sockets", function (table) {
        table.increments("id").primary();
        table.string("session_id").nullable()
        table.text("title").nullable();
        table.text("src").nullable();
        table.text("schedule_time").nullable();
        table.string("created_by").nullable();
        table.string("status").nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("scheduled_sockets");
};
