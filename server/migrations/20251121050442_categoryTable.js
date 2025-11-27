/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Create 'category' table
  await knex.schema.createTable('category', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique(); // Mapped from investigation.category
    table.text('addedBy');
    table.text('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Create 'categoryTest' table
  await knex.schema.createTable('categoryTest', (table) => {
    table.increments('id').primary();
    table.integer('category').unsigned().notNullable(); // FK referencing category.id
    table.string('name').notNullable(); // Mapped from investigation.test_name
    table.text('addedBy');
    table.text('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign Key Constraint
    table.foreign('category')
      .references('id')
      .inTable('category')
      .onDelete('CASCADE');
  });

  // 3. Migrate Data from 'investigation' table
  
  // Check if investigation table exists before trying to read from it
  const hasInvestigationTable = await knex.schema.hasTable('investigation');
  
  if (hasInvestigationTable) {
    const rawData = await knex('investigation').select('*');

    if (rawData.length > 0) {
      // --- Step A: Extract and Insert Unique Categories ---
      const uniqueCategories = [...new Set(rawData.map(item => item.category))];
      
      const categoryInserts = uniqueCategories.map(catName => {
        // Find the first occurrence to copy metadata (status, addedBy, etc)
        const record = rawData.find(r => r.category === catName);
        return {
          name: catName,
          addedBy: record.addedBy,
          status: record.status,
          created_at: record.created_at,
          updated_at: record.updated_at
        };
      });

      // Insert categories
      await knex('category').insert(categoryInserts);

      // --- Step B: Map existing Tests to new Category IDs ---
      
      // Fetch the newly created categories to get their IDs
      const newCategoryRecords = await knex('category').select('id', 'name');
      
      // Create a lookup map: { "Blood Test": 1, "Radiology": 2, ... }
      const categoryMap = {};
      newCategoryRecords.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      // Prepare test data
      const testInserts = rawData.map(row => ({
        category: categoryMap[row.category], // Use the new ID
        name: row.test_name,
        addedBy: row.addedBy,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      // Insert tests in chunks to avoid query limits if data is large
      await knex.batchInsert('categoryTest', testInserts, 100);
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('categoryTest');
  await knex.schema.dropTableIfExists('category');
};