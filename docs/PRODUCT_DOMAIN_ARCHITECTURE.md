# Product Domain Architecture

## Executive Summary

Saat ini, akses data produk tersebar di beberapa pendekatan:

- **Static data** (`data/products.ts`, `data/products.json`) — digunakan oleh Homepage dan Admin Products.
- **API langsung ke Supabase** (`app/api/products/route.ts`) — digunakan oleh Produk Page dan Admin Dashboard.
- **Tanpa abstraksi** — query Supabase ditulis inline di route handler.

Tidak ada pemisahan antara *data access*, *business logic*, dan *presentation*. Hal ini menyebabkan duplikasi logic (misalnya transformasi `product_images` ke `images[]`) dan menyulitkan testing maupun perubahan ke depannya.

**Tujuan sprint ini:** Membangun lapisan Repository dan Service sebagai fondasi arsitektur product domain. Seluruh akses data produk harus melalui Service, Service menggunakan Repository, dan Repository berbicara ke Supabase.

---

## Architecture Diagram

```
Frontend (Server/Client Component)
         │
         ▼
   API Route (app/api/products/route.ts)
         │
         ▼
   ProductService (lib/services/product.service.ts)
         │
         ▼
   ProductRepository (lib/repositories/product.repository.ts)
         │
         ▼
   Supabase (products + product_images tables)
```

### Alur saat ini (before):
```
API Route → Supabase langsung (inline query)
```

### Alur target (after):
```
API Route → ProductService → ProductRepository → Supabase
```

---

## Repository Design

**File:** `lib/repositories/product.repository.ts`

Repository bertanggung jawab atas akses data mentah ke Supabase. Tidak ada logika bisnis di sini.

### Methods

| Method | Signature | Deskripsi |
|--------|-----------|-----------|
| `findAll()` | `() => Promise<ProductRow[]>` | Mengambil semua baris dari tabel `products`, tanpa filter. Return data mentah (termasuk kolom Supabase seperti `created_at`). |
| `findActive()` | `() => Promise<ProductRow[]>` | Mengambil hanya produk dengan `is_active = true` dan `deleted_at IS NULL`. |
| `findById(id)` | `(id: string) => Promise<ProductRow \| null>` | Mencari satu produk berdasarkan primary key `id`. |
| `findImages(productId)` | `(productId: string) => Promise<string[]>` | Mengambil semua `image_url` dari tabel `product_images` untuk satu produk. |
| `create(data)` | `(data: CreateProductInput) => Promise<ProductRow>` | Insert satu baris ke tabel `products`. Return row yang baru dibuat. |
| `insertImages(productId, urls)` | `(productId: string, urls: string[]) => Promise<void>` | Insert banyak baris ke tabel `product_images` sekaligus. |
| `update(id, data)` | `(id: string, data: UpdateProductInput) => Promise<ProductRow \| null>` | Update kolom pada tabel `products`. Return row setelah update. |
| `replaceImages(productId, urls)` | `(productId: string, urls: string[]) => Promise<void>` | Hapus semua `product_images` untuk produk tertentu, lalu insert yang baru. |
| `deleteImages(productId)` | `(productId: string) => Promise<void>` | Hapus semua `product_images` untuk produk tertentu (tanpa insert ulang). |
| `remove(id)` | `(id: string) => Promise<boolean>` | Hard delete baris dari tabel `products`. Return `true` jika ada row terhapus. |
| `getActiveImages()` | `() => Promise<{productId: string, urls: string[]}[]>` | Ambil semua gambar untuk semua produk aktif — digunakan untuk operasi bulk. |

### Catatan

- `ProductRow` merepresentasikan row mentah dari Supabase (termasuk `created_at`, dll).
- Repository hanya melempar error jika query gagal. Tidak ada fallback atau transformasi.
- Parameter `data` pada `create`/`update` strict terhadap kolom yang ada di tabel `products`.

---

## Service Design

**File:** `lib/services/product.service.ts`

Service bertanggung jawab atas logika bisnis, validasi, transformasi data, dan error handling.

### Methods

| Method | Signature | Deskripsi |
|--------|-----------|-----------|
| `getCatalogProducts()` | `() => Promise<Product[]>` | Mengambil produk aktif dari Repository, menggabungkan dengan `product_images`, mengembalikan array `Product` (dengan `images[]`). Jika tidak ada produk, return `[]` (bukan error). |
| `getAdminProducts()` | `() => Promise<Product[]>` | Sama seperti `getCatalogProducts()` tetapi tanpa filter `is_active`. Untuk keperluan admin dashboard. |
| `getProductById(id)` | `(id: string) => Promise<Product \| null>` | Mengambil satu produk berikut gambar-gambarnya. Return `null` jika tidak ditemukan. |
| `createProduct(data)` | `(data: CreateProductInput) => Promise<Product>` | Validasi input, panggil Repository untuk create, kemudian insert images. Return `Product` lengkap. |
| `updateProduct(id, data)` | `(id: string, data: UpdateProductInput) => Promise<Product \| null>` | Validasi input, panggil Repository untuk update dan replace images. Return `Product` lengkap atau `null` jika ID tidak ditemukan. |
| `deleteProduct(id)` | `(id: string) => Promise<{ success: boolean; deletedImages: string[] }>` | Ambil daftar gambar sebelum delete, hapus dari Supabase Storage, lalu hapus row dari DB via Repository. |
| `deleteStorageFiles(urls)` | `(urls: string[]) => Promise<void>` | Hapus file dari Supabase Storage bucket `product-images`. Dipanggil dari `deleteProduct()`. |
| `sanitizePrice(input)` | `(raw: unknown) => number \| null` | Bersihkan input harga: ambil hanya digit, konversi ke integer. |

