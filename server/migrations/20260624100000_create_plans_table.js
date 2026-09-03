exports.up = async function (knex) {
  await knex.schema.createTable("plans", function (table) {
    table.increments("id").primary();
    table.string("plan_type", 50).notNullable().unique();
    table.text("wards").nullable();
    table.text("ward_users").nullable();
    table.text("wards_patients").nullable();
    table.text("faculty_logins").nullable();
    table.text("concurrent_simulations").nullable();
    table.integer("storage").nullable();
    table.text("ai_patients").nullable();
    table.text("ai_observations").nullable();
    table.text("manual_patients").nullable();
    table.text("manual_observations").nullable();
    table.text("total_users").nullable();
    table.timestamps(true, true);
  });

  await knex("plans").insert([
    {
      plan_type: "essential",
      wards: 12,
      ward_users: 3,
      wards_patients: 6,
      faculty_logins: 5,
      concurrent_simulations: 2,
      storage: 10,
      ai_patients: 48,
      ai_observations: 36,
      manual_patients: 50,
      manual_observations: 100,
      total_users: 100,
    },
    {
      plan_type: "advanced",
      wards: 36,
      ward_users: 4,
      wards_patients: 8,
      faculty_logins: 15,
      concurrent_simulations: 8,
      storage: 20,
      ai_patients: 96,
      ai_observations: 72,
      manual_patients: 150,
      manual_observations: 300,
      total_users: 400,
    },
    {
      plan_type: "transform",
      wards: "unlimited",
      ward_users: 8,
      wards_patients: 12,
      faculty_logins: "unlimited",
      concurrent_simulations: 16,
      storage: 100,
      ai_patients: 240,
      ai_observations: 144,
      manual_patients: 350,
      manual_observations: 700,
      total_users: 1000,
    },
  ]);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("plans");
};
