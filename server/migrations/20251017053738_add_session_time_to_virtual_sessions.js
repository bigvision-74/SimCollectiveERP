exports.up = function (knex) {
    return knex.schema.table("virtual_section", function (table) {
        table.text("session_time").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("virtual_section");
};