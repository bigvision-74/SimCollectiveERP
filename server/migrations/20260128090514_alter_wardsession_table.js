exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("wardsession", function (table) {
      table.text("endedBy");
      table.text("ended_at");
    }),
    knex.schema.alterTable("session", function (table) {
      table.text("endedBy");
    }),
  ]);
};

exports.down = function (knex) {
return Promise.all([
    knex.schema.alterTable("wardsession", function (table) {
      table.dropColumn("endedBy");
      table.dropColumn("ended_at");
    }),
    knex.schema.alterTable("session", function (table) {
      table.dropColumn("endedBy");
    }),
  ]);
};