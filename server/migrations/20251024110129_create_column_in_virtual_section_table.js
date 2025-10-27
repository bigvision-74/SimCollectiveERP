
exports.up = function (knex) {
    return knex.schema.table("virtual_section", function (table) {
        table.text("joined_users").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("virtual_section", function (table) {
        table.dropColumn("joined_users");
    });
};