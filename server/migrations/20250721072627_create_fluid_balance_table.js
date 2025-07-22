
exports.up = function (knex) {
    return knex.schema.createTable('fluid_balance', function (table) {
        table.increments('id').primary();
        table.text('patient_id').nullable();
        table.text('observations_by').nullable();
        table.text('fluid_intake').nullable();
        table.text('fluid_output').nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('fluid_balance');
};
