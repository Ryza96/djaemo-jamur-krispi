# Admin Product Verification

## Executive Summary

**Verdict: TIDAK SIAP — GAGAL VERIFIKASI**

Modul Admin Product mengalami **3 kegagalan kritis** yang membuat alur CRUD tidak dapat berjalan lengkap. Akar masalah: migrasi skema database (001 dan 002) **tidak pernah diterapkan** ke Supabase. Akibatnya kolom `image` dan `images` tidak ada, dan bucket storage `products` tidak pernah dibuat.

---

## Test Environment

| Item | Detail |
|------|--------|
| **Aplikasi** | Next.js (localhost:3000) |
| **Supabase Project** | `xvjowuwkjcwixvbmvuqq` |
| **Service Role Key** | Digunakan untuk verifikasi langsung via REST API |
| **Endpoint API** | `http://localhost:3000/api/products` |
| **Metode** | API request langsung (simulasi Dashboard) + verifikasi Supabase REST |
| **Data awal** | 1 produk existing: `jamur krispi Balado` (Rp 14.499) |
| **Data test** | 2 produk test (`test-e2e-001`, `test-e2e-noimg-001`) — sudah dihapus setelah verifikasi |

**State database setelah test:**
```json
[
  { "id": "produk-1781880511713", "name": "jamur krispi Balado", "price": 14499 }
]
```

---

## Test Result

### 1. Tambah Produk

**Prosedur:** POST /api/products dengan body `{ id, name, description, price, weight, image }` — sama seperti yang dikirim Dashboard.

| # | Skenario | Hasil | Detail |
|---|----------|-------|--------|
| 1a | POST tanpa field `image` | ✅ **Berhasil** (201) | Produk tersimpan di tabel `products` |
| 1b | POST dengan field `image` (seperti Dashboard) | ❌ **GAGAL** (500) | `"Could not find the 'image' column of 'products' in the schema cache"` |
| 1c | Verifikasi tabel `products` | ✅ OK | Produk baru muncul di `SELECT * FROM products` |
| 1d | Verifikasi `product_images` | ✅ OK | Tabel ada (kosong) |
| 1e | Verifikasi Storage | ❌ GAGAL | Bucket `products` tidak ada (yang ada: `product-images`) |

**Root cause:** Dashboard mengirim payload:
```javascript
const newProduct = {
  id: productId,
  name: formData.name || "",
  description: formData.description || "",
  price: formData.price || 0,
  weight: formData.weight || "",
  image: imageUrls[0] || "",    // <-- KOLOM INI TIDAK ADA DI DB
};
```

Kolom `image` tidak ada di tabel `products` karena **Migration 001** tidak pernah dijalankan.

**Status: ❌ GAGAL**

---

### 2. Edit Produk

**Prosedur:** PUT /api/products dengan body `{ id, name, description, price, weight, images }`

| # | Skenario | Hasil | Detail |
|---|----------|-------|--------|
| 2a | Update nama, deskripsi, harga, berat | ✅ **Berhasil** (200) | Semua field terupdate |
| 2b | Update dengan field `images` (2 URL) | ✅ **Berhasil** (200) | Produk terupdate, `product_images` terisi |
| 2c | Verifikasi perubahan di DB | ✅ OK | `name: "EDITED Name"`, `price: 20000`, `weight: "120g"` |
| 2d | Verifikasi `product_images` | ✅ OK | 2 baris baru dengan `product_id` dan `image_url` benar |
| 2e | Urutan gambar | ⚠️ **Tidak terjamin** | Tidak ada kolom `sort_order` di `product_images` |

**Catatan:** PUT handler hanya update kolom `name`, `description`, `price`, `weight` — tidak menyentuh `image`/`images` di tabel `products`. Manajemen gambar dilakukan sepenuhnya di tabel `product_images`.

**Status: ✅ BERHASIL** (dengan catatan urutan gambar)

---

### 3. Upload Gambar

