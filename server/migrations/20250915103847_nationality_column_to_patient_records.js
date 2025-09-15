
exports.up = function (knex) {
    return knex.schema.table("patient_records", function (table) {
        table.text("nationality").nullable();
    });
};


exports.down = function (knex) {
    return knex.schema.table("patient_records", function (table) {
        table.dropColumn("nationality");
    });
};
