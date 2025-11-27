/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Create 'testParameters' table
  await knex.schema.createTable('testParameters', (table) => {
    table.increments('id').primary();
    // This refers to the 'id' column of 'categoryTest'
    table.integer('investigation_id').unsigned().notNullable(); 
    table.string('name').notNullable();
    table.string('normal_range');
    table.string('units');
    table.string('field_type');
    table.text('addedBy');
    table.text('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign Key Constraint linking to categoryTest
    table.foreign('investigation_id')
      .references('id')
      .inTable('categoryTest')
      .onDelete('CASCADE');
  });

  // 2. Migrate Data
  // We need to exist checks for source tables to ensure migration doesn't fail on empty DBs
  const hasOldParams = await knex.schema.hasTable('test_parameters');
  const hasOldInvestigation = await knex.schema.hasTable('investigation');
  const hasNewCategoryTest = await knex.schema.hasTable('categoryTest');
  const hasNewCategory = await knex.schema.hasTable('category');

  if (hasOldParams && hasOldInvestigation && hasNewCategoryTest && hasNewCategory) {
    
    // A. Fetch all necessary data to build a map
    const oldParamsData = await knex('test_parameters').select('*');
    const oldInvestigationData = await knex('investigation').select('id', 'test_name', 'category');
    const newCategoryData = await knex('category').select('id', 'name');
    const newCategoryTestData = await knex('categoryTest').select('id', 'category', 'name');

    if (oldParamsData.length > 0) {
      
      // B. Build Mapping Logic
      
      // Map: Category Name -> New Category ID
      const catNameMap = {};
      newCategoryData.forEach(c => catNameMap[c.name] = c.id);

      // Map: (New Category ID + Test Name) -> New CategoryTest ID
      // We use a composite key because test names might be duplicated across different categories
      const testNameMap = {};
      newCategoryTestData.forEach(t => {
        const key = `${t.category}_${t.name}`;
        testNameMap[key] = t.id;
      });

      // Map: Old Investigation ID -> New CategoryTest ID
      const idMap = {};
      oldInvestigationData.forEach(oldInv => {
        const newCatId = catNameMap[oldInv.category];
        if (newCatId) {
          const key = `${newCatId}_${oldInv.test_name}`;
          const newTestId = testNameMap[key];
          if (newTestId) {
            idMap[oldInv.id] = newTestId;
          }
        }
      });

      // C. Prepare and Insert Data
      const rowsToInsert = [];

      for (const row of oldParamsData) {
        // Find the new ID using the map we built
        const newInvestigationId = idMap[row.investigation_id];

        // Only insert if we successfully found the linked parent test
        if (newInvestigationId) {
          rowsToInsert.push({
            investigation_id: newInvestigationId, // The new ID from categoryTest
            name: row.name,
            normal_range: row.normal_range,
            units: row.units,
            field_type: row.field_type,
            addedBy: row.addedBy,
            status: row.status || 'active', // Default to active if missing in source
            created_at: row.created_at,
            updated_at: row.updated_at
          });
        }
      }

      // Batch insert to handle large datasets
      if (rowsToInsert.length > 0) {
        await knex.batchInsert('testParameters', rowsToInsert, 100);
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('testParameters');
};