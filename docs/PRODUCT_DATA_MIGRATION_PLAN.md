# Product Data Migration Plan

## Executive Summary

Saat ini data produk memiliki **tiga sumber** yang tidak sinkron:

1. `data/products.ts` — digunakan oleh halaman publik (katalog, home)
2. `data/products.json` — digunakan oleh migration script (seed ke Supabase), memiliki harga berbeda
3. `products` table di Supabase — digunakan oleh admin dashboard

Target: **Supabase sebagai single source of truth** untuk semua halaman publik dan admin.

---

## Current Architecture

```
                    ┌──────────────────────┐
                    │   data/products.ts    │
                    │  price: 15.000        │
                    └──────┬───────────────┘
                           │ import
              ┌────────────┼────────────┐
              ▼            ▼            │
     ┌────────────┐ ┌──────────┐       │
     │  Home Page │ │ Katalog  │       │
     │  /page.tsx │ │ /produk  │       │
     └────────────┘ └──────────┘       │
                                        │
                    ┌──────────────────┐│
                    │ data/products.json││
                    │ price: 14.499    ││
                    └──────┬───────────┘│
                           │ seed       │
                           ▼            │
                    ┌──────────────────┐│
                    │   Supabase       ││
                    │   products       ││
                    │   price: ?       ││
                    └──────┬───────────┘│
                           │ fetch      │
                           ▼            ▼
                    ┌──────────────────────┐
                    │  Admin Dashboard     │
                    │  (via GET /api/prod) │
                    └──────────────────────┘
```

### Three Sources, Three Sets of Prices

| Source | Price | Weight | Used By |
|--------|-------|--------|---------|
| `data/products.ts` | Rp 15.000 | 100g | Public catalog, Home, Cart, Checkout |
| `data/products.json` | Rp 14.499 | 72g | Migration scripts only |
| Supabase `products` table | Unknown (depends on seed) | Unknown | Admin dashboard, API |

---

## Current Data Flow

### Public catalog flow (CURRENT — uses static data)

```
data/products.ts
  → app/page.tsx (featured products, 3 items)
  → app/produk/page.tsx → ProdukGrid component
    → "Add to Cart" button → CartProvider (localStorage)
      → app/cart/page.tsx (cart display, subtotal from localStorage)
        → app/checkout/page.tsx (checkout form)
          → POST /api/payment (sends product data from localStorage)
```

### Admin flow (CURRENT — uses Supabase)

```
Admin Dashboard
  → fetch("/api/products")
    → supabase.from("products").select("*, product_images(image_url)")
      → Product CRUD (create/edit/delete)
```

---

## Target Architecture

```
                    ┌──────────────────────┐
                    │      Supabase        │
                    │   products table     │
                    │   SINGLE TRUTH       │
                    └──────┬───────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌──────────┐ ┌──────────┐
     │  Home Page │ │ Katalog  │ │  Admin   │
     │  /page.tsx │ │ /produk  │ │ Dashboard│
     │  (API)     │ │ (API)    │ │  (API)   │
     └────────────┘ └──────────┘ └──────────┘
              │            │
              ▼            ▼
     ┌──────────────────────────────┐
     │      Cart → Checkout         │
     │  (harga dari API, bukan local)│
     └──────────────────────────────┘
```

### Perubahan utama:

1. **Public catalog** → fetch dari `GET /api/products` (Supabase) bukan dari `data/products.ts`
2. **Cart** → menyimpan hanya `product.id` + `quantity`, harga di-re-fetch saat checkout
3. **data/products.ts** → dihapus setelah migrasi
4. **data/products.json** → dihapus setelah migrasi (diganti seed script berbasis Supabase)

---

## Affected Files

### Files to CHANGE

| File | Perubahan |
|------|-----------|
| `app/page.tsx` | Ganti `import { products } from "@/data/products"` dengan fetch dari API |
| `app/produk/page.tsx` | Ganti `import { products }` dengan async server component fetch |
| `components/produk/ProdukGrid.tsx` | Mungkin perlu diubah props type (jika fetch dilakukan di komponen) |
| `types/index.ts` | Tambah field `images`, `category`, `stock` ke `Product` interface |
| `app/api/products/route.ts` | Mungkin perlu tambah caching/ISR header |
| `app/checkout/page.tsx` | Sudah direncanakan di Task 1 — server-side price validation |

### Files to DELETE after migration

| File | Alasan |
|------|--------|
| `data/products.ts` | Digantikan Supabase |
| `data/products.json` | Digantikan seed script baru |
| `scripts/migrate-products.js` | Migration sudah selesai |
| `scripts/migrate-images.js` | Migration sudah selesai |

### Files to KEEP (no change needed)

| File | Alasan |
|------|--------|
| `scripts/run-migrations.js` | Utilities masih berguna |
| `lib/supabase-client.ts` | Anon key client — untuk public read |
| `lib/supabase.ts` | Service role — untuk admin |
| `db/supabase_migrations/*` | Riwayat migrasi |

---

## Affected Features

