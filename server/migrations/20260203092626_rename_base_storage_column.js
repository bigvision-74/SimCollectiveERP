exports.up = function (knex) {
    return knex.schema.table('organisations', (table) => {
        table.text('baseStorage').nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table('organisations', (table) => {
        table.dropColumn('baseStorage');
    });
};
