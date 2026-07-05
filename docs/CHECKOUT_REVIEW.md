# Checkout Feature Review

## Executive Summary

Checkout flow **exists and functions end-to-end** from cart → checkout form → shipping calculation → Midtrans payment → callback → status update. However, it has **critical gaps** compared to the specified requirements:

- **6 form fields are missing** (provinsi, kota, kecamatan, kode pos, kurir, payment method selection)
- **Biteship courier integration is absent** from the checkout flow (only flat-rate shipping is used)
- **Prices are calculated client-side** and trusted by the server without validation — vulnerable to manipulation
- **No database transactions** — partial failures can leave orphan records
- **Success page reads from localStorage**, not the actual database — unreliable

**Overall assessment:** Functional for a demo/MVP but **not safe for real customers** due to price manipulation vulnerability and data reliability issues.

---

## Files Involved

| File | Role |
|------|------|
| `app/checkout/page.tsx` | Checkout form, shipping selection, payment initiation |
| `app/checkout/success/page.tsx` | Post-payment success display |
| `app/checkout/failed/page.tsx` | Post-payment failure display |
| `app/api/shipping/route.ts` | Flat-rate shipping calculator |
| `app/api/biteship-rates/route.ts` | Biteship proxy (unused in checkout) |
| `app/api/payment/route.ts` | Order creation + Midtrans transaction |
| `app/api/orders/[id]/callback/route.ts` | Midtrans payment notification webhook |
| `app/api/orders/[id]/route.ts` | Single order retrieval |
| `app/cart/page.tsx` | Cart page (precedes checkout) |
| `components/cart/CartProvider.tsx` | Cart state + localStorage persistence |
| `lib/order.ts` | Order ID generation (DJ-xxxxx-...) |
| `lib/flatRateShipping.ts` | Flat rate shipping logic (env-based rates) |
| `lib/midtrans.ts` | Midtrans Snap + CoreApi init |
| `lib/supabase.ts` | Server-side Supabase (service role) |
| `app/admin/dashboard/page.tsx` | Admin order management (Biteship handling) |

---

## Step-by-Step Analysis

---

### Langkah 1: Customer membuka halaman Checkout

**Status:** ✅ Ada dan berjalan

**File:** `app/checkout/page.tsx`

**Temuan:**

- Halaman menggunakan `"use client"` — wajib karena interaktif
- Mengambil data cart dari `useCart()` (context + localStorage)
- Membuat `orderId` via `buildOrderId(items)` — ID bersifat prediktif dan mengandung data keranjang
- `ORDER_STORAGE_KEY` didefinisikan sebagai konstanta lokal di dalam komponen (line 28) — seharusnya di constants file
- Tidak ada pengecekan apakah user sudah pernah checkout (duplicate submission prevention terbatas pada `isCreating` flag)
- Tidak memeriksa stok produk sebelum menampilkan halaman checkout

**Risiko:**
- 🟠 **Order ID prediktif**: `DJ-lxy6z-produk-1-2-produk-3-1` — bisa ditebak, bocorin komposisi keranjang
- 🟡 **Tidak ada duplicate order detection**: Jika user refresh halaman checkout, order ID baru akan dibuat

---

### Langkah 2: Customer mengisi data diri

**Status:** ⚠️ Sebagian ada, sebagian tidak

**Form fields di spec vs reality:**

| Field | Spec | Reality | Status |
|-------|------|---------|--------|
| Nama | ✅ | ✅ Ada | OK |
| Nomor WhatsApp | ✅ | ❌ Hanya "No. Telepon" (generic tel input) | ❌ **Missing** |
| Email | ✅ | ✅ Ada | OK |
| Alamat | ✅ | ✅ Ada (textarea tunggal) | ⚠️ Parsing alamat dilakukan client-side via `parseDestinationFromAddress` |
| Provinsi | ✅ | ❌ **Tidak ada** field khusus | ❌ **Missing** |
| Kota | ✅ | ❌ **Tidak ada** field khusus | ❌ **Missing** |
| Kecamatan | ✅ | ❌ **Tidak ada** field khusus | ❌ **Missing** |
| Kode Pos | ✅ | ❌ **Tidak ada** field khusus | ❌ **Missing** |

**Temuan:**

