
exports.up = function (knex) {
    return knex.schema.table("patient_notes", function (table) {
        table.text("attachments").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("patient_notes", function (table) {
        table.dropColumn("attachments");
    });
};