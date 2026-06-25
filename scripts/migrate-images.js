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

  for (const p of products) {
    try {
      const localImage = p.image; // e.g. /images/produk/1.JPG
      if (!localImage) continue;

      const relPath = localImage.replace(/^\//, '');
      const absPath = path.join(process.cwd(), 'public', relPath);
      if (!fs.existsSync(absPath)) {
        console.warn('File not found, skipping:', absPath);
        continue;
      }

      const ext = path.extname(absPath);
      const base = path.basename(absPath);
      const destPath = `${p.id}/${Date.now()}-${base}`;

      const fileBuffer = fs.readFileSync(absPath);
      const { error: uploadErr } = await supabase.storage.from('products').upload(destPath, fileBuffer, { upsert: true });
      if (uploadErr) {
        console.error('Upload error for', absPath, uploadErr.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(destPath);
      const publicUrl = urlData?.publicUrl || null;
      if (!publicUrl) {
        console.error('No public url for', destPath);
        continue;
      }

      // update product row
      const { data, error: upsertErr } = await supabase.from('products').upsert({ id: p.id, images: [publicUrl] });
      if (upsertErr) {
        console.error('Failed to upsert product images for', p.id, upsertErr.message);
      } else {
        
      }
    } catch (e) {
      console.error('Unexpected error for product', p.id, e.message || e);
    }
  }

  
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