**Prosedur:** Dashboard → `supabaseClient.storage.from('products').upload(filePath, file)`

| # | Skenario | Hasil | Detail |
|---|----------|-------|--------|
| 3a | Cek bucket `products` | ❌ **TIDAK ADA** | Hanya bucket `product-images` (dengan dash) yang ada |
| 3b | Upload via anon key ke bucket `products` | ❌ **PASTI GAGAL** | Bucket tidak ditemukan (error 400/404) |
| 3c | File size validation | ❌ **Tidak ada** | Tidak ada pengecekan client maupun server |
| 3d | File type validation | ❌ **Tidak ada** | Hanya `accept="image/*"` di client |
| 3e | Parallel upload | ❌ **Tidak ada** | Upload sequential (for loop) — 5 gambar besar lambat |

**Root cause:** Dashboard line 1054: `supabaseClient.storage.from('products')` — nama bucket `products`. Tapi di Supabase hanya ada bucket bernama `product-images`. Storage bucket ini mungkin dibuat manual atau oleh migration yang berbeda, dan ternyata tidak sinkron dengan kode.

**Catatan:** Karena upload gambar gagal, maka `imageUrls[0]` akan kosong, tapi tetap dikirim sebagai `image: ""` ke POST API, yang juga gagal karena kolom `image` tidak ada. Jadi **dua kegagalan bertumpuk**.

**Status: ❌ GAGAL**

---

### 4. Hapus Produk

**Prosedur:** DELETE /api/products?id=X

| # | Skenario | Hasil | Detail |
|---|----------|-------|--------|
| 4a | Hapus produk (tanpa gambar di storage) | ✅ **Berhasil** (200) | `{ success: true }` |
| 4b | Produk hilang dari `products` | ✅ OK | SELECT setelah delete → tidak ditemukan |
| 4c | `product_images` ikut bersih | ✅ OK | Baris dengan `product_id` tersebut hilang |
| 4d | File gambar di Storage ikut terhapus? | ❌ **TIDAK** — dead code | Lihat analisis di bawah |

**Analisis Storage Deletion (4d):**

Kode DELETE handler (line 144-159):
```javascript
const { data: existing } = await supabase.from('products').select('*').eq('id', id).single();
const images = existing?.images || (existing?.image ? [existing.image] : []);
```

Karena kolom `images` dan `image` **tidak ada** di database, `existing.images` = `undefined` dan `existing.image` = `undefined`. Maka `images` = `[]` (array kosong). **Loop penghapusan storage tidak pernah dieksekusi.**

**Dampak:** Jika nanti kolom `images` sudah ada dan berisi URL storage, maka file akan terhapus. Tapi dalam skema saat ini, fitur ini mati. Gambar di storage akan menjadi **orphan** selamanya.

Selain itu, kode hanya handle URL pattern:
```
/storage/v1/object/public/products/
```
Jika URL gambar menggunakan domain lain atau format path berbeda, tidak akan terhapus.

**Status: ⚠️ SEBAGIAN BERHASIL** — data database bersih, storage tidak tersentuh

---

### 5. Storage Verification

| Item | Status | Detail |
|------|--------|--------|
| Bucket `products` | ❌ **Tidak ada** | Dashboard upload ke bucket ini |
| Bucket `product-images` | ✅ Ada (public) | Tapi tidak digunakan oleh Dashboard |
| File size limit | ⚠️ 2 MB (bucket default) | Tidak ada validasi client-side |
| Allowed MIME types | ❌ Tidak ada | File apa pun bisa diupload (lewat API langsung) |
| RLS policies storage | ❌ Tidak dicek | Bucket public bisa diakses anon key |

**Kesimpulan Storage:** Dashboard mengarah ke bucket yang salah. Image upload 100% gagal.

---

### 6. Database Verification

