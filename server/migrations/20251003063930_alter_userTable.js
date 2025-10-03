exports.up = function (knex) {
  return knex.schema.table("users", function (table) {
    table.text("firebase_uid").nullable();
    table.text("re_auth_token").nullable();
    table.text("token_expiry").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("users", function (table) {
    table.text("firebase_uid").nullable();
    table.text("re_auth_token").nullable();
    table.text("token_expiry").nullable();
  });
};
