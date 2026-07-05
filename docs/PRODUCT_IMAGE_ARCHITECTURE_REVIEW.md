# Product & Image Architecture Review

## Executive Summary

Proyek ini memiliki **3 representasi gambar produk** yang saling tumpang tindih dan tidak sinkron:

| Representasi | Lokasi | Status |
|-------------|--------|--------|
| `image: string` (single) | TypeScript `Product` type, static data, schema migration 001 | ✅ Defined but migration never applied |
| `images: text[]` (array) | Schema migration 002, API payload, dashboard PUT | ✅ Defined but migration never applied |
| `product_images` table (join) | API GET/PUT, Supabase live schema | ✅ **Exists in live DB** but empty |

Akar masalah: **Migration 001 dan 002 tidak pernah dijalankan**, sehingga kolom `image`/`images` tidak ada di Supabase. Sementara kode sudah ditulis mengacu pada ketiga representasi tersebut secara campur aduk.

---

## 1. Source Code yang Masih Memakai `image` (singular, column)

### 1a. Type Definition

**File:** `types/index.ts:7`
```typescript
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  image: string;       // <-- single image, not array
}
```

### 1b. Static Data Files

**File:** `data/products.ts:11,20,29,38,47,56,65,74,83`
```typescript
image: "/images/produk/1.JPG",  // Local path, not Supabase URL
// ... 9 products total, all using /images/produk/ path
```

**File:** `data/products.json:8,16,24,32,40,48,56,64,72`
```json
"image": "/images/produk/1.JPG"   // Same local paths
```

### 1c. Public Catalog (Static Import)

**File:** `app/page.tsx:110`
```tsx
src={product.image}               // Uses `Image` from next/image
```

**File:** `components/produk/ProdukGrid.tsx:40`
```tsx
src={product.image}               // Uses `Image` from next/image
```

### 1d. Admin Products Page (Static Import)

**File:** `app/admin/products/page.tsx:24`
```tsx
<img src={p.image} alt={p.name} />  // Legacy admin, uses static data
```

### 1e. Dashboard (Dynamic, but reads `image` field)

**File:** `app/admin/dashboard/page.tsx:845-846`
```typescript
: product.image
  ? [product.image]
```

**File:** `app/admin/dashboard/page.tsx:830`
```typescript
setFormData({ name: "", description: "", price: 0, weight: "", image: "" });
```

**File:** `app/admin/dashboard/page.tsx:1093`
```typescript
image: imageUrls[0] || "",   // Simpan gambar pertama sebagai primary
```

### 1f. API Route (POST handler — checks `payload.image`)

**File:** `app/api/products/route.ts:43`
```typescript
if (payload.image && typeof payload.image !== 'string') delete payload.image;
```

### 1g. API Route (PUT handler — fallback)

**File:** `app/api/products/route.ts:103-104`
```typescript
: body?.image
  ? [body.image]
```

### 1h. API Route (DELETE handler — reads `existing.image`)

**File:** `app/api/products/route.ts:147`
```typescript
const images: string[] = existing?.images || (existing?.image ? [existing.image] : []);
```

### 1i. DB Migration

**File:** `db/supabase_migrations/001_init_schema.sql:12`
```sql
image text,   // <-- Column definition, NEVER APPLIED
```

### 1j. Migration Script (reads `p.image`)

**File:** `scripts/migrate-images.js:27`
```typescript
const localImage = p.image; // e.g. /images/produk/1.JPG
```

---

## 2. Source Code yang Memakai `product_images` (join table)

### 2a. API Route (GET — JOIN dengan product_images)

**File:** `app/api/products/route.ts:23`
```typescript
.select('*, product_images(image_url)')
```

### 2b. API Route (PUT — sync product_images)

**File:** `app/api/products/route.ts:98` (comment)
```typescript
// Tahap 2: sinkronisasi tabel anak `product_images`
```

**File:** `app/api/products/route.ts:113`
```typescript
.from('product_images').delete().eq('product_id', productId);
```

**File:** `app/api/products/route.ts:123`
```typescript
.from('product_images').insert(imagesToInsert.map(...))
```

### 2c. DB Schema (live)

| Item | Status |
|------|--------|
| Tabel `product_images` | ✅ Ada di live Supabase |
| Kolom: `id, product_id, image_url, created_at` | ✅ Ada |
| Foreign key `product_id → products.id` | ✅ Ada (inferred from JOIN working) |
| Kolom `sort_order` | ❌ Tidak ada |

