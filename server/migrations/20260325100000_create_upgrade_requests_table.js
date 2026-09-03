/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("upgrade_requests", (table) => {
    table.increments("id").primary();
    table.text("plan_type").notNullable();
    table.text("organisation_id").notNullable();
    table.text("plan").notNullable();
    table.text("amount").notNullable();
    table.text("status").nullable();
    table.integer("requested_by").notNullable();
    table.integer("approved_by").nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("upgrade_requests");
};
