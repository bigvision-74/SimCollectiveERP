exports.up = function (knex) {
    return knex.schema.table('organisations', (table) => {
        table.text('used_storage').nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table('organisations', (table) => {
        table.dropColumn('used_storage');
    });
};