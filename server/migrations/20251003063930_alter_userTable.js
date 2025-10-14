exports.up = function (knex) {
  return knex.schema.table("users", function (table) {
    table.text("firebase_uid").nullable();
    table.text("re_auth_token").nullable();
    table.text("token_expiry").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("users", function (table) {
    table.dropColumn("firebase_uid");
    table.dropColumn("re_auth_token");
    table.dropColumn("token_expiry");
  });
};