| Feature | Dampak | Detail |
|---------|--------|--------|
| **Home Page** (`/`) | ✅ Langsung berubah | Produk unggulan akan ambil dari Supabase |
| **Product Catalog** (`/produk`) | ✅ Langsung berubah | Daftar produk dari Supabase |
| **Cart** | ⚠️ Tidak langsung | Cart tetap simpan product object di localStorage. Saat checkout, server akan lookup dari Supabase (Task 1) |
| **Checkout** | ⚠️ Tidak langsung | Server-side validation memastikan harga dari Supabase (Task 1) |
| **Payment** | ⚠️ Tidak langsung | Payment API akan menggunakan harga dari Supabase (Task 1) |
| **Admin Dashboard** | ✅ Sudah pakai Supabase | Tidak ada perubahan |
| **Admin Product Form** | ⚠️ Belum integrasi | Form saat ini belum connect ke API (ada TODO) |
| **Search** | 🆕 Bisa ditambahkan | Query Supabase dengan `ilike` |

---

## Database Gap Analysis

### Current Supabase `products` table structure

```sql
create table products (
  id          text primary key,
  name        text not null,
  description text,
  price       integer not null,
  weight      text,
  image       text,
  images      text[],          -- added in migration 002
  created_at  timestamptz default now()
);

-- Terkait: product_images (child table, tidak ada di migration)
create table product_images (
  id          bigserial primary key,  -- inferred
  product_id  text references products(id),  -- inferred
  image_url   text                  -- inferred
);
```

### Comparison: Static data vs Supabase

| Field | `data/products.ts` | `data/products.json` | Supabase | Notes |
|-------|--------------------|----------------------|----------|-------|
| `id` | ✅ `produk-1` | ✅ `produk-1` | ✅ text PK | Konsisten |
| `name` | ✅ | ✅ | ✅ text | OK |
| `description` | ✅ | ✅ | ✅ text | OK |
| `price` | ✅ **15000** | ✅ **14499** | ✅ integer | ❌ **Tidak sinkron** |
| `weight` | ✅ **100g** | ✅ **72g** | ✅ text | ❌ **Tidak sinkron** |
| `image` | ✅ `/images/produk/1.JPG` | ✅ sama | ✅ text | OK |
| `images` | ❌ Tidak ada | ❌ Tidak ada | ✅ text[] | Ada di Supabase |
| `category` | ❌ Tidak ada | ❌ Tidak ada | ❌ **Tidak ada** | Ada di admin product-form |
| `stock` | ❌ Tidak ada | ❌ Tidak ada | ❌ **Tidak ada** | Ada di admin product-form |
| `created_at` | ❌ Tidak ada | ❌ Tidak ada | ✅ timestamptz | Auto-generated |
| `slug` | ❌ Tidak ada | ❌ Tidak ada | ❌ **Tidak ada** | Berguna untuk SEO |

### Data yang ada di Supabase tapi tidak di static files

- `images` (array) — sudah ada migration
- `created_at` — auto-generated

### Data yang ada di static files tapi belum di Supabase

- Tidak ada — semua field ada di Supabase

### Data yang ada di admin product-form tapi belum di database

| Field | Ada di Form? | Ada di Supabase? | Notes |
|-------|-------------|------------------|-------|
| `category` | ✅ (`Original`, `Balado`, `Spicy`, `Keju`) | ❌ | Perlu migrasi |
| `stock` | ✅ (number input) | ❌ | Perlu migrasi |

### Missing Migration

Table `product_images` digunakan di API (`select('*, product_images(image_url)')`) tapi **tidak ada CREATE TABLE di migration files**. Ini harus ditambahkan.

---

## Migration Plan

### Phase 0: Preparation (sebelum ubah kode)

```
Langkah 0.1: Seed Supabase dengan data konsisten
  - Tentukan harga final (rekomendasi: Rp 15.000, weight 100g)
  - Update data di Supabase table via Supabase dashboard atau script
  - Hapus data/products.json atau sinkronkan

Langkah 0.2: Tambah migration untuk product_images table
  - CREATE TABLE IF NOT EXISTS product_images
  - Migration 006

Langkah 0.3: Tambah migration untuk category dan stock
  - ALTER TABLE products ADD COLUMN category text
  - ALTER TABLE products ADD COLUMN stock integer DEFAULT 0
```

### Phase 1: API Layer (no UI changes)

```
Langkah 1.1: Tambah GET /api/products/cached
  - Sama seperti GET /api/products tapi dengan Cache-Control header
  - Atau modifikasi GET existing dengan ISR support

Langkah 1.2: Pastikan GET /api/products accessible dari server component
  - Tidak perlu auth untuk GET (public)
  - RLS policy sudah allow select
```

### Phase 2: Public Pages (switch to Supabase)

```
Langkah 2.1: Ubah app/page.tsx
  - Hapus import { products } from "@/data/products"
  - Ganti dengan fetch dari GET /api/products atau langsung dari Supabase
  - Produk unggulan: ambil 3 produk pertama

Langkah 2.2: Ubah app/produk/page.tsx
  - Hapus import { products } from "@/data/products"
  - Jadikan server component async
  - Fetch dari Supabase langsung (via anon key + RLS)
  - Kirim hasil ke ProdukGrid

Langkah 2.3: Update ProdukGrid props
  - Tipe data sudah sesuai (Product[])
  - Tidak perlu perubahan props
```

