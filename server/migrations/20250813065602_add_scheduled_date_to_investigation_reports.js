exports.up = function (knex) {
    return knex.schema.table("investigation_reports", function (table) {
        table.text("scheduled_date").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("investigation_reports", function (table) {
        table.dropColumn("scheduled_date");
    });
};