### Tanggung Jawab

1. **Transformasi data** — menggabungkan `products` + `product_images` menjadi shape `Product` dengan `images: string[]`.
2. **Validasi** — memastikan `name` tidak kosong, `price` adalah integer valid, `weight` string tidak kosong, dll.
3. **Error boundary** — Service tidak pernah throw error ke API. Return nilai standar (`[]`, `null`, `{ success: false }`).
4. **Idempotency** — `createProduct` dengan ID yang sudah ada ditangani dengan upsert.

### Validasi Detail

| Field | Aturan |
|-------|--------|
| `name` | `typeof string`, length >= 1, trim |
| `description` | Opsional, `typeof string` |
| `price` | Wajib, konversi via `sanitizePrice()`, harus >= 0 |
| `weight` | Opsional, `typeof string` |
| `images` | Opsional, array of string URL |
| `id` | Opsional — jika tidak disediakan, Repository generate dari `name` (slug) atau biarkan Supabase menentukan. |

---

## API Flow

### GET /api/products

```
Request: GET /api/products?admin=true (opsional)
  │
  ▼
  API Route membaca query params
  │
  ├─ admin=true  → ProductService.getAdminProducts()
  │
  └─ (default)   → ProductService.getCatalogProducts()
                    │
                    ▼
                    ProductRepository.findActive()
                    ProductRepository.findImages() (per produk)
                    │
                    ▼
                    Transform ke Product[]
                    │
                    ▼
                    Return JSON
```

### POST /api/products

```
Request: POST /api/products { name, description, price, weight, images }
  │
  ▼
  API Route → ProductService.createProduct(body)
               │
               ├─ sanitizePrice(price)
               ├─ ProductRepository.create({ name, desc, price, weight })
               ├─ ProductRepository.insertImages(productId, images)
               ├─ ProductRepository.findImages(productId)
               └─ Return Product
```

### PUT /api/products

```
Request: PUT /api/products { id, name, description, price, weight, images }
  │
  ▼
  API Route → ProductService.updateProduct(body.id, body)
               │
               ├─ sanitizePrice(price)
               ├─ ProductRepository.update(id, { name, desc, price, weight })
               ├─ ProductRepository.replaceImages(id, images)
               ├─ ProductRepository.findImages(id)
               └─ Return Product
```

### DELETE /api/products

```
Request: DELETE /api/products?id=xxx
  │
  ▼
  API Route → ProductService.deleteProduct(id)
               │
               ├─ ProductRepository.findImages(id) → get image URLs
               ├─ deleteStorageFiles(imageUrls)
               ├─ ProductRepository.deleteImages(id)
               ├─ ProductRepository.remove(id)
               └─ Return { success: true, deletedImages: [...] }
```

---

## Image Handling

### Transformasi `product_images` → `images[]`

```
Database:
  products table          product_images table
  ┌──────────────┐       ┌──────────────────────┐
  │ id: "p-1"    │       │ product_id: "p-1"    │
  │ name: "..."  │  ──►  │ image_url: "/a.jpg"  │
  │ price: 15000 │       │ product_id: "p-1"    │
  └──────────────┘       │ image_url: "/b.jpg"  │
                          └──────────────────────┘

Service output (Product):
  {
    id: "p-1",
    name: "...",
    price: 15000,
    images: ["/a.jpg", "/b.jpg"]
  }
```

### Produk tanpa gambar

Jika `findImages()` mengembalikan array kosong, Service tetap mengembalikan `images: []`. Frontend (`ProdukGrid`) sudah memiliki fallback ke `/images/produk/placeholder.svg`.

### Produk nonaktif (`is_active = false`)

- `getCatalogProducts()` → memfilter `is_active = true`, hanya produk ini yang muncul di /produk.
- `getAdminProducts()` → mengembalikan semua produk termasuk yang nonaktif, agar admin bisa mengaktifkan kembali.
- `getProductById()` → mengembalikan produk apa pun (tidak filter), karena dipanggil dari konteks yang sudah tahu ID-nya.

### Produk yang dihapus

Implementasi awal menggunakan **hard delete** (baris benar-benar dihapus dari tabel). Di masa depan:

- Tambahkan kolom `deleted_at timestamptz` dan `is_active boolean default true`.
- Repository method `remove()` berubah menjadi soft delete: `UPDATE products SET deleted_at = now() WHERE id = $1`.
- Method `findActive()` menambahkan filter `deleted_at IS NULL`.
- Method `findAll()` menambahkan filter `deleted_at IS NULL` (kecuali diminta menyertakan yang terhapus).

