// /migrations/xxxx_create_patient_notes_table.js

exports.up = function (knex) {
    return knex.schema.createTable("patient_notes", function (table) {
        table.increments("id").primary(); // auto-incrementing ID
        table.string("patient_id").notNullable();
        table.string("doctor_id").notNullable();
        table.string("title").notNullable();
        table.text("content").notNullable();

        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("patient_notes");
};