- **6 dari 8 field tidak ada.** Alamat digabung dalam satu textarea tanpa struktur. Ini menyebabkan:
  - Provinsi tidak bisa diekstrak secara reliable
  - Kota tidak bisa diekstrak — padahal Biteship butuh origin/destination city
  - Kode pos tidak dikumpulkan — padahal wajib untuk Biteship dan shipping
  - Nomor WhatsApp tidak dibedakan dari nomor telepon biasa

- `parseDestinationFromAddress()` di `lib/flatRateShipping.ts:17` hanya bisa mengenali Jakarta, Bandung, Surabaya. Kota lain masuk "Luar Jawa".

- `validateEmail` di line 70 menggunakan regex sederhana — validasi dasar OK, tapi bisa bypass (contoh: `a@b.c` lolos)

- **Tidak ada validasi nomor WhatsApp** (format, panjang minimal, kode negara)

**Validasi form saat submit (line 63-68):**
```typescript
const isFormValid =
  customerName.trim().length > 0 &&
  customerEmail.trim().length > 0 &&
  customerPhone.trim().length > 0 &&
  customerAddress.trim().length > 0 &&
  items.length > 0;
```
Validasi hanya cek **ada isi atau tidak**. Tidak ada validasi format/tipe.

**Risiko:**
- 🔴 **Data alamat tidak terstruktur**: Tidak bisa diintegrasikan dengan Biteship atau shipping API manapun yang membutuhkan komponen alamat spesifik
- 🟠 **No WhatsApp validation**: User bisa isi nomor palsu, merchant tidak bisa kontak untuk konfirmasi
- 🟠 **Alamat tidak bisa diparsing**: Shipping fee jadi flat "Luar Jawa" untuk alamat yang tidak mengandung "jakarta", "bandung", atau "surabaya"
- 🟡 **Tidak ada autocomplete/validasi real-time**: User baru tahu error setelah klik submit

---

### Langkah 3: Customer memilih kurir

**Status:** ❌ Tidak ada di checkout

**Temuan:**

- **Tidak ada pilihan kurir** di halaman checkout. Yg ada hanya pilihan **layanan pengiriman** (Reguler/Express/Economy) yang merupakan flat-rate tiers
- `app/api/biteship-rates/route.ts` sudah ada dan berfungsi — dipanggil dari **admin dashboard** untuk cetak resi, **bukan dari checkout**
- Checkout menggunakan `POST /api/shipping` yang menghitung flat rate berdasarkan parsing alamat

**Risiko:**
- 🟠 **Biteship terintegrasi separuh**: API proxy Biteship sudah dibuat (dengan hardcoded API key), user bayar ongkir flat rate, tapi admin nantinya cetak resi via Biteship — **ada selisih biaya** antara yg dibayar customer dan yg dibayar merchant ke Biteship
- 🟡 **Tidak ada opsi kurir untuk customer**: Customer tidak bisa pilih JNE/SiCepat/J&T dll

---

### Langkah 4: Sistem mengambil ongkir dari Biteship

**Status:** ❌ Tidak menggunakan Biteship

**Temuan:**

- Biteship **tidak dipanggil** dari checkout flow sama sekali
- Shipping fee dihitung via `POST /api/shipping` → `lib/flatRateShipping.ts` → flat rate berdasarkan parsing alamat
- `POST /api/biteship-rates` hanya digunakan dari admin dashboard untuk cetak resi fisik

**Yang sebenarnya terjadi:**
```
Checkout → POST /api/shipping → parseDestinationFromAddress() → calculateFlatRateShipping()
→ Return { destination: "Jakarta", service: "Reguler", shippingFee: 15000 }
```

**Risiko:**
- 🟠 **Ongkir tidak real**: Harga flat rate tidak mencerminkan ongkir sebenarnya. Merchant bisa rugi (bayar Biteship lebih mahal dari yang dibayar customer) atau customer overcharge
- 🟡 **Duplikasi shipping logic**: Ada dua file shipping (`lib/flatRateShipping.ts` dan `lib/shipping.ts`) yang tidak konsisten

---

### Langkah 5: Customer memilih layanan pengiriman

**Status:** ✅ Ada

**Temuan:**

- Dropdown dengan 3 opsi: Reguler (×1), Express (×1.4), Economy (×0.95)
- Service multiplier diterapkan ke flat rate
- Default: Reguler
- Nilai multiplier di-hardcode di `lib/flatRateShipping.ts`

