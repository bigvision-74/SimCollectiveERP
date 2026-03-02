exports.up = function (knex) {
    return knex.schema.table("notifications", function (table) {
        table.text("patient_id").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("notifications", function (table) {
        table.dropColumn("patient_id");
    });
};