---

## 3. Source Code yang Memakai Bucket `products`

### 3a. Dashboard (upload gambar — client-side)

**File:** `app/admin/dashboard/page.tsx:1054`
```typescript
await supabaseClient.storage.from('products').upload(filePath, file, { upsert: true });
```

**File:** `app/admin/dashboard/page.tsx:1060**
```typescript
const { data: urlData } = supabaseClient.storage.from('products').getPublicUrl(filePath);
```

**Client used:** `supabaseClient` (anon key) from `lib/supabase-client.ts`

### 3b. API Route (DELETE — hapus gambar dari storage)

**File:** `app/api/products/route.ts:154**
```typescript
await supabase.storage.from('products').remove([path]);
```

**Client used:** `supabase` (service role key) from `lib/supabase.ts`

### 3c. Migration Script (archived)

**File:** `scripts/migrate-images.js:42,48**
```typescript
await supabase.storage.from('products').upload(destPath, fileBuffer, { upsert: true });
const { data: urlData } = supabase.storage.from('products').getPublicUrl(destPath);
```

---

## 4. Source Code yang Memakai Bucket `product-images`

### 4a. Live Supabase Storage

| Item | Detail |
|------|--------|
| Bucket name | `product-images` (dengan dash) |
| Public | ✅ Ya |
| File size limit | 2 MB |
| Allowed MIME types | None |
| **Used by any source code?** | ❌ **Tidak ada** kode yang menggunakan bucket ini |

### 4b. HTML Label (Not storage bucket, just form ID)

**File:** `app/admin/product-form/page.tsx:158,165**
```tsx
<label htmlFor="product-images" ...>
<input id="product-images" ... />
```

Ini adalah **HTML `id` attribute**, bukan referensi storage bucket.

---

## 5. Daftar File yang Harus Diselaraskan

### 5a. Files with `image` (singular) — must be migrated

| File | Baris | Penggunaan | Tindakan |
|------|-------|-----------|----------|
| `types/index.ts` | 7 | `image: string` | Tambah `images?: string[]` atau ganti dengan array |
| `data/products.ts` | 11,20,... | `image: "/images/produk/..."` | Hapus file (pindah ke Supabase) |
| `data/products.json` | 8,16,... | `"image": "/images/produk/..."` | Hapus file (pindah ke Supabase) |
| `app/page.tsx` | 110 | `product.image` | Migrasi ke Supabase API fetch |
| `components/produk/ProdukGrid.tsx` | 40 | `product.image` | Migrasi ke Supabase API fetch + fallback `images[0]` |
| `app/produk/page.tsx` | 2,19 | Import `products` dari `data/products` | Migrasi ke Supabase API fetch |
| `app/admin/products/page.tsx` | 4,24 | Import `data/products`, `p.image` | Migrasi ke API atau hapus |
| `app/admin/dashboard/page.tsx` | 830,845-846,1093 | `formData.image`, `product.image` | Sesuaikan dengan skema baru |
| `app/api/products/route.ts` | 43,103,147 | `payload.image`, `body.image` | Hapus referensi `image`, pakai `product_images` table |
| `scripts/migrate-images.js` | 27 | `p.image` | Archive (sudah dijalankan?) |
| `db/supabase_migrations/001_init_schema.sql` | 12 | `image text` | Jalankan migration atau hapus kolom |
| `db/supabase_migrations/002_add_images.sql` | 5 | `images text[]` | Jalankan migration atau hapus kolom |

### 5b. Files referencing `product_images` (join table) — keep

| File | Baris | Penggunaan | Tindakan |
|------|-------|-----------|----------|
| `app/api/products/route.ts` | 23,98,113,123 | JOIN + CRUD | ✅ **Pertahankan** — ini arsitektur yang benar |
| Live DB | — | `product_images` table | ✅ **Pertahankan** — sudah live, tinggal tambah `sort_order` |

### 5c. Files referencing bucket `products` — must be fixed

| File | Baris | Penggunaan | Tindakan |
|------|-------|-----------|----------|
| `app/admin/dashboard/page.tsx` | 1054,1060 | `storage.from('products')` | Ganti ke `product-images` atau buat bucket `products` |
| `app/api/products/route.ts` | 154 | `storage.from('products').remove()` | Ganti ke `product-images` atau buat bucket `products` |
| `scripts/migrate-images.js` | 42,48 | `storage.from('products')` | Archive ( sudah tidak dipakai) |

