exports.up = function (knex) {
  return knex.schema.table("observations", function (table) {
    table.text("time_diff").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("observations", function (table) {
    table.dropColumn("time_diff");
  });
};
