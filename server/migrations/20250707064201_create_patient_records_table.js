exports.up = function (knex) {
  return knex.schema.createTable('patient_records', (table) => {
    // Primary Key
    table.increments('id').primary();

    // Basic Patient Information
    table.string('name', 100).notNullable();
    table.string('email', 100).notNullable();
    table.string('phone', 15).notNullable();
    table.date('date_of_birth').notNullable();
    table.enum('gender', ['male', 'female', 'other', 'unknown']).defaultTo('unknown');
    table.text('address');
    table.string('category', 50);
    table.string('ethnicity', 50);

    // Physical Attributes
    table.decimal('height', 5, 2).comment('in cm');
    table.decimal('weight', 5, 2).comment('in kg');

    // Location Information
    table.string('scenario_location', 100);
    table.string('room_type', 100);

    // Background Information
    table.text('social_economic_history');
    table.text('family_medical_history');
    table.text('lifestyle_and_home_situation');

    // Medical Equipment
    table.text('medical_equipment');
    table.text('pharmaceuticals');
    table.text('diagnostic_equipment');

    // Test Results
    table.text('blood_tests');

    // Observations
    table.text('initial_admission_observations');
    table.text('expected_observations_for_acute_condition');
    table.text('patient_assessment');
    table.text('recommended_observations_during_event');
    table.text('observation_results_recovery');
    table.text('observation_results_deterioration');

    // Diagnostics and Treatment
    table.text('recommended_diagnostic_tests');
    table.text('treatment_algorithm');
    table.text('correct_treatment');
    table.text('expected_outcome');

    // Healthcare Team
    table.text('healthcare_team_roles');
    table.text('team_traits');

    table.text('organisation_icon', 255).notNullable();

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    // Indexes
    table.index(['name'], 'idx_patient_name');
    table.index(['date_of_birth'], 'idx_patient_dob');
    table.index(['category'], 'idx_patient_category');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('patient_records');
};