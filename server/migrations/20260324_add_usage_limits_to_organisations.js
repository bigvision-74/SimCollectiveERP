exports.up = function (knex) {
  return knex.schema.table("organisations", function (table) {
    table.integer("users_allowed").nullable();
    table.integer("users_used").nullable();
    table.integer("wards_allowed").nullable();
    table.integer("wards_used").nullable();
    table.integer("sessions_allowed").nullable();
    table.integer("sessions_used").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("organisations", function (table) {
    table.dropColumn("users_allowed");
    table.dropColumn("users_used");
    table.dropColumn("wards_allowed");
    table.dropColumn("wards_used");
    table.dropColumn("sessions_allowed");
    table.dropColumn("sessions_used");
  });
};
