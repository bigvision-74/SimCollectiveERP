/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("oximeter_readings", function (table) {
    table.increments("id").primary();
    table.integer("patient_id").unsigned().notNullable();
    table.integer("sp02").nullable();
    table.float("perfusion_index").nullable();
    table.integer("heart_rate").nullable();
    table.integer("session_id").nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("oximeter_readings");
};