**Risiko:**
- 🟡 Tidak ada deskripsi perbedaan layanan (estimasi waktu, guarantee)
- 🟡 Default ke Reguler tanpa rekomendasi

---

### Langkah 6: Sistem menghitung subtotal, ongkir, total pembayaran

**Status:** ⚠️ Ada tapi ada masalah

**Perhitungan:**

| Komponen | Sumber | Cara |
|----------|--------|------|
| `subtotal` | client `useCart()` | `items.reduce((total, item) => total + item.product.price * item.quantity, 0)` |
| `shippingFee` | `POST /api/shipping` | Flat rate dari server (tapi dikirim ke payment API sebagai input client) |
| `totalAmount` | client | `subtotal + shippingFee` |

**Temuan:**

- **Subtotal dan shippingFee dikirim ke `/api/payment` sebagai input client.** Server tidak merekalkulasi dari database.
- `payloadAmount` (line 104-107 di payment route) dihitung tapi **tidak pernah digunakan** — dead code
- Shipping fee di-fetch via API dengan debounce 300ms, ada visual loading state (`isCalculating`)
- Di halaman cart, debounce 500ms — inkonsisten dengan checkout (300ms)

**Risiko:**
- 🔴 **Price manipulation**: Client bisa mengirim `subtotal: 0, shippingFee: 0` ke `/api/payment` — server akan memprosesnya tanpa validasi
- 🟠 **Race condition**: Jika user mengirim form sebelum shipping fee selesai dihitung, `shippingFee` tetap 0

---

### Langkah 7: Customer memilih pembayaran Midtrans

**Status:** ⚠️ Sebagian ada

**Temuan:**

- **Tidak ada pilihan metode pembayaran.** Langsung redirect ke Midtrans Snap (yang menampilkan pilihan metode di sisi Midtrans)
- Callback URL hardcoded ke `/checkout/success?order_id=${orderId}` — hanya `finish` callback, tidak ada `error` atau `pending` callback
- Midtrans environment ditentukan oleh `process.env.NODE_ENV === "production"` — berbahaya karena staging build dengan `NODE_ENV=production` akan menggunakan production Midtrans
- QRIS payment flow ada di halaman success (`order.qrCodeUrl`) tapi **tidak pernah diisi** — endpoint `/api/qrisly` tidak dipanggil dari checkout

**Risiko:**
- 🟠 **Midtrans environment risk**: Jika ada staging di Vercel production deployment, pembayaran staging akan menggunakan Midtrans production
- 🟡 **Hanya satu callback URL**: Tidak ada penanganan untuk `error` atau `pending` redirect
- 🟢 **QRIS code path mati**: QR code di halaman success tidak akan muncul

---

### Langkah 8: Order disimpan ke database

**Status:** ⚠️ Ada, tapi tidak aman

**File:** `app/api/payment/route.ts`

**Alur penyimpanan:**

```
1. Upsert customer by email → get customer.id
2. Insert order dengan client-supplied values → get order.id
3. Insert order_items
4. Create Midtrans transaction
5. Update order.transaction_id = token
```

**Temuan:**

- **Tidak ada database transaction.** Jika step 3 gagal (insert order_items), order sudah terlanjur tersimpan (orphan record). Jika step 4 gagal, order pending ada di DB tanpa link ke Midtrans.
- **Customer upsert by email** tanpa verifikasi — siapa pun bisa pakai email orang lain
- `token` dari Midtrans disimpan di kolom `transaction_id` — ini token, bukan transaction ID. Nomenklatur salah.
- Order items menggunakan price dari `item.product.price` — yang berasal dari **client cart data**, bukan query ke database
- `console.log` di line 109-118 menampilkan PII (nama, email, alamat customer)
- `console.log` di line 139 menampilkan full Midtrans payload (termasuk customer_details)

**Risiko:**
- 🔴 **Orphan records**: Jika payment creation gagal setelah order insert, ada order pending tanpa payment link
- 🔴 **No price validation**: Semua data harga dari client
- 🟠 **PII in logs**: Nama, email, nomor telepon, alamat customer tercatat di log server
- 🟠 **No deduplication**: Jika user mengirim request 2x, bisa tercipta 2 order + 2 customer

---

### Langkah 9: Payment dibuat

