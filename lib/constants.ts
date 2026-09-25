/**
 * Gerbang fitur partner (semua halaman di /partner/*): saat `true`,
 * halaman partner menampilkan tampilan "Coming Soon" alih-alih isi
 * aslinya.
 *
 * ATURAN (fail-safe — default SELALU tertutup):
 *  1. Development / test (NODE_ENV !== "production", mis. `npm run dev`
 *     di localhost): SELALU TERBUKA (`false`) — tanpa perlu set env var
 *     apapun, supaya halaman partner gampang diuji di localhost.
 *  2. Production (NODE_ENV === "production", mis. Vercel): TERTUTUP
 *     (`true`) secara default, KECUALI env var eksplisit
 *     NEXT_PUBLIC_PARTNER_COMING_SOON diset ke string "false" di
 *     dashboard Vercel → maka TERBUKA (`false`).
 *  3. Nilai apa pun selain string "false" TIDAK membuka gerbang (tetap
 *     tertutup) — sengaja, supaya typo atau nilai tak sengaja tidak
 *     pernah membuka fitur di Production.
 *
 * CATATAN TEKNIS:
 *  - Prefix NEXT_PUBLIC_ agar nilai ter-inline (inlining oleh Next.js
 *    saat build) sehingga bisa dibaca dari server component maupun
 *    client component. Konsekuensinya: mengubah env var ini di Vercel
 *    hanya berlaku setelah REBUILD/REDEPLOY.
 *  - Jangan ubah nilai default di file .env; cukup set env var di
 *    dashboard Vercel bila fitur mau dibuka di Production.
 */
export const PARTNER_COMING_SOON =
  process.env.NODE_ENV !== "production"
    ? false
    : process.env.NEXT_PUBLIC_PARTNER_COMING_SOON !== "false";

export const SITE = {
  name: "Djaemo Jamur Krispi",
  tagline: "Camilan jamur renyah, alami, dan penuh rasa.",
  description:
    "Produk camilan jamur krispi berkualitas dengan bahan alami pilihan.",
  logo: "/images/logo/logo.png",
  email: "nguntaljamor@gmail.com",
  phone: "081239047565",
  address: "Kabupaten Bojonegoro, Jawa Timur 62184",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk" },
  { href: "/cart", label: "Keranjang" },
  { href: "/tentang", label: "Tentang" },
  { href: "/kontak", label: "Kontak" },
] as const;

export const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/djaemojamurcrispy", label: "Instagram" },
  { href: "https://wa.me/6281239047565", label: "WhatsApp" },
] as const;
