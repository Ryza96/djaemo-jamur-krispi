const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const file = path.join(process.cwd(), 'data', 'products.json');
  if (!fs.existsSync(file)) {
    console.error('data/products.json not found');
    process.exit(1);
  }

  const raw = fs.readFileSync(file, 'utf8');
  const products = JSON.parse(raw);

  
  const { data, error } = await supabase.from('products').upsert(products);
  if (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
  
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
