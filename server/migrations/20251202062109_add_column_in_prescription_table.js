
exports.up = function (knex) {
    return knex.schema.table("medications_list", function (table) {
        table.text("TypeofDrug").nullable();
        table.text("DrugSubGroup").nullable();
        table.text("DrugGroup").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("medications_list", function (table) {
        table.dropColumn("TypeofDrug");
        table.dropColumn("DrugSubGroup");
        table.dropColumn("DrugGroup");
    });
};