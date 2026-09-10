# LAPORAN RISIKO FINANSIAL — FLAT-RATE FALLBACK ONGKIR LUAR JAWA

**Proyek:** D'Jaemo Jamur Krispi Ecommerce
**Tanggal:** 7 September 2026 — **Murni investigasi & kalkulasi, TANPA perubahan kode.**
**Data harga:** Real-time via Biteship API langsung (key live, origin toko Desa Pandantoyo, Bojonegoro `-7.32893,111.92316`), couriers `jne,jnt,sicepat`, dest koordinat kota besar per wilayah.

---

## 1. DEFINISI FALLBACK SAAT INI

**File:** `lib/services/shipping/constants.ts` → `lib/flatRateShipping.ts` → `lib/services/shipping/flatRateFallback.ts`

| Kategori | Provinsi/Kota yang masuk | Nilai |
|---|---|---|
| Jakarta | DKI JAKARTA (butuh prov DKI) | Rp15.000 |
| Bandung | JAWA BARAT | Rp17.000 |
| Surabaya | JAWA TIMUR | Rp19.000 |
| **Luar Jawa** | **semua sisanya — TANPA pembeda jarak** | **Rp55.000** |

**Pembeda berat (commit 62202c3):**
- Berlaku untuk SEMUA destination termasuk Luar Jawa: `getWeightMultiplier` (`lib/flatRateShipping.ts:20-27`): ≤1kg = 1× → ≤2kg = 1.5× → ≤3kg = 2× → tiap +1kg = +0.5×.
- Service multiplier: Reguler = 1×.

**Temuan penting (bug zona yang tidak disengaja):**
- `PROVINCE_ZONE` (`flatRateFallback.ts:13-17`) TIDAK memuat **Jawa Tengah, DI Yogyakarta, Banten**. Pengecekan keyword kota hanya `jakarta|bandung|surabaya`.
- ⟹ Kota seperti **Semarang, Solo, Purwokerto, Yogyakarta, Tangerang, Cilegon → jatuh ke "Luar Jawa" Rp55.000** padahal jarak Bojonegoro ke sana < 500 km. Ini overpricing pulau Jawa dalam kondisi fallback. (Bogor/Depok/Bekasi juga kena 55k karena tidak match keyword bandung.)
- **TIDAK ada pembeda jarak sama sekali untuk provinsi luar Jawa** — Sumatera, Kalimantan, Sulawesi, NTT, Maluku, Papua semua flat Rp55.000 (≤1kg).

---

## 2. HARGA ASLI BITESHIP vs FALLBACK Rp55.000

### 2a. Berat ≤ 1 kg (satu produk / belum bulk) — fallback Rp55.000 untuk semua

| Kota Tujuan | Termurah (courier) | Fallback | Selisih fallback vs asli |
|---|---|---|---|
| **Medan**, Sumut | Rp44.100 (sicepat reg) | Rp55.000 | **+Rp10.900 (+25%) — OVERPRICED** |
| **Pontianak**, Kalbar | Rp41.000 (jnt ez) | Rp55.000 | **+Rp14.000 (+34%) — OVERPRICED** |
| **Makassar**, Sulsel | Rp53.000 (jnt ez) | Rp55.000 | +Rp2.000 (+4%) — OVERPRICED |
| **Kupang**, NTT | Rp60.000 (jnt ez) | Rp55.000 | **−Rp5.000 (−8%) — RUGI** |
| **Ambon**, Maluku | Rp73.000 (jnt ez) | Rp55.000 | **−Rp18.000 (−25%) — RUGI** |
| **Jayapura**, Papua | Rp92.000 (jnt ez) | Rp55.000 | **−Rp37.000 (−40%) — RUGI** |

Catatan: harga identik untuk 21g / 72g / 500g / 1000g (tarif parcel Biteship flat ≤1 kg dari origin ini) — variasi berat produk asli (21–72g) TIDAK mengubah harga asli.

### 2b. Berat 2 kg — fallback Rp82.500 (1.5×)

| Kota | Termurah | Selisih |
|---|---|---|
| Medan | Rp88.200 | −6% |
| Pontianak | Rp82.000 | +1% |
| Makassar | Rp106.000 | **−22%** |
| Ambon | Rp146.000 | **−43%** |
| Jayapura | Rp184.000 | **−55%** |
| Kupang | Rp120.000 | **−31%** |

