# Admin Product — Production Ready Implementation Plan

## Executive Summary

Modul Admin Product saat ini memiliki **3 critical bug** yang membuatnya tidak dapat digunakan: POST gagal karena kolom `image` tidak ada di database, upload gambar gagal karena bucket `products` tidak ditemukan, dan tidak ada server-side auth pada API. Ditambah **4 high-severity issues** seperti storage cleanup yang mati dan ketergantungan pada static data files.

Rencana ini menyusun **9 task berurutan** untuk membawa modul Admin Product dari kondisi saat ini (gagal verifikasi) menuju **production ready**.

Target arsitektur final:
- **`products` table** — data utama produk
- **`product_images` table** — seluruh gambar produk (join, satu produk banyak gambar)
- **Supabase Storage** — penyimpanan file gambar
- **Dashboard Admin** — satu-satunya UI untuk CRUD produk
- **Public website** — baca data via API `/api/products`

---

## Current Condition

### Database (Live Supabase)

| Object | Status |
|--------|--------|
| `products` table | ✅ Ada (kolom: id, name, description, price, weight, created_at) |
| `product_images` table | ✅ Ada (kolom: id, product_id, image_url, created_at) |
| Kolom `image` (singular) | ❌ Tidak ada — migration 001 never applied |
| Kolom `images` (array) | ❌ Tidak ada — migration 002 never applied |
| Kolom `sort_order` di `product_images` | ❌ Tidak ada |
| Jumlah produk terisi | 1 dari 9 |
| Foreign key `product_images.product_id → products.id` | ✅ Terbangun |

### Storage (Live Supabase)

| Bucket | Status | Digunakan oleh |
|--------|--------|---------------|
| `product-images` | ✅ Ada (public, 2MB limit) | ❌ Tidak ada kode yang pakai |
| `products` | ❌ Tidak ada | Dashboard upload, API DELETE |

### Source Code (Key Files)

| File | Status | Masalah |
|------|--------|---------|
| `types/index.ts` | ❌ Perlu diubah | `image: string` perlu dihapus |
| `app/api/products/route.ts` | ⚠️ Perlu diperbaiki | POST gagal dg `image`, DELETE storage dead code |
| `app/admin/dashboard/page.tsx` | ⚠️ Perlu diperbaiki | Kirim `image` ke POST, bucket `products` tidak ada |
| `app/admin/product-form/page.tsx` | ❌ Tidak selesai | TODO integrasi API |
| `app/admin/products/page.tsx` | ❌ Legacy | Import static data |
| `components/admin/ProductEditModal.tsx` | ❌ Dead code | Tidak dipakai |
| `components/admin/AdminGuard.tsx` | ❌ Dead code | File kosong |
| `data/products.ts` | ❌ Akan dihapus | Static data, migrasi ke Supabase |
| `data/products.json` | ❌ Akan dihapus | Static data, migrasi ke Supabase |
| `scripts/migrate-products.js` | ❌ Akan dihapus | Archived |
| `scripts/migrate-images.js` | ❌ Akan dihapus | Archived |

### Bug Inventory

