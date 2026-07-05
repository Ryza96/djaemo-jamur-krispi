# Product Image Upload Trace — HOTFIX-002

## Executive Summary

Trace menemukan bahwa pipeline upload gambar produk memiliki **error handling yang terlalu agresif** — semua error ditelan (swallowed) tanpa feedback ke user. Akibatnya, upload bisa gagal diam-diam dan user tidak pernah tahu.

Ada **lima titik kegagalan potensial**, ditambah **satu bug struktural** yang membuat error handling tidak efektif.

---

## Upload Flow

```
User klik "Simpan Produk"
  │
  ├─ 1. Validasi form (name, price)
  │
  ├─ 2. Loop previewItems (max 5):
  │     ├─ existing → push URL ke imageUrls[]
  │     └─ new →
  │           ├─ supabaseClient.storage.from('product-images').upload()
  │           │   ⚠ Bisa gagal (RLS, bucket, network)
  │           ├─ supabaseClient.storage.from('product-images').getPublicUrl()
  │           └─ push publicUrl ke imageUrls[]
  │
  ├─ 3. POST /api/products  ATAU  PUT /api/products
  │     └─ payload: { ..., images: imageUrls }
  │
  ├─ 4. API Route (service role key):
  │     ├─ INSERT INTO products
  │     ├─ INSERT INTO product_images (product_id, image_url)
  │     ╰─ Return Product
  │
  ├─ 5. Refresh produk list
  │
  └─ 6. Tutup modal + reset form (APAPUN YANG TERJADI)
```

---

## Trace Result

### 1. Endpoint API yang dipanggil

| Kondisi | Endpoint | File:Baris |
|---------|----------|------------|
| Produk baru | `POST /api/products` | `dashboard/page.tsx:1086` |
| Edit produk | `PUT /api/products` | `dashboard/page.tsx:1072` |

### 2. Apakah request membawa file gambar?

**Tidak.** Payload adalah JSON, bukan multipart/form-data.

File sudah diupload ke Supabase Storage **sebelum** panggilan API. Yang dikirim ke API hanyalah array of URL string:

```json
{
  "id": "produk-1746000000000",
  "name": "Jamur Krispi BBQ",
  "description": "...",
  "price": 15000,
  "weight": "100g",
  "images": [
    "https://xvjowuwkjcwixvbmvuqq.supabase.co/storage/v1/object/public/product-images/produk-xxx/1746000000000-bbq.jpg"
  ]
}
```

### 3. Di mana upload() dipanggil?

`app/admin/dashboard/page.tsx:1048`

```typescript
const { error: uploadError } = await supabaseClient.storage
  .from('product-images')
  .upload(filePath, file, { upsert: true });
```

Menggunakan **supabaseClient** (anon key), **bukan** supabase (service role).

### 4. Apakah upload() benar-benar dipanggil?

**Ya.** Untuk setiap item `previewItem` dengan:
- `type === 'new'` (berasal dari file baru)
- `item.file` ada (File object dari input)

Jika kondisi di atas tidak terpenuhi (misal `item.file` tidak ada), upload dilewati, URL tidak ditambahkan.

### 5. Bucket apa yang dipakai?

`'product-images'` — konsisten di seluruh codebase:
- Dashboard upload: `supabaseClient.storage.from('product-images')`
- API route cleanup: `supabase.storage.from('product-images')`
- `next.config.ts` remotePatterns: `.../product-images/**`

### 6. Apakah bucket tersebut sama dengan yang ada di Supabase?

**Tidak bisa diverifikasi dari kode.** Nama bucket konsisten, tetapi bucket harus dibuat secara manual di Supabase Dashboard. Jika belum dibuat, upload akan gagal dengan error seperti:

> `Bucket 'product-images' not found`

Error ini ditelan (lihat poin 11).

### 7. Apakah upload() mengembalikan success atau error?

**Tergantung konfigurasi Supabase.** Dua skenario:

