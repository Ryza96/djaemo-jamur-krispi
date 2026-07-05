# D'Jaemo — Product Card Concept

> Versi: 1.0  
> Tanggal: 2026-06-30  
> Acuan: `PREMIUM_DESIGN_GUIDE.md` v2.0  
> Status: **Konsep Desain** — panduan implementasi Product Card

---

## Daftar Isi

1. [Design Objective](#1-design-objective)
2. [Visual Hierarchy](#2-visual-hierarchy)
3. [Card Structure](#3-card-structure)
4. [Image Philosophy](#4-image-philosophy)
5. [Typography](#5-typography)
6. [CTA](#6-cta)
7. [White Space](#7-white-space)
8. [Hover Experience](#8-hover-experience)
9. [Mobile Experience](#9-mobile-experience)
10. [Purchase Psychology](#10-purchase-psychology)
11. [Design Mistakes](#11-design-mistakes)
12. [Success Criteria](#12-success-criteria)
13. [Visual Principles](#13-visual-principles)
14. [Do & Don't](#14-do--dont)
15. [Premium Scorecard](#15-premium-scorecard)

---

## 1. Design Objective

### Apa Tujuan Product Card?

Product Card adalah **etalase digital** produk D'Jaemo. Tugasnya bukan sekadar menampilkan informasi — tugasnya adalah **menggugah selera** dan **membangun keinginan** dalam waktu kurang dari 2 detik.

| Bukan Tujuan | Tujuan |
|-------------|--------|
| Menampilkan semua informasi produk | Membuat user ingin **tahu lebih lanjut** |
| Menjual langsung dari card | Mengarahkan user ke **halaman detail** |
| Membandingkan dengan kompetitor | Membuat user **jatuh cinta pada pandangan pertama** |

### Apa yang Harus Dirasakan User?

| Waktu | Perasaan |
|-------|----------|
| 0–0.5 detik | *"Ini makanan enak."* — Foto produk menarik |
| 0.5–1.5 detik | *"Ini jamur krispi premium."* — Nama dan visual card berkualitas |
| 1.5–3 detik | *"Harganya wajar."* — Harga terlihat, proporsional |
| 3+ detik | *"Saya mau lihat detailnya."* — Timbul rasa ingin klik |

### Apa yang Harus Dilakukan User?

1. **Berhenti scroll** — Card harus cukup menarik untuk menghentikan scrolling.
2. **Lihat produk** — Mata tertuju ke foto produk > 1 detik.
3. **Baca nama** — Tahu apa produk ini.
4. **Lihat harga** — Menilai apakah sesuai ekspektasi.
5. **Klik card atau CTA** — Navigasi ke halaman detail.

---

## 2. Visual Hierarchy

### Urutan Perhatian User

```
1. 🥇 FOTO PRODUK  — 70% dari perhatian pertama
2. 🥇 NAMA PRODUK  — 15% (bersamaan dengan foto)
3. 🥈 HARGA        — 10%
4. 🥉 BADGE        — 3%
5.   CTA           — 2% (dalam konteks grid scanning)
```

### Mengapa Urutan Ini?

| Peringkat | Elemen | Alasan |
|-----------|--------|--------|
| **1** | Foto Produk | Manusia adalah makhluk visual. Makanan masuk melalui mata sebelum masuk ke mulut. Foto yang menggugah selera adalah alasan utama orang berhenti scroll. |
| **2** | Nama Produk | Setelah tertarik secara visual, user mencari konfirmasi: "Apa ini?" Nama harus langsung terbaca. |
| **3** | Harga | Setelah tahu apa produknya, user menilai: "Apakah ini terjangkau?" Harga yang wajar mengonfirmasi minat. |
| **4** | Badge | Informasi tambahan (berat, varian) yang memperkuat keputusan. Tidak esensial di pandangan pertama. |
| **5** | CTA | Dalam grid scanning, user belum siap membeli — mereka ingin eksplorasi. CTA akan dominan di halaman detail, bukan di card. |

### Aturan Tata Letak

| Elemen | Posisi | Dominasi Visual |
|--------|--------|-----------------|
| Foto | Bagian atas card, 60–65% tinggi card | Paling kontras, paling besar |
| Nama | Tepat di bawah foto | Font semibold, warna kontras |
| Harga | Sejajar atau setelah nama | Emas, bold, ukuran lebih besar dari body |
| Badge | Samping nama atau di atas harga | Kecil, warna accent |
| CTA | Paling bawah card | Full-width atau align kanan |

---

## 3. Card Structure

### Layout Vertikal (Default)

```
┌──────────────────────────┐
│                          │  ← Image Container
│      FOTO PRODUK         │     aspect-square (1:1)
│                          │     object-cover
│                          │     rounded-xl
│                          │     bg-surface-dark
│                          │
├──────────────────────────┤
│                          │  ← Body Container (p-5)
│  ┌─────────┐  ┌──────┐  │
│  │ Nama    │  │Badge │  │     Nama: semibold, 2 baris max
│  │ Produk  │  │      │  │     Badge: weight/varian
│  └─────────┘  └──────┘  │
│                          │
│  Harga                   │     Price: bold, emas
│                          │     mt-4
│  [Pesan Sekarang]        │     CTA: full-width button
│                          │     mt-4
└──────────────────────────┘
     rounded-2xl
     border border-primary/10
     bg-white
     shadow-sm
```

### Dimensi Card

| Ukuran | Aspect | Lebar (dalam grid) |
|--------|--------|---------------------|
| Image | 1:1 (square) | 100% lebar card |
| Total card | ~1:1.4 | 300–400px (desktop) |

### Spacing Internal

| Area | Jarak | Alasan |
|------|-------|--------|
| Body card ke tepi | `p-5` (20px) | Standar guide — breathing room cukup |
| Nama ke harga | `mt-4` (16px) | Pisahkan identitas dari nilai |
| Harga ke CTA | `mt-4` (16px) | Pisahkan nilai dari aksi |
| Badge ke nama | `ml-auto` atau `gap-2` | Badge mengikuti nama di baris yang sama |
| CTA ke bawah card | `mt-4` (16px) | Sebelum padding bawah card |

### Struktur HTML Semantic

```html
<article class="group rounded-2xl border border-primary/10 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
  <Link href="/produk/[slug]">
    <!-- Image -->
    <div class="relative aspect-square overflow-hidden rounded-xl bg-surface-dark">
      <Image fill src="..." alt="..." class="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
    </div>

    <!-- Body -->
    <div class="p-5">
      <!-- Nama + Badge -->
      <div class="flex items-start justify-between gap-2">
        <h3 class="line-clamp-2 text-base font-semibold text-primary sm:text-lg">Nama Produk</h3>
        <span class="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">250g</span>
      </div>

      <!-- Harga -->
      <p class="mt-4 text-lg font-bold text-secondary sm:text-xl">Rp25.000</p>

      <!-- CTA -->
      <button class="mt-4 w-full rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-light active:scale-95">Pesan Sekarang</button>
    </div>
  </Link>
</article>
```

---

## 4. Image Philosophy

### Aturan Dasar

| Aspek | Spesifikasi | Alasan |
|-------|-------------|--------|
| **Ukuran** | 60–65% dari total tinggi card | Foto adalah elemen terpenting — harus dominan |
| **Rasio** | 1:1 (square) | Konsisten dalam grid; tidak ada whitespace aneh antar baris |
| **Background** | Putih bersih (#ffffff) atau light surface | Produk harus kontras; background tidak boleh bersaing |
| **Object fit** | `object-cover` | Mengisi seluruh container; crop otomatis yang rapi |
| **Crop** | Center crop, fokus ke produk utama | Produk harus selalu di tengah |
| **Padding dalam image** | Tidak ada (full bleed) | Foto harus maksimal memenuhi container |
| **Lighting** | Natural soft, dari atas-kiri | Memberi dimensi tanpa bayangan keras |
| **Resolusi** | Minimal 800×800px untuk produk | Tidak pecah di layar Retina |

### Placeholder

| Skenario | Tampilan |
|----------|----------|
| Produk tanpa gambar | `/images/produk/placeholder.svg` di tengah `bg-surface-dark` |
| Loading image | Skeleton `animate-pulse bg-surface-dark` dengan rasio yang sama |

### Image Quality Rules

1. **Tidak ada stretch.** Aspect ratio 1:1 wajib dijaga.
2. **Tidak ada compression artifact.** Gunakan format WebP dengan quality 85+.
3. **Tidak ada teks di atas gambar.** Semua informasi ada di body card.
4. **Tidak ada border terpisah untuk image.** Image container menyatu dengan card.

### Multiple Images

- Card hanya menampilkan **satu foto utama**.
- Foto utama adalah foto produk dengan visual terbaik (angle paling menggugah selera).
- Foto kedua, ketiga, dst hanya muncul di halaman detail.

---

## 5. Typography

### Role & Spesifikasi

| Elemen | Level | Size | Weight | Color | Line Clamp |
|--------|-------|------|--------|-------|------------|
| **Nama Produk** | Product Name | 16px / sm:18px | 600 (Semibold) | `text-primary` | Max 2 baris |
| **Harga** | Price (card) | 18px / sm:20px | 700 (Bold) | `text-secondary` | 1 baris |
| **Badge** | Badge | 12px | 500 (Medium) | `text-accent` | 1 baris |
| **CTA** | Button | 14px | 600 (Semibold) | `text-white` | 1 baris |

### Ukuran Visual Relatif

```
Foto         ██████████████████████████████████████  60–65%

Nama         ████████████████                        15–18px
Badge        ██████                                   12px
Harga        ████████████████████                     18–20px, bold
CTA          ████████████████████████████████         40px height
```

### Aturan Typography Card

1. **Nama produk** — `line-clamp-2`. Jika lebih dari 2 baris, potong dengan ellipsis. Nama yang terlalu panjang mengurangi premium feeling.
2. **Harga** — Satu baris. Tidak boleh wrap. Jika terlalu panjang, gunakan font scale yang lebih kecil.
3. **Warna** — Tidak boleh abu-abu. Harga harus emas (`text-secondary`). Nama harus cokelat (`text-primary`).
4. **Line height** — Nama: 1.3. Harga: 1.0 (compact).

---

## 6. CTA

### Spesifikasi

| Atribut | Spesifikasi Desktop | Mobile |
|---------|---------------------|--------|
| **Label** | "Pesan Sekarang" | "Pesan" |
| **Style** | Primary button (bg-primary) | Primary button (full-width) |
| **Ukuran** | 40px height, `px-6 py-2.5` | 44px height (touch target) |
| **Posisi** | Paling bawah card, full-width | Sama |
| **Font** | `text-sm font-semibold` | Sama |
| **Radius** | `rounded-full` | Sama |

### Aturan CTA

1. **Full-width di card.** Tidak ada alasan untuk CTA yang tidak full-width — ruang terbatas, dan CTA harus mudah diklik.
2. **Satu CTA per card.** Halaman produk grid bukan tempat untuk multiple actions.
3. **CTA tidak tersembunyi.** Tidak boleh muncul hanya saat hover. Harus selalu terlihat.
4. **Hover:** Background lighten (`bg-primary → bg-primary-light`), `active:scale-95`.
5. **Mobile:** Touch target minimal 44×44px.
6. **Loading state:** Jika CTA memicu aksi, gunakan `opacity-75 cursor-wait`.

### Perbedaan dengan Halaman Detail

| Aspek | Card (Grid) | Halaman Detail |
|-------|-------------|----------------|
| CTA | "Pesan Sekarang" → langsung ke detail | "Pesan Sekarang" → add to cart / checkout |
| Tujuan | Navigasi ke detail | Konversi pembelian |
| Urgensi | Rendah (eksplorasi) | Tinggi (keputusan) |

---

## 7. White Space

### Mengapa Card Premium Membutuhkan Ruang Kosong?

1. **Foto produk butuh zona eksklusif.** Tidak boleh ada teks di atas foto. Foto punya wilayah sendiri yang tidak terganggu.
2. **Mata butuh istirahat antar elemen.** 20px antara foto, nama, harga, dan CTA memberi kesempatan mata untuk memproses setiap informasi secara terpisah.
3. **Kepadatan = murahan.** Marketplace penuh dengan card yang sesak oleh teks, diskon, rating, stok, pengiriman — semuanya dalam card kecil. D'Jaemo tidak seperti itu.
4. **Whitespace adalah sinyal kemewahan.** Brand premium tidak perlu memenuhi setiap pixel dengan informasi. Cukup yang penting.

### Whitespace Map

```
┌──────────────────────────┐
│                          │
│                          │  ← 60–65% area: IMAGE
│                          │     Tidak ada gangguan
│       ██████████         │
│                          │
├──────────────────────────┤  ← 16px gap (antara image dan body)
│                          │
│   ████  ██               │  ← 20px padding kiri-kanan
│                          │
│       ██████             │  ← 16px dari nama
│                          │
│   ████████████████████   │  ← 16px dari harga
│                          │
└──────────────────────────┘
     20px padding bawah
```

---

## 8. Hover Experience

### Apa yang Berubah Saat Hover?

| Elemen | Sebelum | Sesudah | Durasi |
|--------|---------|---------|--------|
| **Card container** | `shadow-sm` | `shadow-md` | 200ms |
| **CTA** | `bg-primary` | `bg-primary-light` | 200ms |
| **Thumbnail image** | normal | `scale-105` (+ transform) | 200ms |
| **Cursor** | default | pointer | instant |

### Apa yang Tidak Boleh Berubah?

| Elemen | Alasan |
|--------|--------|
| **Warna card** | Background putih harus tetap putih. Hover tidak boleh mengubah warna card. |
| **Border card** | Border tetap `border-primary/10`. Tidak perlu highlight border saat hover — itu gaya marketplace. |
| **Posisi teks** | Nama, harga, badge tidak bergerak saat hover. |
| **Visibilitas CTA** | CTA harus selalu terlihat, bukan muncul hanya saat hover. |

### Aturan Hover

1. **Card: shadow meningkat, bukan scale.** Scale card saat hover terasa murahan dan tidak stabil.
2. **Image: scale 1.05.** Sedikit zoom-in pada foto memberikan efek "melihat lebih dekat" yang alami.
3. **CTA: lighten background.** Memberi feedback bahwa tombol bisa diklik.
4. **No rotation, no glow, no underline.** D'Jaemo bukan brand yang heboh. Hover harus tenang dan premium.

### CSS Mapping

```css
/* Card */
.card {
  transition: box-shadow 200ms ease-out;
}
.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Image dalam card */
.card-image {
  transition: transform 200ms ease-out;
}
.card:hover .card-image {
  transform: scale(1.05);
}

/* CTA dalam card */
.card-cta {
  transition: background-color 200ms ease-out;
}
.card:hover .card-cta {
  /* bg-primary → bg-primary-light */
}
```

---

## 9. Mobile Experience

### Ukuran Layar

| Device | Lebar | Grid Kolom | Card Width | Keputusan |
|--------|-------|------------|------------|-----------|
| **Mobile kecil** | 360px | 1 atau 2 kolom | ~170–360px | 1 kolom untuk fokus maksimal |
| **Mobile standar** | 390px | 2 kolom | ~180px | 2 kolom efisien |
| **Mobile besar** | 412px | 2 kolom | ~190px | 2 kolom nyaman |
| **Tablet** | 768–834px | 2 kolom | ~350–390px | 2 kolom, card lebih besar |
| **Desktop** | 1024px+ | 3 kolom | ~300–340px | 3 kolom standar |

### Adaptasi Mobile

| Aspek | Desktop | Mobile |
|-------|---------|--------|
| **Image size** | 300×300px | 170–200×170–200px |
| **Font nama** | `text-lg` (18px) | `text-sm` (15px) |
| **Font harga** | `text-xl` (20px) | `text-base` (16px) |
| **Badge** | Muncul | Muncul (sama) |
| **CTA** | `text-sm py-2.5` | `text-xs py-2` atau `text-sm` (touch 44px) |
| **Card padding** | `p-5` | `p-3` atau `p-4` |
| **Hover** | Ada efek hover | Tidak ada hover (touch device) |

### Aturan Mobile

1. **Touch target CTA minimal 44×44px.** Tidak ada toleransi lebih kecil.
2. **1 kolom vs 2 kolom:** Jika konten produk sedikit (< 4 item), gunakan 1 kolom dengan card besar. Jika banyak, 2 kolom.
3. **Tidak ada hover state di mobile.** Hover tidak berarti di layar sentuh. Fokus ke active state.
4. **Card tidak boleh lebih sempit dari 160px.** Di bawah itu, teks dan gambar terlalu kecil untuk dinilai.
5. **Horizontal scroll dilarang.** Semua card harus muat dalam grid yang bisa di-scroll vertikal.

---

## 10. Purchase Psychology

### Bagaimana Card Meningkatkan Trust?

| Mekanisme | Implementasi | Efek |
|-----------|-------------|------|
| **Foto asli** | Foto produk real, bukan ilustrasi | *"Ini beneran, bukan stok gambar."* |
| **Desain bersih** | Tidak ada iklan, diskon, countdown | *"Brand ini serius."* |
| **Konsistensi** | Semua card seragam | *"Mereka profesional."* |
| **Bahasa sopan** | "Pesan Sekarang" bukan "Beli Sekarang" | *"Ramah, tidak agresif."* |

### Bagaimana Card Meningkatkan Curiosity?

| Mekanisme | Implementasi | Efek |
|-----------|-------------|------|
| **Foto close-up** | Detail tekstur jamur krispi | *"Kelihatan renyah. Saya penasaran rasanya."* |
| **Nama deskriptif** | "Jamur Krispi Original" bukan "Produk A" | *"Original? Ada varian lain?"* |
| **Minimal informasi** | Hanya nama + harga + badge. Tidak ada deskripsi. | *"Saya klik untuk lihat detailnya."* |

### Bagaimana Card Meningkatkan Click-Through?

| Mekanisme | Implementasi |
|-----------|-------------|
| **Hierarchy jelas** | Foto → Nama → Harga — alami mengarah ke klik |
| **CTA visible** | Tidak perlu hover untuk lihat tombol |
| **Card clickable** | Area card penuh adalah link (kecuali CTA) |
| **Harga wajar** | Tidak ada harga yang mengejutkan setelah klik |

### Bagaimana Card Meningkatkan Purchase Intention?

| Mekanisme | Implementasi |
|-----------|-------------|
| **Foto premium** | Foto membuat orang lapar |
| **Harga sebagai value signal** | Harga emas menunjukkan nilai, bukan diskon |
| **Badge kualitas** | Berat (250g) menunjukkan quantity jelas |
| **CTA tegas** | "Pesan Sekarang" mengasumsikan keputusan sudah dibuat |

---

## 11. Design Mistakes

### ❌ Foto Terlalu Kecil

Image area < 50% card → produk tidak dominan, tidak menggugah selera.

### ❌ Card Terlalu Sesak

Nama + Deskripsi + Harga + Badge + Rating + Stok + Diskon + Tombol = terlalu banyak informasi. User tidak bisa fokus.

### ❌ Harga Tidak Jelas

Harga ukuran kecil, warna abu-abu, atau tersembunyi di antara teks lain → user ragu.

### ❌ CTA Hanya Muncul Saat Hover

Mobile tidak punya hover → user tidak pernah melihat CTA.

### ❌ Card Border Berbeda-beda

Ada card dengan `rounded-lg`, ada yang `rounded-2xl` → tidak konsisten, murahan.

### ❌ Shadow Berlebihan

`shadow-lg` atau `shadow-xl` pada card → terasa berat dan tidak profesional.

### ❌ Gambar Stretched

Aspect ratio tidak dijaga → produk terlihat aneh, trust turun.

### ❌ Nama Terpotong Satu Baris

`line-clamp-1` untuk nama yang panjang → informasi tidak lengkap. Gunakan `line-clamp-2`.

### ❌ Mengisi Semua Ruang

Tidak ada whitespace dalam card → terasa seperti marketplace murahan.

### ❌ Hover Scale Card

`hover:scale-105` pada seluruh card → layout grid bergoyang, tidak stabil.

### ❌ Ikon atau Emoji di Card

Bintang, love, share, atau emoji → mengurangi premium feeling.

### ❌ Diskon atau Harga Coret

"Rp30.000 Rp25.000" → D'Jaemo bukan brand diskon. Hanya tampilkan harga final.

---

## 12. Success Criteria

### Bagaimana Product Owner Menilai Card Ini Berhasil?

| Kriteria | Target | Metrik |
|----------|--------|--------|
| **Visual Appeal** | Card terlihat premium dalam 1 detik | Review Design Lead ≥ 8/10 |
| **Click-Through Rate** | User klik card untuk lihat detail | Minimal 15% dari impressions (di atas industri rata-rata 10%) |
| **Harga Terlihat** | User bisa melihat harga tanpa mencari | Eye tracking: harga ditemukan < 0.5 detik |
| **Mobile Usability** | Card nyaman di 360px – 412px | Tidak ada horizontal scroll, touch target ≥ 44px |
| **Consistency** | Semua card identik dalam struktur | Tidak ada variasi padding, font, atau radius |
| **Image Quality** | Semua foto clear di semua ukuran card | No compression artifact, aspect ratio 1:1 |
| **Brand Alignment** | Sesuai brand DNA dan design guide | Premium Checklist lulus 100% |

### Tolok Ukur

| Tingkat | Skor | Tindakan |
|---------|------|----------|
| ✅ **Premium** | 90–100% | Siap implementasi |
| ⚠️ **Perlu Polish** | 70–89% | Revisi minor sebelum implementasi |
| ❌ **Tidak Lulus** | < 70% | Redesain diperlukan |

---

## 13. Visual Principles

### Aturan Mutlak

1. **Foto harus mendominasi 60–65% tinggi card.** Produk adalah bintang. Beri dia panggung.

2. **Nama maksimal dua baris.** Dibatasi dengan `line-clamp-2`. Nama yang panjang > 2 baris dipotong dengan ellipsis. Tidak ada nama produk yang memakan 3+ baris.

3. **Harga selalu terlihat.** Tidak boleh tersembunyi di bawah hover. Tidak boleh sekecil caption. Harga adalah keputusan — tunjukkan dengan percaya diri.

4. **CTA tidak boleh tersembunyi.** CTA primary button harus selalu visible. Tidak ada "muncul saat hover." Mobile tidak punya hover.

5. **Badge maksimal satu.** Hanya satu badge per card. Pilih yang paling relevan (biasanya berat). Jangan tambahkan badge "Best Seller", "Baru", "Limited" — itu gaya marketplace.

6. **Card border: `border-primary/10`.** Tidak tebal, tidak tipis. Opacity 10% memberi batas halus tanpa membuat card terasa berat.

7. **Shadow: `shadow-sm` → `hover:shadow-md`.** Mulai dari subtle, meningkat sedikit saat hover. Tidak pernah `shadow-lg` atau `shadow-xl`.

8. **Tidak ada teks di atas gambar.** Semua teks berada di body card. Gambar adalah gambar murni.

9. **Link mencakup seluruh card (kecuali CTA).** User bisa klik area mana pun untuk menuju halaman detail. CTA adalah tombol independen yang bisa punya aksi sendiri.

10. **Satu font.** Geist Sans untuk semua elemen card. Tidak ada variasi font.

11. **Warna card: `bg-white`.** Card harus putih (#ffffff). Background halaman adalah `bg-background` (#fff8f0). Perbedaan subtle antara card dan page background memberi depth.

12. **Image border-radius: `rounded-xl` (12px).** Berbeda dengan card `rounded-2xl` (16px). Hierarchy radius: card > image.

---

## 14. Do & Don't

### DO

- [x] Foto produk harus menjadi elemen terbesar dan paling kontras dalam card.
- [x] Gunakan `object-cover` dengan aspect 1:1 untuk konsistensi grid.
- [x] Nama produk `line-clamp-2` — jangan potong di 1 baris.
- [x] Harga selalu `text-secondary` dan bold.
- [x] Badge gunakan `bg-accent/10 text-accent` — hanya satu badge.
- [x] CTA full-width di bagian bawah card.
- [x] Gunakan `shadow-sm` sebagai default, `hover:shadow-md` sebagai hover.
- [x] Padding internal card: `p-5`.
- [x] Link wrapping seluruh card untuk kemudahan klik.
- [x] Skeleton loading dengan bentuk yang mirip card final.
- [x] Placeholder SVG untuk produk tanpa gambar.

### DON'T

- [ ] Jangan gunakan foto produk yang buram, pecah, atau stretch.
- [ ] Jangan gunakan `shadow-lg` atau `shadow-xl`.
- [ ] Jangan tampilkan lebih dari satu badge.
- [ ] Jangan gunakan diskon, harga coret, atau "Sale" dalam bentuk apa pun.
- [ ] Jangan gunakan emoji, bintang rating, atau ikon sosial.
- [ ] Jangan sembunyikan CTA di balik hover.
- [ ] Jangan gunakan `hover:scale-105` pada card — hanya pada image.
- [ ] Jangan letakkan teks di atas gambar.
- [ ] Jangan gunakan font berbeda.
- [ ] Jangan gunakan border yang berbeda antar card dalam satu grid.
- [ ] Jangan gunakan carousel produk — gunakan grid.
- [ ] Jangan gunakan background gradient pada card.
- [ ] Jangan gunakan multiple CTA (misal "Detail" + "Beli").
- [ ] Jangan tampilkan stok, SKU, atau informasi operasional di card.
- [ ] Jangan tampilkan testimoni atau rating di card.

---

## 15. Premium Scorecard

### Format Penilaian

Setiap Product Card yang sudah diimplementasikan WAJIB dinilai dengan scorecard ini.

| # | Kategori | Skor (1–10) | Kriteria Skor 10 |
|---|----------|-------------|-------------------|
| 1 | **First Impression** — Apakah card terlihat premium dalam 0.5 detik? | | Layout bersih, foto dominan, tidak ada elemen mengganggu |
| 2 | **Photo Quality** — Apakah foto produk menggugah selera? | | Fokus tajam, lighting natural, warna akurat, crop tepat |
| 3 | **Typography** — Apakah font size, weight, dan warna sesuai guide? | | Nama semibold cokelat, harga bold emas, line clamp tepat |
| 4 | **Spacing** — Apakah whitespace dalam card cukup? | | Padding 20px, jarak antar elemen 16px, tidak sesak |
| 5 | **Premium Feeling** — Apakah card terasa premium, bukan marketplace? | | Tidak ada diskon, tidak ada stok, tidak ada FOMO, bersih |
| 6 | **Trust** — Apakah card membuat user percaya? | | Foto asli, desain rapi, konsisten, bahasa sopan |
| 7 | **CTA** — Apakah CTA jelas dan mudah diakses? | | Full-width, visible, touch target ≥44px mobile |
| 8 | **Mobile** — Apakah card nyaman di 360–412px? | | Tidak horizontal scroll, font terbaca, CTA touchable |
| 9 | **Hover Experience** — Apakah hover terasa premium? | | Shadow meningkat, image scale, CTA lighten, stabil |
| 10 | **Brand Consistency** — Apakah sesuai guide dan card lain? | | Radius, border, shadow, font, warna identik antar card |

### Interpretasi

| Total Skor | Grade | Arti |
|------------|-------|------|
| 90–100 | 🏆 Premium | Siap rilis ke production |
| 75–89 | 👍 Good | Minor polish sebelum rilis |
| 60–74 | 🔧 Needs Work | Revisi diperlukan |
| < 60 | ❌ Poor | Redesain dari awal |

### Lembar Review

```
Product Card: _________________________________
Tanggal:     _________________________________
Reviewer:    _________________________________

  1. First Impression:      ___/10
  2. Photo Quality:         ___/10
  3. Typography:            ___/10
  4. Spacing:               ___/10
  5. Premium Feeling:       ___/10
  6. Trust:                 ___/10
  7. CTA:                   ___/10
  8. Mobile:                ___/10
  9. Hover Experience:      ___/10
  10. Brand Consistency:    ___/10

  TOTAL: ___/100  →  Grade: ________

  Komentar:
  _________________________________________

  Action Items:
  [ ] _________________________________
  [ ] _________________________________

  Status: [ ] Approved  [ ] Revisi  [ ] Redesain
```

---

*Dokumen ini adalah panduan desain Product Card D'Jaemo.  
Semua implementasi Product Card WAJIB mengacu pada dokumen ini.  
Gunakan Premium Scorecard untuk menilai kualitas sebelum rilis.*

*"Setiap gigitan adalah bukti kualitas."*
