
exports.up = function (knex) {
    return knex.schema.table("payment", function (table) {
        table.text("purchaseOrder").nullable();
    });
};


exports.down = function (knex) {
    return knex.schema.table("payment", function (table) {
        table.dropColumn("purchaseOrder");
    });
};
