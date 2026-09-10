# LAPORAN AUDIT KESIAPAN GO-LIVE (READ-ONLY)

**Proyek:** D'Jaemo Jamur Krispi Ecommerce
**Tanggal:** 7 September 2026
**Metode:** Inspeksi kode + env lokal + git history + `npm run build` + `npm run lint`. TIDAK ada perubahan kode di sesi ini.
**Referensi audit sebelumnya:** `docs/audit-api-report.md` (4 Sep 2026) — beberapa temuannya sudah diverifikasi ulang statusnya di bawah.

---

## VERDICT: **SIAP GO-LIVE DENGAN CATATAN**

Jalur uang (Midtrans payment → callback → order → stok → notifikasi) sangat solid dan siap produksi. Ada beberapa item operasional yang WAJIB dibereskan sebelum rilis publik (lihat Blocker), namun tidak ada cacat kritis di alur pembayaran/ongkir.

---

## RINGKASAN STATUS PER AREA

| # | Area | Status |
|---|------|--------|
| 1 | Pembayaran (Midtrans) | ✅ PASS |
| 2 | Ongkir & Alamat | ✅ PASS (dengan catatan) |
| 3 | Environment & Secrets | ⚠️ WARNING (1 item) |
| 4 | Validasi Input & Keamanan | ⚠️ WARNING (rate limit terbuka) |
| 5 | Alur Order End-to-End & Audit Trail | ✅ PASS |
| 6 | Build & Deployment | ❌ FAIL (lint 15 error, pre-existing) |
| 7 | File belum di-commit | ✅ PASS (aman) |

---

## 1. PEMBAYARAN (MIDTRANS) — PASS

**Konfigurasi production**
- `lib/midtrans.ts` — `isProduction = process.env.NEXT_PUBLIC_MIDTRANS_ENV === "production"`, dipakai untuk instance Snap & Core API.
- `.env.local` → `NEXT_PUBLIC_MIDTRANS_ENV=production`; `MIDTRANS_SERVER_KEY` berformat `Mid-server-...` (bukan `SB-Mid-server`), `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` `Mid-client-...` → key produksi.
- ⚠️ **Asumsi:** pastikan seluruh env di atas (bukan hanya `.env.local`) terpasang di hosting (Vercel) sebagai Production Environment Variable sebelum rilis.

**Keamanan webhook — PASS**
- Verifikasi signature SHA-512 (`lib/services/payment/verifySignature.ts`) memakai `timingSafeEqual`.
- Gross amount divalidasi ulang vs `total_amount` DB sebelum transisi status (`lib/services/order.service.ts:530-552`) — mismatch → log `callback.invalid` + tolak.
- Status hanya dipercaya dari server-to-server webhook, bukan redirect URL.
- Race recovery: order berstatus EXPIRED/FAILED/CANCELLED yang ternyata ter-settle di Midtrans tidak pernah jadi "bayar tapi mati" — diverifikasi via Core API `isTransactionSettledAtMidtrans` (`lib/services/payment/midtrans-verify.ts`) lalu `recoverPaidOrderFromTerminal` (order.service.ts:600-695).

**Idempotensi duplicate webhook — PASS (3 lapis)**
1. Early exit `ORDER_ALREADY_PAID` (order.service.ts:554-569).
2. Conditional/optimistic lock `updatePaymentByOrderIdIf` — 0 baris ter-update ⇒ re-check, tidak overwrite (order.service.ts:700-747).
3. Partial unique index notifikasi `(event, order_id, channel_id) WHERE sent` (dikonfirmasi di test integration).

**Gagal bayar / timeout / expire — PASS**
- Callback FAILED/EXPIRED → `FulfillmentService.cancel` (order.service.ts:749-766).
- `expireUnpaidOrder` pakai conditional write + retry baca, aman terhadap race dengan webhook (order.service.ts:261-372).
- Kegagalan Snap creation → order di-rollback ke FAILED + audit `order.rollback` (app/api/payment/create/route.ts:257-288).

