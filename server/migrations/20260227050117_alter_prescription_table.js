exports.up = function (knex) {
    return knex.schema.table('prescriptions', (table) => {
        table.text('pharmacistName');
        table.text('validated_at');
    });
};

exports.down = function (knex) {
    return knex.schema.table('prescriptions', (table) => {
        table.dropColumn('pharmacistName');
        table.dropColumn('validated_at');
    });
};