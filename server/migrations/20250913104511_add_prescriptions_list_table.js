exports.up = function (knex) {
    return knex.schema.createTable("medications_list", function (table) {
        table.increments("id").primary();
        table.string("medication").nullable();
        table.string("dose").nullable();
        table.string("added_by").nullable();
        table.string("org_id").nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("medications_list");
};
