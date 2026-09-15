const { initDatabase } = require('./database');

const runSeed = async () => {
  console.log('Initializing database and seeding demo data if empty...');
  await initDatabase();
  console.log('✅ Seed check complete!');
  console.log('\nDemo Account Logins (Password for all accounts: Demo@123):');
  console.log('1. Username: alex  | Email: alex@example.com');
  console.log('2. Username: sarah | Email: sarah@example.com');
  console.log('3. Username: rahul | Email: rahul@example.com');
  process.exit(0);
};

runSeed().catch(err => {
  console.error('Error running database seed script:', err);
  process.exit(1);
});
