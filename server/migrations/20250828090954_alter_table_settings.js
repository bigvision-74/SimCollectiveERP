exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("settings", function (table) {
      table.text("trialRecords");
      table.text("patients");
      table.text("fileSize");
      table.text("storage");
    }),
  ]);
};

exports.down = function (knex) {
  return knex.schema.table("settings", function (table) {
    table.dropColumn("trialRecords");
    table.dropColumn("patients");
    table.dropColumn("fileSize");
    table.dropColumn("storage");
  });
};
