exports.up = function (knex) {
    return knex.schema.table("prescriptions", function (table) {
        table.string("dose").nullable();
        table.string("route").nullable();
        table.dropColumn("title");
    });
};


exports.down = function (knex) {
    return knex.schema.table('prescriptions', function (table) {
        table.dropColumn('dose');
        table.dropColumn('route');
    });
};