### 2c. Berat 3 kg — fallback Rp110.000 (2×)

| Kota | Termurah | Selisih |
|---|---|---|
| Medan | Rp132.300 | −17% |
| Pontianak | Rp123.000 | −11% |
| Makassar | Rp159.000 | **−31%** |
| Ambon | Rp219.000 | **−50%** |
| Jayapura | Rp276.000 | **−60%** |
| Kupang | Rp180.000 | **−39%** |

> **Kesimpulan arah risiko:**
> 1. **≤1 kg:** Sumatera/Kalimantan **ditagih lebih mahal** (konversi turun, bukan rugi tunai); **Maluku/Papua/NTT rugi tunai 8–40%** per order.
> 2. **>1 kg:** SEMUA wilayah Timur (dan Makassar) **rugi besar** — multiplier 1.5×/2× jauh di bawah kenaikan harga riil (riil naik ~2× per kg, fallback cuma 1.5×). Jayapura 3 kg rugi Rp166.000 (60%) per order.

---

## 3. APAKAH FALLBACK BISA DIPANTAU? — GAP KNOWN

**Hasil grep `isFallback|fallback_used|FALLBACK_USED` di `lib/*.ts`:**
- Flag `isFallback` ada, tapi **hanya ditampilkan ke UI** (label "Estimasi — dapat disesuaikan admin") dan **tidak pernah dipersist ke mana pun**:
  - `lib/services/shipping/getRates.ts:14,140-152` → flag ke ShippingProvider.
  - `lib/services/payment/checkoutValidation.ts:93,134,197,219,227` → dipakai cuma untuk memvalidasi metode fallback di create route.
- `console.error` hanya muncul bila Biteship HTTP non-ok (`biteship-rates/route.ts:189,206`), **bukan** saat fallback dipakai karena "tidak ada koordinat/area".
- `lib/services/audit-log.service.ts` **tidak punya event** untuk fallback shipping.

⟹ **GAP TERKONFIRMASI:** pemilik toko TIDAK dapat mengetahui dari data mana pun berapa banyak order yang memakai harga estimasi vs harga asli — karenanya juga tidak tahu berapa total kerugian akibat fallback. Satu-satunya jejak adalah order → kolom `shipping_cost` (berisi harga fallback), tanpa penanda `is_fallback`.

---

## 4. TINGKAT KEGAGALAN GEOCODING ALAMAT PELOSOK LUAR JAWA

Diuji dengan logika **persis** `lib/services/address/geocoding.ts` (structured query state+county+city, fallback county-only, User-Agent sudah benar, throttle 1.1 s, timeout 6 s) terhadap 9 kecamatan pelosok realistis:

| Provinsi | Kecamatan | Hasil |
|---|---|---|
| Kalimantan Tengah / Kapuas | Mantangai | ✅ |
| Kalimantan Tengah / Barito Utara | Gunung Timang | ✅ (via county-only fallback) |
| Papua Pegunungan / Jayawijaya | Walesi | ✅ |
| Papua Pegunungan / Pegunungan Bintang | Oksibil | ✅ |
| Maluku Utara / Halmahera Barat | Jailolo Selatan | ✅ (via county-only fallback) |
| Maluku Utara / Kepulauan Sula | Sanana | ✅ |
| NTT / Timor Tengah Utara | Insana Utara | ✅ (via county-only fallback) |
| Papua / Merauke | Ulilin | ✅ (via county-only fallback) |
| Maluku / Maluku Tengah | Amahai | ✅ |

**Hasil sample: 9/9 (100%) berhasil.**

Catatan kehati-hatian untuk angka real (estimasi):
- Beberapa kasus hanya lolos lewat **level-county** fallback (bukan kecamatan persis) — koordinatnya titik kabupaten, bukan kecamatan. Ini cukup untuk lookup Biteship (koordinat kabupaten saja sudah memberi harga asli), tapi koordinat bisa agak jauh dari alamat pelanggan.
- Risiko sisa yang membuat fallback tetap terpakai di produksi: Nominatim down/maintenance, rate-limit (throttle per-instance; multi-instance serverless bisa saling timpa), nama regency baru yang belum ada di OSM.
- **Estimasi real: ~75–95% alamat luar Jawa dapat koordinat. Sisanya jatuh ke flat fallback** — dan karena itu zona fallback harus dihargai aman.

---

## 5. REKOMENDASI

