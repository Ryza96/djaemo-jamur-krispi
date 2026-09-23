import type { NextConfig } from "next";

function getStorageHostname(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const storageHostname = getStorageHostname();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storageHostname
      ? [
          {
            protocol: "https",
            hostname: storageHostname,
            pathname: "/storage/v1/object/public/product-images/**",
          },
        ]
      : [],
  },
  serverExternalPackages: ["pdfkit", "fontkit", "bwip-js", "qrcode"],
};

export default nextConfig;
