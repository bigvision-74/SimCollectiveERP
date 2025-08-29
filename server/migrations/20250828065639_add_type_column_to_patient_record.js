// Example migration: add_type_column_to_patient_record.js
exports.up = function (knex) {
    return knex.schema.table("patient_records", function (table) {
        table.string("type").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("patient_records", function (table) {
        table.dropColumn("type");
    });
};