| ID | Severity | Bug | Root Cause |
|----|----------|-----|------------|
| B1 | 🔴 **Critical** | POST `/api/products` error 500 ketika dashboard kirim `image` field | Kolom `image` tidak ada di DB (migration 001 never applied) |
| B2 | 🔴 **Critical** | Upload gambar gagal — bucket `products` tidak ditemukan | Dashboard upload ke bucket `products` yang belum pernah dibuat |
| B3 | 🔴 **Critical** | API produk tidak punya server-side auth | Tidak ada pengecekan token/session di route handler |
| B4 | 🟠 **High** | DELETE API tidak membersihkan file storage | `existing.images` dan `existing.image` selalu undefined (kolom tidak ada) |
| B5 | 🟠 **High** | Urutan gambar tidak terjamin | Tidak ada kolom `sort_order` di `product_images` |
| B6 | 🟠 **High** | Hanya 1 produk di database, perlu 9 | Seed data belum dijalankan |
| B7 | 🟠 **High** | Public catalog masih pakai `data/products.ts` (static import) | Belum migrasi ke Supabase API |
| B8 | 🟡 **Medium** | Tidak ada validasi ukuran/tipe file gambar | Tidak ada pengecekan client maupun server |
| B9 | 🟡 **Medium** | Upload gambar sequential (lambat untuk 5 gambar) | `for` loop, bukan `Promise.all` |
| B10 | 🟡 **Medium** | Price input: `value={formData.price \|\| 0}` — tidak bisa bedakan 0 vs belum diisi | `|| 0` mengubah null/undefined jadi 0 |
| B11 | 🟡 **Medium** | Tidak ada notifikasi sukses/gagal (hanya `alert()` + `console.error`) | UX belum diimplementasi |
| B12 | 🟡 **Medium** | ID produk pakai `Date.now()` — potensi collision | Tidak menggunakan UUID |
| B13 | 🟢 **Low** | Dead code: `ProductEditModal.tsx`, `AdminGuard.tsx` | Tidak dipakai, perlu dihapus |
| B14 | 🟢 **Low** | Form duplikat: `/admin/product-form/page.tsx` belum selesai (TODO) | Perlu diselesaikan atau dihapus |
| B15 | 🟢 **Low** | `data/products.ts` dan `data/products.json` perlu dihapus | Migrasi ke Supabase selesai |
| B16 | 🟢 **Low** | `scripts/migrate-*.js` perlu diarsipkan | Satu kali pakai |

---

## Implementation Strategy

### Prinsip

1. **Database first** — semua perubahan kode bergantung pada skema database yang benar
2. **Backward compatibility** — website publik tidak boleh rusak selama migrasi
3. **Incremental** — setiap task menghasilkan state yang bisa di-deploy
4. **Testable** — setiap task punya cara verifikasi yang jelas

### Urutan Task

```
PF-001: Database Schema    → dependency for everything else
    ↓
PF-002: Storage Bucket     → dependency for image upload
    ↓
PF-003: API — POST Fix     → dependency for Tambah Produk
    ↓
PF-004: API — DELETE Fix   → dependency for Hapus Produk (storage cleanup)
    ↓
PF-005: Product Type       → dependency for Frontend
    ↓
PF-006: Dashboard Fix      → fixes Tambah/Edit/Upload flows
    ↓
PF-007: API — Auth         → security, can be done in parallel with PF-006
    ↓
PF-008: Public Catalog     → migrates from static to API
    ↓
PF-009: Cleanup            → removes dead code, archived files
```

**Mengapa urutan ini:**
- Database + storage adalah foundation — tanpa ini semua code changes sia-sia
- API harus benar dulu sebelum Dashboard diperbaiki
- Auth bisa paralel karena tidak mengubah logic CRUD
- Public catalog migrasi paling akhir agar website tetap jalan selama development
- Cleanup paling akhir agar tidak ada yang terhapus sebelum selesai migrasi

---

## Task Breakdown

---

### Task PF-001: Database Schema

**Tujuan:** Menambahkan kolom `sort_order` ke `product_images` dan melakukan seed 9 produk ke Supabase.

**Keputusan arsitektur:**
- Kolom `image` dan `images` di tabel `products` **tidak perlu ditambahkan.**
- Semua gambar dikelola via `product_images` join table.
- Migration 001 dan 002 tidak perlu dijalankan — arsitektur final hanya pakai `product_images`.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `db/supabase_migrations/006_add_sort_order.sql` | CREATE — migration baru: `ALTER TABLE product_images ADD COLUMN sort_order integer DEFAULT 0` |
| `data/products.json` | Sumber data seed (9 products, 2 harga: 14499) |
| (seeder script) | Script satu-kali untuk seed produk |

