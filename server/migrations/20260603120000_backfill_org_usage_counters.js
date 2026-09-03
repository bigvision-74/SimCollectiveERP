exports.up = async function (knex) {
  await knex("organisations")
    .whereNull("users_used")
    .update({ users_used: 0 });

  await knex("organisations")
    .whereNull("wards_used")
    .update({ wards_used: 0 });

  await knex("organisations")
    .whereNull("sessions_used")
    .update({ sessions_used: 0 });

  await knex("organisations")
    .whereNull("used_manual_patients")
    .update({ used_manual_patients: 0 });

  await knex("organisations")
    .whereNull("used_manual_observations")
    .update({ used_manual_observations: 0 });

  await knex("organisations")
    .whereNull("used_storage")
    .update({ used_storage: "0" });

  await knex.schema.alterTable("organisations", function (table) {
    table.integer("users_used").defaultTo(0).alter();
    table.integer("wards_used").defaultTo(0).alter();
    table.integer("sessions_used").defaultTo(0).alter();
    table.integer("used_manual_patients").defaultTo(0).alter();
    table.integer("used_manual_observations").defaultTo(0).alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("organisations", function (table) {
    table.integer("users_used").nullable().alter();
    table.integer("wards_used").nullable().alter();
    table.integer("sessions_used").nullable().alter();
    table.integer("used_manual_patients").nullable().alter();
    table.integer("used_manual_observations").nullable().alter();
  });
};
