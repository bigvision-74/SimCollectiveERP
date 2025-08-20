exports.up = function (knex) {
  return knex.schema.createTable("mails", function (table) {
    table.increments("id").primary();
    table.string("fname").notNullable();
    table.string("lname").notNullable();
    table.text("email").notNullable();
    table.text("status").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("mails");
};
