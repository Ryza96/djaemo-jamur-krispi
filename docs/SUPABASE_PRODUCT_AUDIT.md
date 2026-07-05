# Supabase Product Audit

## Executive Summary

Pemeriksaan langsung terhadap Supabase database mengungkapkan **kesenjangan kritis**: tabel `products` hanya berisi **1 dari 9 produk** yang dibutuhkan. Kolom `image` dan `images` juga **tidak ada** di database, padahal migration `001_init_schema.sql` dan `002_add_images.sql` mendefinisikannya.

**Database tidak siap menjadi single source of truth untuk produk.**

---

## Jumlah Produk

| Sumber | Jumlah Produk |
|--------|:------------:|
| `data/products.ts` (katalog publik) | **9** |
| `data/products.json` (seed script) | **9** |
| **Supabase `products` table** | **1** |

**Selisih: 8 produk hilang dari Supabase.**

---

## Perbandingan Produk

### Produk #1 (satu-satunya di Supabase)

| Field | `data/products.ts` | `data/products.json` | **Supabase (aktual)** |
|-------|:------------------:|:--------------------:|:--------------------:|
| `id` | `produk-1` | `produk-1` | `produk-1781880511713` |
| `name` | `Jamur Krispi Balado` | `Jamur Krispi Balado` | `jamur krispi Balado` |
| `price` | **15000** | **14499** | **14499** |
| `description` | "Cita rasa balado khas Indonesia..." | "Cita rasa balado khas Indonesia..." | `Jamur alami sehat merona` |
| `weight` | **100g** | **72g** | **72** |
| `image` | `/images/produk/4.JPG` | `/images/produk/4.JPG` | ❌ **Kolom tidak ada** |
| `images` | — | — | ❌ **Kolom tidak ada** |
| `created_at` | — | — | `2026-06-19T14:48:34+00` |

### Produk #2 sampai #9

**Tidak ada di Supabase.** Semua 8 produk lainnya (Original, BBQ, Pedas Manis, Rumput Laut, Bawang, Cabe Rawit, Keju, Madu) tidak ditemukan di database.

---

## Temuan

### 1. Data Tidak Konsisten

| Temuan | Detail | Dampak |
|--------|--------|--------|
| **ID tidak standar** | `produk-1781880511713` vs `produk-1` | ID mengandung timestamp, tidak konsisten |
| **Harga berbeda** | Supabase: 14499, `products.ts`: 15000 | **Tiga sumber, tiga harga** |
| **Berat tanpa satuan** | Supabase: `"72"`, `products.json`: `"72g"`, `products.ts`: `"100g"` | Berat di Supabase tidak punya unit |
| **Nama lowercase** | Supabase: `"jamur krispi Balado"` vs `"Jamur Krispi Balado"` | Inconsistent capitalization |
| **Deskripsi berbeda total** | Supabase: `"Jamur alami sehat merona"` vs static: deskripsi panjang | Error seed atau data diubah manual |

### 2. Data Hilang

| Item | Status |
|------|--------|
| **8 dari 9 produk** | ❌ **Tidak ada di Supabase** |
| **Kolom `image`** (didefinisikan di migration 001) | ❌ **Kolom tidak ada di database** |
| **Kolom `images`** (didefinisikan di migration 002) | ❌ **Kolom tidak ada di database** |
| **Tabel `product_images`** | ✅ Ada tapi **kosong** (0 baris) |
| **Relasi gambar produk** | ❌ Tidak ada gambar untuk produk mana pun |

### 3. Tidak Ada Data Ganda

Tidak ditemukan duplikasi data. Hanya ada 1 record unik.

---

## Status Kolom Database

Berdasarkan query langsung ke Supabase REST API (`select=id,name,price,description,weight,created_at`):

| Kolom | Ada di DB? | Dibutuhkan? | Status |
|-------|:----------:|:-----------:|--------|
| `id` | ✅ | ✅ | OK |
| `name` | ✅ | ✅ | OK |
| `description` | ✅ | ✅ | OK |
| `price` | ✅ | ✅ | OK |
| `weight` | ✅ | ✅ | OK (tapi tanpa satuan) |
| `image` | ❌ | ✅ (digunakan API `GET /api/products` di `*.select('*, product_images(image_url)')` ) | ❌ **Migration belum jalan** |
| `images` | ❌ | ✅ (digunakan admin dashboard) | ❌ **Migration belum jalan** |
| `created_at` | ✅ | ✅ | OK |

**Kesimpulan:** Migration `001_init_schema.sql` dan `002_add_images.sql` belum sepenuhnya dijalankan di database ini.

---

## Kesiapan Database untuk Single Source of Truth

| Kriteria | Status | Bobot |
|----------|--------|:-----:|
| Semua produk tersedia | ❌ Hanya 1 dari 9 | 40% |
| Harga konsisten | ❌ Beda dengan static file | 15% |
| Gambar tersedia | ❌ Kolom image tidak ada | 15% |
| Deskripsi akurat | ❌ Berbeda | 10% |
| ID konsisten | ❌ Berbeda format | 10% |
| Struktur tabel lengkap | ❌ Kolom image/images hilang | 10% |

**Tingkat Kesiapan Database: 11%**

Rincian:
- Produk tersedia: 1/9 × 40% = **4.4%**
- Harga: 0% (berbeda) = **0%**
- Gambar: 0% (kolom tidak ada) = **0%**
- Deskripsi: 0% (berbeda) = **0%**
- ID: 0% (berbeda format) = **0%**
- Struktur: kolom `image` dan `images` tidak ada = **6.6%** (created_at ada)

---

## Rekomendasi Langkah Sebelum Migrasi

1. **Jalankan migration 001 dan 002** ke Supabase untuk membuat kolom `image`, `images`
2. **Seed ulang seluruh 9 produk** dengan data final (pilih satu set harga: Rp 15.000 atau Rp 14.499)
3. **Upload gambar** ke Supabase Storage atau pastikan path publik bisa diakses
4. **Gunakan ID konsisten** (`produk-1` sampai `produk-9`)
5. **Verifikasi** bahwa `product_images` table terisi dengan benar
6. **Test query** `GET /api/products` dari aplikasi setelah seed

---

## Catatan Tambahan

Database saat ini berisi **1 order paid** dan **1 customer** — ini menandakan pernah ada transaksi sukses menggunakan data dari Supabase. Ini membuktikan bahwa payment flow bisa berfungsi meski hanya dengan 1 produk.

Migration 001 dan 002 mungkin **belum pernah dijalankan** terhadap Supabase project ini. Kolom `image` dan `images` tidak ada, yang berarti struktur tabel `products` masih berupa struktur awal sebelum migration.

Waktu pembuatan produk (`created_at: 2026-06-19`) mengindikasikan data ini dimasukkan sekitar 10 hari yang lalu, kemungkinan via script `migrate-products.js` yang membaca dari `products.json` (harga 14499 cocok).