**Isi migration 006:**
```sql
ALTER TABLE product_images ADD COLUMN sort_order integer DEFAULT 0 NOT NULL;

-- Update existing rows to have sequential sort_order per product
UPDATE product_images SET sort_order = sub.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY product_id ORDER BY created_at) - 1 AS rn
  FROM product_images
) sub
WHERE product_images.id = sub.id;
```

**Risiko:**
- Jika migration error, data produk tidak bisa diakses
- Seed data harus sesuai format yang diterima API
- Harga harus konsisten (Rp 14.499 untuk semua varian)

**Cara testing:**
1. Jalankan migration
2. `SELECT column_name FROM information_schema.columns WHERE table_name = 'product_images'` → verifikasi `sort_order` ada
3. Seed 9 products via API POST
4. `SELECT count(*) FROM products` → harus 9 (atau 10 jika diitung existing 1)
5. Verifikasi setiap produk bisa di-GET

**Estimasi kompleksitas:** ⭐ (1/5 — straightforward SQL + script)

---

### Task PF-002: Storage Bucket

**Tujuan:** Membuat bucket `products` di Supabase Storage atau mengubah semua referensi dari `products` → `product-images`.

**Keputusan:** **Buat bucket baru bernama `products`** — karena lebih sedikit perubahan kode (3 file vs semuanya on `product-images`).

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| Supabase Dashboard (manual) | Buat bucket `products`: public, file size limit 5MB, allowed MIME types: `image/jpeg`, `image/png`, `image/webp` |
| `app/admin/dashboard/page.tsx:1054` | ✅ Tidak perlu diubah (sudah `'products'`) |
| `app/api/products/route.ts:154` | ✅ Tidak perlu diubah (sudah `'products'`) |
| `scripts/migrate-images.js:42,48` | Akan dihapus di Task PF-009 |

**Risiko:**
- Bucket name typo atau config salah
- Public access perlu di-set agar gambar bisa diakses

**Cara testing:**
1. Buat bucket via Supabase Dashboard
2. `Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/bucket/products"` → 200 OK
3. Upload file test via `supabaseClient.storage.from('products').upload(...)` → sukses
4. Akses public URL gambar di browser → muncul

**Estimasi kompleksitas:** ⭐ (1/5 — operasional, bukan coding)

---

### Task PF-003: API — POST Fix

**Tujuan:** Memperbaiki `POST /api/products` agar tidak gagal saat menerima field `image` (dikirim oleh Dashboard), dan menyimpan gambar ke `product_images` table.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `app/api/products/route.ts` | POST handler: hapus field `image` dari payload sebelum insert; simpan URL gambar ke `product_images` |

**Detail perubahan:**

POST handler saat ini:
```typescript
const payload: any = { ...body };
// ... sanitization ...
const { data, error } = await supabase.from('products').insert([payload]).select();
// payload contains `image` → column not found
```

POST handler baru:
```typescript
const payload: Record<string, unknown> = {};
if (typeof body?.name === 'string') payload.name = body.name;
if (typeof body?.description === 'string') payload.description = body.description;
if (body?.price !== undefined) payload.price = sanitizePriceToInt(body.price);
if (typeof body?.weight === 'string') payload.weight = body.weight;
// Note: image/images are NOT included in product payload

const { data: product, error } = await supabase.from('products').insert([payload]).select().single();
if (error) { ... }

// Save images to product_images table
const incomingImages: string[] = Array.isArray(body?.images) ? body.images : [];
const imagesToInsert = incomingImages
  .filter((u: unknown) => typeof u === 'string')
  .map((u: string) => u.trim())
  .filter((u) => u.length > 0);

if (imagesToInsert.length > 0) {
  const { error: imgErr } = await supabase.from('product_images').insert(
    imagesToInsert.map((url, i) => ({
      product_id: product.id,
      image_url: url,
      sort_order: i,
    }))
  );
  if (imgErr) { ... }
}
```

**Risiko:**
- Dashboard mengirim `image` field → payload baru ignore field → `image` tidak dikirim → Supabase tidak error
- Dashboard juga kirim `images` array → masuk ke `product_images`
- Tidak ada `image` di response → frontend perlu pakai `product_images` dari GET

