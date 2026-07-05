# Admin Product Module Review

## Executive Summary

Modul Admin Product memiliki **dua implementasi** yang tidak terhubung:

1. **Inline modal di dashboard** (`app/admin/dashboard/page.tsx:1422-1568`) — **berfungsi**, terintegrasi dengan API `/api/products`
2. **Halaman terpisah** (`app/admin/product-form/page.tsx`) — **belum selesai**, ada TODO integrasi backend

Selain itu ada `components/admin/ProductEditModal.tsx` (51 line, minimal) dan `components/admin/AdminGuard.tsx` (file kosong).

Inline modal sudah bisa **Tambah, Edit, Hapus, Upload Gambar, Multi Gambar**, dan **Simpan ke Supabase**. Tapi ada beberapa masalah yang perlu diperhatikan sebelum dipakai production.

---

## Feature Checklist

| Fitur | Status | Keterangan |
|-------|--------|------------|
| **Tambah produk** | ✅ Berfungsi | Via modal di dashboard |
| **Edit produk** | ✅ Berfungsi | Via modal, PUT /api/products |
| **Hapus produk** | ✅ Berfungsi | Confirm dialog + DELETE /api/products |
| **Upload gambar** | ✅ Berfungsi | Upload ke Supabase Storage |
| **Upload multi gambar** | ✅ Berfungsi | Maks 5, urut, drag & drop reorder |
| **Simpan ke Supabase** | ✅ Berfungsi | Service role key via API |
| **Update data** | ✅ Berfungsi | PUT endpoint update produk |
| **Validasi form** | ⚠️ Minimal | Hanya cek nama + harga |
| **Error handling** | ⚠️ Sebagian | Ada try-catch, tapi user feedback minim |
| **UX** | ⚠️ Cukup | Ada loading state upload, drag & drop |
| **Auth** | ❌ **TIDAK ADA** | Tidak ada server-side auth |
| **Standalone product form** | ❌ **Belum selesai** | Ada TODO: integrasi backend |

---

## Temuan Detail

### 1. Dua Implementasi Produk Form

| Aspek | Inline Modal (Dashboard) | Standalone Page (/admin/product-form) |
|-------|-------------------------|--------------------------------------|
| Lokasi | `app/admin/dashboard/page.tsx:1422-1568` | `app/admin/product-form/page.tsx` |
| Integrasi API | ✅ Sudah (`POST/PUT /api/products`) | ❌ **TODO** — `alert("Produk berhasil disimpan. Lanjutkan integrasi ke backend.")` |
| Upload Gambar | ✅ Upload ke Supabase Storage | ❌ Hanya preview lokal (blob URL) |
| Field `category` | ❌ Tidak ada | ✅ Ada (dropdown: Original/Balado/Spicy/Keju) |
| Field `stock` | ❌ Tidak ada | ✅ Ada (number input) |
| Drag & drop reorder | ✅ Ada | ❌ Tidak ada |
| Multi gambar | ✅ Maks 5 | ✅ Upload multiple |
| **Kesiapan** | **Bisa dipakai** | **Belum selesai** |

### 2. Autentikasi

| Temuan | Detail |
|--------|--------|
| **Server-side auth** | ❌ **Tidak ada.** Endpoint `POST/PUT/DELETE /api/products` bisa dipanggil siapa pun |
| **Client-side auth** | ⚠️ Hanya cek localStorage `admin-authenticated === "true"` |
| **Dampak** | Siapa pun dengan URL bisa menambah/mengubah/menghapus produk |

### 3. Image Management

| Temuan | Detail |
|--------|--------|
| **Upload** | ✅ Berfungsi via `supabaseClient.storage.from('products').upload()` |
| **Multi gambar** | ✅ Maks 5, upload sequential (for loop) |
| **Drag & drop reorder** | ✅ Bisa urut ulang gambar |
| **Set primary** | ✅ Tombol "Utama" — gambar pertama dianggap primary |
| **Image size validation** | ❌ Tidak ada. File berapa pun bisa diupload |
| **Image type validation** | ❌ Tidak ada. `accept="image/*"` hanya client-side |
| **Upload progress** | ❌ Tidak ada. Hanya spinner "uploading" state |
| **Parallel upload** | ❌ Sequential. 5 gambar besar = lambat |
| **Blob URL cleanup** | ✅ `URL.revokeObjectURL()` di cleanup effect |
| **Storage bucket** | Menggunakan `products` bucket di Supabase |

### 4. Form Validation

| Field | Validasi | Masalah |
|-------|----------|---------|
| **Nama** | ✅ Cek `!formData.name` | OK |
| **Harga** | ✅ `sanitizePriceToInt` + null check | OK |
| **Deskripsi** | ❌ Tidak ada validasi | Bisa kosong atau HTML injection |
| **Berat** | ❌ Tidak ada validasi | Text bebas, bisa format tidak konsisten |
| **Gambar** | ❌ Tidak ada validasi | Ukuran, tipe, jumlah maks 5 (tapi tidak ada batas bawah) |
| **Error message** | ⚠️ `alert()` — bukan inline validation | UX kurang baik |

### 5. ID Generation

| Temuan | Detail |
|--------|--------|
| **Pattern** | `produk-${Date.now()}` — ID mengandung timestamp |
| **Risiko** | Collision jika dua produk ditambah dalam millisecond yang sama |
| **Tipe** | `text` di database — bukan UUID |
| **Konsistensi** | Static file pakai `produk-1` sampai `produk-9` |

### 6. Delete Product Flow

