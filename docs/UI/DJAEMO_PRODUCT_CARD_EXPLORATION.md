# D'Jaemo — Product Card Exploration

> Versi: 1.0  
> Tanggal: 2026-06-30  
> Acuan: `DJAEMO_BRAND_DNA.md`, `DJAEMO_PRODUCT_CARD_CONCEPT.md`, `PREMIUM_DESIGN_GUIDE.md`  
> Status: **Eksplorasi Konsep** — tiga pendekatan berbeda untuk Product Card D'Jaemo

---

## Daftar Isi

1. [Pendahuluan — Mengapa Eksplorasi Ini Penting](#1-pendahuluan)
2. [Concept A — The Warm Frame](#2-concept-a--the-warm-frame)
3. [Concept B — The Hero Card](#3-concept-b--the-hero-card)
4. [Concept C — The Natural Canvas](#4-concept-c--the-natural-canvas)
5. [2-Second Test — Perbandingan](#5-2-second-test)
6. [Purchase Psychology](#6-purchase-psychology)
7. [Mobile Experience](#7-mobile-experience)
8. [Photo Strategy](#8-photo-strategy)
9. [CTA Strategy](#9-cta-strategy)
10. [White Space Analysis](#10-white-space-analysis)
11. [Anti-Marketplace Check](#11-anti-marketplace-check)
12. [Emotional Test](#12-emotional-test)
13. [Brand Test](#13-brand-test)
14. [Comparison Table](#14-comparison-table)
15. [Final Recommendation](#15-final-recommendation)

---

## 1. Pendahuluan

### Mengapa Eksplorasi Ini Penting

Product Card adalah **touchpoint paling sering dilihat** oleh calon pelanggan D'Jaemo. Di halaman produk, user melihat puluhan card dalam hitungan detik. Setiap card harus kompetitif — bukan dalam arti "yang paling cantik," tetapi dalam arti **yang paling efektif mengubah scrolling menjadi klik.**

Eksplorasi ini menyajikan tiga konsep yang berbeda secara fundamental. Bukan variasi dari satu ide yang sama, tetapi tiga filosofi berbeda tentang bagaimana produk, informasi, dan aksi berinteraksi dalam sebuah card.

### Prinsip yang Tidak Bisa Ditawar

Apapun konsep yang dipilih, prinsip ini tetap berlaku:

1. Produk adalah bintang — tidak boleh ada elemen yang mengalahkannya
2. Tidak boleh terasa seperti marketplace — nol toleransi
3. Harga harus terlihat dalam 1 detik — tanpa effort
4. CTA harus jelas — tanpa hover, tanpa scroll
5. Wajib mobile-friendly — 60%+ traffic dari layar kecil

---

## 2. Concept A — The Warm Frame

### Nama Konsep

**The Warm Frame** — Bingkai Hangat

### Feeling

Seperti melihat produk yang dipajang di etalase kaca dengan pencahayaan sempurna. Produk diletakkan di dalam "bingkai" dengan padding yang generous, seperti karya seni yang dipamerkan di galeri.

Tenang, premium, percaya diri. Tidak perlu teriak — produk cukup menarik tanpa bantuan.

### Layout

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│           ┌──────────┐           │
│           │          │           │
│           │ PRODUK   │           │  aspect-square
│           │ (contain)│           │  p-8 padding
│           │          │           │  bg-surface-dark (krem)
│           └──────────┘           │
│                                  │
├──────────────────────────────────┤
│                                  │
│  Nama Produk              [250g] │  p-5
│  Rp25.000                        │
│                                  │
│  ┌──────────────────────────────┐│
│  │        Lihat Detail →        ││  primary button
│  └──────────────────────────────┘│
│                                  │
└──────────────────────────────────┘
     rounded-2xl, bg-white, border-primary/10, shadow-sm
```

### Visual Hierarchy

1. **Foto produk** — sentered dalam bingkai persegi dengan padding lebar. Produk tidak dipotong, utuh.
2. **Nama produk** — headline kedua setelah foto, semibold.
3. **Harga** — bold, emas, sejajar dengan nama atau tepat di bawah.
4. **Weight badge** — aksen kecil di pojok kanan nama.
5. **CTA** — full-width di bagian bawah, taktis.

### Photography

`object-contain` di dalam `aspect-square` dengan `p-8`. Produk utuh, tidak terpotong. Background surface-dark (#f5ebe0) memberi kontras tanpa mengalihkan. Produk difoto dengan lighting natural dari kiri atas, background putih bersih di foto asli — sehingga dalam container cokelat krem, produk "melayang" dengan elegant.

### CTA

"Lihat Detail →" — ajakan hangat, bukan perintah. Arrow memberi arah. Full-width primary button agar mudah diklik di mobile.

### Whitespace

**Paling generous dari tiga konsep.** Padding 20px di body, 32px di image area. Antara image dan body dipisahkan oleh border image. Card memiliki "zona tenang" yang jelas.

### Typography

Nama: `text-base sm:text-lg font-semibold text-primary` — hangat, terbaca.  
Price: `text-xl sm:text-2xl font-bold text-secondary` — dominan, emas, percaya diri.  
CTA: `text-sm font-semibold` — bersih, fungsional.

### Keunggulan

- Premium feeling paling kuat — padding generous = sinyal mahal
- Produk utuh, tidak terpotong — transparan, jujur
- Whitespace melimpah — tidak sesak, tidak seperti marketplace
- CTA full-width — mudah diakses mobile
- Cocok untuk fotografi produk berkualitas tinggi

### Kelemahan

- Produk terlihat lebih kecil karena padding
- Kurang "menggoda" — terlalu sopan, kurang urgensi visual
- Di grid dengan banyak card, padding bisa membuat produk terlihat "hilang"
- Membutuhkan foto produk yang sangat kuat (close-up, detail tekstur jelas)

### Cocok untuk

Brand yang sudah mapan, percaya diri, tidak perlu trik. D'Jaemo dalam fase "established premium."

### Premium Score

**9/10** — Padding menciptakan kesan eksklusif yang kuat.

### Conversion Score

**7/10** — Terlalu sopan untuk konversi agresif. Tapi untuk audiens premium, ini ideal.

---

## 3. Concept B — The Hero Card

### Nama Konsep

**The Hero Card** — Card Pahlawan

### Feeling

Seperti melihat iklan produk di majalah mode. Image mendominasi penuh, teks muncul di atas gambar dengan overlay lembut. Drama, percaya diri, modern. Tidak takut menjadi pusat perhatian.

Berani, kontemporer, sedikit lebih "berisik" dari konsep lain, tapi masih dalam batas premium. Terinspirasi dari Apple product cards dan fashion e-commerce.

### Layout

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│                                  │
│       ██████████████████         │
│       ██              ██         │  ~85% card height
│       ██   PRODUK     ██         │  object-cover atau contain
│       ██              ██         │  tanpa padding
│       ██████████████████         │
│                                  │
│   ┌─────────────────────┐        │
│   │ Nama Produk         │        │  overlay di atas gambar
│   │ Rp25.000            │        │  atau di bawah gambar
│   └─────────────────────┘        │
│                                  │
│  [Lihat Detail →]                │  CTA di pojok atau full-width
│                                  │
└──────────────────────────────────┘
     border tipis (1px), shadow sangat minimal
```

**Varian Layout B1 — Overlay:**

Nama dan harga muncul sebagai overlay di bagian bawah gambar dengan `bg-gradient-to-t from-black/60 to-transparent`. Teks putih. Tanpa badge di card — badge dipindah ke halaman detail.

**Varian Layout B2 — Compact Footer:**

Nama dan harga di strip tipis di bawah gambar (20–25% card height). CTA hanya muncul saat hover. Card jadi sangat "photography-forward."

### Visual Hierarchy

1. **Foto produk** — mendominasi 80–85% card. Full-bleed, tanpa padding, produk besar dan berani.
2. **Nama produk** — overlay atau compact footer.
3. **Harga** — menyatu dengan nama.
4. **CTA** — opsional: muncul saat hover (B2) atau fixed di bawah (B1).

### Photography

`object-cover` atau `object-contain` dengan sedikit atau tanpa padding. Foto harus sangat kuat, close-up, menampilkan tekstur jamur krispi secara detail. Lighting dramatis — side lighting yang menonjolkan kerenyahan.

Konsep ini **menuntut foto berkualitas sangat tinggi** — karena foto adalah 85% dari card.

### CTA

Dua opsi:
- **B1 (Overlay):** "Lihat Detail" kecil di sudut kanan bawah overlay. Tidak mencolok — user sudah tertarik dengan foto.
- **B2 (Compact):** CTA hanya muncul saat hover/click. Lebih berani, tapi berisiko di mobile.

Rekomendasi: Gunakan B1 untuk mobile safety, dengan CTA fixed di footer.

### Whitespace

**Paling sedikit dari tiga konsep.** Hampir tidak ada whitespace — foto mengambil semuanya. Whitespace hanya ada di border card dan gap antar card di grid. Ini membuat card terasa "penuh," yang bisa positif (produk besar) atau negatif (sesak) tergantung eksekusi.

### Typography

Dalam overlay: `text-white` dengan `text-shadow: 0 1px 3px rgba(0,0,0,0.3)`. Nama: semibold. Harga: bold, emas (tapi dengan opacity lebih tinggi agar kontras di background gelap). Atau putih semua dengan weight berbeda.

### Keunggulan

- Produk terlihat **sangat besar dan dominan** — menggugah selera maksimal
- Layout berani, beda dari kompetitor
- Cocok untuk foto produk close-up berkualitas tinggi
- Terasa modern dan fashion-forward
- Di grid, card ini "berteriak" lebih keras dari card lain

### Kelemahan

- **Berisiko terasa seperti marketplace** — banyak toko online menggunakan layout full-bleed image
- Overlay teks di atas gambar berisiko: kontras, readability, aksesibilitas
- CTA mungkin tidak terlihat jelas (tergantung implementasi)
- Mobile: produk terlalu besar, informasi kurang
- Badge tidak muat — harus dipindah ke halaman detail
- Fotografi harus sempurna — tidak ada ruang untuk foto kurang bagus

### Cocok untuk

Brand fashion-forward, produk visual-heavy. D'Jaemo jika ingin tampil lebih modern dan "berani." Risiko: bisa terasa seperti brand fashion, bukan brand makanan.

### Premium Score

**7/10** — Berani, tapi berisiko. Overlay bisa terasa murahan jika tidak dieksekusi dengan sempurna.

### Conversion Score

**8/10** — Foto besar menggoda klik. Tapi CTA tersembunyi (di overlay) bisa turunkan konversi mobile.

---

## 4. Concept C — The Natural Canvas

### Nama Konsep

**The Natural Canvas** — Kanvas Alami

### Feeling

Seperti melihat produk di atas meja kayu rustic, ditemani secangkir kopi dan serbet linen. Hangat, personal, artisan. Card terasa tactile — seperti Anda bisa menyentuh permukaannya.

Ini adalah konsep yang paling "D'Jaemo" secara emosional. Terinspirasi dari Aesop, Muji, dan brand artisan. Tidak berusaha terlihat mahal — justru dengan tampil sederhana, ia terasa premium.

### Layout

```
┌──────────────────────────────────┐
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │       PRODUK (contain)     │  │  image area, aspect-square
│  │       dengan shadow        │  │  shadow natural tipis
│  │       natural              │  │  bg-card (warm)
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  Nama Produk                     │  text-center atau left
│  ~ deskripsi singkat (1 baris) ~│  caption kecil
│  Rp25.000                        │  harga center
│                                  │
│       [Lihat Produk]             │  ghost button, subtle
│                                  │
└──────────────────────────────────┘
     bg-surface (cream, menyatu dengan halaman)
     rounded-2xl
     NO border, NO shadow (card menyatu dengan background)
```

### Unsur Unik

**Card menyatu dengan background halaman** — tidak ada border, tidak ada shadow card. Card hanya didefinisikan oleh konten internalnya. Ini adalah pendekatan paling berani — card tidak memiliki "dinding."

Image area memiliki `bg-card` (sedikit lebih terang dari background, atau sama) dan dikelilingi whitespace. Produk di dalam image area memiliki `drop-shadow` natural yang sangat tipis — seolah produk benar-benar diletakkan di atas permukaan.

**Badge tidak ada.** Informasi berat dipindah ke halaman detail atau di bawah harga dalam format "250g" teks kecil.

### Visual Hierarchy

1. **Foto produk** — dalam "panggung" berupa kotak dengan shadow natural.
2. **Nama produk** — tepat di bawah, sentral atau rata kiri.
3. **Harga** — bold, emas, ukuran lebih besar dari nama.
4. **Deskripsi singkat** — 1 baris, caption, opsional.
5. **CTA** — ghost button, subtle, tidak memaksa.

### Photography

`object-contain` di dalam container yang **tidak memiliki background kontras**. Background container sama dengan background card (warm cream). Produk difoto dengan **latar belakang putih** sehingga di dalam container, produk terlihat "melayang" di atas permukaan krem.

Bayangan produk (drop shadow) dibuat natural, seolah produk diletakkan di atas meja.

### CTA

Ghost button: `border border-primary/20 text-primary hover:bg-primary/5`. Tidak full-width — hanya selebar teks + padding. Atau link dengan arrow, bukan button.

"Lihat Produk" atau "Detail" — minimalis, tidak mendominasi.

### Whitespace

Whitespace sangat generous, bahkan lebih dari Concept A. Seluruh card memiliki padding `p-6` atau `p-8`. Tidak ada border card — whitespace antara card dan konten halaman adalah "border" alami.

### Typography

Font lebih kecil dari konsep lain. Nama: `text-base font-medium` (bukan semibold). Harga: `text-lg font-bold` (lebih kecil dari Concept A).  
Tujuannya: **tidak ada yang berteriak.** Semuanya tenang.

### Keunggulan

- **Paling berbeda** — tidak ada e-commerce yang menggunakan pendekatan ini
- Paling "D'Jaemo" — hangat, natural, tidak berisik
- Tidak ada risiko terlihat seperti marketplace
- Memberi kesan brand yang sangat percaya diri (tidak perlu border/shadow)
- Kesan artisan dan handmade sangat kuat

### Kelemahan

- **Risiko tidak terlihat seperti card** — user mungkin tidak menyadari ini adalah elemen yang bisa diklik
- CTA ghost button bisa terlalu subtle — turunkan click-through
- Tanpa border/shadow, card sulit dibedakan dari konten halaman biasa
- Di grid, card bisa "hilang" karena menyatu dengan background
- Fotografi harus sempurna — produk harus terlihat 3D dengan shadow natural
- Lebih sulit diimplementasikan secara konsisten

### Cocok untuk

Brand artisan premium yang sangat percaya diri. D'Jaemo jika ingin menonjolkan sisi "handmade" dan "alami." Risiko konversi lebih tinggi.

### Premium Score

**9/10** — Kesederhanaan ekstrem adalah puncak premium. Tapi hanya untuk audiens yang tepat.

### Conversion Score

**5/10** — Terlalu subtle. User mungkin tidak tahu harus klik di mana. Butuh edukasi atau ekspektasi yang sudah terbangun.

---

## 5. 2-Second Test

### Concept A — The Warm Frame

| Waktu | Apa yang Dilihat User | Emosi |
|-------|----------------------|-------|
| 0–0.5s | Bingkai krem dengan produk di tengah | *"Produk apa itu?"* |
| 0.5–1s | Nama produk terbaca, badge berat | *"Jamur krispi."* |
| 1–1.5s | Harga emas bold | *"Harganya wajar."* |
| 1.5–2s | CTA "Lihat Detail" | *"Klik untuk lihat."* |

### Concept B — The Hero Card

| Waktu | Apa yang Dilihat User | Emosi |
|-------|----------------------|-------|
| 0–0.5s | Foto produk BESAR, full bleed | *"Wah, besarnya!"* |
| 0.5–1s | Nama produk (overlay/compact) | *"Ini namanya..."* |
| 1–1.5s | Harga kecil atau tidak langsung terlihat | *"Harganya berapa?"* |
| 1.5–2s | CTA (jika ada) | *"Klik?"* |

**Catatan:** Di Concept B, harga tidak selalu terlihat dalam 1 detik — ini kelemahan serius untuk conversion.

### Concept C — The Natural Canvas

| Waktu | Apa yang Dilihat User | Emosi |
|-------|----------------------|-------|
| 0–0.5s | Area krem dengan produk di tengah | *"Apa ini?"* |
| 0.5–1s | Produk dengan shadow natural | *"Oh, ini produk."* |
| 1–1.5s | Nama produk | *"Jamur krispi."* |
| 1.5–2s | Harga + CTA subtle | *"Klik... atau tidak?"* |

**Catatan:** Concept C butuh waktu lebih lama untuk dikenali sebagai "card"— ini risiko.

---

## 6. Purchase Psychology

### Concept A — The Warm Frame

**Mengapa orang terdorong mengklik?**
- Padding dan bingkai menciptakan "jarak aman" — user merasa produk ini eksklusif, layak dilihat lebih dekat.
- Foto yang utuh (tidak dipotong) membangun trust — "saya melihat produk asli, bukan yang diedit."

**Apa yang meningkatkan rasa penasaran?**
- Produk terlihat utuh tapi tidak terlalu detail — user ingin lihat lebih dekat.
- Nama dan harga sudah terlihat, tapi deskripsi belum — "apa lagi ya tentang produk ini?"

**Apa yang meningkatkan trust?**
- Produk tidak dipotong — transparan.
- Padding lebar — sinyal brand tidak butuh memenuhi ruang.
- Weight badge — informasi jelas.

**Apa yang membuat terlihat premium?**
- Whitespace. Sederhana: semakin banyak ruang kosong di sekitar produk, semakin mahal kelihatannya.

### Concept B — The Hero Card

**Mengapa orang terdorong mengklik?**
- Foto besar dan berani. Otak manusia tertarik pada visual besar — ini insting.
- "Saya harus lihat produk ini lebih dekat" — karena fotonya besar tapi detail terbatas.

**Apa yang meningkatkan rasa penasaran?**
- Foto besar tapi hanya menunjukkan satu angle — "bagaimana sisi lainnya?"
- Harga mungkin tidak terlihat — "klik untuk tahu harga."

**Apa yang meningkatkan trust?**
- Foto berkualitas tinggi — kalau brand berani pasang foto sebesar ini, pasti produknya bagus.
- (Tapi sebaliknya: foto kurang bagus = trust langsung hancur.)

**Apa yang membuat terlihat premium?**
- Keberanian. Brand yang berani menampilkan produk sebesar itu tanpa gangguan terlihat percaya diri.

### Concept C — The Natural Canvas

**Mengapa orang terdorong mengklik?**
- Rasa penasaran: "Apa ini sebenarnya?" — karena card tidak terlihat seperti card biasa.
- Kesan handmade: "Ini brand artisan, pasti ada cerita di baliknya."

**Apa yang meningkatkan rasa penasaran?**
- Desain yang tidak biasa — "ini bukan toko biasa."
- Produk dengan shadow natural — terasa nyata, bukan digital.

**Apa yang meningkatkan trust?**
- Kesederhanaan. Tidak ada trik, tidak ada promo, tidak ada tekanan.
- "Brand ini percaya diri dengan produknya — tidak perlu border atau shadow."

**Apa yang membuat terlihat premium?**
- Anti-marketplace. Semakin tidak terlihat seperti toko online biasa, semakin premium.
- Keberanian untuk tampil berbeda.

---

## 7. Mobile Experience

### Concept A — The Warm Frame

| Device | Lebar | Tampilan |
|--------|-------|----------|
| 360px | 1 kolom | Card full-width. Image: ~300×300px dengan p-6. Nama: 15px. Harga: 18px. CTA: touch-friendly. ✅ |
| 390px | 1–2 kolom | Sangat nyaman. Padding cukup. ✅ |
| 412px | 2 kolom | Image ~180×180px. Padding p-4 mungkin diperlukan agar proporsional. ✅ |
| Tablet | 2 kolom | Ideal — padding generous, image cukup besar. ✅ |
| Desktop | 3 kolom | Premium — whitespace terlihat mewah. ✅ |

**Verdict:** Konsep paling mobile-friendly. Padding adaptif menjaga kualitas di semua ukuran.

### Concept B — The Hero Card

| Device | Lebar | Tampilan |
|--------|-------|----------|
| 360px | 1 kolom | Image dominan (85%). Teks overlay mungkin terlalu kecil. ❌ |
| 390px | 1–2 kolom | Overlay readable, tapi CTA mungkin terpotong. ⚠️ |
| 412px | 2 kolom | Image ~180×180px — overlay teks sangat kecil, sulit dibaca. ❌ |
| Tablet | 2 kolom | Mulai nyaman — overlay cukup besar. ✅ |
| Desktop | 3 kolom | Ideal — dramatis, modern, elegan. ✅ |

**Verdict:** Paling tidak mobile-friendly. Overlay teks di image kecil adalah masalah serius di layar 360–412px. Solusi: di mobile, ubah ke layout stacked (image lalu teks di bawah).

### Concept C — The Natural Canvas

| Device | Lebar | Tampilan |
|--------|-------|----------|
| 360px | 1 kolom | Card menyatu dengan background. Risiko: tidak terlihat sebagai card. ⚠️ |
| 390px | 1–2 kolom | Sama — terlalu subtle. User mungkin scroll tanpa sadar. ⚠️ |
| 412px | 2 kolom | Mulai terbaca sebagai card karena whitespace. ✅ |
| Tablet | 2 kolom | Cukup jelas — whitespace membantu. ✅ |
| Desktop | 3 kolom | Premium — terasa seperti galeri. ✅ |

**Verdict:** Mobile adalah kelemahan utama. Tanpa border, card mudah "hilang" di layar kecil. Solusi: tambah `border-primary/5` sangat tipis di mobile, atau bedakan warna background card dengan halaman.

---

## 8. Photo Strategy

### Aspek Umum (Semua Konsep)

| Aspek | Standar D'Jaemo |
|-------|----------------|
| **Lighting** | Natural soft, window light, 45° dari kiri atas |
| **Background foto asli** | Putih bersih (#ffffff) — biar kontras dengan card |
| **Angle** | 45° top-down — menunjukkan tekstur dan dimensi |
| **Fokus** | Tajam — detail kerenyahan terlihat |
| **Format** | WebP, quality 85+, minimal 800×800px |
| **Prop** | Minimal — daun segar 1 helai, atau sendok stainless |

### Concept A — The Warm Frame

| Aspek | Spesifikasi |
|-------|-------------|
| **Ukuran dalam card** | ~65% dari image container (karena padding p-8) |
| **Object fit** | `object-contain` — produk utuh |
| **Kebutuhan foto** | Close-up dengan komposisi sentral. Background putih bersih. |
| **Strategi** | Foto produk diletakkan di tengah frame. Padding menciptakan "galeri." |
| **Risiko** | Produk terlihat kecil di grid mobile 2 kolom |

### Concept B — The Hero Card

| Aspek | Spesifikasi |
|-------|-------------|
| **Ukuran dalam card** | ~95% dari image container (full bleed) |
| **Object fit** | `object-cover` — crop, fokus ke detail |
| **Kebutuhan foto** | Sangat tinggi. Foto harus sempurna — tidak ada kompresi, tidak ada blur. Close-up ekstrim menunjukkan tekstur. |
| **Strategi** | Foto produk dari angle yang paling dramatis. Fokus ke kerenyahan. |
| **Risiko** | Foto kurang bagus = card gagal total. Tidak ada tempat bersembunyi. |

### Concept C — The Natural Canvas

| Aspek | Spesifikasi |
|-------|-------------|
| **Ukuran dalam card** | ~75% dari image container (padding p-4) |
| **Object fit** | `object-contain` — produk utuh |
| **Kebutuhan foto** | Produk dengan background putih, lalu di-render dengan shadow natural. Foto harus terasa 3D. |
| **Strategi** | Foto flat-lay dengan angle 45°. Tambah shadow natural tipis. Produk terasa "diletakkan" di atas card. |
| **Risiko** | Shadow natural sulit dirender konsisten. Foto tanpa shadow terlihat datar dan kehilangan "magic." |

---

## 9. CTA Strategy

### "Lihat Detail"

| Konsep | Cocok? | Alasan |
|--------|--------|--------|
| A | ✅ **Sangat cocok** | Sopan, hangat, mengundang. Sesuai dengan karakter card yang tenang. |
| B | ⚠️ Mungkin | Terlalu sopan untuk card yang "berteriak." Tapi bisa dipasangkan dengan ikon panah. |
| C | ✅ Cocok | Sesuai dengan keseluruhan tone yang minimal. |

### "Lihat Produk"

| Konsep | Cocok? | Alasan |
|--------|--------|--------|
| A | ✅ Alternatif | Lebih umum, sedikit lebih hangat dari "Lihat Detail." |
| B | ✅ Cocok | Langsung ke inti — "lihat produk" karena produk adalah hero. |
| C | ⚠️ Mungkin | Terlalu instruktif untuk card yang subtle. |

### "Pesan Sekarang"

| Konsep | Cocok? | Alasan |
|--------|--------|--------|
| A | ❌ Tidak | Terlalu agresif untuk card yang hangat dan sopan. Lebih cocok di halaman detail. |
| B | ⚠️ Mungkin | Cocok dengan keberanian card, tapi bisa terasa terlalu "jualan." |
| C | ❌ Tidak | Sangat tidak cocok. Terlalu keras untuk card yang tenang. |

### Rekomendasi Final

| Konsep | CTA Terbaik | Alasan UX |
|--------|-------------|-----------|
| **A** | "Lihat Detail →" | Mengundang, memberi arah, tidak memaksa. Panah menunjukkan "ada lagi di balik ini." |
| **B** | "Lihat Produk" | Langsung to the point. Card sudah besar dan berani — CTA tidak perlu banyak bantuan. |
| **C** | "Lihat Detail" (tanpa panah, ghost button) | Minimal, tidak mengganggu. CTA harus menyatu dengan card. |

---

## 10. White Space Analysis

### Mengapa Whitespace Penting untuk D'Jaemo

**Whitespace adalah sinyal harga termahal yang bisa diberikan brand.**

Ketika user melihat card dengan padding lebar, otak mereka secara tidak sadar memproses: *"Brand ini punya ruang — mereka tidak perlu mengisi setiap pixel dengan informasi. Mereka percaya produk mereka cukup menarik."*

Sebaliknya, card tanpa whitespace mengirim sinyal: *"Kami harus memasukkan sebanyak mungkin informasi karena produk kami mungkin tidak cukup menarik."*

Marketplace seperti Shopee dan Tokopedia **tidak punya whitespace** di card mereka. Mereka memasukkan:
- Nama produk (3 baris)
- Diskon dan harga coret
- Rating bintang
- Jumlah terjual
- Lokasi toko
- Voucher
- CTA "Masukkan Keranjang"

Setiap elemen tambahan **mengurangi premium feeling.**

### Perbandingan Whitespace per Konsep

| Aspek | Concept A | Concept B | Concept C |
|-------|-----------|-----------|-----------|
| Padding image area | 32px (p-8) | 0px (full bleed) | 16px (p-4) |
| Padding body | 20px (p-5) | 12–16px | 24–32px |
| Gap nama ke harga | 16px (mt-4) | 8px | 16px |
| Card border | 1px solid | 1px solid atau none | None |
| Kesan whitespace | ⭐⭐⭐⭐⭐ Generous | ⭐⭐ Padat | ⭐⭐⭐⭐⭐ Sangat lega |
| Risiko | Tidak ada | Sesak di mobile | Terlalu longgar |

### Hubungan Whitespace — Premium Feeling

```
Whitespace ════ Premium Feeling
     ↑                  ↑
     Rendah            Rendah    (marketplace)
     Sedang            Sedang    (Concept B)
     Tinggi            Tinggi    (Concept A)
     Sangat Tinggi     Sangat Tinggi (Concept C)
```

Tapi ada titik balik: **terlalu banyak whitespace** (Concept C) bisa membuat card tidak terlihat sebagai card — dan ini menurunkan conversion.

**Sweet spot:** Concept A. Whitespace yang cukup untuk terasa premium, tapi tidak berlebihan hingga card kehilangan identitasnya.

---

## 11. Anti-Marketplace Check

### Concept A — The Warm Frame

| Risiko Marketplace | Status | Alasan |
|--------------------|--------|--------|
| Terlihat seperti Shopee | ✅ **Aman** | Padding lebar, tidak ada diskon, tidak ada rating. |
| Terlihat seperti Tokopedia | ✅ **Aman** | Satu badge, tidak ada informasi berlebih. |
| Terlihat seperti Lazada | ✅ **Aman** | Tidak ada voucher, tidak ada harga coret. |
| Terlihat seperti template Shopify | ✅ **Aman** | Padding generous membedakan dari template standar. |
| Terlihat seperti template Next.js biasa | ✅ **Aman** | Whitespace dan rounded corners signature D'Jaemo. |

**Verdict:** Paling aman. Padding lebar adalah tameng terbaik melawan kesan marketplace.

### Concept B — The Hero Card

| Risiko Marketplace | Status | Alasan |
|--------------------|--------|--------|
| Terlihat seperti Shopee | ⚠️ **Risiko** | Banyak toko Shopee menggunakan full-bleed image. Tapi mereka biasanya tambah diskon besar-besaran. |
| Terlihat seperti Tokopedia | ⚠️ **Risiko** | Sama — full-bleed image adalah pola umum. |
| Terlihat seperti Lazada | ⚠️ **Risiko** | Sama. |
| Terlihat seperti template Shopify | ❌ **Risiko Tinggi** | Banyak template Shopify menggunakan hero card layout. |
| Terlihat seperti template Next.js biasa | ⚠️ **Mungkin** | Tergantung eksekusi — overlay teks dan font bisa membedakan. |

**Verdict:** Paling berisiko. Full-bleed image adalah pola umum e-commerce. D'Jaemo harus membedakan diri melalui kualitas foto dan typography.

### Concept C — The Natural Canvas

| Risiko Marketplace | Status | Alasan |
|--------------------|--------|--------|
| Terlihat seperti Shopee | ✅ **Sangat aman** | Tidak ada e-commerce besar yang berani tanpa border. |
| Terlihat seperti Tokopedia | ✅ **Sangat aman** | Sama. |
| Terlihat seperti Lazada | ✅ **Sangat aman** | Sama. |
| Terlihat seperti template Shopify | ✅ **Aman** | Tidak ada template Shopify tanpa border card. |
| Terlihat seperti template Next.js biasa | ✅ **Aman** | Unik — tidak seperti template standar. |

**Verdict:** Paling anti-marketplace. Tapi ini juga yang membuatnya berisiko — terlalu berbeda bisa membingungkan user.

---

## 12. Emotional Test

### Concept A — The Warm Frame

Setelah melihat card, user harus merasa:

| Emosi | Ya/Tidak | Alasan |
|-------|----------|--------|
| "Enak nih." | ✅ Ya | Foto produk utuh dengan padding — terlihat "siap disantap." |
| "Pengen coba." | ✅ Ya | Harga terlihat, CTA jelas, langkah selanjutnya jelas. |
| "Kelihatan renyah." | ✅ Ya (tergantung foto) | Object-contain dengan padding cukup besar untuk menunjukkan tekstur. |
| "Kelihatan mahal." | ⚠️ Sedang | Padding lebar memberi kesan mahal, tapi tidak berlebihan. |
| "Trustworthy." | ✅ Ya | Produk ditampilkan utuh — tidak ada yang disembunyikan. |

### Concept B — The Hero Card

Setelah melihat card, user harus merasa:

| Emosi | Ya/Tidak | Alasan |
|-------|----------|--------|
| "Enak nih." | ✅ **Sangat ya** | Foto besar dan dominan — efek visual paling kuat. |
| "Pengen coba." | ✅ Ya | Foto menggoda, tapi CTA perlu jelas. |
| "Kelihatan renyah." | ✅ **Sangat ya** | Foto close-up ekstrim menampilkan tekstur maksimal. |
| "Kelihatan mahal." | ✅ Ya | Keberanian layout menciptakan kesan brand fashion. |
| "Trustworthy." | ⚠️ Tergantung foto | Foto berkualitas tinggi = trust. Foto kurang = trust hilang. |

### Concept C — The Natural Canvas

Setelah melihat card, user harus merasa:

| Emosi | Ya/Tidak | Alasan |
|-------|----------|--------|
| "Enak nih." | ⚠️ Mungkin | Foto tidak dominan — butuh waktu lebih untuk "merasakan" produk. |
| "Pengen coba." | ❌ Kurang | CTA terlalu subtle. User mungkin tidak tahu harus klik. |
| "Kelihatan renyah." | ⚠️ Tergantung foto | Tanpa border yang jelas, fokus terbelah. |
| "Kelihatan mahal." | ✅ **Sangat ya** | Kesederhanaan ekstrem = mahal. Tapi hanya untuk yang paham. |
| "Trustworthy." | ✅ Ya | Kesederhanaan membangun trust — "brand ini tidak perlu trik." |

---

## 13. Brand Test

### Jika Logo Dihilangkan, Apakah Orang Tetap Bisa Mengenali D'Jaemo?

### Concept A — The Warm Frame

**Ya, dengan catatan.**

Yang bisa dikenali: whitespace generous, rounded corners signature, warna cokelat-emas-hijau, harga emas. Kombinasi ini cukup kuat untuk membedakan D'Jaemo dari brand lain.

Yang kurang: tanpa logo, orang mungkin tidak langsung tahu ini "D'Jaemo," tapi mereka akan tahu ini **bukan Shopee, bukan Tokopedia, bukan brand biasa.**

**Score: 7/10** — Cukup kuat untuk membedakan dari marketplace, tapi belum cukup untuk dikenali sebagai D'Jaemo spesifik.

### Concept B — The Hero Card

**Mungkin, tergantung eksekusi.**

Jika full-bleed image + overlay teks, ini adalah pola yang digunakan banyak brand. Tanpa logo, orang mungkin mengira ini brand fashion, brand skincare, atau brand makanan lain.

Yang bisa dikenali: warna emas pada harga, font Geist Sans yang konsisten. Tapi ini detail kecil yang mudah terlewat.

**Score: 4/10** — Tanpa logo, card kehilangan identitas D'Jaemo. Terlalu generik.

### Concept C — The Natural Canvas

**Ya, paling kuat.**

Konsep ini sangat berbeda dari e-commerce pada umumnya. Orang yang pernah melihat D'Jaemo akan langsung mengenali "card tanpa border" ini. Bahkan orang yang belum pernah, akan merasa ini brand yang unik.

Yang bisa dikenali: tidak adanya border, shadow natural pada produk, warna krem yang hangat, typography yang tenang.

**Score: 9/10** — Paling distinctive. Tapi keunikannya juga yang membuatnya berisiko.

---

## 14. Comparison Table

| # | Kategori | Concept A | Concept B | Concept C |
|---|----------|-----------|-----------|-----------|
| 1 | **Premium Feeling** | 9/10 — Whitespace generous, terasa eksklusif | 7/10 — Berani tapi berisiko terasa generik | 9/10 — Kesederhanaan ekstrem, artisan |
| 2 | **Appetite (Selera)** | 8/10 — Produk utuh, menggoda | 9/10 — Foto besar, sangat menggugah | 6/10 — Kurang visual dominant |
| 3 | **Brand Identity** | 8/10 — Cukup kuat, warna dan spacing signature | 5/10 — Terlalu generik tanpa logo | 9/10 — Paling distinctive |
| 4 | **Readability** | 9/10 — Semua informasi jelas | 6/10 — Overlay bisa sulit dibaca | 7/10 — Teks jelas tapi CTA terlalu subtle |
| 5 | **Photography** | 8/10 — Butuh foto berkualitas, tapi ada ruang | 10/10 — Foto jadi bintang mutlak | 7/10 — Butuh shadow natural yang sulit |
| 6 | **Conversion** | 8/10 — CTA jelas, harga terlihat, trust tinggi | 7/10 — Foto menggoda tapi CTA/price kurang jelas | 5/10 — Terlalu subtle untuk konversi |
| 7 | **Mobile Experience** | 9/10 — Adaptif, padding membantu | 5/10 — Overlay bermasalah di layar kecil | 6/10 — Card bisa "hilang" di mobile |
| 8 | **Scalability** | 9/10 — Konsisten untuk semua tipe produk | 7/10 — Bergantung pada kualitas foto per produk | 5/10 — Shadow natural sulit diskalakan |
| 9 | **Development Complexity** | 8/10 — Sederhana, mudah diimplementasikan | 6/10 — Overlay responsif, handling gambar kompleks | 4/10 — Shadow natural, borderless, tricky |
| 10 | **Maintainability** | 9/10 — Mudah dirawat, komponen sederhana | 7/10 — Foto harus konsisten, Quality Assurance ketat | 5/10 — Shadow natural harus di-maintain per produk |

### Total Score

| Concept | Total (dari 100) | Rata-rata |
|---------|-----------------|-----------|
| **A — The Warm Frame** | **85** | **8.5/10** |
| **B — The Hero Card** | 69 | 6.9/10 |
| **C — The Natural Canvas** | 63 | 6.3/10 |

---

## 15. Final Recommendation

### Pilihan: Concept A — The Warm Frame

**Skor: 85/100 — dengan rata-rata 8.5/10 di semua kategori.**

### Alasan Utama

**1. Keseimbangan Terbaik Antara Premium dan Conversion**

Concept A tidak mengejar skor tertinggi di satu kategori dengan mengorbankan kategori lain. Ia tidak memiliki kelemahan fatal — semua kategori berada di 8 atau 9.

- Premium: 9
- Conversion: 8
- Mobile: 9
- Maintainability: 9

Tidak ada konsep lain yang mencapai keseimbangan ini.

**2. Paling Sesuai dengan Brand DNA D'Jaemo**

D'Jaemo adalah "The Warm Artisan" — hangat, percaya diri, tidak berisik. Concept A menerjemahkan ini dengan sempurna:

- Hangat → Warna krem, rounded corners, padding
- Percaya diri → Whitespace generous, tidak perlu memenuhi ruang
- Tidak berisik → Tidak ada overlay, tidak ada elemen yang berteriak

**3. Paling Anti-Marketplace Tanpa Mengorbankan Kejelasan**

Concept A jelas bukan marketplace karena padding dan whitespace-nya. Tapi ia tetap jelas sebagai "card" — user langsung paham bahwa ini adalah elemen yang bisa diklik. Tidak seperti Concept C yang berisiko tidak terlihat sebagai card.

**4. Paling Mobile-Friendly**

Dari tiga konsep, hanya Concept A yang bekerja dengan baik di semua ukuran layar tanpa perlu kompromi atau varian layout. Di 360px hingga desktop 1440px, card tetap konsisten dan premium.

**5. Paling Mudah Diimplementasikan dan Dirawat**

Tidak ada overlay responsif, tidak ada shadow natural yang rumit, tidak ada full-bleed image yang menuntut foto sempurna. Component sederhana, mudah di-scale untuk puluhan produk.

### Risiko dan Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Produk terlihat kecil di mobile 2 kolom | Kurangi padding image dari `p-8` ke `p-4` atau `p-6` di layar <640px |
| Foto kurang bagus mengurangi dampak | Gunakan object-contain — foto yang kurang bagus tetap utuh, tidak crop aneh |
| Terlalu "safe" — kurang berani | Pertahankan padding, tapi tingkatkan kualitas fotografi sebagai diferensiasi |

### Rekomendasi Implementasi

1. **Image container:** `aspect-square` dengan `p-6 sm:p-8`, `object-contain`
2. **Card body:** `p-5`, name `line-clamp-2`, price bold emas
3. **CTA:** "Lihat Detail →", primary button, full-width
4. **Badge:** Weight badge, `bg-accent/10`, satu saja
5. **Hover:** Card lift `-translate-y-0.5`, shadow meningkat, image scale 1.05
6. **Mobile (360–412px):** Padding image turun ke `p-4`, font body compact
7. **Animasi:** 200ms, ease-out, halus natural

### Perbandingan dengan Implementasi Saat Ini

Implementasi yang sudah ada (`ProductCard.tsx`) sudah menggunakan Concept A — The Warm Frame. Eksplorasi ini memvalidasi bahwa arah yang diambil adalah **yang terbaik** dari tiga opsi yang dianalisis.

Tidak ada perubahan fundamental yang diperlukan. Fokus ke depan:
- Meningkatkan kualitas fotografi produk
- Memastikan padding konsisten di semua viewport
- Optimalisasi mobile: kurangi padding image di layar <640px dari `p-6` ke `p-4`

### Penutup

> **The Warm Frame adalah D'Jaemo.**
>
> Ia tidak berteriak. Ia tidak memaksa. Ia tidak perlu trik.
>
> Ia hanya meletakkan produknya dengan bangga di depan Anda,
> memberi Anda ruang untuk mengagumi,
> lalu dengan hangat mengundang Anda untuk melihat lebih dekat.
>
> Itulah D'Jaemo.

---

*Setiap gigitan adalah bukti kualitas.*
