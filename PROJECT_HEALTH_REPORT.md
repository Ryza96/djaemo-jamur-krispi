# PROJECT HEALTH REPORT — Djaemojamurkrispi

**Generated:** 2026-07-01  
**Scope:** Full audit across 10 health dimensions.  
**Rule:** JANGAN mengubah UI, database, API, routing, atau business logic. Temuan saja.

---

## 🔴 CRITICAL (must fix immediately)

| # | Temuan | File | Detail |
|---|--------|------|--------|
| C1 | **Biteship API key hardcoded** | `app/api/biteship-rates/route.ts:74` | `const API_KEY = "qz..."` — plaintext key in source code. Gunakan env var. |
| C2 | **Real Supabase + Midtrans secrets di disk** | `.env.local` | `SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY` dll. Sudah digitignore, tapi ada di filesystem. Risiko jika backup/commit keliru. |

---

## 🟠 HIGH (fix soon)

| # | Temuan | File | Detail |
|---|--------|------|--------|
| H1 | **Heavy `any` usage (~59 occurrences)** | 7+ files | Dominan di admin dashboard, API routes, midtrans.ts. Menghilangkan type safety. |
| H2 | **Heavy `as` assertions (~34)** | `app/admin/dashboard/page.tsx` | Paksakan tipe alih-alih validasi runtime. |
| H3 | **No try-catch in API routes** | `app/api/shipping/route.ts`, `app/api/payment/route.ts`, `app/api/biteship-rates/route.ts` | Malformed JSON/unexpected errors → 500 tanpa pesan jelas. |
| H4 | **No input validation in API routes** | `app/api/shipping/route.ts`, `app/api/payment/route.ts` | Request body tidak divalidasi (zod, yup, atau manual). |
| H5 | **46 console.log/warn/error statements** | Tersebar di `app/` (admin dashboard, product-form), `lib/`, `components/`, `scripts/` | Kotoran debugging production. |
| H6 | **ESLint: 64 errors, 26 warnings** | Seluruh proyek | `@typescript-eslint/no-explicit-any` dominan (21 error). Juga `no-require-imports` di scripts, `no-unused-vars`. |
| H7 | **`admin/dashboard/page.tsx` (1641 lines)** | `app/admin/dashboard/page.tsx` | Monster file. Heavy `any`, heavy `as`, business logic campur UI. Butuh refactor split. |

---

## 🟡 MEDIUM (address in Commerce Engine phase)

| # | Temuan | File | Detail |
|---|--------|------|--------|
| M1 | **1 TODO — not yet integrated with API** | `app/admin/product-form/page.tsx:51` | `// TODO: Integrasikan dengan API backend untuk simpan data produk` — form tidak bisa submit. |
| M2 | **Dead file: `lib/shipping.ts` (50 lines)** | `lib/shipping.ts` | 0 importer. Code identik dengan `lib/flatRateShipping.ts`. |
| M3 | **Dead file: `components/admin/AdminGuard.tsx` (0 lines)** | Empty file, never imported | Hapus aman. |
| M4 | **4 bare `declare module` type files** | `types/qrcode.d.ts`, `pdfkit.d.ts`, `midtrans-client.d.ts`, `bwip-js.d.ts` | Tidak ada definisi tipe — efektif `any`. |
| M5 | **Unused devDependencies (depcheck)** | `@tailwindcss/postcss`, `autoprefixer`, `tailwindcss` | Tidak langsung terpakai di package.json (Tailwind v4 via CSS). Pastikan bersih. |
| M6 | **Missing dependency `pg`** | `scripts/run-migrations.js` | Script butuh `pg` tapi tidak ada di dependencies. |
| M7 | **`checkout/page.tsx` — `useEffect` + `useMemo` potensi unstable deps** | `app/checkout/page.tsx` | Shipping logic dalam `useEffect` bisa infinite loop jika dependency array tidak stabil. |
| M8 | **`ThemeToggle.tsx` — setState dalam useEffect** | `components/ui/ThemeToggle.tsx:11` | ESLint `react-hooks/set-state-in-effect`. Sebaiknya `useSyncExternalStore` atau derived state. |
| M9 | **Unused import `parseDestinationFromAddress`** | `app/cart/page.tsx:93` | Import mati. |
| M10 | **Unused vars in scripts** | `scripts/migrate-images.js:37,56`, `scripts/migrate-products.js:26`, `pages/api/orders/[id]/receipt.ts:40` | `ext`, `data`, `e` — unused. |
| M11 | **`ProdukGrid.tsx` (61 lines) — redundant wrapper** | `components/produk/ProdukGrid.tsx` | Hanya wrap `ProductCard` — bisa inline di caller. |