### 5.1 Pecah fallback per-zona (angka usulan berbasis data harga asli di atas)

Data termurah aktual (≤1 kg): Sumatera/Kalimantan 41–52k, Sulawesi 53k, NTT 60k, Maluku 73k, Papua 92k. Fallback adalah jaring pengaman → **hargai sedikit DI ATAS termurah** (jangan pernah di bawah, karena pelosok lebih mahal daripada ibu kota provinsi):

| Zona (usulan) | Cakupan | Nilai ≤1 kg |
|---|---|---|
| Jakarta | DKI Jakarta | Rp15.000 (tetap) |
| Bandung | Jawa Barat | Rp17.000 (tetap) |
| Surabaya | Jawa Timur | Rp19.000 (tetap) |
| **Jawa Dekat** (BARU) | Jawa Tengah, DI Yogyakarta, Banten, kota Jabar/Jatim non-keyword (Bogor/Tangerang/Semarang/Jogja dll.) | **Rp30.000** |
| **Sumatera & Kalimantan** | semua prov Sumatera + Kalimantan | **Rp50.000** |
| **Sulawesi & Nusa Tenggara** | Sulawesi + Bali/NTB/NTT | **Rp65.000** |
| **Maluku** | Maluku, Maluku Utara | **Rp80.000** |
| **Papua** | Papua, Papua Barat, Papua Pegunungan, dst. | **Rp100.000** |

Alasan: menghapus underpricing Timur (Maluku/Papua rugi 25–40% sekarang), sekaligus menurunkan overpricing Sumatera/Kalimantan (55k→50k) dan memperbaiki overpricing Jawa luar keyword (55k→30k).

### 5.2 Perbaiki multiplier berat

Harga riil parcel naik **~2× per kg** (Medan 44,1k→88,2k; Jayapura 92k→184k). Usulan: berat ≤2 kg = **2×** (bukan 1.5×), ≥2 kg tetap progresif (+0.5×/kg atau 2.5×). Tanpa ini, order 2–3 kg selalu rugi di zona Timur.

### 5.3 Tambah logging eksplisit "fallback_used" (rekomendasi inti)

**Ya, wajib ditambahkan** supaya kepemilikan tahu berapa order yang memakai estimasi. Cara paling murah tanpa ubah schema:
- Definisikan event baru di `AuditLogService.events` (mis. `shipping.fallback_used`).
- Tulis ke `audit_logs` (metadata JSONB — tanpa migrasi) setiap kali `validateCheckoutRequest` memutuskan memakai fallback: `{orderId?, destination: {province, city}, weightGrams, fallbackFee, reason: "no_coords|biteship_error|area_rejected"}`.
- Tambahkan penanda pada respon create (`isFallback`) dan/atau kolom penanda di laporan order, agar bisa dihitung rugi agregat: `SUM(shipping_cost) WHERE fallback=1` per zona.

### 5.4 Urgensi deploy

Catatan dari audit sebelumnya: versi ter-deploy (origin/main) masih memakai jalur `area_id` → Biteship tolak `40001010` → **fallback kepakai hampir SEMUA order luar Jawa saat ini di produksi**. Dampak finansial langsung: setiap order Maluku/Papua/NTT yang lolos dengan harga 55k = potensi rugi 5–37 ribu. Deploy fix koordinat (`d423d76`) akan menurunkan frekuensi fallback drastis; rehabilitasi zona & logging di atas menutup sisa risiko.

---

## RINGKASAN EKSEKUTIF

- Fallback 55k **tidak aman**: overpricing Sumatera/Kalimantan (konversi turun) **dan** underpricing Maluku/Papua/NTT (rugi tunai 8–40% per order, makin besar di berat ≥2 kg).
- Zona tidak ada pembeda jarak; bahkan Jateng/Jogja/Banten ikut kena 55k (overpricing Jawa).
- Fallback **tidak tercatat di mana pun** → kepemilikan buta terhadap besaran kerugian. Perlu event audit `fallback_used`.
- Geocoding luar Jawa **sangat baik** saat ini (sample 9/9 berhasil), sehingga dengan deploy fix koordinat, frekuensi fallback seharusnya rendah; tapi zona fallback tetap harus dihargai aman sebagai jaring.
- Angka data mentah tersimpan (temp, luar repo): `biteship-remote-prices.mjs`, `biteship-2kg.mjs`, `geocode-test.mjs`.