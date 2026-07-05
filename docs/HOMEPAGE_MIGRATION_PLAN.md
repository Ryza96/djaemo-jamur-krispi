# Homepage Migration Plan — Static Data → API Products

## Executive Summary

Homepage (`app/page.tsx`) dan halaman produk (`app/produk/page.tsx`) saat ini membaca produk dari `data/products.ts` (static import). Target akhir adalah membaca dari `GET /api/products` yang mengambil data dari Supabase.

Strategi: **Dua fase** — Fase 1 migrasi homepage dan halaman produk ke API, Fase 2 hapus static files. Fase 2 hanya boleh dijalankan setelah public pages terbukti stabil menggunakan API.

**Rekomendasi utama:** Gunakan **Server Component + fetch** untuk `/produk` dan **Client Component + useEffect** untuk homepage (`/`). Tidak perlu custom hook — `fetch` + `useEffect` atau Server Component async sudah cukup untuk pola sesederhana ini.

---

## Current Architecture

```
app/page.tsx (Client Component)
  └── import { products } from "@/data/products"
      └── products.slice(0, 3) → "Produk Unggulan"

app/produk/page.tsx (Server Component)
  └── import { products } from "@/data/products"
      └── <ProdukGrid products={products} />

components/produk/ProdukGrid.tsx (Client Component)
  └── menerima props products: Product[]
  └── menampilkan grid, tombol "Add to Cart"

CartProvider.tsx
  └── addToCart(product: Product) → menyimpan ke localStorage
  └── CartItem = { product: Product, quantity: number }

data/products.ts → akan dihapus
data/products.json → akan dihapus
```

**3 file sumber data:** `data/products.ts`, `data/products.json`, dan Supabase via `GET /api/products`. Dua pertama akan dihapus.

---

## Target Architecture

```
Server Component:

app/produk/page.tsx
  └── async function → fetch(API_URL/api/products)
      └── <ProdukGrid products={data} />

Client Component:

app/page.tsx
  └── useEffect → fetch(/api/products)
      └── slice(0, 3) → "Produk Unggulan"
```

### Arus Data Final

```
Supabase products
    ↓
GET /api/products (Next.js Route Handler)
    ↓
fetch() dari Server atau Client Component
    ↓
ProdukGrid / Homepage
```

---

## Implementation Plan

### Task HMP-1: Migrasi `/produk` (Server Component)

**Tujuan:** Mengubah `app/produk/page.tsx` dari static import ke fetch API.

**Strategi: Server Component dengan async/await.** Halaman `/produk` sudah berupa Server Component. Cukup tambahkan `async` dan ganti import dengan fetch.

```typescript
// app/produk/page.tsx — setelah migrasi
import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/sections/Section";
import { ProdukGrid } from "@/components/produk/ProdukGrid";

export const metadata: Metadata = {
  title: "Produk",
  description: "Lihat koleksi camilan jamur krispi Djaemo.",
};

async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ProdukPage() {
  const products = await getProducts();
  return (
    <Section>
      <PageHeader
        title="Produk Kami"
        description="Pilih varian jamur krispi favorit Anda..."
      />
      <ProdukGrid products={products} />
    </Section>
  );
}
```

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `app/produk/page.tsx` | Hapus `import { products } from "@/data/products"`. Tambah `async function getProducts()`. Ubah komponen jadi `async`. |

**Kenapa `no-store`?** Produk bisa berubah kapan saja via Dashboard Admin. Cache akan membuat data stale. Untuk performa, bisa tambahkan `revalidate` nanti.

**Risiko:**
- Jika API tidak jalan, halaman produk kosong
- `NEXT_PUBLIC_SITE_URL` harus di-set dengan benar di environment (saat ini: `http://localhost:3000`)

**Estimasi:** ⭐ (1/5)

---

### Task HMP-2: Migrasi Homepage

**Tujuan:** Mengubah `app/page.tsx` dari static import ke fetch API.

**Strategi: Client Component dengan `useEffect`.**
Homepage adalah Client Component (karena pakai `useState` untuk carousel). Pertahankan Client Component, tambah fetch di `useEffect`.

