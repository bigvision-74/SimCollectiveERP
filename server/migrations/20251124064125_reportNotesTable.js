
exports.up = function (knex) {
    return knex.schema.createTable("reportNotes", function (table) {
        table.increments("id").primary();
        table.string("reportId").nullable()
        table.text("note").nullable();
        table.text("addedBy").nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("reportNotes");
};
