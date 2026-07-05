# D'Jaemo — Floating Product Experience

> Versi: 1.0  
> Tanggal: 2026-06-30  
> Status: **Eksplorasi Konsep** — ulang cara produk dipajang, bukan dikotakkan

---

## Daftar Isi

1. [Masalah Fundamental](#1-masalah-fundamental)
2. [Filosofi Panggung, Bukan Kardus](#2-filosofi-panggung-bukan-kardus)
3. [12 Pertanyaan + Analisis](#3-12-pertanyaan--analisis)
4. [Prinsip Floating Product](#4-prinsip-floating-product)
5. [Dari Card ke Stage](#5-dari-card-ke-stage)
6. [Yang Harus Hilang](#6-yang-harus-hilang)
7. [Yang Harus Datang](#7-yang-harus-datang)
8. [Yang Bisa Dipelajari dari Brand Lain](#8-yang-bisa-dipelajari-dari-brand-lain)
9. [Satu Hal yang Saya Ubah](#9-satu-hal-yang-saya-ubah)

---

## 1. Masalah Fundamental

### Card Adalah Penjara

Masalah Product Card saat ini bukan pada warna, font, atau radius.

Masalahnya adalah **struktur itu sendiri.**

Card — dalam bentuk apa pun — adalah **kotak yang membatasi.** Ia memberi sinyal:

> "Ini adalah sebuah unit informasi. Produk hanyalah salah satu isinya."

Padahal yang kita inginkan adalah:

> "Ini adalah sebuah produk. Informasi hanyalah pelengkapnya."

### Perbedaan Krusial

| Card (sekarang) | Stage (yang diinginkan) |
|-----------------|------------------------|
| Produk di dalam kotak | Produk di atas permukaan |
| Batas tegas (border) | Batas samar (whitespace) |
| Informasi bersaing dengan produk | Informasi melayani produk |
| User melihat "card" dulu | User melihat "produk" dulu |
| "Oh, ini card produk." | "Enak nih." |

### Akar Masalah

Kita mendesain card dengan pendekatan **informasi-first**: "Apa yang perlu user ketahui?" Lalu kita masukkan produk.

Seharusnya pendekatan **produk-first**: "Ini produknya. Sekarang, informasi apa yang paling minimal untuk mendukungnya?"

---

## 2. Filosofi Panggung, Bukan Kardus

### Etalase Butik vs Rak Supermarket

| Rak Supermarket | Etalase Butik |
|-----------------|---------------|
| Produk berjejer rapat | Produk punya ruang sendiri |
| Informasi harga besar | Produk lebih besar dari label harga |
| Banyak label, stiker, promo | Hanya nama dan harga |
| Anda mengambil sendiri | Anda diamati, lalu dilayani |
| Fokus pada quantity | Fokus pada kualitas |

Product Card D'Jaemo saat ini, meskipun sudah premium, **masih berada di wilayah Rak Supermarket** dalam hal struktur. Kita perlu bergerak ke **Etalase Butik.**

### Panggung, Bukan Kardus

Bayangkan Anda masuk ke butik jam tangan mewah.

Jam tangan tidak diletakkan di dalam **kotak kardus** dengan tulisan "Nama: Rp25.000. Beli Sekarang."

Jam tangan diletakkan di atas **panggung** — sebuah alas akrilik transparan, dengan pencahayaan spot dari atas, dan latar belakang netral yang membuat jam tangan melayang secara visual.

**Itulah yang harus dilakukan Product Card D'Jaemo.**

### Tiga Pilar Floating Product

| Pilar | Makna | Implementasi Visual |
|-------|-------|---------------------|
| **Levitate** | Produk terlihat melayang, tidak menempel pada apa pun | Bayangan halus di bawah produk, jarak dari tepi container |
| **Breathe** | Produk punya ruang di sekelilingnya — tidak ada yang mendekat | Padding besar, tidak ada teks yang menyentuh area produk |
| **Serve** | Semua elemen lain adalah pelayan, bukan bintang kedua | Nama, harga, CTA — lebih kecil, lebih tenang, tidak bersaing |

---

## 3. 12 Pertanyaan + Analisis

---

### Pertanyaan 1

**Bagaimana membuat produk terlihat mengambang?**

Bukan dengan satu hal, tetapi kombinasi:

| Elemen | Efek |
|--------|------|
| **Bayangan** | Bayangan di bawah produk (bukan di bawah card) menciptakan ilusi bahwa produk berada *di atas* permukaan. Bayangan harus lembut, tidak simetris sempurna — seperti bayangan benda nyata yang diterangi dari satu arah. |
| **Whitespace di sekeliling produk** | Produk dikelilingi ruang kosong yang cukup sehingga ia tidak menyentuh "dinding" container. Makin banyak ruang, makin produk melayang. |
| **Background kontras** | Background container yang lebih gelap atau lebih terang dari produk membuat tepi produk terlihat jelas, memperkuat ilusi melayang. Background putih dengan produk cokelat keemasan: tepi produk terlihat tajam, seolah terlepas dari background. |
| **Tidak ada border container** | Jika container produk memiliki border, produk terlihat "di dalam" sesuatu. Tanpa border, produk terlihat "di atas" sesuatu. |
| **Proporsi** | Produk mengambil 50–60% dari area container. Tidak lebih. Produk yang terlalu besar terasa "menempel." Produk yang pas dengan ruang di sekelilingnya terasa "melayang." |

**Kesimpulan:** Mengambang adalah ilusi yang diciptakan oleh **ruang** dan **bayangan**. Bukan oleh satu elemen, tetapi oleh relasi antara produk, background, dan ruang di sekitarnya.

---

### Pertanyaan 2

**Apakah produk benar-benar perlu berada di dalam sebuah card?**

**Tidak.**

Kata "card" sendiri bermasalah. Card adalah **wadah**. Wadah mengimplikasikan batas. Batas mengimplikasikan "produk ada di sini, jangan lihat ke luar."

Solusinya: **Stage, bukan Card.**

| Card | Stage |
|------|-------|
| Memiliki border | Tidak memiliki border |
| Background putih eksplisit | Background menyatu dengan halaman |
| Padding sebagai "dinding dalam" | Padding sebagai "jarak aman" |
| Produk *di dalam* stage | Produk *di atas* stage |

**Visual Stage:**

```
                                      
                                      
    ┌──────────────────────────┐      
    │                          │      Stage adalah area yang didefinisikan
    │         PRODUK           │      oleh ruang, bukan oleh garis.
    │         (mengambang)     │      
    │                          │      Tidak ada border.
    │                          │      Tidak ada background kotak.
    └──────────────────────────┘      Hanya produk dan ruang di sekelilingnya.
          Nama Produk                 
          Rp25.000                    
          [Lihat Detail]              
                                      
```

Stage hanyalah **area yang didefinisikan oleh jarak** — jarak dari tepi ke produk, jarak dari produk ke teks, jarak dari teks ke CTA. Tidak ada garis, tidak ada kotak.

---

### Pertanyaan 3

**Bagaimana membuat user merasa "saya ingin mengambil produk itu" padahal hanya melihat gambar?**

Ini adalah pertanyaan psikologis, bukan visual.

Ada tiga mekanisme:

**1. Scale yang tepat.**

Produk yang difoto dari jarak yang membuatnya terlihat **seukuran aslinya** atau sedikit lebih kecil menciptakan keinginan untuk "mengambil."

Produk yang terlalu besar (close-up ekstrim) menciptakan kekaguman, bukan keinginan. Produk yang terlalu kecil menciptakan rasa jauh.

**Sweet spot:** Produk dalam frame sehingga Anda bisa membayangkan memegangnya. Proporsi yang sama dengan saat Anda mengambil sekantong camilan dari rak.

**2. Tekstur yang terlihat nyata.**

Foto yang menampilkan tekstur permukaan — butiran tepung, lipatan jamur, kilau minyak — membuat otak kita mensimulasikan sentuhan. Semakin nyata teksturnya, semakin kuat keinginan untuk memegang.

**3. Bayangan yang meyakinkan.**

Bayangan produk yang natural — tidak terlalu gelap, tidak terlalu terang, arah yang konsisten — meyakinkan otak bahwa benda ini **nyata**, bukan gambar datar. Otak kita secara naluriah ingin mengambil benda yang terlihat nyata.

---

### Pertanyaan 4

**Bagaimana membuat packaging dan isi jamur terlihat dalam satu komposisi?**

**Masalah:** Packaging dan isi jamur adalah dua hal yang berbeda secara visual. Packaging adalah kotak/dus. Isi jamur adalah makanan. Menyatukan mereka dalam satu card tanpa membuatnya ramai adalah tantangan.

**Tiga pendekatan:**

**Pendekatan A: Flat Lay Komposisi**

Produk diletakkan di atas meja bersama kemasannya. Kemasan di pojok kiri atau kanan, isi jamur di piring kecil di tengah, atau sebaliknya. Satu foto, dua subjek, komposisi rapi.

*Kelebihan:* Satu gambar, natural, estetik.
*Kekurangan:* Memerlukan styling fotografi yang konsisten. Dua subjek dalam satu gambar bisa bersaing.

**Pendekatan B: Produk Sebagai Hero, Kemasan Sebagai Badge**

Foto hanya menampilkan isi jamur — close-up yang menggugah selera. Informasi kemasan (berat, varian) disampaikan melalui badge atau teks kecil di body card. Kemasan fisik tidak perlu muncul di foto.

*Kelebihan:* Fokus penuh ke appetite. Card tetap bersih.
*Kekurangan:* Brand building dari packaging tidak terlihat.

**Pendekatan C: Stage Berganda**

Card memiliki dua "stage" — stage utama untuk isi jamur (hero, besar), stage kecil untuk kemasan (small, di samping atau di bawah). Ini seperti meja dapur: sepiring jamur krispi di tengah, kemasannya di samping.

*Kelebihan:* Keduanya terlihat, masing-masing punya ruang.
*Kekurangan:* Card lebih kompleks, risiko terlalu ramai.

**Rekomendasi:** **Pendekatan A + B hybrid.** Gunakan flat lay untuk produk unggulan (hero section, featured products). Gunakan foto isi jamur saja untuk grid produk biasa. Kemasan diperkenalkan di halaman detail.

---

### Pertanyaan 5

**Bagaimana menggunakan ruang kosong?**

Bukan agar terlihat minimal. **Tetapi agar perhatian langsung menuju produk.**

Ruang kosong adalah **arah pandang**.

| Teknik Visual | Efek pada Arah Pandang |
|---------------|------------------------|
| Ruang kosong di kiri produk | Mata masuk dari kiri, langsung ke produk |
| Ruang kosong di atas produk | Produk terasa "penting" — seperti judul |
| Ruang kosong merata | Produk terasa "tenang" — tidak ada tekanan |
| Ruang kosong asimetris | Produk terasa "dinamis" — ada gerakan |

**Prinsip:** Ruang kosong bukan "apa yang tidak ada." Ruang kosong adalah **jalan** yang mengarahkan mata ke produk. Jika ruang kosong tidak mengarah ke produk, maka ruang itu salah tempat.

**Contoh:**

```
Buruk:
┌──────────────────────┐
│                      │  ← ruang kosong di sini tidak mengarah ke mana-mana
│     FOTO PRODUK      │
│                      │
│ Nama                 │
│ Harga                │
│ Button               │
└──────────────────────┘

Baik:
┌──────────────────────┐
│                      │
│                      │
│     FOTO PRODUK      │  ← produk adalah satu-satunya tujuan
│                      │
│                      │  ← ruang memisahkan produk dari informasi
│──────────────────────│
│ Nama                 │  ← informasi di bawah, tidak bersaing
│ Harga                │
│ Button               │
└──────────────────────┘
```

Pemisahan tegas antara **zona produk** (atas, luas, sunyi) dan **zona informasi** (bawah, kompak, fungsional) menggunakan ruang kosong sebagai **pemisah** — bukan garis, bukan border.

---

### Pertanyaan 6

**Bagaimana seharusnya CTA muncul?**

CTA adalah **pintu keluar** dari card menuju halaman detail. Semakin besar dan terang pintunya, semakin user tergoda untuk keluar dari halaman ini sebelum melihat produk lain.

**Paradoks CTA:** CTA yang terlalu kuat membuat user cepat pergi. CTA yang terlalu lembut membuat user bingung.

**Solusi untuk D'Jaemo: CTA sebagai undangan, bukan perintah.**

| Gaya CTA | Efek | Cocok untuk |
|----------|------|-------------|
| Primary button besar, full-width | "Klik saya!" — efektif tapi agresif | Marketplace, konversi tinggi |
| Ghost button, text-only | "Kalau mau..." — sopan tapi lemah | Brand artisan |
| Icon/arrow saja | "Ada lagi di sini" — misterius | Brand fashion |
| **Text + arrow, ghost** | "Lihat Detail →" — mengundang, jelas, tidak memaksa | **D'Jaemo** |
| Hover-only CTA | "...
(baru muncul kalau disentuh) | Brand berani, mobile riskan | — |

**Rekomendasi:** CTA sebagai text link dengan arrow, ghost style. Tidak full-width — hanya selebar teksnya. Biarkan produk yang menjadi fokus, bukan tombol.

**Tapi —** ini untuk tahap eksplorasi. Jika data menunjukkan konversi rendah, CTA bisa dinaikkan ke primary button. Tapi mulai dari yang paling tenang, lalu tingkatkan jika perlu.

---

### Pertanyaan 7

**Apa yang harus pertama kali dilihat user dalam dua detik pertama?**

**Produk. Hanya produk. Bukan yang lain.**

Urutan yang ideal:

| Waktu | Melihat | Seharusnya |
|-------|---------|------------|
| 0–0.5s | Area terluas, kontras tertinggi | **Produk** — foto jamur krispi |
| 0.5–1s | Area kontras tertinggi kedua | **Ruang kosong** — yang membuat produk "bernapas" |
| 1–1.5s | Area dengan teks terbesar | **Nama produk** — untuk konfirmasi |
| 1.5–2s | Area dengan warna paling kontras (emas) | **Harga** — untuk keputusan |

**Aturan Mutlak:**

Tidak boleh ada yang dilihat sebelum produk.

- Logo brand di card? ❌ Tidak — logo cukup di header.
- Badge "Best Seller"? ❌ Tidak — tidak perlu.
- Badge berat? ⚠️ Mungkin — tapi harus sangat kecil.
- CTA? ❌ Tidak — CTA adalah langkah terakhir.
- Harga? ❌ Tidak dalam 0–1 detik — harga adalah langkah ketiga.

---

### Pertanyaan 8

**Apa yang harus HILANG dari Product Card lama?**

| Elemen | Harus Hilang? | Alasan |
|--------|---------------|--------|
| **Border card** | ✅ HILANG | Border membatasi produk. Tanpa border, stage terasa lebih luas. |
| **Shadow card** | ✅ HILANG | Shadow card menciptakan ilusi "kotak." Produk yang melayang tidak butuh kotak. |
| **Badge berat** | ⚠️ Opsional | Jika berat adalah informasi penting untuk keputusan, pertahankan sebagai teks kecil, bukan badge. |
| **Deskripsi** | ✅ SUDAH HILANG | (sudah dihapus di UI-006) |
| **Background kontras card** | ✅ HILANG | Card menyatu dengan background halaman. Stage tidak butuh kontras — produk yang kontras. |
| **CTA button penuh** | ⚠️ Opsional | Ganti dengan ghost link. Tapi jika konversi turun, kembalikan. |
| **Rounded corners** | ⚠️ Tergantung | Tanpa border, rounded corners tidak punya fungsi. Bisa dihilangkan atau dipertahankan sebagai "sisa" dari era card. |

**Total yang bisa dihapus: 5 dari 7 elemen.**

Yang tersisa hanyalah:

```
Foto produk (mengambang)
Nama produk
Harga
CTA (ghost)
Berat (teks kecil)
```

---

### Pertanyaan 9

**Jika card dicetak hitam putih, apakah masih premium?**

**Ya — jika hierarki visualnya kuat.**

Tanpa warna, yang tersisa hanyalah:

- **Kontras tonal** — produk vs background
- **Ukuran** — besar vs kecil
- **Weight font** — bold vs regular
- **Spacing** — ruang vs isi

**Tes hitam putih untuk setiap konsep:**

| Konsep | Hasil Hitam Putih | Alasan |
|--------|-------------------|--------|
| Card saat ini (dengan border, shadow) | ❌ Biasa saja | Tanpa warna emas dan cokelat, card kehilangan karakter. Border dan shadow terasa "berat" tanpa warna. |
| Tanpa border, shadow, background kontras | ✅ Premium | Yang tersisa adalah proporsi, spacing, dan hierarki font. Ini adalah elemen desain paling murni. Bedanya antara "tata letak" dan "desain." |

**Kesimpulan:** Jika desain hanya mengandalkan warna untuk terlihat premium, ia tidak benar-benar premium. Floating product tanpa border/shadow akan tetap premium di hitam putih karena kekuatannya ada di **proporsi dan ruang**, bukan warna.

---

### Pertanyaan 10

**Jika semua shadow dihapus, apakah masih elegan?**

**Ya — justru lebih elegan.**

Shadow adalah kruk. Shadow memberi ilusi kedalaman pada desain datar. Tapi shadow juga menambah "kebisingan visual."

Tanpa shadow sama sekali:

- Produk terlihat lebih **flat** — seperti ilustrasi atau pattern
- Tapi — jika fotografi produk sudah memiliki dimensi (lighting, bayangan alami), shadow tambahan tidak diperlukan
- Desain tanpa shadow terasa **lebih jujur** — tidak mencoba menjadi 3D palsu

**Catatan penting:** Yang dimaksud shadow di sini adalah **box-shadow** CSS. Bukan bayangan alami pada foto produk. Bayangan alami pada foto — yang muncul karena lighting — adalah bagian dari fotografi dan tetap diperlukan.

**Kesimpulan:** Hapus semua `box-shadow`. Biarkan fotografi produk yang memberikan dimensi. Ini lebih bersih, lebih jujur, lebih premium.

---

### Pertanyaan 11

**Bagaimana Apple, Aesop, dan Muji memajang produknya?**

#### Apple — Produk Melayang di Atas Latar Belakang

Apa yang dilakukan Apple:
- Produk selalu difoto dengan latar belakang putih bersih
- Produk "melayang" tanpa bayangan yang terlihat — seolah tersuspensi di udara
- Tidak ada teks di atas gambar produk di halaman grid
- Hanya nama produk dan harga di bawah, dalam font yang sangat bersih

Apa yang bisa dipelajari tanpa meniru:
- **Latar belakang putih pada foto produk** adalah kanvas paling aman — produk apa pun akan kontras
- **Produk adalah satu-satunya subjek** dalam gambar — tidak ada props bersaing
- **Informasi produk terpisah total dari gambar** — tidak ada tumpang tindih
- **Font sangat tenang** — tidak berteriak, tidak bersaing

#### Aesop — Produk dalam "Ruang Negatif" yang Luas

Apa yang dilakukan Aesop:
- Produk difoto dalam komposisi yang tidak biasa — miring, tidak sentral, sering terpotong
- Background gelap atau hangat, bukan putih
- Banyak ruang kosong — produk hanya mengambil 30–40% frame
- Nama produk kecil, di pojok, hampir tidak terlihat
- Harga lebih kecil lagi — atau tidak ada di grid

Apa yang bisa dipelajari tanpa meniru:
- **Keberanian untuk tidak sentral** — produk tidak harus di tengah untuk menjadi fokus
- **Keberanian untuk membuat teks sangat kecil** — biarkan produk yang berbicara
- **Ruang kosong yang sangat banyak** lebih baik daripada sedikit

#### Muji — Produk Tanpa Hiasan

Apa yang dilakukan Muji:
- Foto produk sangat sederhana — hampir seperti katalog
- Tidak ada styling, tidak ada props, tidak ada angle dramatis
- Background putih, produk di tengah
- Nama produk dalam font minimal, hitam, ukuran kecil
- Harga dalam font yang sama, ukuran sama

Apa yang bisa dipelajari tanpa meniru:
- **Kesederhanaan ekstrem menciptakan premium** — ketika tidak ada yang bisa dihapus lagi
- **Konsistensi adalah brand** — setiap produk difoto dengan cara yang persis sama
- **Fungsi adalah estetika** — card tidak perlu "cantik," cukup "jelas"

#### Sintesis untuk D'Jaemo

| Dari | Dipelajari | Diterapkan |
|------|------------|------------|
| Apple | Background putih, produk melayang | Foto produk dengan bg putih, tanpa props |
| Aesop | Ruang kosong berani, font kecil | Stage dengan whitespace ekstra, nama tidak perlu besar |
| Muji | Kesederhanaan ekstrim, konsistensi | Setiap produk diperlakukan sama — seragam |

---

### Pertanyaan 12

**Bagaimana cara membuat user berkata "Enak nih." bahkan sebelum membaca nama produk?**

Ini adalah pertanyaan tentang **fotografi**, bukan desain card.

Tapi ada hubungannya dengan card: **card harus keluar dari jalan.**

Ketika user melihat grid produk, otak mereka memproses:

1. Pertama: elemen terbesar, paling kontras → **harus produk**
2. Kedua: warna paling menarik → **harus produk (emas, cokelat keemasan)**
3. Ketiga: teks → **nama produk**

Jika urutan ini berhasil, user sudah berkata "Enak nih." di langkah 1–2, sebelum membaca nama.

**Cara memastikan urutan ini:**

1. **Produk adalah satu-satunya elemen visual** di area atas card. Tidak ada ikon, tidak ada badge, tidak ada teks.
2. **Tidak ada border atau shadow card** yang bersaing dengan tepi produk.
3. **Background card menyatu dengan background halaman** — sehingga yang terlihat kontras adalah produk, bukan card.

---

## 4. Prinsip Floating Product

### Ringkasan 5 Prinsip

| # | Prinsip | Implementasi |
|---|---------|--------------|
| 1 | **Produk melayang, card tidak terlihat** | Hapus border, shadow card. Stage menyatu dengan background. |
| 2 | **Produk punya zona eksklusif** | Area atas card (60%+) hanya untuk produk. Tidak ada teks, ikon, atau elemen lain. |
| 3 | **Bayangan adalah milik produk, bukan card** | Jika ada bayangan, bayangan itu di bawah produk (dari foto asli), bukan box-shadow CSS. |
| 4 | **Informasi adalah pelayan** | Nama, harga, CTA — lebih kecil, lebih tenang, tidak bersaing dengan produk. |
| 5 | **Konsistensi adalah brand** | Semua produk diperlakukan sama. Pengecualian hanya untuk produk unggulan. |

### Visual Akhir

```
                                      
                                      
          ┌──────────────┐            
          │              │            
          │   PRODUK     │            ← Stage. Tidak ada border.
          │              │            ← Produk "melayang" di atas permukaan.
          │   "Enak"     │            ← Yang pertama dilihat user.
          └──────────────┘            
                                      
                                      
    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─       ← Ruang kosong sebagai pemisah alami
                                      
    Nama Produk                       
    Rp25.000                          ← Informasi, compact, tidak bersaing
    250g                              
                                      
    Lihat Detail →                    ← CTA ghost, undangan bukan perintah
                                      
```

---

## 5. Dari Card ke Stage

### Perubahan Struktur

| Elemen | Sebelum (Card) | Sesudah (Stage) |
|--------|----------------|-----------------|
| Container | `bg-white`, border, shadow | `bg-transparent` (menyatu dengan halaman) |
| Image container | `aspect-square`, `rounded-xl`, `bg-surface-dark`, `p-6` | `aspect-square` atau proporsional, tanpa radius, `bg-transparent` atau putih, tanpa padding |
| Image | `object-contain` dalam container dengan padding | `object-contain` langsung tanpa batas container visual |
| Pemisah image-body | Border image container + padding | **Ruang kosong vertikal** — tidak ada garis pemisah |
| Body | `p-5` dengan background putih | Tanpa background, hanya teks di atas stage |
| Nama | `text-primary`, semibold | Sama, atau lebih kecil (medium weight) |
| Harga | `text-secondary`, bold, ukuran besar | Sama, atau sedikit lebih kecil |
| Badge | `bg-accent/10`, rounded-full | Teks saja, warna accent, tanpa background badge |
| CTA | Primary button, full-width | Ghost link, "Lihat Detail →", selebar teks |
| Hover | Card lift + shadow + image scale | Tidak ada hover pada stage. Hover hanya pada CTA dan image |

### Grid Tanpa Card

Bayangkan grid produk di halaman `/produk`:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│   │         │    │         │    │         │         │
│   │ PRODUK  │    │ PRODUK  │    │ PRODUK  │         │
│   │         │    │         │    │         │         │
│   └─────────┘    └─────────┘    └─────────┘         │
│                                                      │
│   Nama A         Nama B         Nama C               │
│   Rp25.000       Rp25.000       Rp25.000             │
│   Lihat Detail → Lihat Detail → Lihat Detail →       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Tidak ada card.** Yang ada adalah:
- Produk di tengah stage-nya masing-masing
- Ruang antar stage (gap grid)
- Informasi di bawah setiap stage

**Setiap produk adalah sebuah pulau kecil** di lautan ruang kosong.

---

## 6. Yang Harus Hilang

### Checklist Penghapusan

| No | Elemen | Dihapus? | Dampak |
|----|--------|----------|--------|
| 1 | `bg-white` pada card | ✅ | Stage menyatu dengan background halaman |
| 2 | `border` pada card | ✅ | Stage tidak memiliki batas, produk tidak terkurung |
| 3 | `shadow-sm` pada card | ✅ | Ilusi "card" hilang. Produk tidak berada di dalam kotak |
| 4 | `rounded-2xl` pada card | ✅ | Tanpa border, radius tidak berfungsi |
| 5 | `bg-surface-dark` pada image container | ✅ | Image container tidak perlu background — produk melayang di atas halaman |
| 6 | `rounded-xl` pada image container | ✅ | Tanpa container visual, radius tidak diperlukan |
| 7 | Badge `bg-accent/10` | ✅ | Berat cukup ditulis sebagai teks, tanpa background |
| 8 | Padding `p-5` pada body | ⚠️ Parsial | Teks tetap butuh jarak dari tepi, tapi tidak perlu padding penuh |
| 9 | CTA sebagai primary button | ⚠️ Opsional | Ganti dengan ghost link. Tergantung data konversi |
| 10 | `hover:-translate-y-0.5` pada card | ✅ | Stage tidak bergerak saat hover — biarkan produk diam |
| 11 | `hover:shadow-md` pada card | ✅ | Tidak ada shadow — tidak perlu hover shadow |
| 12 | `group-hover:scale-105` pada image | ⚠️ Opsional | Boleh dipertahankan sebagai "undangan" untuk melihat lebih dekat |

**Total elemen yang dihapus: 10 dari Community**

---

## 7. Yang Harus Datang

### Checklist Penambahan

| No | Elemen | Ditambahkan | Fungsi |
|----|--------|-------------|--------|
| 1 | **Ruang vertikal yang lebih besar** antara image dan teks | ✅ | Pemisah alami: produk vs informasi |
| 2 | **Foto dengan background putih** untuk semua produk | ✅ | Produk kontras dengan halaman krem |
| 3 | **Bayangan alami dari foto** (dari lighting) | ✅ | Dimensi produk tanpa CSS shadow |
| 4 | **Font nama yang lebih tenang** (medium weight, bukan semibold) | ✅ | Nama tidak bersaing dengan produk |
| 5 | **Berat sebagai teks** (bukan badge) | ✅ | Informasi tanpa elemen dekoratif |
| 6 | **CTA ghost dengan arrow** | ✅ | Undangan, bukan perintah |
| 7 | **Hover hanya pada area image** | ✅ | Stage tetap tenang, hanya produk yang "bergerak" |

---

## 8. Yang Bisa Dipelajari dari Brand Lain

### Pelajaran, Bukan Tiruan

| Brand | Pelajaran | Cara Menerapkan untuk D'Jaemo |
|-------|-----------|-------------------------------|
| **Apple** | Produk melayang di atas kanvas putih | Foto produk dengan background putih. Biarkan produk menjadi satu-satunya subjek. |
| **Aesop** | Ruang kosong yang sangat berani | Jangan takut dengan 60% area kosong dalam card. Itu bukan pemborosan — itu investasi premium. |
| **Muji** | Konsistensi adalah brand | Setiap foto produk harus memiliki komposisi, lighting, dan background yang sama. Tidak ada variasi. |
| **Nike** | Produk dalam aksi | Jamur krispi yang "direbut" dari frame — seolah baru saja digoreng, uap masih terlihat. |
| **Glossier** | Produk dipegang tangan | Menunjukkan skala dan keintiman. Foto tangan memegang kemasan. Tapi hati-hati — terlalu personal. |
| **Olipop** | Warna background cerah yang kontras | Background foto yang sedikit berwarna (hijau sage, krem) untuk membuat produk cokelat keemasan lebih menonjol. |

---

## 9. Satu Hal yang Saya Ubah

> **Jika saya hanya boleh mengubah SATU HAL pada Product Card saat ini, maka saya akan mengubah:**

### Hapus Card Container Sepenuhnya.

Bukan border-nya saja. Bukan shadow-nya saja. **Bukan warnanya saja.**

**Card container itu sendiri.**

Saya akan menghapus `bg-white`, `border`, `shadow`, `rounded-2xl` — seluruh lapisan yang membuat stage ini terlihat seperti "card."

**Mengapa?**

Karena "card" adalah pola pikir yang salah.

Card membuat kita — designer dan engineer — berpikir bahwa produk adalah **salah satu isi** dari sebuah kotak. Padahal yang kita inginkan: produk adalah **satu-satunya** fokus.

Ketika card container dihapus:
- Produk terpajang di atas halaman, bukan di dalam kotak
- Tidak ada "dinding" yang membatasi perhatian user
- Yang tersisa hanyalah produk, nama, harga, dan aksi
- Tidak ada yang bisa bersaing dengan produk

**Dampak Visual:**

| Sebelum | Sesudah |
|---------|---------|
| User melihat "card putih" → lalu produk | User melihat **produk** — langsung |
| Ada batas tegas antara card dan halaman | Tidak ada batas — produk "keluar" dari stage |
| Card menciptakan "hirarki buatan" | Hirarki alami: produk > informasi |
| Terlihat seperti "e-commerce pada umumnya" | Terlihat seperti **brand** — bukan toko |

**Dampak Psikologis:**

Tanpa card, tanpa batas, tanpa kotak — otak user memproses produk dengan cara yang berbeda. Produk tidak lagi "barang di rak toko online." Produk adalah **benda nyata yang dipajang di depan Anda.**

**Resiko:**

| Risiko | Mitigasi |
|--------|----------|
| Card tidak terlihat sebagai elemen yang bisa diklik | Image container tetap memiliki `cursor: pointer` dan area klik yang jelas |
| Grid kehilangan struktur visual | Gap grid yang konsisten (24–32px) tetap menjaga pemisahan antar produk |
| Produk "hilang" di background | Foto produk dengan background putih — kontras dengan halaman krem (#fff8f0) |

**Mengapa Ini Satu Hal Paling Penting?**

Karena semua perbaikan lain — typography yang lebih baik, spacing yang lebih longgar, foto yang lebih bagus — hanya akan **mempercantik card**.

Menghapus card container adalah satu-satunya perubahan yang **mengubah esensi** — dari "etalase rak supermarket" menjadi "panggung butik."

---

*"Setiap gigitan adalah bukti kualitas."*
