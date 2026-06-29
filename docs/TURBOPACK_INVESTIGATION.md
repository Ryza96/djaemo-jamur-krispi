# Turbopack Investigation Report — Page Refresh Loop

## Environment

| Context | Value |
|---------|-------|
| Next.js | 16.2.9 |
| React | 19 |
| Bundler | Turbopack (default in Next.js 16) |
| OS | Windows |
| Package manager | npm |
| Symptom | Halaman melakukan full page reload terus-menerus (~2-4x/dtk) |
| Confirmed | `next dev --webpack` works; `next dev` (Turbopack) breaks |

---

## 1. Apakah ini Bug yang Sudah Diketahui?

**YA — ini adalah bug yang sudah dikenal dan sedang aktif dilaporkan.**

Bug ini didokumentasikan di Issue GitHub **#94634**: *"infinite refresh loop and crashes in next.js 16.2.7"* yang memiliki gejala persis sama: halaman masuk ke infinite refresh loop pada Next.js versi 16.2.7 dan 16.2.9. Masalah hanya terjadi dengan Turbopack, dan hilang saat menggunakan Webpack.

---

## 2. Issue GitHub yang Relevan

### Primary Issue

| Field | Value |
|-------|-------|
| **Issue** | [#94634 — infinite refresh loop and crashes in next.js 16.2.7](https://github.com/vercel/next.js/issues/94634) |
| **Status** | **Open** |
| **Labels** | (no labels assigned yet) |
| **Reporter** | ken-spencer |
| **Tanggal** | 2026-06-10 |
| **Affected versions** | 16.2.7, **16.2.9** ✓ |

**Gejala yang dilaporkan:**
- Di Firefox, halaman yang menggunakan PPR masuk ke infinite refresh loop
- Tidak terjadi di 16.2.6, muncul di 16.2.7 dan masih ada di 16.2.9
- Halaman _refresh loop_ terus-menerus tanpa henti

**Update dari maintainer:**
- Bukan PPR-related, melainkan _Cache Components_ issue
- Di-triage ke `16.2.1-canary.46` sebagai first-bad version
- **Fixed** di `16.3.0-canary.30` melalui PR [#94128](https://github.com/vercel/next.js/pull/94128)
- Belum dirilis di stable — harus pakai `next@canary`

**Additional context dari user lain di issue yang sama:**
- Juga terjadi di Pages Router — WebSocket HMR gagal terkoneksi 10-12 kali sebelum halaman reload
- Versi 16.1.7 aman, versi 16.2.0 sampai 16.2.9 semua bermasalah
- Fix dikonfirmasi bekerja di `16.3.0-canary.30+`

### Secondary Issues

| Issue | Status | Relevance |
|-------|--------|-----------|
| [#92534](https://github.com/vercel/next.js/issues/92534) — Turbopack panic loop on Windows (pnpm) | **Open** | Windows + Turbopack + loop. Workaround: `--webpack`. **Mirip tapi root cause berbeda** (Next.js package not found) |
| [#87322](https://github.com/vercel/next.js/issues/87322) — Infinite compiling loop (og-image + Turbopack) | **Closed/Fixed** | Kompilasi loop, bukan page reload. Fixed di 16.1.1-canary.27 |
| [#78957](https://github.com/vercel/next.js/issues/78957) — Turbopack dev mode fast refresh loop | **Closed/Fixed** | Fast Refresh loop → full page reload. Fixed di 16.0.0-canary.7 |
| [#68441](https://github.com/vercel/next.js/issues/68441) — Permanent reloads after deleting page 2x | **Closed/Fixed** | Permanent reload loop dengan Turbopack. Fixed di 15.0.0-canary.154 |
| [#92372](https://github.com/vercel/next.js/issues/92372) — Infinite Suspense remount cycle | **Investigated** | Turbopack + React.lazy() menyebabkan unmount/remount cycle. Workaround: `--webpack` |
| [#89530](https://github.com/vercel/next.js/issues/89530) — Excessive Fast Refresh rebuilds (Bun+Windows) | **Open** | Hanya dengan Bun runtime, tidak dengan Node |

---

## 3. Discussion GitHub yang Relevan

| Discussion | Key Points |
|------------|------------|
| [#89397](https://github.com/vercel/next.js/discussions/89397) — "Failed to write app endpoint" + infinite refresh loop | Workaround: `rm -rf node_modules .next && npm install`. User report: "whenever I run app with Turbopack, in a page I get stuck in infinite refresh loop" |
| [#94227](https://github.com/vercel/next.js/discussions/94227) — "Failed to write app endpoint /page" on Windows | Root cause: Windows error 1450 — exhausted file handles. Turbopack's RocksDB cache grows `.sst`/`.meta` files. Fix: kill Node processes + delete `.next` |
| [#77102](https://github.com/vercel/next.js/discussions/77102) — Dev server stuck in compiling + extreme CPU/memory | "HMR/react-fast-refresh triggers HTTP request → HTTP request triggers compilation → compilation triggers another HMR" = infinite loop |
| [#85800](https://github.com/vercel/next.js/discussions/85800) — "Connection forcibly closed" on Windows | Turbopack worker process crashes on Windows. CSS/PostCSS subprocess bug |

---

## 4. Changelog Next.js

### Versi yang Terkena Dampak

| Version | Release Date | Status |
|---------|-------------|--------|
| 16.2.0 | 2026-03-18 | First version with Server HMR enabled by default |
| 16.2.1 | 2026-03-? | Bug regression starts (first-bad: 16.2.1-canary.46) |
| 16.2.7 | 2026-06-? | Infinite refresh loop confirmed |
| **16.2.9** | 2026-06-? | **BUG MASIH ADA — versi yang digunakan project** |
| 16.3.0-canary.30 | 2026-06-? | **Fixed** via PR #94128 |

### Perubahan yang Relevan per Versi

**Next.js 16.2.0** — Turbopack menjadi default bundler. Server HMR diaktifkan secara default:
- `Turbopack: Enable server HMR by default for app pages` (#91476)
- `Turbopack: enable server HMR for app route handlers` (#91466)

**Next.js 16.2.1-canary.46** — First version where the refresh loop bug was introduced (per triage di #94634).

**Next.js 16.2.3** — Fix: `Turbopack: exclude metadata routes from server HMR` (#92034)

**Next.js 16.2.4** — Fix: `fix(server-hmr): metadata routes overwrite page runtime HMR handler` (#92273)
- Fix: `Turbopack: fix filesystem watcher config not applying follow_symlinks(false)` (#92631)

**Next.js 16.3.0-canary.30** — **Fix untuk infinite refresh loop** via PR #94128

---

## 5. Apakah Sudah Diperbaiki pada Versi Lebih Baru?

**YA — sudah diperbaiki di `next@canary` (16.3.0-canary.30+), BELUM di stable.**

| Versi | Status Fix |
|-------|-----------|
| 16.2.9 (stable, current) | ❌ **BUG MASIH ADA** |
| 16.3.0-canary.30 | ✅ **Fixed** via PR #94128 |
| 16.3.0 (stable, not yet released) | ✅ Akan include fix |

**Cara verifikasi:**
```powershell
npm install next@canary
npm run dev
```

---

## 6. Workaround Resmi

### Workaround Paling Efektif (Confirmed oleh Banyak User)

| Workaround | Source | Efektivitas |
|------------|--------|-------------|
| **`next dev --webpack`** | Official Next.js docs & multiple issues | ✅ **100% efektif** — masalah hilang total |
| **Gunakan `next@canary`** (16.3.0-canary.30+) | Maintainer di #94634 | ✅ **Fix permanen** — tapi masih canary |
| **Clear `.next` cache** (`rmdir /s /q .next`) | Multiple discussions | ⚠️ Sementara — bisa kambuh |
| **Kill lingering Node processes** (`taskkill /F /IM node.exe`) | Discussion #94227 | ⚠️ Sementara |
| **Tambahkan exclusion Windows Defender** | [Next.js local dev guide](https://nextjs.org/docs/app/api-reference/config/next-config-js/devIndicators) | ⚠️ Mencegah file watcher issue |

### Cara Implementasi Workaround di Project Ini

**Opsi A (Direkomendasikan — segera):** Gunakan Webpack

Ubah `package.json`:
```json
{
  "scripts": {
    "dev": "next dev --webpack"
  }
}
```

**Opsi B (Untuk testing):** Upgrade ke canary
```powershell
npm install next@canary
npm run dev
```

---

## 7. Root Cause yang Dijelaskan oleh Tim Next.js

### Root Cause untuk #94634 (Issue Utama)

Berdasarkan triage oleh maintainer:

- **BUKAN** terkait PPR (Partial Prerendering) seperti yang pertama kali diduga
- **BUKAN** terkait metadata routes
- Akar masalah ada di **Cache Components** — mekanisme caching yang diperkenalkan di Next.js 16.2
- Bug diintroduksi di `16.2.1-canary.46`
- Diperbaiki di PR [#94128](https://github.com/vercel/next.js/pull/94128) yang mendarat di `16.3.0-canary.30`

Mekanisme yang memicu refresh loop:
1. Server HMR mengirimkan update ke client
2. Cache components merespons dengan cara yang salah
3. Update tersebut memicu full page reload di client
4. Page reload → request baru ke server → server HMR mengirim update lagi
5. Loop tak terbatas

### Root Cause untuk Masalah Windows + Turbopack Secara Umum

Beberapa isu yang telah diidentifikasi tim Next.js untuk Windows:

1. **File system path separator** (`path.join` vs `posix.join`):
   - Issue #90381: Manifest files menggunakan backslash (`\`) di URL pada Windows
   - Fix: PR #90700 — menggunakan `posix.join` untuk URL paths

2. **Workspace root misdetection**:
   - Issue #92978: Turbopack salah mendeteksi root workspace dari lockfile di parent directory
   - Fix: Set `turbopack.root: __dirname` di `next.config.ts`

3. **Windows reserved device names**:
   - Issue #90860: PostCSS mencoba membaca `NUL` device → panic
   - Fix: Handle error dengan graceful

4. **File handle exhaustion** (RocksDB cache):
   - Discussion #94227: `.sst`/`.meta` files menumpuk → Windows error 1450
   - Fix: Bersihkan `.next` cache secara berkala

### Root Cause untuk HMR Loop (Issue #77102)

Tim Next.js menjelaskan:
> "We have some mitigations in place for this, but there is a rare edge-case you can end up where an HMR/react-fast-refresh triggers an HTTP request, and the HTTP request triggers a (no-op) compilation, which then incorrectly triggers another HMR."

Ini adalah _feedback loop_:
```
HMR update → browser reload → HTTP request → server compiles → HMR update → ...
```

---

## Conclusion & Recommendation

### Diagnosis untuk Project Ini

Berdasarkan bukti yang terkumpul, penyebab page refresh loop di project ini adalah **bug yang sudah dikenal di Next.js 16.2.9 + Turbopack pada Windows**, didokumentasikan di Issue #94634.

Konfirmasi:
| Faktor | Sesuai? |
|--------|---------|
| Versi 16.2.9 affected | ✅ Ya |
| Hanya Turbopack | ✅ Ya |
| Windows | ✅ Ya |
| `next dev --webpack` solves | ✅ Ya |
| Gejala infinite refresh loop | ✅ Ya |

### Rekomendasi

| Opsi | Risiko | Keuntungan |
|------|--------|------------|
| **✅ Gunakan `next dev --webpack`** | Rendah — Webpack lebih lambat tapi stabil | Development bisa lanjut tanpa hambatan |
| **⏸ Upgrade ke `next@canary` (16.3.0-canary.30+)** | Sedang — canary mungkin punya bug lain | Bisa tetap pakai Turbopack |
| **❌ Tetap di 16.2.9 + Turbopack** | Tinggi — page tidak bisa digunakan | — |

### Keputusan

> **PROJECT INI DISARANKAN MENGGUNAKAN WEBPACK (`next dev --webpack`) UNTUK DEVELOPMENT SEMENTARA.**

Alasan:
1. Bug infinite refresh loop membuat Turbopack **tidak bisa digunakan sama sekali** di versi 16.2.9
2. Fix sudah tersedia di `next@canary` tapi **belum rilis di stable**
3. Webpack bekerja dengan baik dan stabil — hanya lebih lambat
4. Setelah Next.js 16.3.0 stable dirilis, upgrade dan coba Turbopack kembali

### Cara Beralih

```powershell
# Di package.json, ubah dev script
# Dari:
# "dev": "next dev"
# Menjadi:
"dev": "next dev --webpack"

# Lalu restart dev server:
taskkill /F /IM node.exe
rmdir /s /q .next
npm run dev
```

### Monitoring

Pantau rilis Next.js 16.3.0 stable di:
- https://github.com/vercel/next.js/releases
- Issue #94634 untuk update status fix

---

## Referensi

| Link | Deskripsi |
|------|-----------|
| [#94634](https://github.com/vercel/next.js/issues/94634) | **Primary issue** — infinite refresh loop 16.2.7+ |
| [PR #94128](https://github.com/vercel/next.js/pull/94128) | Fix yang mendarat di 16.3.0-canary.30 |
| [#92534](https://github.com/vercel/next.js/issues/92534) | Turbopack panic loop Windows (secondary) |
| [#78957](https://github.com/vercel/next.js/issues/78957) | Fast Refresh loop (fixed in 16.0) |
| [#87322](https://github.com/vercel/next.js/issues/87322) | Infinite compiling loop (fixed) |
| [#90381](https://github.com/vercel/next.js/issues/90381) | Manifest file 404 on Windows |
| [Discussion #94227](https://github.com/vercel/next.js/discussions/94227) | Windows file handle exhaustion |
| [Discussion #77102](https://github.com/vercel/next.js/discussions/77102) | HMR feedback loop explanation |
| [Next.js 16.2 Turbopack blog](https://nextjs.org/blog/next-16-2-turbopack) | Official changelog |
| [Next.js local dev guide](https://nextjs.org/docs/app/api-reference/config/next-config-js/devIndicators) | Windows Defender exclusion |

---

*Report generated 2026-06-29. Investigation by opencode.*
