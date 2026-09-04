import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xvjowuwkjcwixvbmvuqq.supabase.co",
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ],
  },
  serverExternalPackages: ["pdfkit", "fontkit", "bwip-js", "qrcode"],
};

export default nextConfig;