**Status:** ✅ Ada dan berjalan

**Temuan:**

- `snap.createTransaction(midtransPayload)` berhasil membuat transaksi Midtrans
- Midtrans payload mencakup `item_details` (termasuk ongkir sebagai item "Ongkos Kirim")
- `transaction_details.gross_amount` menggunakan `totalAmount` dari client (price manipulation risk)
- Callback URL hanya `finish` — tidak ada `error` atau `pending`

**Risiko:**
- 🟠 Midtrans callback redirect hanya handle success case
- 🟡 `gross_amount` unchecked — bisa mismatch dengan actual item_details sum

---

### Langkah 10: Customer diarahkan ke pembayaran

**Status:** ✅ Ada dan berjalan

**Temuan:**

- Redirect ke Midtrans Snap payment page via `window.location.href = paymentData.redirect_url`
- Setelah redirect, halaman checkout asal ditinggalkan — user tidak akan kembali ke halaman yang sama
- Sebelum redirect, orderPayload disimpan ke localStorage (`djaemo-last-order`)

**Risiko:**
- 🟡 **Cart tidak clear**: Items tetap ada di keranjang setelah payment redirect. User harus kembali secara manual dan keranjang masih penuh
- 🟡 **Order data di localStorage**: Setelah redirect, data order masih di localStorage. Jika user membuka `/checkout/success` langsung tanpa data di localStorage, akan muncul "Pesanan Tidak Ditemukan"

---

### Langkah 11: Setelah pembayaran berhasil — verifikasi data order

**Status:** ⚠️ Ada, tapi tidak akurat

**Dua jalur setelah bayar:**

1. **Midtrans redirect** → `/checkout/success?order_id=...`
2. **Midtrans callback (server-side)** → `POST /api/orders/[id]/callback`

#### Success Page (`/checkout/success`)

**Temuan:**

- **Membaca data dari localStorage**, bukan dari database API
- Data yang ditampilkan: orderId, status, customer info, items, subtotal
- `order.qrCodeUrl` ditampilkan tapi **selalu null/undefined** karena tidak pernah diisi dari checkout flow
- Status selalu "Berhasil dibuat" (dari localStorage) — **tidak mencerminkan status real dari Midtrans callback**
- Data bisa di-view oleh siapa saja yang membuka halaman — tidak ada proteksi

**Risiko:**
- 🔴 **localStorage !== database**: Data di localStorage bisa outdated, termanipulasi, atau hilang. Success page seharusnya fetch data dari API.
- 🟠 **QRIS tidak pernah muncul**: Selalu fallback ke "QRIS belum tersedia"
- 🟠 **Tidak verifikasi status pembayaran**: Page tidak cek ke Midtrans atau API untuk memastikan status pembayaran aktual

#### Midtrans Callback (`POST /api/orders/[id]/callback`)

**Temuan:**

- Signature verification dengan HMAC-SHA512 ✅
- **Fallback ke `body.transaction_status` jika Midtrans API gagal** — attacker bisa manipulasi status jika koneksi ke Midtrans timeout
- Callback membaca `body.order_id` (dari Midtrans), **tidak menggunakan `params.id` dari URL** — endpoint bisa dipanggil dengan URL apapun
- Update menggunakan `.eq("order_id", ordinal)` — kolom `order_id` di database adalah string seperti `DJ-xxxx`, bukan UUID primary key
- `updated_at` di-set manual, bukan trigger

**Risiko:**
- 🟠 **Fallback bypasses verification**: Jika `core.transaction.status()` gagal, status dari body (yang bisa dimanipulasi) digunakan
- 🟠 **No idempotency**: Midtrans bisa mengirim multiple callback untuk event yang sama (retry mechanism). Callback bisa double-process.
- 🟡 **URL parameter ignored**: `params.id` tidak digunakan — order lookup berdasarkan body
- 🟢 **Status mapping terbatas**: Hanya `settlement` → `paid`, `pending` → `pending`, `deny/cancel/expire` → `failed`. Tidak ada mapping untuk `capture`, `authorize`, `chargeback`, `refund`

---

## Data Integrity: End-to-End Tracing

Berikut tracing data dari input customer sampai tersimpan di database:

