exports.up = function (knex) {
    return knex.schema.createTable('image_library', function (table) {
        table.increments('id').primary();
        table.string("investigation_id").nullable();
        table.string("test_parameters").nullable();
        table.string("added_by").nullable();
        table.text("image_url").nullable();
        table.text("status").nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('image_library');
};