```typescript
// app/page.tsx — perubahan utama
// HAPUS:
import { products } from "@/data/products";
const featured = products.slice(0, 3);

// TAMBAH:
const [featured, setFeatured] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/products')
    .then(r => r.json())
    .then(data => setFeatured(data.slice(0, 3)))
    .catch(() => setFeatured([]))
    .finally(() => setLoading(false));
}, []);
```

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `app/page.tsx` | Hapus `import { products } from "@/data/products"`. Hapus `const featured = products.slice(0, 3)`. Tambah state `featured` + `loading`. Tambah `useEffect` fetch. Tambah skeleton loading. |

**Mengapa bukan Server Component?**
Homepage menggunakan `useState` untuk carousel (`activeCarouselIndex`), `useEffect` untuk interval, dan `useMemo` untuk `carouselImages`. Mengubahnya jadi Server Component akan membutuhkan refactor besar pada carousel. Lebih pragmatis pertahankan Client Component + fetch di `useEffect`.

**Mengapa bukan React Server Fetch (RSC)?** 
Karena komponen ini sudah `"use client"`, tidak bisa pakai `async`. Alternatif: pisahkan bagian featured products ke Server Component terpisah, lalu compose di Client Component. Ini lebih bersih untuk SEO, tapi menambah kompleksitas.

**Rekomendasi:** Gunakan fetch di `useEffect` untuk sekarang. Jika nanti butuh optimalisasi SEO, baru refactor dengan compose pattern.

**Estimasi:** ⭐⭐ (2/5)

---

### Task HMP-3: Loading State

**Mengapa Skeleton?**
- Logo dan hero section sudah static (tidak perlu loading)
- Bagian "Produk Unggulan" adalah satu-satunya dynamic section
- Skeleton Grid sesuai dengan tampilan akhir (3 card)

**Implementasi:**
```typescript
// Di app/page.tsx
{loading ? (
  <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[1,2,3].map(i => (
      <div key={i} className="overflow-hidden rounded-2xl border bg-white shadow-sm animate-pulse">
        <div className="h-48 bg-slate-200" />
        <div className="p-5 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-6 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    ))}
  </div>
) : featured.length > 0 ? (
  ...render produk...
) : (
  <p className="text-center text-muted mt-10">Produk belum tersedia.</p>
)}
```

**File yang diubah:**
- `app/page.tsx` — tambah skeleton grid

**Estimasi:** ⭐ (1/5)

---

### Task HMP-4: Error & Empty State

**API gagal:**
- `catch(() => setFeatured([]))` → fallback ke empty state
- Tampilkan "Produk belum tersedia" (bukan error crash)

**Database kosong:**
- API mengembalikan `[]` → `featured.length === 0`
- Tampilkan pesan "Belum ada produk" di grid

**Produk tanpa gambar:**
- `product.images?.[0] || '/images/placeholder.jpg'`
- Buat file placeholder di `public/images/placeholder.jpg`

**Produk nonaktif:**
- Belum ada mekanisme aktif/nonaktif di database (tidak ada kolom `is_active`)
- Bisa ditambahkan nanti di API: filter produk aktif sebelum return
- Sampai ada, semua produk ditampilkan

**File yang diubah:**
- `app/page.tsx` — empty state
- `components/produk/ProdukGrid.tsx` — fallback gambar (sudah diubah di PF-001)

**Estimasi:** ⭐ (1/5)

---

### Task HMP-5: API Fallback & Cache

**Menambahkan opsi fallback ke static data** (opsional, untuk transisi aman):

Jika API gagal, homepage bisa fallback ke static data yang masih ada:
```typescript
import { products as fallbackProducts } from "@/data/products";
// ...
fetch('/api/products')
  .then(r => r.json())
  .catch(() => setFeatured(fallbackProducts.slice(0, 3)))
```

Tapi ini membuat `data/products.ts` tetap diperlukan. **Rekomendasi:** Jangan pakai fallback. Lebih baik API dijamin stabil. Jika API down, tampilkan empty state — owner akan langsung tahu ada masalah.

