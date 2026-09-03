exports.up = async function (knex) {
  await knex("plans").insert({
    plan_type: "free",
    wards: 5,
    ward_users: 2,
    wards_patients: 3,
    faculty_logins: 2,
    concurrent_simulations: 1,
    storage: 2,
    ai_patients: 5,
    ai_observations: 10,
    manual_patients: 10,
    manual_observations: 20,
    total_users: 10,
  });
};

exports.down = async function (knex) {
  await knex("plans").where({ plan_type: "free" }).del();
};
