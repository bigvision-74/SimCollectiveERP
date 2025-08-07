exports.up = function (knex) {
    return knex.schema.table('prescriptions', function (table) {
        table.string('medication_name').nullable();
        table.string('indication').nullable();
        table.date('start_date').nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table('prescriptions', function (table) {
        table.dropColumn('medication_name');
        table.dropColumn('indication');
        table.dropColumn('start_date');
    });
};
