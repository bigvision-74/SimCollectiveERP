/**
 * Holds the reusable "dummy" patient blueprints that get generated once via AI
 * and copied into patient_records (with an organisation_id) whenever a new
 * organisation is created.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("patient_template_records", (table) => {
    table.increments("id").primary();

    table.string("name", 100).notNullable();
    table.string("email", 100);
    table.string("phone", 15);
    table.string("date_of_birth", 50);
    table.string("gender", 20);
    table.text("address");
    table.string("category", 50);
    table.string("ethnicity", 50);
    table.text("nationality");
    table.text("ageGroup");

    table.decimal("height", 5, 2).comment("in cm");
    table.decimal("weight", 5, 2).comment("in kg");

    table.string("scenario_location", 100);
    table.string("room_type", 100);

    table.text("social_economic_history");
    table.text("family_medical_history");
    table.text("lifestyle_and_home_situation");

    table.text("medical_equipment");
    table.text("pharmaceuticals");
    table.text("diagnostic_equipment");

    table.text("blood_tests");

    table.text("initial_admission_observations");
    table.text("expected_observations_for_acute_condition");
    table.text("patient_assessment");
    table.text("recommended_observations_during_event");
    table.text("observation_results_recovery");
    table.text("observation_results_deterioration");

    table.text("recommended_diagnostic_tests");
    table.text("treatment_algorithm");
    table.text("correct_treatment");
    table.text("expected_outcome");

    table.text("healthcare_team_roles");
    table.text("team_traits");

    table.text("allergies");
    table.text("medical_history");

    table.string("patient_thumbnail", 255);
    table.string("type", 50).defaultTo("private");

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("patient_template_records");
};