**Manual refund pasca-cancel order yang sudah dibayar — PASS**
- `getRefundInfo`/`confirmManualRefund` berbasis audit log append-only (order.service.ts:798-878).

**Catatan kecil (non-blocking)**
- `app/api/payment/callback/route.ts` hanya mewajibkan field `order_id` & `signature_key` ada di body; kalkulasi signature tetap di `processCallback`. Aman karena signature gagal ⇒ callback ditolak.
- `lib/midtrans.ts:5,7` memakai `any` → kontribusi error lint `no-explicit-any` (lihat §6).

---

## 2. ONGKIR & ALAMAT — PASS (dengan catatan)

**Prioritas lookup rate (sudah dibenahi di commit `d423d76`)**
- Client coords → areaId → city coords (getDestinationCoords) → flat-rate fallback deterministik.
- Diterapkan konsisten di `lib/services/shipping/getRates.ts` dan `lib/services/payment/checkoutValidation.ts:120-205`.
- Server re-kalkulasi ongkir di checkout & mencocokkan dengan metode yang dipilih client (`checkoutValidation.ts:224-264`), fee dihitung ulang bukan dipercaya dari client (`assertClientTotalsMatch`).

**Masalah area_id yang sudah dikenal**
- Akun Biteship live menolak lookup area-id (`40001010` di semua lokasi/kurir), termasuk Bandung/Medan — ini penyebab fallback Rp55.000 lama.
- Mitigasi terbaru: `app/api/address/resolve-area/route.ts` kini me-return koordinat bila Biteship tidak punya lat/lng area, via `geocodeAddress` (`lib/services/address/geocoding.ts`). Flow checkout otomatis membawa koordinat → lookup berbasis coords memberikan harga asli multi-kurir (sudah diuji live: Blahbatuh/Gianyar, Muara Bulian/Batang Hari, Bandar Laksamana/Bengkalis).
- Sisa risiko: klien yang memaksa kirim `areaId` tanpa koordinat tetap kena `40001010` → safe fallback flat (idempotent, tidak underpriced karena pakai `computeFlatRateFallback` yang sama dengan client). Catat saja untuk monitoring.

**Geocoding Nominatim — PASS dengan catatan**
- `lib/services/address/geocoding.ts` — throttle 1.1 detik module-level (mempatuhi kebijakan 1 req/s OSM), timeout 6s, User-Agent valid, cache in-memory per proses.
- Catatan: throttle & cache per-instance; di serverless multi-instance, beberapa instance bisa menembak >1 qps sesaat untuk kota berbeda. Risiko rendah, pantau bila traffic naik.
- ⚠️ `app/api/address/resolve-area` TIDAK punya rate limit sendiri → lihat §4.

**Biteship down / timeout — PASS**
- Semua panggilan Biteship punya timeout 10s + fallback flat deterministik; `fetchBiteshipRates` dan `biteship-rates/route.ts` keduanya fallback ke `computeFlatRateFallback`.

**DEFAULT_COURIERS = "jne,jnt,sicepat"** (`lib/services/shipping/constants.ts`)
- ✅ Sudah terverifikasi via uji live return rate asli untuk ketiga kurir.
- Catatan: pastikan akun Biteship live tetap aktif & 3 kurir ini diaktifkan di dashboard saat go-live.

---

## 3. ENVIRONMENT & SECRETS — WARNING (1 item operasional)

