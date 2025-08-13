exports.up = function (knex) {
  return knex.schema.createTable("requests", function (table) {
    table.increments("id").primary();
    table.string("institution").notNullable();
    table.string("fname").notNullable();
    table.string("lname").notNullable();
    table.text("username").notNullable();
    table.text("email").notNullable();
    table.text("country");
    table.text("thumbnail");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("prescriptions");
};
