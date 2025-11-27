/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('category', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.text('addedBy');
    table.text('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('categoryTest', (table) => {
    table.increments('id').primary();
    table.integer('category').unsigned().notNullable();
    table.string('name').notNullable();
    table.text('addedBy');
    table.text('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('category')
      .references('id')
      .inTable('category')
      .onDelete('CASCADE');
  });
  const hasInvestigationTable = await knex.schema.hasTable('investigation');
  
  if (hasInvestigationTable) {
    const rawData = await knex('investigation').select('*');

    if (rawData.length > 0) {
      const uniqueCategories = [...new Set(rawData.map(item => item.category))];
      
      const categoryInserts = uniqueCategories.map(catName => {
        const record = rawData.find(r => r.category === catName);
        return {
          name: catName,
          addedBy: record.addedBy,
          status: record.status,
          created_at: record.created_at,
          updated_at: record.updated_at
        };
      });

      await knex('category').insert(categoryInserts);
      const newCategoryRecords = await knex('category').select('id', 'name');
      const categoryMap = {};
      newCategoryRecords.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });
      const testInserts = rawData.map(row => ({
        category: categoryMap[row.category],
        name: row.test_name,
        addedBy: row.addedBy,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
      await knex.batchInsert('categoryTest', testInserts, 100);
    }
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('categoryTest');
  await knex.schema.dropTableIfExists('category');
};