# LAPORAN AUDIT API — PRE-GO-LIVE

**Proyek:** D'Jaemo Jamur Krispi Ecommerce
**Tanggal:** 4 September 2026
**Stack:** Next.js 16 / React 19 / TypeScript / Supabase / Midtrans / Biteship

---

## RINGKASAN EKSEKUTIF

| Kategori | Kritis | Sedang | Rendah |
|----------|--------|--------|--------|
| 1. API Key & Credentials | 1 | 0 | 1 |
| 2. Payment Gateway | 0 | 1 | 1 |
| 3. Autentikasi & Otorisasi | 0 | 2 | 3 |
| 4. Error Handling & Data Exposure | 2 | 2 | 1 |
| 5. Rate Limiting & Abuse | 0 | 3 | 2 |
| 6. Konsistensi & Reliabilitas | 1 | 1 | 4 |
| 7. HTTPS & CORS | 0 | 0 | 0 |
| **TOTAL** | **4** | **9** | **12** |

---

## 1. KEAMANAN API KEY & CREDENTIALS

### K1 — [KRITIS] `.env.local.example` berisi kredensial sungguhan

- **File:** `.env.local.example:5-18`
- **Masalah:** File ini memuat key real (Supabase anon key, service_role key, Midtrans client/server key) alih-alih placeholder. Bandingkan dengan `.env.example` yang benar menggunakan placeholder.
- **Risiko:** Jika file ini tidak sengaja di-share atau di-commit, semua credential bocor. `SUPABASE_SERVICE_ROLE_KEY` sangat berbahaya karena bypass RLS.
- **Saran:** Ganti semua value di `.env.local.example` dengan placeholder seperti `your-supabase-anon-key-here`, sesuai pola `.env.example`.

### K2 — [RENDAH] Biteship test key bocor di git history

- **Commit:** `0e70897`
- **Masalah:** Key `biteship_test.eyJ...` pernah ter-hardcode di `app/api/biteship-rates/route.ts` sebelum dipindah ke env var. Masih bisa diakses via `git log -p`.
- **Saran:** Rotate key Biteship di dashboard Biteship. Selain itu, code saat ini sudah benar (semua key dari `process.env`).

### Konfirmasi Positif:

- `.env.local` masuk `.gitignore` dan TIDAK pernah di-commit ke git.
- Tidak ada hardcoded API key di file `.ts`/`.tsx` source saat ini.
- `.env.example` sudah menggunakan placeholder yang benar.
- Supabase service-role client menggunakan `server-only` import.

---

## 2. INTEGRASI PAYMENT GATEWAY (MIDTRANS)

### P1 — [SEDANG] Resend & Fonnte API calls tanpa timeout

- **File:** `lib/notifications/channels/email/resend-provider.ts:10-23`
- **File:** `lib/notifications/channels/whatsapp/fonnte-provider.ts:11-21`
- **Masalah:** Fetch ke Resend dan Fonnte tidak ada `AbortController` timeout. Jika API down/hang, serverless function bisa hang sampai timeout platform.
- **Saran:** Tambahkan `AbortController` dengan timeout 10 detik untuk keduanya (mirip yang sudah dilakukan untuk Biteship).

### P2 — [RENDAH] Biteship API calls tanpa automatic retry

- **File:** `lib/services/shipping/biteship.ts:20-21`, `app/api/biteship-rates/route.ts:4`
- **Masalah:** Panggilan Biteship punya timeout tapi tidak ada retry/backoff otomatis. Jika Biteship down, checkout gagal total.
- **Saran:** Implementasi 1 retry dengan exponential backoff untuk panggilan Biteship.

### Konfirmasi Positif:

- Webhook signature verification dengan HMAC-SHA512 + `timingSafeEqual` (**sempurna**).
- Payment amount (gross_amount) divalidasi ulang di server.
- Status "success" hanya dipercaya dari webhook server-to-server, bukan dari redirect URL.
- Idempotency 3 lapis: early exit + optimistic lock + conditional SQL update.
- Race condition recovery menggunakan Midtrans Core API re-verification.
- Audit log komprehensif untuk semua callback events.
- Midtrans Snap creation punya retry mechanism + rollback.

---

## 3. AUTENTIKASI & OTORISASI API

### A1 — [SEDANG] Middleware tidak melindungi `/api/admin/*` routes

- **File:** `middleware.ts:9` — matcher hanya `/admin/:path*`
- **Masalah:** Admin API routes hanya dilindungi oleh `requireAdmin()` per-handler. Tidak ada safety net di middleware. Jika developer lupa panggil `requireAdmin()` di route baru, route tersebut terbuka total.
- **Saran:** Extend matcher menjadi `["/admin/:path*", "/api/admin/:path*"]`.

