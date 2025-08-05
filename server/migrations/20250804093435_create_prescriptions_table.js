
exports.up = function (knex) {
    return knex.schema.createTable("prescriptions", function (table) {
        table.increments("id").primary(); // auto-incrementing ID
        table.string("patient_id").notNullable();
        table.string("doctor_id").notNullable();
        table.string("title").notNullable();
        table.text("description").notNullable();

        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("prescriptions");
};
