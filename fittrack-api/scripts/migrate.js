// Production migration runner.
// Использует скомпилированный dist/config/typeorm.datasource.js — без ts-node.
// Запускается из docker entrypoint после готовности PG.

require('dotenv/config');
const dataSource = require('../dist/config/typeorm.datasource').default;

async function run() {
  try {
    await dataSource.initialize();
    const pending = await dataSource.showMigrations();
    if (!pending) {
      console.log('No pending migrations.');
    } else {
      console.log('Running migrations...');
    }
    await dataSource.runMigrations({ transaction: 'each' });
    console.log('Migrations applied.');
    await dataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
