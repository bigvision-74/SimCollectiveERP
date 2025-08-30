
exports.up = function (knex) {
    return knex.schema.table("investigation_reports", function (table) {
        table.integer("organisation_id").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("investigation_reports", function (table) {
        table.dropColumn("organisation_id");
    });
};