### 5d. Files to delete (dead/legacy)

| File | Alasan |
|------|--------|
| `data/products.ts` | Akan diganti Supabase API |
| `data/products.json` | Akan diganti Supabase API |
| `scripts/migrate-products.js` | One-time migration, sudah tidak relevan |
| `scripts/migrate-images.js` | One-time migration, sudah tidak relevan |
| `components/admin/ProductEditModal.tsx` | Tidak terpakai (diganti inline modal dashboard) |
| `components/admin/AdminGuard.tsx` | File kosong |
| `app/admin/product-form/page.tsx` | Duplicate form, tidak selesai (TODO), atau selesaikan |
| `app/admin/products/page.tsx` | Legacy page, menggunakan static import |

---

## 6. Rekomendasi Satu Arsitektur Final

### Arsitektur Target

```
┌─────────────────────────────────────────────────┐
│                  PRODUCT TYPE                    │
│  interface Product {                             │
│    id: string;                                   │
│    name: string;                                 │
│    description: string;                          │
│    price: number;                                │
│    weight: string;                               │
│    // NO image field here                        │
│  }                                               │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           product_images TABLE                   │
│  id (PK) | product_id (FK) | image_url | sort   │
├─────────────────────────────────────────────────┤
│  1       | produk-1         | url       | 1      │
│  2       | produk-1         | url       | 2      │
│  3       | produk-2         | url       | 1      │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│          STORAGE BUCKET                          │
│  Name: product-images (sudah ada)                │
│  Atau: products (buat baru)                      │
│  Folder structure: {productId}/{timestamp}-{name}│
└─────────────────────────────────────────────────┘
```

### Prinsip Arsitektur

| Aspek | Keputusan | Alasan |
|-------|-----------|--------|
| **Image column di products** | **HAPUS** — jangan pakai `image` atau `images` di tabel `products` | Normalisasi: satu produk bisa punya banyak gambar. Join table `product_images` sudah benar. |
| **Storage bucket** | **Ganti semua `products` → `product-images`** | Bucket `product-images` sudah ada di Supabase. Buat `products` baru juga opsi, tapi lebih sedikit perubahan kode jika konsisten pakai yang sudah ada. |
| **Product type** | **HAPUS `image: string`** dari `Product` interface | Ambil gambar dari `product_images` via API. Frontend bisa pakai `images[0]?.image_url` untuk primary. |
| **Data source** | **Supabase sebagai single source of truth** | Hapus `data/products.ts` dan `data/products.json`. Semua halaman fetch dari `/api/products`. |
| **Admin form** | **Satukan ke inline modal dashboard** | Hapus atau selesaikan `/admin/product-form/page.tsx`. Hapus `ProductEditModal.tsx`. |

### Langkah Implementasi

1. **DB:** Tambah kolom `sort_order integer` ke tabel `product_images`
2. **DB:** Terapkan migration 001 + 002 (kolom `image` + `images`) — atau biarkan tidak terpakai dan langsung gunakan `product_images`
3. **DB:** Seed 9 produk ke Supabase
4. **Storage:** Buat bucket `products` (baru) atau ubah semua kode dari `products` → `product-images`
5. **Types:** Update `Product` interface: hapus `image`, tambah helper untuk akses gambar dari join
6. **API:** Update POST handler agar tidak mengirim `image` field; simpan gambar ke `product_images`
7. **API:** Update DELETE handler agar membaca gambar dari `product_images` table untuk cleanup storage
8. **Dashboard:** Update form agar tidak mengirim `image` field ke POST API
9. **Public pages:** Ubah dari `import { products } from "@/data/products"` ke fetch `/api/products`
10. **Cleanup:** Hapus file dead code

### Diagram Alur Final

```
User (Browser)
    │
    ├── Public Catalog ──► GET /api/products ──► Supabase products + product_images
    │
    ├── Checkout ──► GET /api/products ──► Supabase (price sebagai source of truth)
    │
    └── Admin Dashboard
            │
            ├── Tambah/Edit ──► POST/PUT /api/products
            │       │                  │
            │       └── Upload Image ──► supabase.storage.from('product-images')
            │                                    │
            │                                    └── URL disimpan ke product_images
            │
            └── Hapus ──► DELETE /api/products
                                │
                                ├── Hapus baris dari product_images
                                ├── Hapus file dari storage
                                └── Hapus baris dari products
```