```
Customer Input
  ├── customerName  →  JSON body  →  customers.name
  ├── customerEmail →  JSON body  →  customers.email (upsert key)
  ├── customerPhone →  JSON body  →  customers.phone
  ├── customerAddress → JSON body → customers.address
  ├── subtotal (client-generated)  →  orders.subtotal ← 🔴 UNVALIDATED
  ├── shippingFee (client-state)   →  orders.shipping_fee ← 🔴 UNVALIDATED
  ├── destination  (from parseDestinationFromAddress) → orders.destination
  ├── shippingService (from dropdown) → orders.shipping_service
  └── items[*].product.price (from localStorage) → order_items.price ← 🔴 UNVALIDATED
```

**Semua nilai numerik berasal dari client-side state (localStorage/cart context), bukan dari database.**

---

## Ringkasan Masalah Berdasarkan Prioritas

### 🔴 Kritis (should block production deployment)

| # | Masalah | File | Dampak |
|---|---------|------|--------|
| 1 | **Price manipulation** — subtotal, shippingFee, item prices dari client, tidak divalidasi server-side | `app/api/payment/route.ts:33-133` | Customer bisa bayar Rp 0 atau nominal berapa pun |
| 2 | **No database transaction** — order terlanjur insert meski payment gagal | `app/api/payment/route.ts:54-86` | Orphan records, data inconsistent |
| 3 | **Midtrans callback fallback bypasses verification** — jika `core.transaction.status()` gagal, pakai `body.transaction_status` | `app/api/orders/[id]/callback/route.ts:37-41` | Attacker bisa spoof payment status jika Midtrans timeout |
| 4 | **Success page reads localStorage, not API** — data tidak real-time, bisa outdated/manipulasi | `app/checkout/success/page.tsx:17-28` | Customer melihat data yang tidak akurat |

### 🟠 Tinggi (should fix before public launch)

| # | Masalah | File | Dampak |
|---|---------|------|--------|
| 5 | **6 form fields missing** — provinsi, kota, kecamatan, kode pos, nomor WhatsApp, kurir | `app/checkout/page.tsx:199-254` | Data alamat tidak lengkap untuk shipping; Biteship tidak bisa diintegrasikan |
| 6 | **Biteship tidak terintegrasi di checkout** — hanya flat rate, padahal API proxy sudah ada | `app/checkout/page.tsx:33-60` vs `app/api/biteship-rates/route.ts` | Ongkir tidak real; selisih biaya antara customer dan merchant |
| 7 | **PII di-log ke server console** — nama, email, telepon, alamat, full Midtrans payload | `app/api/payment/route.ts:109-118,139` | Privacy violation, data leak via logs |
| 8 | **Cart tidak clear setelah payment** — keranjang tetap penuh setelah checkout | `app/checkout/page.tsx:119-140` | UX buruk, user bingung |
| 9 | **No idempotency on callback** — Midtrans bisa kirim multiple callback | `app/api/orders/[id]/callback/route.ts:65-72` | Order status bisa ter-update ganda |
| 10 | **Midtrans environment dari NODE_ENV** — staging build bisa pakai production Midtrans | `lib/midtrans.ts:17` | Pembayaran staging mengganggu production |
| 11 | **Callback URL parameter ignored** — `params.id` tidak dipakai | `app/api/orders/[id]/callback/route.ts:8,18` | Endpoint tidak melakukan autentikasi berbasis URL |

### 🟡 Sedang (should fix in next sprint)

| # | Masalah | File | Dampak |
|---|---------|------|--------|
| 12 | **Order ID prediktif** — mengandung timestamp + item detail | `lib/order.ts:3-6` | Bocorin komposisi keranjang, bisa ditebak |
| 13 | **Hanya `finish` callback** — tidak ada penanganan `error` dan `pending` redirect | `app/api/payment/route.ts:134-137` | User error/pending tidak diarahkan dengan baik |
| 14 | **Address parsing hanya 3 kota** — Jakarta/Bandung/Surabaya, sisanya "Luar Jawa" | `lib/flatRateShipping.ts:17-36` | Ongkir tidak akurat untuk kota besar lain |
| 15 | **Duplicate shipping logic** — dua file shipping (satu tidak terpakai) | `lib/shipping.ts` vs `lib/flatRateShipping.ts` | Bikin bingung developer baru |
| 16 | **Token disimpan sebagai transaction_id** — nomenklatur salah | `app/api/payment/route.ts:146` | Bikin bingung saat debugging |
| 17 | **Debounce timeout inkonsisten** — cart 500ms, checkout 300ms | `app/cart/page.tsx:30` vs `app/checkout/page.tsx:59` | Perilaku tidak konsisten |
| 18 | **QRIS code path mati** — endpoint `/api/qrisly` tidak pernah dipanggil | `app/checkout/success/page.tsx:147-154` | Fitur QRIS tidak muncul ke customer |