---

## Folder Structure

```
lib/
├── repositories/
│   └── product.repository.ts      # Data access layer
├── services/
│   └── product.service.ts         # Business logic layer
├── supabase.ts                    # Supabase admin client (existing)
├── supabase-client.ts             # Supabase anon client (existing)
├── utils.ts                       # Utility functions (existing)
├── constants.ts                   # Site constants (existing)

app/api/products/
└── route.ts                       # API route → delegates to ProductService

types/
└── index.ts                       # Product, CartItem, etc. (existing, diperluas)

data/
├── products.ts                    # Static fallback (existing, tidak dihapus)
└── products.json                  # Static seed data (existing, tidak dihapus)
```

### Type Extensions

Tambahkan ke `types/index.ts`:

```typescript
// Input type untuk create/update (tanpa relasi)
export interface CreateProductInput {
  id?: string;
  name: string;
  description?: string;
  price: number;
  weight?: string;
  images?: string[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

// Internal row type (mentah dari database)
export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  weight: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}
```

---

## Migration Strategy

### Tahap 1: Buat Repository (Aman — tidak ada perubahan konsumen)

1. Buat `lib/repositories/product.repository.ts`.
2. Implementasi semua method dengan mengacu pada Supabase table `products` dan `product_images`.
3. Tidak ada impor baru dari API route atau komponen.
4. **Verifikasi:** Test tiap method secara manual (atau via script).

### Tahap 2: Buat Service (Aman — tidak ada perubahan konsumen)

1. Buat `lib/services/product.service.ts`.
2. Implementasi business logic, validasi, transformasi image.
3. Service mengimpor Repository, bukan Supabase langsung.
4. **Verifikasi:** Test tiap method dengan mock repository.

### Tahap 3: Update API Route (Backward Compatible)

1. Ubah `app/api/products/route.ts`:
   - GET → panggil `ProductService.getCatalogProducts()` atau `getAdminProducts()`.
   - POST → panggil `ProductService.createProduct()`.
   - PUT → panggil `ProductService.updateProduct()`.
   - DELETE → panggil `ProductService.deleteProduct()`.
2. Hapus kode inline yang sekarang ada (query Supabase langsung, sanitasi, transformasi, hapus storage).
3. **Verifikasi:** Semua endpoint API harus mengembalikan shape yang sama persis seperti sebelumnya.

### Tahap 4: Migrasi Konsumen Lain (Optional — di luar scope sprint ini)

- `app/admin/dashboard/page.tsx` — sudah menggunakan API, tidak perlu perubahan.
- `app/page.tsx` — masih static data, migrasi ke API bisa dilakukan nanti.
- `app/admin/products/page.tsx` — masih static data, migrasi ke API bisa dilakukan nanti.

### Rollback Plan

Jika terjadi masalah setelah Tahap 3:
1. Kembalikan `app/api/products/route.ts` ke versi sebelumnya (git checkout).
2. Repository dan Service tetap ada di codebase (tidak digunakan).
3. Tidak ada dampak ke pengguna.

---

## Risk Analysis

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Schema mismatch antara migration dan actual DB | Data tidak ditemukan atau query gagal | Audit schema sebelum implementasi. Dokumentasikan kolom aktual di Supabase. |
| `product_images` table tidak memiliki migration file | Ketergantungan pada tabel yang tidak terdokumentasi | Buat migration untuk `product_images` sebagai bagian dari sprint ini, atau pastikan tabel sudah ada. |
| Service menambah latency (double mapping) | Response lebih lambat | Repository dan service adalah lapisan tipis (hanya delegasi). Overhead minimal. |
| Perubahan shape response API | Frontend error | Pastikan shape output service identik dengan shape saat ini. Tulis test snapshot jika memungkinkan. |
| Conflict dengan sprint lain yang mengubah file sama | Merge conflict | Koordinasi tim. File yang diubah terisolasi di `lib/` dan `app/api/products/route.ts`. |
| Tidak ada test | Regression tidak terdeteksi | Tambahkan test untuk Repository (integration) dan Service (unit) di sprint ini. |

---

## Definition of Done

1. `lib/repositories/product.repository.ts` berisi semua method Repository dan berfungsi dengan Supabase.
2. `lib/services/product.service.ts` berisi semua method Service, menggunakan Repository, bukan Supabase langsung.
3. `app/api/products/route.ts` didelegasikan ke Service, tidak ada query Supabase inline.
4. Shape response API sebelum dan sesudah migrasi identik.
5. Produk tanpa gambar tetap tampil dengan placeholder.
6. Produk nonaktif tidak muncul di /produk.
7. `data/products.ts` dan `data/products.json` tidak dihapus.
8. `next build` berhasil tanpa error.
9. `npx tsc --noEmit` bersih tanpa error.
10. Homepage, Cart, dan Checkout tidak berubah dan berfungsi normal.
