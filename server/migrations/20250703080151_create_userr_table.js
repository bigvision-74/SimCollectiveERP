const bcrypt = require('bcrypt');
 
exports.up = async function (knex) {
    await knex.schema.createTable('users', function (table) {
        table.increments('id').primary();
        table.string('fname', 255).notNullable();
        table.string('lname', 255).notNullable();
        table.string('username', 255).notNullable().unique();
        table.string('uemail', 255).notNullable().unique();
        table.string('password', 255).notNullable();
        table.string('role', 20).notNullable();
        table.text('accessToken').defaultTo(null);
        table.integer('verification_code').defaultTo(null);
        table.integer('user_unique_id').defaultTo(null);
        table.text('user_thumbnail').notNullable();
        table.text('organisation_id');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
 
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
 
    await knex('users').insert({
        fname: 'Super',
        lname: 'Admin',
        username: 'superadmin',
        uemail: 'superadmin@yopmail.com',
        password: hashedPassword,
        role: 'superadmin',
        accessToken: null,
        verification_code: null,
        user_unique_id: 1234,
        user_thumbnail: 'default_thumbnail_url',
        organisation_id: null,
    });
};
 
exports.down = function (knex) {
    return knex.schema.dropTable('users');
};