exports.up = function (knex) {
    return knex.schema.table('prescriptions', (table) => {
        table.text('status');
        table.text('stopped_by');
        table.text('stopped_at');
    });
};

exports.down = function (knex) {
    return knex.schema.table('prescriptions', (table) => {
        table.dropColumn('status');
        table.dropColumn('stopped_by');
        table.dropColumn('stopped_at');
    });
};