exports.up = function (knex) {
  return knex.schema.alterTable("observations", function (table) {
    table.text("respiratory_rate").nullable().alter();
    table.text("o2_sats").nullable().alter();
    table.text("pulse").nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("observations", function (table) {
    table.integer("respiratory_rate").nullable().alter();
    table.integer("o2_sats").nullable().alter();
    table.integer("pulse").nullable().alter();
  });
};