| Skenario | Hasil | Kode |
|----------|-------|------|
| Anon key memiliki izin upload ke bucket `product-images` | ✅ `uploadError = null` | Lanjut ke `getPublicUrl()` |
| **Anon key TIDAK memiliki izin** (default) | ❌ `uploadError = { message: "...violates row-level security..." }` | `console.error()` + `continue` |
| Bucket tidak ada | ❌ `uploadError = { message: "Bucket not found" }` | `console.error()` + `continue` |
| Network error / timeout | ❌ Exception thrown | `catch (e) { console.error(e) }` + `finally` |

**Semua error upload ditangani dengan `continue`** — product tetap disimpan, hanya tanpa gambar.

### 8. Apakah ada INSERT INTO product_images?

**Ya.** Di API route (`route.ts`):

- **POST** (baris 76-83): `supabase.from('product_images').insert(...)` — menggunakan **service role key** (bypass RLS).
- **PUT** (baris 126-137): `DELETE` dulu semua `product_images` untuk product_id, lalu `INSERT` yang baru.

### 9. (Tidak relevan — INSERT ada)

### 10. Apakah INSERT berhasil?

Tergantung:

| Kondisi | Hasil |
|---------|-------|
| Tabel `product_images` ada ✅ | ✅ INSERT berhasil (service role bypass RLS) |
| Tabel `product_images` tidak ada | ❌ Error: `relation "product_images" does not exist` |
| Foreign key constraint `product_id` → `products.id` ada ✅ | ✅ INSERT berhasil |
| Foreign key constraint ada, product_id tidak valid | ❌ Error: `violates foreign key constraint` |

**Catatan:** Tidak ada migration file untuk tabel `product_images`. Hanya ada 5 migration (`001`-`005`). Tidak satupun membuat tabel `product_images`. Tabel ini harus dibuat manual di Supabase Dashboard.

### 11. Apakah try/catch menyembunyikan error?

**Ya — tiga lapis error swallowing:**

#### Lapis 1: Upload loop (dashboard:1045-1064)

```typescript
try {
  const { error: uploadError } = await supabaseClient.storage.from(...).upload(...);
  if (uploadError) {
    console.error('Upload error:', uploadError.message);  // ← DIsembunyikan
    continue;  // ← skip, tidak push URL
  }
  // ... getPublicUrl ...
} catch (e) {
  console.error('Upload exception', e);  // ← DIsembunyikan
}
// finally: clear flags (tetap jalan)
```

**Dampak:** Upload gagal → URL tidak ditambahkan → `imageUrls` tetap kosong (atau hanya existing) → produk disimpan tanpa gambar.

#### Lapis 2: API call error handling (dashboard:1073-1090)

```typescript
if (!res.ok) {
  const errBody = await res.json().catch(() => null);
  throw new Error(errBody?.error || `HTTP ${res.status}`);
}
```

Ini melempar error (benar). Tapi error ini tertangkap oleh:

#### Lapis 3: Outer try/catch (dashboard:1028-1099)

```typescript
try {
  // ... upload loop ...
  // ... API call ...
  // ... refresh list ...
} catch (err) {
  console.error(err);   // ← Hanya console.log
}

// INI JALAN APAPUN YANG TERJADI:
setShowProductModal(false);   // ← Modal tetap ditutup
setFormData({});              // ← Form tetap direset
setPreviewItems([]);          // ← Preview tetap dibersihkan
```

**Dampak final:** Upload gagal → produk tersimpan tanpa gambar → modal tertutup → form direset → user melihat produk baru di tabel **tanpa gambar** dan **tanpa notifikasi error**.

---

## Root Cause

### Root Cause #1 (Utama): Storage upload gagal karena bucket/RLS belum dikonfigurasi

Kemungkinan terbesar: Anon key tidak memiliki izin untuk upload ke bucket `product-images`. Default Supabase memblokir semua operasi storage untuk user anonim.

**Error yang seharusnya muncul (jika tidak ditelan):**
```
StorageError: new row violates row-level security policy for "objects"
```

### Root Cause #2 (Penyebab): Error handling menelan semua error

