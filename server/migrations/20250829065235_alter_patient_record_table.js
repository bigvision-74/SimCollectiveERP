/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable("patient_records", function (table) {
        table.string("type").defaultTo("private").alter();
        table.string("status").defaultTo("draft").alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable("patient_records", function (table) {
        table.string("type").defaultTo(null).alter();
        table.string("status").defaultTo(null).alter();
    });
};
