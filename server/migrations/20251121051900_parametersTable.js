exports.up = async function(knex) {
  // 1. Create 'testParameters' table
  await knex.schema.createTable('testparameters', (table) => {
    table.increments('id').primary();
    table.integer('investigation_id').unsigned().notNullable(); 
    table.string('name').notNullable();
    table.string('normal_range');
    table.string('units');
    table.string('field_type');
    table.text('addedBy');
    table.text('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('investigation_id')
      .references('id')
      .inTable('categoryTest')
      .onDelete('CASCADE');
  });

  const hasOldParams = await knex.schema.hasTable('test_parameters');
  const hasOldInvestigation = await knex.schema.hasTable('investigation');
  const hasNewCategoryTest = await knex.schema.hasTable('categoryTest');
  const hasNewCategory = await knex.schema.hasTable('category');

  if (hasOldParams && hasOldInvestigation && hasNewCategoryTest && hasNewCategory) {
    const oldParamsData = await knex('test_parameters').select('*');
    const oldInvestigationData = await knex('investigation').select('id', 'test_name', 'category');
    const newCategoryData = await knex('category').select('id', 'name');
    const newCategoryTestData = await knex('categoryTest').select('id', 'category', 'name');

    if (oldParamsData.length > 0) {
      const catNameMap = {};
      newCategoryData.forEach(c => catNameMap[c.name] = c.id);
      const testNameMap = {};
      newCategoryTestData.forEach(t => {
        const key = `${t.category}_${t.name}`;
        testNameMap[key] = t.id;
      });
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
      const rowsToInsert = [];
      for (const row of oldParamsData) {
        const newInvestigationId = idMap[row.investigation_id];
        if (newInvestigationId) {
          rowsToInsert.push({
            investigation_id: newInvestigationId,
            name: row.name,
            normal_range: row.normal_range,
            units: row.units,
            field_type: row.field_type,
            addedBy: row.addedBy,
            status: row.status || 'active',
            created_at: row.created_at,
            updated_at: row.updated_at
          });
        }
      }
      if (rowsToInsert.length > 0) {
        await knex.batchInsert('testparameters', rowsToInsert, 100);
      }
    }
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('testparameters');
};