**Cara testing:**
1. POST ke `/api/products` dengan body `{ name, description, price, weight, image: "..." }` → harus 201
2. POST dengan `{ name, price, images: ["url1", "url2"] }` → 201, verifikasi `product_images` terisi
3. POST tanpa gambar → 201, `product_images` kosong
4. GET `/api/products` → response mengandung `product_images` array

**Estimasi kompleksitas:** ⭐⭐ (2/5 — logika baru, testing perlu)

---

### Task PF-004: API — DELETE Fix

**Tujuan:** Memperbaiki `DELETE /api/products` agar benar-benar membersihkan file dari Supabase Storage dan menghapus relasi `product_images`.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `app/api/products/route.ts` | DELETE handler: baca gambar dari `product_images` table (bukan dari kolom `image`/`images`) |

**Detail perubahan:**

DELETE handler saat ini:
```typescript
const { data: existing } = await supabase.from('products').select('*').eq('id', id).single();
const images = existing?.images || (existing?.image ? [existing.image] : []);
// → always empty because columns don't exist
```

DELETE handler baru:
```typescript
// Fetch images from product_images table
const { data: existingImages } = await supabase
  .from('product_images')
  .select('image_url')
  .eq('product_id', id);

// Delete files from storage
for (const row of existingImages || []) {
  // ... parse URL and remove from 'products' bucket
}

// Delete product_images rows (cascade or manual)
await supabase.from('product_images').delete().eq('product_id', id);

// Delete product
await supabase.from('products').delete().eq('id', id);
```

**Risiko:**
- Jika storage delete gagal, produk tetap terhapus → orphan images
- URL parsing harus handle berbagai format

**Cara testing:**
1. Buat produk dengan 2 gambar (upload ke storage dulu)
2. DELETE produk
3. Verifikasi produk hilang dari `products`
4. Verifikasi `product_images` kosong untuk product_id tersebut
5. Verifikasi file di storage bucket juga hilang

**Estimasi kompleksitas:** ⭐⭐ (2/5 — logika baru, perlu error handling)

---

### Task PF-005: Product Type

**Tujuan:** Memperbarui `Product` type di `types/index.ts` agar tidak bergantung pada field `image`, dan menambahkan `images` sebagai array.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `types/index.ts` | Hapus `image: string`, tambah `images: string[]` (opsional) |

**Detail perubahan:**

```typescript
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  // image: string;          // ← HAPUS — tidak ada di Supabase schema
  images: string[];          // ← TAMBAH — dari product_images join
}
```

**Dampak (file yang perlu diperbarui setelah type berubah):**

| File | Perubahan |
|------|-----------|
| `components/produk/ProdukGrid.tsx:40` | `product.image` → `product.images?.[0] || '/placeholder.jpg'` |
| `app/page.tsx:110` | `product.image` → `product.images?.[0] || '/placeholder.jpg'` |
| `app/admin/dashboard/page.tsx:845-846` | `product.image ? [product.image] : []` → `product.images || []` |
| `app/admin/dashboard/page.tsx:830` | `image: ""` → `images: []` |
| `app/admin/dashboard/page.tsx:1093` | `image: imageUrls[0] || ""` → `images: imageUrls` |
| `app/admin/products/page.tsx:24` | `p.image` → `p.images?.[0] || '/placeholder.jpg'` (atau hapus) |
| `data/products.ts` | Akan dihapus di PF-009 |

**GET API juga perlu diperbarui** untuk mengembalikan `images` sebagai array string (bukan array objek `{ image_url }`):

Saat ini: `.select('*, product_images(image_url)')` → `{ id, name, ..., product_images: [{ image_url: "..." }] }`

Baru: Di response handler, transform jadi:
```typescript
const transformed = data.map((p: any) => ({
  ...p,
  images: (p.product_images || []).map((img: any) => img.image_url),
  product_images: undefined, // hapus raw join
}));
```