**Cache strategy:**
- Homepage: `fetch('/api/products')` tanpa cache option → selalu fresh
- Halaman produk: `cache: 'no-store'` → bisa diubah jadi `revalidate: 60` jika performa perlu
- API Route: `supabase.from('products').select(...)` tanpa caching → selalu data terbaru

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API down → homepage kosong | Low | High | Empty state message, owner segera tahu |
| `NEXT_PUBLIC_SITE_URL` tidak ter-set | Low | High | Gunakan relative URL `/api/products` (lebih aman) |
| Perubahan tiba-tiba (flash of missing content) | Medium | Low | Skeleton loading mencegah layout shift |
| Cart items dari old data (masih `image` bukan `images`) | Low | Medium | CartProvider tidak pakai `images` — hanya `id`, `name`, `price` untuk display. `image` tidak dipakai di checkout. Periksa file checkout. |

**Catatan Cart/Checkout:** CartProvider hanya menyimpan `Product` object dan `quantity`. Checkout page membaca `items` dari cart dan mengirim `items` ke payment API. Field `image` atau `images` tidak pernah dipakai di checkout flow. Tidak ada risiko.

---

## Testing Strategy

### Per-Task

| Task | Test | Expected |
|------|------|----------|
| HMP-1 | Buka `/produk` | 9 produk dari API |
| HMP-1 | Matikan API | Empty state, tidak crash |
| HMP-2 | Buka `/` | 3 produk featured dari API |
| HMP-2 | Matikan API | Skeleton → empty state |
| HMP-3 | Slow network | Skeleton muncul |
| HMP-4 | Produk tanpa gambar | Placeholder tampil |

### Integration

| Test | Skenario | Expected |
|------|----------|----------|
| E2E-1 | Buka `/` → klik "Add to Cart" → buka cart | Produk masuk cart |
| E2E-2 | Buka `/produk` → klik "Add to Cart" → buka checkout | Product data benar |
| E2E-3 | Admin tambah produk → buka `/` | Produk baru muncul |
| E2E-4 | Admin hapus produk → buka `/produk` | Produk hilang dari grid |

### Regression Checklist

- [ ] Cart masih bisa menambah/menghapus item
- [ ] Checkout masih bisa memproses pesanan
- [ ] Total harga di checkout masih benar
- [ ] Admin Dashboard masih bisa CRUD produk
- [ ] API `/api/products` masih return 200

---

## Rollback Strategy

### Fase 1: Jika migrasi homepage gagal

**Rollback:**
1. Kembalikan `app/page.tsx` ke commit sebelumnya: `git checkout HEAD -- app/page.tsx`
2. Kembalikan `app/produk/page.tsx` ke commit sebelumnya: `git checkout HEAD -- app/produk/page.tsx`
3. Restart server: `npm run dev` atau redeploy

**Durasi:** < 1 menit

### Fase 2: Jika penghapusan static files gagal

**Rollback:**
1. Kembalikan file yang dihapus: `git checkout HEAD -- data/products.ts data/products.json`
2. Pastikan tidak ada import yang broken

**Durasi:** < 1 menit

### Git Strategy

```
commit A: HMP-1 + HMP-2 (ubah import ke API)
commit B: HMP-3 + HMP-4 (tambah skeleton + error handling)
commit C: HMP-5 (hapus data/products.ts, data/products.json) — hanya jika stabil
```

Setiap commit bisa di-rollback secara independen.

---

## Definition of Done

- [ ] `/` (homepage) menampilkan 3 produk unggulan dari API
- [ ] `/produk` menampilkan semua produk dari API
- [ ] Skeleton loading muncul saat fetching
- [ ] Empty state muncul jika API gagal atau database kosong
- [ ] Placeholder gambar muncul jika produk tanpa gambar
- [ ] Cart + Checkout tidak terpengaruh
- [ ] Admin Dashboard CRUD masih berfungsi
- [ ] `data/products.ts` dan `data/products.json` bisa dihapus (setelah stabil)
- [ ] `next build` lulus tanpa error
- [ ] `tsc --noEmit` lulus tanpa error
