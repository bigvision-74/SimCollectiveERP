exports.up = function (knex) {
  return knex.schema.createTable('observations', function (table) {
    table.increments('id').primary();

    table.integer('patient_id').notNullable();

    table.integer('observations_by').nullable();
    table.integer('respiratory_rate').nullable();
    table.integer('o2_sats').nullable();
    table.string('spo2_scale').nullable();
    table.string('oxygen_delivery').nullable();
    table.string('blood_pressure').nullable(); // store as "120/80" string
    table.integer('pulse').nullable();
    table.string('consciousness').nullable();
    table.float('temperature').nullable();
    table.text('news2_score').nullable();

    table.timestamps(true, true); // created_at and updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('observations');
};