Atau alternatif: biarkan FE menangani bentuk `product_images[].image_url`.

**Risiko:**
- Semua file yang pakai `product.image` akan broken sampai diperbarui
- Perlu dikerjakan bareng dengan PF-006 (Dashboard) dan PF-008 (Public Catalog)

**Cara testing:**
1. `tsc --noEmit` → 0 type errors
2. `npm run build` atau `next build` → 0 errors
3. GET `/api/products` → response mengandung `images: string[]`

**Estimasi kompleksitas:** ⭐ (1/5 — type change, update consumers)

---

### Task PF-006: Dashboard Fix

**Tujuan:** Memperbaiki Dashboard Admin agar CRUD produk berjalan lengkap, tidak error, dan memberikan UX yang baik.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `app/admin/dashboard/page.tsx` | Banyak — form submit, image upload, form state |

**Sub-task:**

**6a — Fix POST payload (critical)**
- Jangan kirim `image` field ke API
- Kirim `images: imageUrls` array
- Ubah `formData` initial state: `image: ""` → `images: []`

**6b — Fix Edit flow (high)**
- Saat edit, baca gambar dari `product.images` (bukan `product.image`)
- `handleEditProduct`: fallback `product.images ? product.images : product.image ? [product.image] : []`

**6c — Parallel image upload (medium)**
- Ganti `for` loop sequential dengan `Promise.all` untuk upload paralel
- Maks 5 gambar, upload semua dalam satu batch
- Tampilkan progress per gambar

**6d — Image validation (medium)**
- Validasi client: max 5MB per file, hanya jpeg/png/webp
- Validasi server di API: sama

**6e — Form improvement (medium)**
- Price field: `value={formData.price ?? ''}` bukan `value={formData.price || 0}`
- `parseInt` → gunakan `Number` atau `sanitizePriceToInt`
- Tambah validation error message inline

**6f — Notification system (medium)**
- Ganti `alert("Nama dan harga produk harus diisi")` dengan state error message
- Ganti `console.error(err)` dengan notifikasi error
- Tambah toast sukses setelah save/delete

**6g — Apply `sort_order` saat edit (medium)**
- Saat PUT, kirim `images` array dengan urutan sesuai `previewItems`
- API akan insert dengan `sort_order` sesuai index array

**Risiko:**
- Banyak perubahan di satu file besar (1720 line) — risiko merge conflict
- Image upload logic perlu di-refactor dengan hati-hati
- Perubahan state management bisa menyebabkan regression di bagian lain

**Cara testing:**
1. Tambah produk dengan 3 gambar → sukses, semua gambar muncul
2. Edit produk, ganti nama + upload 2 gambar baru → sukses
3. Edit produk, hapus 1 gambar existing → gambar hilang
4. Tambah produk tanpa gambar → sukses
5. Coba upload file non-image → ditolak
6. Coba upload file >5MB → ditolak
7. Hapus produk → sukses, muncul konfirmasi

**Estimasi kompleksitas:** ⭐⭐⭐⭐ (4/5 — refactor besar di file besar)

---

### Task PF-007: API — Authentication

**Tujuan:** Menambahkan server-side authentication pada `POST / PUT / DELETE /api/products` agar hanya admin yang bisa mengelola produk.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `app/api/products/route.ts` | Semua handler: tambah pengecekan auth |

**Detail perubahan:**

Ada dua pendekatan:

**Opsi A: Simple token (direkomendasikan untuk MVP)**
- Client dashboard kirim header `Authorization: Bearer <token>`
- Token diverifikasi di server (bisa hardcoded env var atau JWT)

