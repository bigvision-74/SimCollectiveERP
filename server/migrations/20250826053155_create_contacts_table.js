// migrations/20250826123000_create_contacts_table.js

export async function up(knex) {
  return knex.schema.createTable("contacts", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("email").notNullable();
    table.string("subject").notNullable();
    table.text("message").notNullable();
    table.timestamps(true, true); // created_at, updated_at
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists("contacts");
}
