export const SITE = {
  name: "Djaemo Jamur Krispi",
  tagline: "Camilan jamur renyah, alami, dan penuh rasa.",
  description:
    "Produk camilan jamur krispi berkualitas dengan bahan alami pilihan.",
  logo: "/images/logo/logo.png",
  email: "hello@djaemojamurkrispi.com",
  phone: "+62 812-3904-7565",
  address: "Indonesia",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk" },
  { href: "/cart", label: "Keranjang" },
  { href: "/tentang", label: "Tentang" },
  { href: "/kontak", label: "Kontak" },
] as const;

export const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://wa.me/6281239047565", label: "WhatsApp" },
] as const;
