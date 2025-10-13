
exports.up = function (knex) {
    return knex.schema.table("patient_records", function (table) {
        table.text("ageGroup").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("patient_records", function (table) {
        table.dropColumn("ageGroup");
    });
};