---

## 🟢 LOW (nice to have)

| # | Temuan | File | Detail |
|---|--------|------|--------|
| L1 | **No `dangerouslySetInnerHTML` usage** | — | ✅ Tidak ada XSS via innerHTML. |
| L2 | **No `@ts-ignore` / `@ts-expect-error` / `eslint-disable`** | — | ✅ Tidak ada suppression. |
| L3 | **TypeScript strict mode?** | `tsconfig.json` | Perlu dicek apakah `strict: true`. |
| L4 | **No lazy loading heavy components** | `app/admin/dashboard/page.tsx` | Bisa pakai `next/dynamic` untuk chart/table berat. |
| L5 | **`next.config.ts`** | Has `images.remotePatterns` untuk Supabase | ✅ Already configured. |

---

## ✅ ALREADY FIXED (from earlier session)

| Fix | Detail |
|-----|--------|
| Image optimizer blocking private IP in dev | `unoptimized={process.env.NODE_ENV === "development"}` applied to all 5 `<Image>` instances |
| Hero image size | Compressed from 5.7 MB → 1.6 MB |
| Static Logo unaffected | Uses `/images/logo/logo.png` — local file, no IP issue |

---

## 📊 SCORING

| Dimensi | Skor | Alasan |
|---------|------|--------|
| **Folder Structure** | 90/100 | Standar Next.js App Router. 3 empty dirs, 1 dead file. |
| **API** | 55/100 | 3/12 routes tanpa try-catch, 2 tanpa validasi, Biteship key hardcoded. |
| **TypeScript** | 40/100 | 59 `any`, 34 `as`, 4 `.d.ts` kosong, tapi 1 file typed (`types/index.ts`). |
| **ESLint** | 30/100 | 64 errors, 26 warnings — dominan `no-explicit-any`. |
| **Dead Code** | 75/100 | 2 dead files (`lib/shipping.ts`, `AdminGuard.tsx`), 1 unused import. |
| **Console/TODO** | 65/100 | 46 console.log, 1 TODO active. |
| **Reusable Components** | 70/100 | `ProdukGrid` redundant wrapper, otherwise decent. |
| **Security** | 30/100 | Biteship key di source code, secrets di .env.local (gitignored OK, tapi tetap risiko). |
| **Performance** | 70/100 | No lazy loading, heavy single file (dashboard 1641 lines), tapi image optimized. |
| **Technical Debt** | 45/100 | `midtrans.ts` any, no error boundaries, minimal API validation, missing `pg` dep. |

### 🏁 OVERALL: **57/100** — "Perlu Perbaikan Signifikan"

---

## 🎯 Recommended Action Plan (Commerce Engine Phase)

### Sprint 1 — Security & Hygiene
- [ ] C1: Move Biteship key to env var
- [ ] H5: Remove console.log production (46 statements)
- [ ] H6: Fix ESLint errors (especially `no-explicit-any`)
- [ ] M2, M3: Delete dead files

### Sprint 2 — Type Safety
- [ ] H1, H2: Eliminate `any` and `as` — proper types
- [ ] M4: Proper type definitions for qrcode, pdfkit, midtrans-client, bwip-js
- [ ] Enable `strict: true` in tsconfig

### Sprint 3 — API Robustness
- [ ] H3, H4: try-catch + input validation on all API routes
- [ ] M1: Connect product-form to real API

### Sprint 4 — Architecture
- [ ] H7: Split dashboard (1641 lines) into components
- [ ] L4: Add lazy loading
- [ ] M7: Fix useEffect stability in checkout

---

*End of Report*