### A2 — [SEDANG] Tidak ada sistem autentikasi customer

- **Masalah:** Customer tidak punya login, session, atau akun. Identifikasi hanya berbasis `X-Order-Token` (UUID per-order) dan `device_id` (client-generated).
- **Risiko:** Tidak ada order history, wishlist, atau customer profile yang terikat akun. Jika fitur ini dibutuhkan nanti, perlu bangun dari nol.
- **Catatan:** Ini adalah arsitektural decision, bukan vulnerability. Untuk go-live saat ini masih acceptable.

### A3 — [RENDAH] Limited order data leak tanpa token

- **File:** `app/api/orders/[id]/route.ts:44-58`
- **Masalah:** Tanpa token valid, response tetap mengembalikan `payment_status`, `fulfillment_status`, `total_amount`, dan `order_items` (nama produk, harga, jumlah).
- **Risiko:** Seseorang yang mengetahui order_id bisa melihat detail pesanan. Ini by-design untuk halaman tracking.
- **Catatan:** PII sensitif (nama, email, alamat) hanya bisa diakses dengan token valid.

### A4 — [RENDAH] Device ID spoofing untuk likes

- **File:** `app/api/products/[id]/likes/route.ts:38-48`
- **Masalah:** `device_id` dikontrol penuh oleh client. Bisa dimanipulasi untuk inflate/deflate likes.
- **Risiko:** Rendah (likes bukan data sensitif).

### A5 — [RENDAH] Admin logout tanpa server-side token revocation

- **File:** `app/api/admin/logout/route.ts:7`
- **Masalah:** Logout hanya menghapus cookie. Token HMAC tetap valid selama 24 jam.
- **Saran:** Untuk keamanan tinggi, pertimbangkan token blocklist atau short-lived tokens.

### Konfirmasi Positif:

- 19 admin API routes **semuanya** konsisten memanggil `requireAdmin()`.
- Admin login punya brute force protection (5 attempts/15 min/IP).
- Timing side-channel protection (dummy bcrypt hash).
- Order access token 128-bit UUID (brute-force tidak feasible).

---

## 4. ERROR HANDLING & DATA EXPOSURE

### E1 — [KRITIS] Supabase error details bocor ke client

- **File:** `app/api/products/route.ts:155` — `{ details: error.details ?? null }`
- **File:** `app/api/products/route.ts:162` — `{ details, hint, code }` dari Supabase error
- **File:** `app/api/contact/route.ts:162` — `JSON.stringify(error)` sebagai fallback
- **File:** `app/api/orders/[id]/route.ts:28,51` — `error.message` dari Supabase
- **File:** `app/api/orders/[id]/expire/route.ts:29` — `error.message`
- **File:** `app/api/analytics/revenue/route.ts:43` — `error.message`
- **File:** `app/api/admin/orders/[id]/timeline/route.ts:19` — `error.message`
- **Masalah:** Error response memuat internal database details (column names, constraint names, SQL hints, PostgreSQL error codes). Attacker bisa merekonstruksi schema database.
- **Saran:** Ganti semua dengan generic error message: `"Terjadi kesalahan server"`. Log detail di server-side saja.

### E2 — [KRITIS] Raw Biteship API response bocor ke client

- **File:** `app/api/biteship-rates/route.ts:115` — `{ raw: responseData }`
- **Masalah:** Seluruh raw response dari Biteship API dikirim ke client, bisa mengandung internal metadata, API key info, atau debugging data.
- **Saran:** Hapus `raw: responseData` dari response.

### E3 — [SEDANG] Error.message dari external API di-echo ke client

- **File:** `app/api/biteship-rates/route.ts:98-103,106,135`
- **File:** `app/api/biteship-areas/route.ts:190-197`
- **Masalah:** Error message dari Biteship API diteruskan langsung ke client.
- **Saran:** Gunakan generic error message. Log detail di server.

### E4 — [SEDANG] Beberapa API routes tanpa try-catch

- **File:** `app/api/checkout/validate-voucher/route.ts:27` — tidak ada try-catch untuk `VoucherService.previewForCheckout`
- **File:** `app/api/admin/orders/[id]/receipt/route.ts:9-14` — tidak ada try-catch
- **File:** `app/api/admin/session/route.ts`, `app/api/admin/logout/route.ts`, address routes
- **Masalah:** Jika terjadi error, Next.js default error handler berpotensi mengekspos stack trace (di development).
- **Saran:** Bungkus semua handler dalam try-catch dengan generic error response.

### E5 — [RENDAH] Admin promos routes mengekspos database details

