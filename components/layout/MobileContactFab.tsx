import { SITE } from "@/lib/constants";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.9 9.9 0 0 0 4.74 1.21h.01c5.45 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.86 9.86 0 0 0 12.04 2zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.05 8.05 0 0 1 2.37 5.73c0 4.47-3.63 8.1-8.1 8.1a8.1 8.1 0 0 1-4.15-1.14l-.3-.18-3.12.82.83-3.04-.2-.32a8.07 8.07 0 0 1-1.24-4.31c0-4.46 3.63-8.1 8.1-8.1zm-2.98 4.38c-.15 0-.4.06-.6.28-.2.22-.79.77-.79 1.88s.81 2.18.92 2.33c.11.15 1.59 2.43 3.86 3.41 1.9.82 2.28.66 2.7.62.41-.04 1.33-.54 1.52-1.07.19-.52.19-.97.13-1.07-.06-.1-.22-.15-.46-.27-.24-.11-1.43-.7-1.65-.78-.22-.08-.38-.12-.55.11-.16.24-.63.78-.77.94-.14.15-.28.17-.53.06-.24-.11-1.03-.38-1.96-1.21-.73-.65-1.22-1.45-1.36-1.7-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.11-.55-1.32-.75-1.81-.2-.47-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01z" />
    </svg>
  );
}

export function MobileContactFab() {
  const waLink = `https://wa.me/62${SITE.phone.replace(/\D/g, "").replace(/^0/, "")}`;

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi kami via WhatsApp"
      className="fixed bottom-[86px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-teal-deep shadow-lg shadow-gold/30 transition-all duration-200 hover:scale-105 hover:bg-gold-bright active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:hidden"
    >
      <WhatsAppIcon />
    </a>
  );
}
