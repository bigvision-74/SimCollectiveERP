
exports.up = function (knex) {
    return knex.schema.createTable("subscriptions", function (table) {
        table.increments("id").primary();
        table.string("subscription_id").notNullable();
        table.string("customer_id").notNullable();
        table.string("status").notNullable();
        table.text("plan_title").notNullable();
        table.text("plan_duration").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("prescriptions");
};