Struktur try/catch di `handleSaveProduct()` menyebabkan:
1. Upload gagal → `continue` → tidak ada URL di payload
2. API sukses menyimpan produk tanpa gambar → response 200
3. Modal ditutup → user tidak sadar ada yang salah

### Root Cause #3 (Struktural): Tidak ada notifikasi error ke user

Tidak ada `alert()`, `showToast()`, atau indikator visual apapun ketika upload atau API gagal di dalam handleSaveProduct. Bandingkan dengan handleDelete yang menggunakan `confirm()`, atau `addToCart` di ProdukGrid yang menggunakan `showToast()`.

---

## Evidence

### Evidence A: Error swallowing — upload gagal, produk tetap disimpan

```
File: app/admin/dashboard/page.tsx:1028-1104

try {
  for (...) {
    if (item.type === 'new' && item.file) {
      try {
        const { error: uploadError } = await supabaseClient.storage.from('product-images').upload(...);
        if (uploadError) {
          console.error('Upload error:', uploadError.message);  // ← Hanya console.log
          continue;  // ← Lanjut tanpa URL
        }
      } catch (e) {
        console.error('Upload exception', e);  // ← Hanya console.log
      }
    }
  }
  // API call (mungkin sukses karena payload: { images: [] })
} catch (err) {
  console.error(err);  // ← Hanya console.log
}
// ← Kode di sini JALAN TANPA PEDULI error di atas
setShowProductModal(false);
```

### Evidence B: Tidak ada migration untuk `product_images`

```
db/supabase_migrations/
├── 001_init_schema.sql       ← products, customers, orders, order_items
├── 002_add_images.sql        ← add images[] column to products
├── 003_add_postal_code.sql   ← (orders)
├── 004_backfill_postal_code.sql
└── 005_add_shipping_columns.sql
                                ← TIDAK ADA migration untuk product_images
```

### Evidence C: Halaman lain menggunakan `showToast`, tetapi dashboard tidak

- `components/produk/ProdukGrid.tsx:23` — menggunakan `showToast()` untuk feedback add to cart
- `app/page.tsx` — tidak ada error state karena fetch
- `app/admin/dashboard/page.tsx:1049-1052` — upload error: `console.error()` saja

---

## Recommended Fix

### Fix #1 (Kritis — Error Handling): Tampilkan error ke user

Ganti `console.error()` dengan `showToast()` atau `alert()` sehingga user tahu upload gagal:

```typescript
// Sebelum: hanya console.log
console.error('Upload error:', uploadError.message);
continue;

// Sesudah: notifikasi user
showToast(`Gagal mengupload gambar: ${uploadError.message}`, "error");
continue;
```

Jangan biarkan modal tertutup jika terjadi error kritis. Atau setidaknya tampilkan toast dengan daftar gambar yang gagal.

### Fix #2 (Kritis — Storage RLS): Pastikan anon key memiliki izin upload

Di Supabase Dashboard → Storage → Policies, buat policy untuk bucket `product-images`:

```sql
-- Izinkan anon key upload ke bucket product-images
CREATE POLICY "anon_insert_product_images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'product-images');
```

Atau, upload dari server-side (via API route, pakai service role) untuk menghindari masalah RLS storage.

### Fix #3 (Struktural): Migration untuk `product_images`

Buat migration file untuk memastikan tabel `product_images` terdokumentasi dan bisa direproduksi:

```sql
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images(product_id);
```

### Fix #4 (Robustness): Jangan tutup modal jika API gagal

Pindahkan `setShowProductModal(false)` ke dalam blok `try` (setelah refresh sukses), bukan di luar `try/catch`.

---

## Status Perbaikan HOTFIX-001

`next.config.ts` sudah diperbaiki di HOTFIX-001 (`images.remotePatterns`). Tapi itu hanya menyelesaikan masalah **render**. Masalah **upload** (gagal diam-diam, tanpa feedback) masih ada dan merupakan PR syarat agar gambar bisa tampil — karena jika upload gagal, tidak ada gambar yang perlu dirender.
