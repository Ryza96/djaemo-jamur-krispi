# Runtime Upload Verification Report — HOTFIX-003

## Executive Summary

Verifikasi runtime membuktikan bahwa **anon key yang dikonfigurasi di `.env.local` sudah tidak valid**. Semua upload dari Dashboard gagal karena Supabase menolak key dengan error `signature verification failed` (HTTP 403).

Pipeline lain (service role key, `product_images` table, repository join, storage bucket) berfungsi normal.

---

## Test Methodology

Test dilakukan dalam 2 skenario menggunakan Supabase JS client dan API HTTP:

| Test | Tool | Tujuan |
|------|------|--------|
| #1 | Supabase JS client (anon key) | Simulasi upload Dashboard |
| #2 | Supabase JS client (service role key) | Verifikasi pipeline server-side |
| #3 | Database query (service role key) | Verifikasi `product_images` + join |
| #4 | HTTP GET /api/products | Verifikasi response API |

---

## Hasil Runtime

### 1. Apakah previewItems berisi File object?

**Tidak bisa diverifikasi dari CLI.** Ini adalah state browser runtime. Namun secara kode (`dashboard/page.tsx:854-866`), setiap file dari `<input type="file">` disimpan sebagai `item.file: File`. Kode sudah benar.

### 2. Apakah upload() benar-benar dieksekusi?

**Tidak bisa diverifikasi dari CLI.** Namun dari kode, upload dipanggil untuk setiap item dengan `type === 'new'` dan `item.file` ada.

### 3. Response Supabase untuk upload (Anon Key)

```
✗ GAGAL — signature verification failed (HTTP 403)

Error:
{
  "name": "StorageApiError",
  "message": "signature verification failed",
  "status": 400,
  "statusCode": "403"
}
```

### 4. Response Supabase untuk upload (Service Role Key)

```
✓ BERHASIL

Public URL:
https://xvjowuwkjcwixvbmvuqq.supabase.co/storage/v1/object/public/product-images/test-upload-svc-1782792515289.svg
```

### 5. Apakah POST /api/products tetap dikirim?

**Ya, tetap dikirim.** Dashboard mengirim POST/PUT terlepas dari hasil upload (karena upload error hanya `continue`).

### 6. Payload POST sebenarnya

Payload dari Dashboard (simulasi):
```json
{
  "id": "produk-{timestamp}",
  "name": "Nama Produk",
  "description": "...",
  "price": 25000,
  "weight": "100g",
  "images": []
}
```

**Catatan:** Jika upload gagal, `images: []`. Jika upload berhasil, `images: ["https://..."]`.

### 7. Apakah field `images` berisi `[]` atau URL?

**Bergantung hasil upload:**

| Skenario | images |
|----------|--------|
| Anon key valid + upload sukses | `["https://..."]` |
| **Anon key invalid (kondisi sekarang)** | **`[]`** |
| Tidak pilih gambar | `[]` |

Pada kondisi runtime saat ini: **`images: []`** karena anon key invalid.

### 8. Apakah insert ke product_images dijalankan?

**Ya, dijalankan — tetapi dengan `images: []`**, sehingga tidak ada record yang di-insert.

Verifikasi database:

```
Query SELECT * FROM product_images:
→ 0 records

Query SELECT *, product_images(image_url) FROM products:
→ 2 products, masing-masing product_images: 0 items
```

---

## Ringkasan Runtime

| Komponen | Status | Detail |
|----------|--------|--------|
| Anon key | **✗ INVALID** | `signature verification failed` (403) |
| Service role key | ✅ Valid | Upload berhasil |
| Bucket `product-images` | ✅ Ada | Bisa upload & list |
| `product_images` table | ✅ Ada | INSERT berhasil via service role |
| Repository join | ✅ Berfungsi | `SELECT *, product_images(image_url)` mengembalikan data |
| API POST (dengan id) | ✅ Berfungsi | Product tersimpan |
| API POST (tanpa id) | ❌ 500 | `null value in column "id"` — tetapi dashboard selalu kirim `id` |
| GET /api/products | ✅ Berfungsi | Response dengan `images[]` |
| `next.config.ts` remotePatterns | ✅ Fixed (HOTFIX-001) | Supabase domain dikonfigurasi |

---

## Root Cause

**Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) sudah tidak valid.** Supabase menolak semua request yang menggunakan key ini dengan error JWT signature verification failed (HTTP 403).

Akibatnya:
1. Upload storage dari Dashboard (yang menggunakan anon key) selalu gagal
2. Error ditelan: `console.error()` + `continue` — user tidak mendapat notifikasi
3. Produk tersimpan dengan `images: []`
4. Frontend menampilkan placeholder

**Bukan masalah kode. Bukan masalah konfigurasi Next.js. Bukan masalah bucket atau tabel.**

Ini masalah **credentials** — anon key perlu diperbarui dari Supabase Dashboard → Settings → API.

---

## Recommended Fix

### Perbaiki anon key

Buka Supabase Dashboard → Project Settings → API → Copy `anon public` key baru → Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
```

Restart dev server. Upload dari Dashboard akan berfungsi kembali.

### Opsional: Upload via API (lebih robust)

Agar tidak bergantung pada anon key, pindahkan logic upload dari client-side ke endpoint API:

```
Dashboard → POST /api/products/upload (multipart)
  → Server menerima file
  → Server upload ke Supabase Storage (service role key)
  → Server return public URL
  → Dashboard menerima URL dan lanjut ke POST /api/products
```

Ini menghilangkan ketergantungan pada anon key storage RLS policies.
