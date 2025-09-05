exports.up = function (knex) {
    return knex.schema.alterTable("observations", function (table) {
        table.renameColumn("spo2_scale", "time_stamp");
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("observations", function (table) {
        table.renameColumn("time_stamp", "spo2_scale");
    });
};