- ✅ `.gitignore` meng-ignore `.env*`; `git ls-files` hanya menampilkan `.env.example`; `git log --all -- .env .env.local .env.production` → TIDAK ADA riwayat commit file `.env`. PASS.
- ✅ Tidak ditemukan hardcoded secret di source saat ini (grep `biteship_live|Mid-server|Mid-client|eyJ...` di `lib/**/*.ts` → kosong).
- ✅ `.env.local.example` sudah berisi placeholder (temuan kritis K1 audit sebelumnya sudah FIXED). Catatan: isi template masih "tua" (belum memuat geocoding, courier settings, webhook signature, admin keys) — sebaiknya disinkronkan dengan `.env.example` yang lebih lengkap, non-blocking.
- ✅ `NEXT_PUBLIC_SITE_URL=https://djaemo.com` (temuan kritis C1 sebelumnya sudah FIXED). Semua fallback URL sudah bukan `localhost`.
- ✅ Key aktif di `.env.local`: BITESHIP (live, len 191), SUPABASE_SERVICE_ROLE, MIDTRANS server+client, FONNTE, RESEND, ADMIN_AUTH_SECRET (64 char).
- ⚠️ **`ADMIN_WHATSAPP_NUMBER` TIDAK TERPASANG** di `.env.local` ⇒ notifikasi WA admin untuk order baru PAID di-skip secara senyap (`order.service.ts:61-64` console.warn). Admin butuh sumber notifikasi order baru. **Blocker operasional.**
- ⚠️ Rendah: git history commit `0e70897` pernah memuat `biteship_test.eyJ...` (TEST key, bukan live). Disarankan rotate di dashboard Biteship. Live key tidak pernah bocor.

---

## 4. VALIDASI INPUT & KEAMANAN — WARNING (rate limit terbuka)

**Validasi server-side — PASS**
- Zod di `app/api/payment/create/route.ts`: nama 1-100, WA regex Indonesia, email opsional valid, alamat max, kode pos 5 digit, qty int 1-50/produk, maks 20 produk beda, larang duplikat produk, subtotal/ongkir nonnegatif.
- Checkout re-validasi server-side: harga produk via `resolveTransactionPrice`/pricing-authority (`checkoutValidation.ts:273-294`), stok batch (`InventoryService.validateCheckoutStock`), ongkir dihitung ulang, voucher preview + aplikasi atomik `apply_voucher` RPC (reservasi slot, anti TOCTOU; `app/api/payment/create/route.ts:189-204`).
- Stok: validasi saat checkout, pengurangan aktual saat admin konfirmasi via RPC atomik `inventory_deduct_batch` + idempotency key per-order (`lib/repositories/inventory.repository.ts:170-198`). Tidak ada oversell-negatif; order yang gagal deduksi tetap terjaga integritasnya.
- SQL injection/XSS: semua akses Supabase parameterized; zero `dangerouslySetInnerHTML` (konsisten dengan audit sebelumnya).

**Rate limiting — DIBUKA (WARNING sedang)**
- Yang ada hanya: admin login (5/15mnt/IP) & contact form (5/1jam/IP).
- Endpoint publik TANPA rate limit, termasuk: `payment/create` (spam order + trigger Midtrans billing), `resolve-area` (trigger Biteship lookup + Nominatim), `biteship-rates` (cost amplification, setiap request = panggilan paid upstream), `checkout/validate-voucher` (brute-force kode voucher).
- **Rekomendasi blocker-menengah:** pasang rate limit pada 4 endpoint tersebut sebelum go-live (atau segera setelahnya bila volume awal kecil).

**Autentikasi admin**
- `middleware.ts:9` masih hanya memproteksi `/admin/:path*` (temuan A1 lama BELUM berubah); namun seluruh 19 route `/api/admin/*` dipastikan memanggil `requireAdmin()` per-handler (audit sebelumnya) → safety-net middleware masih layak ditambah, non-blocking.
- Login admin bcrypt + timing-safe dummy hash. Session HMAC 24 jam, logout tanpa revocation server-side (diterima untuk go-live).

---

## 5. ALUR ORDER END-TO-END & AUDIT TRAIL — PASS

- Audit log komprehensif & append-only (`lib/services/audit-log.service.ts`): order.created, snap.created, status.changed, callback.invalid, callback.skipped, order.rollback, order.recovered, order.cancelled, voucher.usage_released_on_recovery, dst.
- Semua kegagalan rollback / audit-failure di-path uang dicatat via `console.error` berkonteks; TIADA `console.log` di kode produksi (grep `console.(log|info)` hanya di folder `__tests__`).
- Notifikasi admin PAID bersifat fire-and-forget (`after()` + tidak pernah throw), status disimpan di `notification_log` — kegagalan tidak pernah merusak callback. ✅ (Namun lihat blocker `ADMIN_WHATSAPP_NUMBER`.)
- Email ke customer/penjual via Resend; ⚠️ rendah: pastikan dari/domain verified (bukan `onboarding@resend.dev`) agar tidak masuk spam.