### Phase 3: Cleanup

```
Langkah 3.1: Hapus data/products.ts
Langkah 3.2: Hapus data/products.json
Langkah 3.3: Archive migration scripts
Langkah 3.4: Update types/index.ts jika perlu
```

### Phase 4: Verify

```
Langkah 4.1: Buka /produk — harus menampilkan produk dari Supabase
Langkah 4.2: Buka / — produk unggulan harus tampil
Langkah 4.3: Add to cart → checkout → verifikasi harga di Midtrans cocok
Langkah 4.4: Admin dashboard — tambah produk → tampil di publik
Langkah 4.5: Admin dashboard — edit harga → harga berubah di publik
```

---

## Risk Analysis

| Risiko | Dampak | Probabilitas | Mitigasi |
|--------|--------|-------------|----------|
| **Harga di Supabase kosong/salah** | Produk tampil dengan harga 0 atau error | Rendah (seed dulu) | Seed data dulu sebelum cutover |
| **Supabase down** | Catalog kosong, tidak bisa checkout | Rendah (SLA 99.9%) | Fallback ke cache atau static data sementara |
| **Data inkonsistensi harga** | Customer lihat harga A, bayar harga B | Sedang | Sinkronisasi data dulu sebelum cutover; server-side validation memastikan final price |
| **Performance: public pages jadi slow** | Semua produk perlu fetch dari Supabase | Rendah (Supabase fast, server component) | Gunakan cache header; jumlah produk sedikit (< 50) |
| **product_images table belum ada** | API error | Tinggi | Migration harus jalan duluan |
| **Cart yang sudah ada di localStorage pake harga lama** | Harga cart tidak sinkron | Sedang | Di-checkout, server akan re-calculate (Task 1) |

---

## Rollback Plan

### Jika terjadi error setelah deploy:

1. **Kembalikan import ke data/products.ts** di `app/page.tsx` dan `app/produk/page.tsx`
2. **Redeploy** — karena kompiler akan kembali menggunakan static file
3. Tidak ada data yang hilang — Supabase tetap terisi, tinggal switch kapan saja

### Rollback safety net:

```
Simpan file data/products.ts sebagai cadangan (jangan hapus dulu).
Rename menjadi data/products.backup.ts selama transisi.
Hapus setelah 1 minggu produksi stabil.
```

---

## Implementation Checklist

### Pre-Migration

- [ ] Tentukan harga final untuk seed data (Rp 15.000 atau Rp 14.499)
- [ ] Seed Supabase dengan data final
- [ ] Verifikasi semua 9 produk ada di Supabase
- [ ] Verifikasi `product_images` table sudah ada (buat migration 006 jika belum)
- [ ] Verifikasi semua harga integer (bukan string/float)
- [ ] Buat migration 007 untuk `category` dan `stock` (opsional)

### Phase 1 — API Layer

- [ ] `app/api/products/route.ts` — verify GET sudah benar dan public
- [ ] `app/api/products/route.ts` — verify caching behavior

### Phase 2 — Public Pages

- [ ] `app/produk/page.tsx` — convert ke async server component
- [ ] `app/produk/page.tsx` — ganti `import products` dengan fetch Supabase
- [ ] `app/page.tsx` — ganti featured products fetch ke Supabase
- [ ] `components/produk/ProdukGrid.tsx` — verify props type cocok
- [ ] Test `/produk` — tampilkan 9 produk
- [ ] Test `/` — tampilkan 3 produk unggulan
- [ ] Test "Add to Cart" dari katalog — produk masuk ke cart
- [ ] Test checkout — harga di Midtrans = harga di Supabase

### Phase 3 — Cleanup

- [ ] Hapus `data/products.ts`
- [ ] Hapus `data/products.json`
- [ ] Archive `scripts/migrate-products.js`
- [ ] Archive `scripts/migrate-images.js`
- [ ] Update `types/index.ts` jika ada field baru

### Phase 4 — Verification

- [ ] `npm run build` — tidak ada error
- [ ] `npm run lint` — tidak ada error
- [ ] Test semua flow: Home → Produk → Cart → Checkout → Payment
- [ ] Test admin: Tambah produk → muncul di publik
- [ ] Test admin: Edit harga → harga berubah di publik
- [ ] Test admin: Hapus produk → hilang dari publik

### Post-Migration

- [ ] Monitor error rate 24 jam
- [ ] Monitor response time `GET /api/products`
- [ ] Hapus file backup setelah 1 minggu

---

## Summary

| Metric | Value |
|--------|-------|
| Files to change | 3 |
| Files to delete | 4 |
| Files to keep | ~50 |
| New migrations needed | 1-2 (product_images, optional category/stock) |
| Estimated effort | 2-3 hari |
| Downtime required | 0 (hot swap) |
| Risk level | Rendah — rollback semudah revert import |
