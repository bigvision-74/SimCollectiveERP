exports.up = function (knex) {
    return knex.schema.table("request_investigation", function (table) {
        table.text("response_reason").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("request_investigation", function (table) {
        table.dropColumn("response_reason");
    });
};