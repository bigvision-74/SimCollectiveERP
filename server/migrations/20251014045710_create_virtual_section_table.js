
exports.up = function (knex) {
    return knex.schema.createTable("virtual_section", function (table) {
        table.increments("id").primary();
        table.string("user_id").nullable()
        table.text("session_name").nullable();
        table.text("patient_type").nullable();
        table.text("room_type").nullable();
        table.string("selected_patient").nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("virtual_section");
};
