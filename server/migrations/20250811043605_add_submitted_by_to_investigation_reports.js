exports.up = function (knex) {
    return knex.schema.table("investigation_reports", function (table) {
        table.integer("submitted_by").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("investigation_reports", function (table) {
        table.dropColumn("submitted_by");
    });
};