```typescript
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
if (!ADMIN_TOKEN) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

const authHeader = request.headers.get('authorization');
if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Opsi B: Supabase Session (lebih secure)**
- Dashboard login via Supabase Auth
- Server verifikasi session token

**Rekomendasi:** Opsi A untuk MVP, karena auth existing dashboard masih pakai localStorage `admin-authenticated`. Nanti bisa upgrade ke Supabase Auth.

**Risiko:**
- Admin bisa lock out sendiri jika token salah
- GET endpoint tetap publik (untuk public catalog)

**Cara testing:**
1. GET tanpa token → 200 OK (public read)
2. POST tanpa token → 401
3. POST dengan token salah → 401
4. POST dengan token benar → 201
5. PUT/DELETE dengan token benar → 200

**Estimasi kompleksitas:** ⭐⭐ (2/5 — pattern umum, mudah diimplementasi)

---

### Task PF-008: Public Catalog Migration

**Tujuan:** Mengubah public website dari static import (`data/products.ts`) menjadi fetch dari Supabase API.

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `app/page.tsx` | Ganti `import { products } from "@/data/products"` dengan fetch from API |
| `app/produk/page.tsx` | Ganti `import { products } from "@/data/products"` dengan fetch from API |
| `components/produk/ProdukGrid.tsx` | Update `product.image` → `product.images?.[0]` |

**Detail:**

**`app/produk/page.tsx`** (Server Component — bisa async):
```typescript
async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function ProdukPage() {
  const products = await getProducts();
  return <ProdukGrid products={products} />;
}
```

**`app/page.tsx`** (Client Component — perlu useEffect atau pindah ke Server Component):
```typescript
// Opsi: pindah featured section ke server component
// Atau: fetch di useEffect
const [featured, setFeatured] = useState<Product[]>([]);
useEffect(() => {
  fetch('/api/products').then(r => r.json()).then(data => setFeatured(data.slice(0, 3)));
}, []);
```

**`components/produk/ProdukGrid.tsx`:**
```typescript
src={product.images?.[0] || '/images/placeholder.jpg'}
```

**Risiko:**
- Website publik mungkin kosong jika API down
- Loading state perlu ditambahkan
- SEO: server component lebih baik untuk indexing

**Cara testing:**
1. Buka `/` → produk featured muncul dengan gambar
2. Buka `/produk` → semua 9 produk muncul
3. Buka salah satu produk → gambar muncul
4. Matikan API → halaman tetap render (tapi tanpa produk)

**Estimasi kompleksitas:** ⭐⭐⭐ (3/5 — perlu refactor client/server component)

---

### Task PF-009: Cleanup

**Tujuan:** Menghapus dead code, file legacy, dan archived scripts.

**File yang dihapus:**

| File | Alasan |
|------|--------|
| `data/products.ts` | Static data — sudah migrasi ke Supabase |
| `data/products.json` | Static data — sudah migrasi ke Supabase |
| `scripts/migrate-products.js` | One-time migration script |
| `scripts/migrate-images.js` | One-time migration script |
| `components/admin/ProductEditModal.tsx` | Tidak dipakai (inline modal dashboard) |
| `components/admin/AdminGuard.tsx` | File kosong |
| `app/admin/products/page.tsx` | Legacy page (static data, duplicate functionality) |

**File yang dipertahankan tapi perlu dimark:**

| File | Mark |
|------|------|
| `app/admin/product-form/page.tsx` | Tambah komentar "DEPRECATED — gunakan Dashboard" atau selesaikan |

**Risiko:**
- Mungkin ada import yang masih referensi file yang dihapus
- Perlu `grep` untuk memastikan tidak ada yang pakai

**Cara testing:**
1. `npm run build` → 0 error
2. Buka semua halaman publik → OK
3. Buka dashboard → OK
4. CRUD produk → OK

**Estimasi kompleksitas:** ⭐ (1/5 — hapus file, cek import)

---

## Testing Strategy

### Per-Task Testing

Setiap task memiliki testing plan spesifik (lihat bagian "Cara testing" per task di atas).

### Integration Testing (setelah semua task selesai)

| Test | Skenario | Expected |
|------|----------|----------|
| E2E-1 | Buka `/` → lihat produk | 9 produk muncul, gambar OK |
| E2E-2 | Buka `/produk` → grid produk | Semua produk tampil |
| E2E-3 | Login dashboard → menu Produk | Daftar produk dari API |
| E2E-4 | Tambah produk (dengan 3 gambar) | 201, gambar tersimpan, tampil di grid |
| E2E-5 | Edit produk (nama + ganti gambar) | 200, data berubah, gambar baru tampil |
| E2E-6 | Hapus produk | 200, produk hilang, gambar di storage hilang |
| E2E-7 | POST tanpa token | 401 |
| E2E-8 | GET tanpa token | 200 (public) |
| E2E-9 | Upload non-image file | Ditolak (client + server) |
| E2E-10 | Upload file >5MB | Ditolak |

### Regression Testing

- Checkout flow: tambah produk ke cart → checkout → bayar → order muncul di dashboard
- Pastikan `data/products.ts` sudah tidak diimport di mana pun
- Pastikan tidak ada error TypeScript (`tsc --noEmit`)

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API down → public catalog kosong | Low | High | Fallback ke empty array + placeholder "Produk tidak tersedia" |
| Migration error → data loss | Low | Critical | Backup database sebelum migration; test di dev dulu |
| Dashboard refactor → regression | Medium | High | Manual regression test lengkap |
| Auth bug → admin lock out | Medium | High | Recovery flow: env var + supabase dashboard direct |
| Image size validation too strict | Low | Low | Configurable di env var |
| Sort_order migration → existing images unordered | Medium | Low | Default `0`, urutan berdasarkan `created_at` |

---

## Definition of Done

Admin Product dinyatakan **Production Ready** jika semua indikator berikut terpenuhi:

### Functional

- [ ] **Tambah produk**: Admin bisa menambah produk baru dengan nama, deskripsi, harga, berat, dan 1-5 gambar. Data tersimpan di Supabase. Gambar terupload ke Storage.
- [ ] **Edit produk**: Admin bisa mengubah nama, deskripsi, harga, berat. Bisa menambah/menghapus/mengurutkan gambar. Data terupdate di Supabase.
- [ ] **Hapus produk**: Admin bisa menghapus produk. Produk hilang dari database, gambar bersih dari storage, relasi `product_images` ikut terhapus.
- [ ] **Upload gambar**: Upload berhasil ke bucket `products`. Validasi ukuran (max 5MB) dan tipe (jpeg/png/webp) bekerja. Upload paralel untuk kecepatan.
- [ ] **Public catalog**: Website publik menampilkan produk dari Supabase API. Semua gambar tampil benar.

### Non-Functional

- [ ] **Security**: POST/PUT/DELETE `/api/products` hanya bisa diakses dengan token admin. GET tetap publik.
- [ ] **UX**: Notifikasi sukses/gagal muncul (bukan `alert()`). Loading state terlihat. Form validation jelas.
- [ ] **Data integrity**: Image order terjamin via `sort_order`. Tidak ada orphan images di storage. Tidak ada referensi ke kolom `image`/`images` yang tidak ada.
- [ ] **No dead code**: `data/products.ts`, `data/products.json`, `ProductEditModal.tsx`, `AdminGuard.tsx`, `scripts/migrate-*.js` sudah dihapus.
- [ ] **Zero TypeScript errors**: `tsc --noEmit` lulus tanpa error.
- [ ] **Build success**: `next build` lulus tanpa error.

### Owner-Ready Checklist

Seorang owner bisnis (non-technical) harus bisa:

1. ✅ Buka dashboard → login
2. ✅ Lihat daftar produk yang sudah ada
3. ✅ Klik "Tambah Produk" → isi form → upload foto dari HP → klik "Simpan"
4. ✅ Lihat produk baru muncul di dashboard
5. ✅ Edit produk (ganti harga, ganti foto)
6. ✅ Hapus produk yang tidak dijual lagi
7. ✅ Buka website publik → lihat semua produk muncul dengan benar

Jika semua langkah di atas bisa dilakukan tanpa error, Admin Product **Production Ready**.
