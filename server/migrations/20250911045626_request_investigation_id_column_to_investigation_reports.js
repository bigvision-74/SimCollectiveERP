
exports.up = function (knex) {
    return knex.schema.table("investigation_reports", function (table) {
        table.integer("request_investigation_id ").nullable();
    });
};


exports.down = function (knex) {
    return knex.schema.table("investigation_reports", function (table) {
        table.dropColumn("request_investigation_id");
    });
};
