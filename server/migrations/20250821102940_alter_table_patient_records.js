exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("patient_records", function (table) {
      table.text("status");
    }),
  ]);
};

exports.down = function (knex) {
  return knex.schema.table("patient_records", function (table) {
    table.dropColumn("status");
  });
};