| Item | Status | Detail |
|------|--------|--------|
| Tabel `products` | ✅ Ada | Kolom: `id, name, description, price, weight, created_at` |
| Tabel `product_images` | ✅ Ada | Kolom: `id, product_id, image_url, created_at` |
| Kolom `image` | ❌ **Tidak ada** | Migration 001 tidak pernah dijalankan |
| Kolom `images` (array) | ❌ **Tidak ada** | Migration 002 tidak pernah dijalankan |
| Foreign key `product_images.product_id → products.id` | ✅ Ada (infered from JOIN working) | Supabase JOIN `product_images(image_url)` berhasil |
| Kolom `sort_order` di `product_images` | ❌ Tidak ada | Urutan gambar tidak bisa dipertahankan |
| RLS `products` | ✅ Ada | Policy `public_select_products` untuk public read |
| RLS `product_images` | ❌ Tidak dicek | Tidak ada policy publik |

---

## Ringkasan Bug

| # | Bug | Level | Komponen | Dampak |
|---|-----|-------|----------|--------|
| B1 | Kolom `image` tidak ada di tabel `products` | 🔴 **Critical** | Database Schema | POST produk dengan `image` field error 500 |
| B2 | Bucket storage `products` tidak ada | 🔴 **Critical** | Storage | Upload gambar gagal total |
| B3 | Dashboard kirim `image` ke POST API | 🔴 **Critical** | Dashboard | Tambah produk selalu gagal jika ada gambar |
| B4 | Storage deletion adalah dead code | 🟠 **High** | DELETE API | Gambar di storage tidak pernah terhapus |
| B5 | Tidak ada `sort_order` di `product_images` | 🟠 **High** | Database Schema | Urutan gambar tidak terjamin |
| B6 | Tidak ada validasi ukuran/tipe file | 🟠 **High** | Dashboard + API | File 100MB bisa diupload (jika bucket ada) |
| B7 | ID produk menggunakan `Date.now()` | 🟡 **Medium** | Dashboard | Potensi collision |
| B8 | Tidak ada server-side auth di API produk | 🟡 **Medium** | API | Siapa pun bisa CRUD (jika tahu endpoint) |
| B9 | Upload sequential bukan parallel | 🟢 **Low** | Dashboard | 5 gambar besar = lambat |
| B10 | Urutan gambar tidak dipertahankan di DB | 🟢 **Low** | PUT API | Tidak ada field sort |

---

## Kesimpulan

**Kelengkapan fitur:**

| Fitur | Status | Keterangan |
|-------|--------|------------|
| Tambah Produk (tanpa gambar) | ✅ Bisa | Tapi Dashboard selalu kirim `image` |
| Tambah Produk (dengan gambar) | ❌ GAGAL | Dua masalah: kolom hilang + bucket salah |
| Edit Produk | ✅ Bisa | name, description, price, weight, images |
| Upload Gambar | ❌ GAGAL | Bucket `products` tidak ada |
| Hapus Produk (database) | ✅ Bisa | Produk + relasi terhapus |
| Hapus Produk (storage) | ❌ GAGAL | Dead code — kolom `images`/`image` tidak ada |

**Apakah modul Admin Product sudah layak menjadi satu-satunya tempat mengelola produk?**

**TIDAK.**

Dari 6 alur utama, hanya 2 yang berfungsi penuh (Edit, Hapus database). Tambah produk gagal jika ada gambar. Upload gambar gagal total. Storage cleanup mati.

Akar masalah tunggal: **Migration 001 dan 002 belum dijalankan.** Setelah kolom `image` dan `images` ditambahkan, dan bucket `products` dibuat, baru modul ini bisa difungsikan.

**Prioritas perbaikan:**
1. Jalankan migration 001 (tambah kolom `image`) dan 002 (tambah kolom `images`)
2. Buat bucket storage bernama `products` (atau ubah kode Dashboard jadi `product-images`)
3. Tambahkan validasi ukuran/tipe gambar
4. Tambahkan `sort_order` di `product_images` untuk urutan gambar
5. Tambahkan server-side auth di API produk
6. Tambahkan toast notification (ganti `alert()`)
