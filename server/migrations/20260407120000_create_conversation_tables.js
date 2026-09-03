/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("conversation_sessions", function (table) {
      table.increments("id").primary();
      table.integer("session_id").unsigned().notNullable();
      table.integer("user_id").unsigned().notNullable();
      table.integer("patient_id").unsigned().notNullable();
      table.timestamps(true, true);
    })
    .then(() =>
      knex.schema.createTable("conversation_messages", function (table) {
        table.increments("id").primary();
        table
          .integer("conversation_id")
          .unsigned()
          .notNullable()
          .references("id")
          .inTable("conversation_sessions")
          .onDelete("CASCADE");
        table.text("person").notNullable();
        table.text("query").notNullable();
        table.timestamps(true, true);
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("conversation_messages")
    .then(() => knex.schema.dropTableIfExists("conversation_sessions"));
};
