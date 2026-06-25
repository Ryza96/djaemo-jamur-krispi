const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const directory = path.join(process.cwd(), 'db', 'supabase_migrations');
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL or SUPABASE_DB_URL environment variable.');
  console.error('Set it to your Supabase Postgres connection string before running this script.');
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const files = fs.readdirSync(directory)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(directory, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await client.query(sql);
      
    } catch (err) {
      console.error(`Failed: ${file}`);
      console.error(err);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