- **File:** `app/api/admin/promos/route.ts:154,160` — `getDatabaseDetails(error)`
- **File:** `app/api/admin/promos/[id]/route.ts:170,176`
- **Masalah:** Meskipun admin-only, internal database details tetap diekspos.
- **Saran:** Ganti dengan generic error message.

### Konfirmasi Positif:

- Contact form menggunakan `escapeHtml()` untuk mencegah XSS di email HTML.
- Zero `dangerouslySetInnerHTML` / `innerHTML` di seluruh codebase.
- `app/error.tsx` error boundary ada dan menampilkan generic message.

---

## 5. RATE LIMITING & ABUSE PROTECTION

### R1 — [SEDANG] Checkout/payment creation tanpa rate limit

- **File:** `app/api/payment/create/route.ts:123`
- **Masalah:** Endpoint paling kritikal — tidak ada rate limiting. Attacker bisa spam order creation, exhaust stock reservations, consume voucher slots, dan trigger Midtrans billing abuse.
- **Saran:** Tambahkan rate limit (misal: 10 requests/5 min per IP).

### R2 — [SEDANG] Voucher validation tanpa rate limit

- **File:** `app/api/checkout/validate-voucher/route.ts:10`
- **Masalah:** Attacker bisa brute-force voucher codes tanpa batas.
- **Saran:** Tambahkan rate limit dan/atau implementasi cooldown setelah N gagal.

### R3 — [SEDANG] Biteship rates proxy tanpa rate limit (cost amplification)

- **File:** `app/api/biteship-rates/route.ts:8`
- **Masalah:** Setiap request memicu paid upstream API call ke Biteship. Tanpa limit, attacker bisa menghasilkan biaya upstream yang besar.
- **Saran:** Tambahkan rate limit (misal: 20 requests/menit per IP).

### R4 — [RENDAH] Admin login tanpa input length limits

- **File:** `app/api/admin/login/route.ts:43-50`
- **Masalah:** Username/password tidak ada batas panjang. Bisa dikirim body multi-megabyte.
- **Saran:** Tambahkan zod schema dengan max length.

### R5 — [RENDAH] Product likes tanpa rate limit

- **File:** `app/api/products/[id]/likes/route.ts:38-48`
- **Masalah:** `device_id` client-controlled + tanpa rate limit = like-count manipulation.
- **Saran:** Tambahkan rate limit per device_id.

### Konfirmasi Positif:

- Admin login rate limit: 5 attempts/15 min per IP.
- Contact form rate limit: 5 submissions/1 jam per IP.
- Input validation menggunakan Zod di routes kritikal (checkout, shipping, payment).
- SQL injection: **tidak ditemukan** — semua database access via Supabase parameterized queries.
- XSS: **tidak ditemukan** — tidak ada `dangerouslySetInnerHTML`.
- Upload validation: magic bytes + extension + MIME type checking.

---

## 6. KONSISTENSI & RELIABILITAS

### C1 — [KRITIS] `NEXT_PUBLIC_SITE_URL` masih `http://localhost:3000`

- **File:** `.env.local:42`
- **Masalah:** Digunakan di 6 tempat kritikal:
  1. `app/produk/page.tsx:15` — SSR product fetch (akan gagal di serverless)
  2. `lib/services/payment/createSnap.ts:104-106` — Midtrans callback URL (redirect ke localhost setelah bayar)
  3. `lib/services/order.service.ts:89` — Admin dashboard URL di WhatsApp notification
  4. `lib/services/shipping/receipt.service.ts:111` — Order URL di receipt email
  5. `app/layout.tsx:28-34` — OG/Twitter metadata (fallback ke `jamurkrispi.com`)
  6. `app/sitemap.ts:6-11` — fallback ke `jamurkrispi.com`
- **Saran:** Set ke `https://jamurkrispi.com` di production environment. Perlu konsisten di semua tempat.

### C2 — [SEDANG] Fallback URL tidak konsisten antar file

- **File:** `app/produk/page.tsx:15` fallback: `http://localhost:3000`
- **File:** `app/layout.tsx:28` fallback: `https://jamurkrispi.com`
- **File:** `app/sitemap.ts:6` fallback: `https://jamurkrispi.com`
- **File:** `app/robots.ts:3` fallback: `https://jamurkrispi.com`
- **Masalah:** `produk/page.tsx` dan `createSnap.ts` fallback ke localhost, yang lain ke jamurkrispi.com.
- **Saran:** Standarisasi semua fallback ke `https://jamurkrispi.com`.

### C3 — [RENDAH] Biteship API URL diduplikasi di 3 file

