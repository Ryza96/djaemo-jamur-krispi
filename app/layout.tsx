import type { Metadata } from "next";
import { Manrope, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { PartnerAuthProvider } from "@/components/partner/PartnerAuthProvider";
import { PublicShell } from "@/components/layout/PublicShell";
import { SITE } from "@/lib/constants";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ToastProvider>
          <CartProvider>
            <PartnerAuthProvider>
              <PublicShell>{children}</PublicShell>
            </PartnerAuthProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
