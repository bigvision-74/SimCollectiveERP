exports.up = function (knex) {
  return knex.schema.table("organisations", function (table) {
    table.integer("manual_patients").defaultTo(0).nullable();
    table.integer("used_manual_patients").defaultTo(0).nullable();
    table.integer("manual_observations").defaultTo(0).nullable();
    table.integer("used_manual_observations").defaultTo(0).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("organisations", function (table) {
    table.dropColumn("manual_patients");
    table.dropColumn("used_manual_patients");
    table.dropColumn("manual_observations");
    table.dropColumn("used_manual_observations");
  });
};
