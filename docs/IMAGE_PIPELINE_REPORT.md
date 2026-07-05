# Image Pipeline Report — PF-005.1

## Executive Summary

Investigasi menemukan bahwa pipeline gambar produk memiliki **satu titik kegagalan kritis** dan **satu kelemahan struktural** yang mencegah produk baru dari Dashboard menampilkan gambar di frontend.

**Root Cause:** `next.config.ts` tidak memiliki konfigurasi `images.remotePatterns`, sehingga Next/Image menolak merender URL dari Supabase Storage (domain eksternal).

**Kelemahan Struktural:** Tabel `product_images` tidak memiliki migration file. Tidak ada jaminan foreign key constraint antara `products.id` dan `product_images.product_id`.

---

## Pipeline Verification

### Stage 1: Dashboard → Upload Image

| Check | Status | Detail |
|-------|--------|--------|
| File masuk ke bucket `product-images` | `✓` Berhasil | Dashboard menggunakan `supabaseClient.storage.from('product-images').upload()` dengan anon key. Jika bucket dan RLS storage dikonfigurasi benar, file akan terupload. |
| `getPublicUrl()` mengembalikan URL | `✓` Berhasil | `getPublicUrl()` selalu mengembalikan URL, tidak memverifikasi file benar-benar ada. |

**File:** `app/admin/dashboard/page.tsx:1048-1054`
```typescript
const filePath = `${productId}/${Date.now()}-${file.name}`;
const { error: uploadError } = await supabaseClient.storage.from('product-images').upload(filePath, file, { upsert: true });
const { data: urlData } = supabaseClient.storage.from('product-images').getPublicUrl(filePath);
```

---

### Stage 2: Dashboard → API → `product_images`

| Check | Status | Detail |
|-------|--------|--------|
| Payload `images[]` dikirim | `✓` Berhasil | Dashboard mengirim `images: imageUrls` di body POST/PUT. |
| Record masuk ke `product_images` | `✓` Berhasil | API route menggunakan service role key (bypass RLS). Insert ke `product_images(product_id, image_url)`. |

**File:** `app/api/products/route.ts:76-83`
```typescript
const { data: product, error } = await supabase.from('products').insert([payload]).select().single();
const imagesToInsert = extractImageUrls(body);
if (imagesToInsert.length > 0) {
  await supabase.from('product_images').insert(
    imagesToInsert.map((image_url) => ({ product_id: product.id, image_url }))
  );
}
```

---

### Stage 3: `product_id` dan `image_url`

| Check | Status | Detail |
|-------|--------|--------|
| `product_id` benar | `✓` Berhasil | POST: `product.id` dari return value insert. PUT: `body.id` (dari form). |
| `image_url` benar | `✓` Berhasil | URL dari `getPublicUrl()` — format: `https://<project>.supabase.co/storage/v1/object/public/product-images/<path>`. |

---

### Stage 4: Repository → Service

| Check | Status | Detail |
|-------|--------|--------|
| Repository mengambil `product_images` | `✓` Berhasil | `findCatalog()` menggunakan `.select("*, product_images(image_url)")`. Selama ada foreign key relationship, Supabase resolve join ini. |
| `⚠` Foreign key constraint | `✗` **Tidak Terverifikasi** | Tidak ada migration yang membuat tabel `product_images`, apalagi foreign key. Jika FK tidak ada, Supabase **tidak bisa** melakukan join. Lihat Evidence #1. |
| Service menghasilkan `images[]` | `✓` Berhasil | Jika Repository mengembalikan `product_images`, Service mentransformasi ke `images[]`. |

**File:** `lib/repositories/product.repository.ts:4-7`
```typescript
const { data, error } = await supabase
  .from("products")
  .select("*, product_images(image_url)")
  .order("created_at", { ascending: false });
```

**File:** `lib/services/product.service.ts:6-10`
```typescript
return data.map((p: any) => ({
  ...p,
  images: (p.product_images || []).map((img: any) => img.image_url),
  product_images: undefined,
}));
```

---

### Stage 5: API Response

| Check | Status | Detail |
|-------|--------|--------|
| GET /api/products mengembalikan `images[]` | `✓` Berhasil | Response JSON berisi field `images: string[]`. |

---

### Stage 6: Frontend Menerima Data

| Check | Status | Detail |
|-------|--------|--------|
| Homepage menerima `images[]` | `✓` Berhasil | Client fetch → `setFeatured(response.slice(0,3))` → akses `product.images?.[0]`. |
| Produk page menerima `images[]` | `✓` Berhasil | Server fetch → `getProducts()` → pass ke `ProdukGrid` → akses `product.images?.[0]`. |

---

### Stage 7: Next/Image Render

| Check | Status | Detail |
|-------|--------|--------|
| URL valid | `✓` Ya | URL dari Supabase valid. |
| Next/Image remotePatterns | `✗` **Gagal** | `next.config.ts` **tidak memiliki konfigurasi `images.remotePatterns`**. Next/Image menolak merender domain eksternal. |
| Fallback placeholder | `✓` Berhasil | Jika `images[0]` undefined, fallback ke `/images/produk/placeholder.svg` (lokal) berfungsi. |

