
exports.up = function (knex) {
    return knex.schema.table("settings", function (table) {
        table.text("coloredLogo").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("settings", function (table) {
        table.dropColumn("coloredLogo");
    });
};