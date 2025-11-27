
exports.up = function (knex) {
    return knex.schema.table("organisations", function (table) {
        table.text("patients_allowed").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("organisations", function (table) {
        table.dropColumn("patients_allowed");
    });
};