/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable("users", function(table) {
        table.boolean('user_deleted').defaultTo(false); 
        table.boolean('org_delete').defaultTo(false);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable("users", function(table) {
        table.dropColumn('user_deleted');
        table.dropColumn('org_delete');
    });
};