---

## 6. BUILD & DEPLOYMENT — FAIL (lint pre-existing)

- ✅ `npm run build` — **SUKSES** (Next.js 16.2.9 Turbopack, TypeScript lulus, 63 route; termasuk `GET / sitemap`, produk static 1m, dsb).
- ❌ `npm run lint` — **GAGAL: 15 errors + 24 warnings** (semua pre-existing, di luar scope audit ini):
  - `no-explicit-any` ×10: `lib/midtrans.ts:5,5,7`, `scripts/generate-order-receipt.ts`, `scripts/generate-sample-receipts.ts`.
  - `react-hooks/set-state-in-effect` ×5: `CartProvider.tsx:27`, `PartnerAuthProvider.tsx:48`, `use-promo-detail.ts:40`, `use-promos.ts:47`, `use-vouchers.ts:36`.
  - Warnings: unused vars, `no-img-element` pada beberapa komponen.
  - ⟹ Melanggar Definition of Done ("No ESLint errors"). **Wajib dibersihkan sebelum rilis versi ini** bila tim menegakkan gate lint.
- ⚠️ Tidak ada script `npm test` di package.json — tidak ada unit test runner resmi (ada script manual + test file di `lib/notifications/__tests__`). Catatan untuk pipeline.
- ⚠️ Deprecation Next 16: `middleware.ts` → `proxy` (pesan build). Teknis kecil, bereskan nanti.
- ⚠️ Belum terlihat CI/CD; commit `d423d76` belum di-push. Pastikan strategi deployment & rollback sudah jelas sebelum go-live.

---

## 7. FILE BELUM DI-COMMIT — PASS

- `git status` bersih kecuali `?? docs/audit-api-report.md` dan file laporan ini (sengaja TIDAK di-commit — read-only audit). `*.REPORT.md` masuk `.gitignore` (baris 50), jadi `audit-api-report.md` tidak akan ter-commit.
- Isi `docs/audit-api-report.md`: memuat referensi key Biteship test JWT hanya dalam bentuk terpotong `biteship_test.eyJ...` (bukan full secret). Key full hanya ada di git history commit `0e70897`. Tidak ada secret produksi dalam file ini.

---

## BLOCKER (minimal sebelum go-live)

| # | Item | Efek jika diabaikan |
|---|------|---------------------|
| B1 | Set `ADMIN_WHATSAPP_NUMBER` di environment produksi | Admin tidak dapat notifikasi order PAID baru (skip senyap) |
| B2 | Pastikan semua env var produksi terpasang di hosting (Midtrans production, Biteship live key, Supabase service role, Fonnte, Resend, `NEXT_PUBLIC_SITE_URL`) | Aplikasi bisa terdeploy dalam mode sandbox/test |
| B3 | Konfirmasi sekali lagi 3 kurir (`jne`,`jnt`,`sicepat`) aktif di dashboard Biteship live | Kurir tidak muncul / semua jatuh ke flat fallback |

## SANGAT DISARANKAN sebelum go-live

| # | Item |
|---|------|
| S1 | Rate limit: `payment/create`, `resolve-area`, `biteship-rates`, `checkout/validate-voucher` |
| S2 | Bersihkan 15 error lint (DoD "No ESLint errors") |
| S3 | Verify email Resend pakai domain verified (bukan `onboarding@resend.dev`) |
| S4 | Rotate Biteship test key yang bocor di git history (`0e70897`) |
| S5 | Ekstensi middleware matcher ke `/api/admin/:path*` sebagai safety net |

## NICE-TO-HAVE (pasca go-live)

- Unit test runner (`npm test`) formal.
- Retry/backoff otomatis panggilan Biteship (saat ini timeout 10s + fallback, tanpa retry).
- Migrasi `middleware` → `proxy` (Next 16).
- Sinkronkan `.env.local.example` dengan `.env.example` terbaru.
- Batasi input panjang admin login (belum ada zod max-length).