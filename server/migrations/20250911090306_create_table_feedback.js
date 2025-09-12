exports.up = function (knex) {
    return knex.schema.createTable("feedback_requests", function (table) {
        table.increments("id").primary();
        table.string("user_id").nullable();
        table.string("organisation_id").nullable();
        table.string("name").nullable();
        table.string("email").nullable();
        table.text("feedback").nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("feedback_requests");
};
