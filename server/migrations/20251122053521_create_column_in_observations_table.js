
exports.up = function (knex) {
    return knex.schema.table("observations", function (table) {
        table.text("mews2").nullable();
        table.text("pews2").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("observations", function (table) {
        table.dropColumn("mews2");
        table.dropColumn("pews2");
    });
};