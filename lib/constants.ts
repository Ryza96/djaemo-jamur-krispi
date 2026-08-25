export const PARTNER_COMING_SOON = true;

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