- **File:** `lib/services/shipping/constants.ts:1`, `app/api/biteship-rates/route.ts:3`, `app/api/biteship-areas/route.ts:9`
- **Masalah:** Hardcoded ke `https://api.biteship.com/v1` di 3 tempat. Maintenance risk.
- **Saran:** Konsolidasi ke constants file.

### C4 — [RENDAH] Resend email sender masih test domain

- **File:** `lib/notifications/channels/email/resend-provider.ts:17`, `app/api/contact/route.ts:93`
- **Masalah:** `from: "onboarding@resend.dev"` — test domain Resend. Email bisa masuk spam atau tidak deliver.
- **Saran:** Setup verified domain di Resend untuk production.

### C5 — [RENDAH] Stock restore saat cancel tidak atomic

- **File:** `lib/services/inventory.service.ts:166-213`
- **Masalah:** Restore dilakukan item-by-item dalam loop. Partial failure mungkin terjadi.
- **Catatan:** Sudah ada audit trail dan handling `PARTIAL_RESTORE_FAILURE`.

### C6 — [RENDAH] Order creation race condition window

- **File:** `lib/services/order.service.ts:139-178`
- **Masalah:** `findByOrderId` + `insert` bukan dalam satu database transaction. Tapi dilindungi oleh UNIQUE constraint di database.

### Konfirmasi Positif:

- Biteship, Resend, Fonnte semua sudah HTTPS.
- Midtrans environment switching (sandbox/production) correctly implemented.
- Midtrans Snap creation punya retry + rollback.
- Stock deduction pakai atomic RPC (`inventory_deduct_batch`).
- Payment status transitions pakai conditional updates (optimistic concurrency).
- Voucher application pakai atomic `apply_voucher` RPC.

---

## 7. HTTPS & CORS

### Tidak ada temuan negatif.

- Semua API calls eksternal sudah HTTPS.
- Tidak ada `Access-Control-Allow-Origin: *` di mana pun.
- Tidak ada CORS headers — benar untuk same-origin architecture.
- SameSite cookie `lax` untuk admin session.

---

## PRIORITAS PERBAIKAN

### Harus diperbaiki SEBELUM go-live:

| # | Temuan | Risk | Estimasi |
|---|--------|------|----------|
| 1 | `.env.local.example` ganti dengan placeholder | Kritis | 10 menit |
| 2 | `NEXT_PUBLIC_SITE_URL` set ke production URL | Kritis | 5 menit |
| 3 | Hapus Supabase error details dari response (`products/route.ts`, `orders/[id]/route.ts`, dll) | Kritis | 30 menit |
| 4 | Hapus `raw: responseData` dari `biteship-rates/route.ts` | Kritis | 5 menit |
| 5 | Rotate Biteship key di dashboard | Kritis | Manual |
| 6 | Tambah rate limit untuk `/api/payment/create` | Sedang | 1 jam |
| 7 | Tambah rate limit untuk `/api/checkout/validate-voucher` | Sedang | 30 menit |
| 8 | Tambah rate limit untuk `/api/biteship-rates` | Sedang | 30 menit |
| 9 | Extend middleware matcher ke `/api/admin/:path*` | Sedang | 5 menit |
| 10 | Tambah timeout ke Resend & Fonnte API calls | Sedang | 20 menit |
| 11 | Ganti error.message di semua public routes dengan generic message | Sedang | 1 jam |
| 12 | Setup verified domain di Resend | Sedang | Manual |

### Direkomendasikan setelah go-live:

| # | Temuan | Risk |
|---|--------|------|
| 13 | Tambah try-catch ke API routes yang belum ada | Rendah |
| 14 | Tambah input length limits ke admin login | Rendah |
| 15 | Implementasi Biteship API retry dengan backoff | Rendah |
| 16 | Konsolidasi Biteship base URL ke constants | Rendah |
| 17 | Admin logout server-side token revocation | Rendah |
| 18 | Tambah `app/global-error.tsx` | Rendah |

---

## CATATAN TAMBAHAN

### Zod Tidak Terdeklarasi di `package.json`

Zod v4.4.3 digunakan langsung di 5 file (checkout validation, shipping, payment, admin orders) tetapi **tidak dideklarasikan di `package.json`** — hanya ada sebagai transitive dependency. Ini adalah supply-chain risk. **Saran:** Tambahkan `zod` ke dependencies di `package.json`.

### Rate Limit IP Spoofing via `x-forwarded-for`

Rate limiting mengandalkan `x-forwarded-for` header pertama. Di Vercel ini aman (edge mengganti header). Di host lain, attacker bisa spoof IP untuk bypass rate limit. **Pastikan deployment menggunakan platform yang mengatur `x-forwarded-for` dengan benar.**
