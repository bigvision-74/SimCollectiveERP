/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable("patient_notes", function (table) {
      table.integer("session_id").unsigned().nullable();
    })
    .alterTable("observations", function (table) {
      table.integer("session_id").unsigned().nullable();
    })
    .alterTable("prescriptions", function (table) {
      table.integer("session_id").unsigned().nullable();
    })
    .alterTable("fluid_balance", function (table) {
      table.integer("session_id").unsigned().nullable();
    })
    .alterTable("investigation_reports", function (table) {
      table.integer("session_id").unsigned().nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable("patient_notes", function (table) {
      table.dropColumn("session_id");
    })
    .alterTable("observations", function (table) {
      table.dropColumn("session_id");
    })
    .alterTable("prescriptions", function (table) {
      table.dropColumn("session_id");
    })
    .alterTable("fluid_balance", function (table) {
      table.dropColumn("session_id");
    })
    .alterTable("investigation_reports", function (table) {
      table.dropColumn("session_id");
    });
};