### 🟢 Rendah (nice to have)

| # | Masalah | File | Dampak |
|---|---------|------|--------|
| 19 | `ORDER_STORAGE_KEY` didefinisikan di dalam komponen (dua kali) | `app/checkout/page.tsx:28`, `app/checkout/success/page.tsx:10` | Seharusnya constants file |
| 20 | `payloadAmount` dihitung tapi tidak dipakai | `app/api/payment/route.ts:104-107` | Dead code |
| 21 | Unused imports (`calculateFlatRateShipping`, `parseDestinationFromAddress`) di cart page | `app/cart/page.tsx:8` | Dead imports |
| 22 | Tidak ada input autocomplete/validation real-time di form checkout | `app/checkout/page.tsx:201-253` | UX lebih baik dengan validasi real-time |
| 23 | Tidak ada loading skeleton — hanya teks "Membuat transaksi..." | `app/checkout/page.tsx:288` | UX bisa ditingkatkan |

---

## Additional Findings

### Input Validation Gaps

| Field | Validation | Missing |
|-------|-----------|---------|
| Nama | Hanya `trim().length > 0` | Min/max length, tidak boleh angka |
| Email | Regex dasar + `trim().length > 0` | Validasi domain, MX record check (server-side) |
| Telepon | Hanya `trim().length > 0` | Tidak ada validasi format telepon Indonesia (`08xx`, `+62`, min 10 digit) |
| Alamat | Hanya `trim().length > 0` | Tidak ada validasi alamat (min karakter, tidak boleh hanya angka) |
| Provinsi | ❌ Field tidak ada | — |
| Kota | ❌ Field tidak ada | — |
| Kecamatan | ❌ Field tidak ada | — |
| Kode Pos | ❌ Field tidak ada | — |

### Error Handling Gaps

| Skenario | Handling | Masalah |
|----------|----------|---------|
| Midtrans API timeout | ✅ Ada try-catch | Error message di-log, response JSON error |
| Supabase connection error | ✅ Ada try-catch | Error message dikembalikan ke client |
| Double submit | ⚠️ `isCreating` flag | Hanya mencegah client-side, tidak mencegah duplicate API call |
| Network error saat fetch shipping | ✅ Ada catch block | `shippingFee` di-set ke 0 |
| Callback Midtrans duplicate | ❌ Tidak ada | Tidak ada idempotency key |

### Loading State Gaps

| Komponen | Loading State | Catatan |
|----------|--------------|---------|
| Shipping fee | ✅ `isCalculating` | Menampilkan "Menghitung..." |
| Payment creation | ✅ `isCreating` | Button disabled + "Membuat Transaksi..." |
| Success page | ✅ `loading` state | Text "Sedang memuat..." |
| Failed page | ✅ `loading` state | Text "Mohon tunggu" |
| **Cart clear** | ❌ **Tidak ada** | Tidak ada indikasi cart akan/ sudah clear |
| **Post-payment redirect** | ❌ **Tidak ada** | Redirect langsung tanpa loading/confirmation |

---

## Kesimpulan

Checkout flow secara garis besar **berfungsi tapi tidak aman**. Masalah paling kritis adalah **price manipulation vulnerability** — semua data harga berasal dari client tanpa validasi server-side. Ini membuat fitur checkout tidak bisa digunakan di production tanpa risiko finansial.

Selain itu, ada **gap arsitektural** signifikan antara spesifikasi yang diminta dan implementasi aktual:
- Form checkout kekurangan 6 dari 8 field yang diminta
- Biteship tidak terintegrasi di checkout (hanya di admin dashboard)
- Tidak ada mekanisme untuk mencegah double order atau data inconsistency

**Rekomendasi utama:** Sebelum production launch, harus ada (1) server-side price validation, (2) database transactions, (3) Biteship integration di checkout, dan (4) restrukturisasi form alamat dengan field-field terpisah.
