exports.up = function (knex) {
  return knex.schema.createTable("wards", (table) => {
    table.increments("id").primary();
    table.text("name");
    table.text("faculty");
    table.text("observer");
    table.text("users");
    table.text("admin");
    table.text("patients");
    table.text("orgId");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("wards");
};
