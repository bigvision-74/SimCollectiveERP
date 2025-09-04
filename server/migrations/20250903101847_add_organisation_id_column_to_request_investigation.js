
exports.up = function (knex) {
    return knex.schema.table("request_investigation", function (table) {
        table.integer("session_id ").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("request_investigation", function (table) {
        table.dropColumn("session_id ");
    });
};