**File:** `next.config.ts` (full content)
```typescript
const nextConfig: NextConfig = {
  /* config options here */  // ← Tidak ada images.remotePatterns
};
```

**File:** `components/produk/ProdukGrid.tsx:39-45`
```typescript
<Image
  src={product.images?.[0] || "/images/produk/placeholder.svg"}
  alt={product.name}
  fill
  className="object-cover"
/>
```

---

## Root Cause

Terdapat dua masalah independen:

### Root Cause #1 (Kritis): Next/Image tidak bisa merender URL Supabase

`next.config.ts` tidak memiliki konfigurasi `images.remotePatterns`. Tanpa ini, Next.js Image Optimization API menolak memproses gambar dari domain asing.

**Dampak:** Setiap gambar produk yang diupload melalui Dashboard (URL: `https://xvjowuwkjcwixvbmvuqq.supabase.co/...`) tidak akan tampil. Sebagai gantinya, placeholder muncul.

**Bukti:**
- `next.config.ts:3-5` — Tidak ada konfigurasi `images`.
- Semua produk dari `data/products.ts` menggunakan path lokal (`/images/produk/1.JPG`) — makanya produk lama tetap tampil.

### Root Cause #2 (Struktural): Tidak ada migration untuk `product_images`

Tabel `product_images` dibuat tanpa migration file. Artinya:
- Foreign key ke `products.id` mungkin tidak ada
- Tidak bisa direproduksi di environment lain
- Jika database di-reset, tabel ini hilang tanpa jejak

**Bukti:**
- `db/supabase_migrations/` hanya berisi 5 file (`001`-`005`).
- Tidak satu pun yang membuat tabel `product_images`.
- File `001_init_schema.sql` hanya membuat tabel `products` dengan kolom `image text` (single column).

---

## Evidence

### Evidence #1: Tidak ada migration untuk `product_images`

```
db/supabase_migrations/
├── 001_init_schema.sql       ← Membuat products (dengan image text, images text[])
├── 002_add_images.sql        ← Menambah images[] column
├── 003_add_postal_code.sql   ← Orders (tidak terkait)
├── 004_backfill_postal_code.sql
└── 005_add_shipping_columns.sql
```

Tidak ada `006_create_product_images.sql`.

### Evidence #2: `next.config.ts` tanpa remotePatterns

```typescript
// File: next.config.ts (line 3-5)
const nextConfig: NextConfig = {
  /* config options here */
};
```

### Evidence #3: Service role vs anon key

- **API route (DB writes):** `supabase` (service role) — bypasses RLS ✅
- **Dashboard (Storage upload):** `supabaseClient` (anon key) — tergantung RLS policy storage ⚠️

### Evidence #4: `scripts/migrate-images.js` menggunakan bucket salah

```javascript
// File: scripts/migrate-images.js (line 42)
await supabase.storage.from('products').upload(destPath, fileBuffer, { upsert: true });
//                                                    ^^^^^^^
// Bukan 'product-images'
```

Script migrasi legacy menggunakan bucket `'products'` sedangkan Dashboard menggunakan `'product-images'`. Ini adalah bug terpisah yang memengaruhi migrasi data awal, bukan pipeline runtime.

---

## Recommended Fix

### Fix #1 (Wajib — Pipeline): Tambahkan `images.remotePatterns` ke `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};
```

Ini memungkinkan Next/Image mengoptimasi dan merender gambar dari Supabase Storage.

### Fix #2 (Wajib — Struktural): Buat migration untuk `product_images`

```sql
-- 006_create_product_images.sql
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  image_url text not null,
  created_at timestamptz default now()
);

create index if not exists idx_product_images_product_id
  on product_images(product_id);
```

### Fix #3 (Rekomendasi — Konsistensi): Perbaiki bucket name di `scripts/migrate-images.js`

Ganti `storage.from('products')` menjadi `storage.from('product-images')`.

### Fix #4 (Rekomendasi — Robustness): Validasi hasil join di Repository

Jika foreign key belum ada, Supabase tidak bisa resolve join `product_images`. Repository bisa fallback dengan query manual:

```typescript
// Jika join gagal, fallback query terpisah
const { data: images } = await supabase
  .from("product_images")
  .select("product_id, image_url");
```

---

## Status Ringkasan

| Tahap | Status | Masalah |
|-------|--------|---------|
| Upload ke Storage | ✅ | Berfungsi (dengan asumsi RLS storage dikonfigurasi) |
| Insert `product_images` | ✅ | Berfungsi (service role bypass RLS) |
| Foreign Key constraint | ❓ | Tidak ada migration → tidak terverifikasi |
| Repository join | ❓ | Bergantung FK — jika tidak ada, join gagal |
| Service transformasi | ✅ | Logika benar |
| API response `images[]` | ✅ | Response shape benar |
| Frontend fetch | ✅ | Data diterima |
| Next/Image render | ❌ | **`remotePatterns` tidak dikonfigurasi** |

**Bottom Line:** Produk baru dari Dashboard tersimpan di database dan API, tetapi **gambarnya tidak tampil** karena Next/Image memblokir domain Supabase.