| Langkah | Status |
|---------|--------|
| Konfirmasi | ✅ `confirm("Apakah Anda yakin...")` |
| DELETE request | ✅ `fetch('/api/products?id=X', { method: 'DELETE' })` |
| Image cleanup di storage | ⚠️ Ada di API (line 148-159) tapi hanya handle URL pattern `/storage/v1/object/public/products/` |
| Refresh setelah delete | ✅ `fetch('/api/products')` |
| **Partial failure** | ❌ Jika image cleanup gagal, produk tetap terhapus — orphan images di storage |

### 7. API Issues

| Temuan | Detail |
|--------|--------|
| **No auth** | Endpoint produk publik — siapa pun bisa CRUD |
| **PUT endpoint** | Hanya update kolom tertentu (name, description, price, weight) — tidak update `image`/`images` |
| **Image sync** | PUT hapus semua `product_images` lalu insert ulang — **tidak atomic**, bisa loss data jika insert gagal |
| **Error response** | Tidak konsisten — kadang `{ error }`, kadang `{ error, details }`, kadang langsung data array |
| **Price sanitization** | Duplikasi: `sanitizePriceToInt` ada di API route dan dashboard |

### 8. UX Issues

| Temuan | Detail |
|--------|--------|
| **Loading state upload** | ✅ Ada spinner overlay per gambar |
| **Save button disabled** | ✅ Jika ada upload berjalan |
| **Tambah/Edit sukses** | ❌ Tidak ada toast/snackbar — hanya refresh daftar |
| **Error feedback** | ⚠️ `console.error` + `alert()` — tidak ada notifikasi di halaman |
| **Modal tidak auto-close** | ✅ Tertutup setelah save selesai |
| **Form tidak reset** | ⚠️ Setelah save, form di-reset manual |
| **Price field default 0** | ⚠️ `value={formData.price \|\| 0}` — tidak bisa bedakan "belum diisi" vs "gratis" |

### 9. Dead Code

| File | Status |
|------|--------|
| `components/admin/ProductEditModal.tsx` | ❌ Sangat minimal (51 line), tidak digunakan — inline modal dashboard yang dipakai |
| `components/admin/AdminGuard.tsx` | ❌ File kosong |
| `app/admin/product-form/page.tsx` | ⚠️ Belum selesai, tapi ada route `/admin/product-form` yang bisa diakses |

### 10. Data Integrity

| Risiko | Skenario |
|--------|----------|
| **Orphan images** | Image upload sukses, tapi POST/PUT produk gagal → gambar di storage tanpa referensi |
| **Image index mismatch** | Urutan gambar di form tidak dipertahankan di database (tidak ada `sort_order` di `product_images`) |
| **No product_images cleanup** | Saat edit, gambar lama dihapus dari `product_images` table tapi tidak dari Supabase Storage |
| **Deskripsi tidak disanitasi** | Bisa injection HTML/JS di field deskripsi (tapi Next.js React escape otomatis) |

---

## Risiko

| Risiko | Level | Dampak |
|--------|-------|--------|
| **No auth pada product API** | 🔴 Kritis | Siapa pun bisa tambah/edit/hapus produk |
| **Price 0 tidak bisa dibedakan** | 🟠 Sedang | Produk gratis vs belum diisi harga |
| **Image size/type tidak divalidasi** | 🟠 Sedang | User upload file 100MB, abuse storage |
| **Orphan images di storage** | 🟠 Sedang | Storage penuh oleh gambar tanpa referensi |
| **Dua implementasi form** | 🟡 Rendah | Bikin bingung: mana yang dipakai? |
| **Standalone product-form tidak selesai** | 🟡 Rendah | Route `/admin/product-form` bisa diakses tapi tidak berfungsi |
| **Dead components** | 🟢 Info | ProductEditModal.tsx, AdminGuard.tsx |

---

## Prioritas Perbaikan

| Prio | Item | Effort | Dampak |
|:----:|------|--------|--------|
| P0 | **Tambahkan server-side auth** ke `POST/PUT/DELETE /api/products` | 1 hari | 🔴 Keamanan |
| P1 | **Tambahkan validasi ukuran & tipe gambar** (client + server) | 0.5 hari | 🟠 Mencegah abuse storage |
| P2 | **Ganti `alert()` dengan toast notification** untuk feedback sukses/gagal | 0.5 hari | 🟠 UX |
| P3 | **Parallel image upload** (Promise.all) untuk 5 gambar | 0.5 hari | 🟠 Performance |
| P4 | **Hapus gambar dari storage saat edit/hapus produk** | 1 hari | 🟠 Data integrity |
| P5 | **Tambahkan sort_order ke product_images** untuk urutan gambar | 0.5 hari | 🟡 Konsistensi |
| P6 | **Hapus dead code**: AdminGuard.tsx, ProductEditModal.tsx | 0.5 jam | 🟢 Kebersihan kode |
| P7 | **Selesaikan atau hapus** `/admin/product-form` | 1 hari | 🟢 Konsistensi |
| P8 | **Gunakan UUID untuk product ID** (bukan timestamp) | 1 hari | 🟢 Scalability |

---

## Kesimpulan

**Status siap pakai:** ⚠️ **Bisa dipakai dengan pengawasan**

Inline modal di dashboard sudah fungsional untuk operasi sehari-hari (tambah, edit, hapus, upload gambar). Tapi **tidak aman** karena tidak ada server-side authentication.

Seorang admin yang sudah login (via localStorage) bisa mengelola produk dengan lancar. Tapi siapa pun yang tahu endpoint API juga bisa melakukannya tanpa login.

**Rekomendasi:** Bereskan auth dulu, baru dipakai production.
