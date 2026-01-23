exports.up = function (knex) {
  return knex.schema.createTable("wardsession", (table) => {
    table.increments("id").primary();
    table.text("ward_id");
    table.text("started_by");
    table.text("status");
    table.text("assignments");
    table.text("start_time");
    table.text("duration");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("wardsession");
};
