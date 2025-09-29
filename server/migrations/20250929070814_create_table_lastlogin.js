exports.up = function (knex) {
  return knex.schema.createTable("lastLogin", function (table) {
    table.increments("id").primary();
    table.string("userId").notNullable()
    table.timestamp("login_time").defaultTo(knex.fn.now());
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("image_library");
};
