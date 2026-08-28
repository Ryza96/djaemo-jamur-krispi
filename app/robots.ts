import type { MetadataRoute } from "next";

function baseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.trim() !== "") {
    return configured.replace(/\/+$/, "");
  }
  return "https://jamurkrispi.com";
}

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/checkout",
          "/track-order",
          "/login",
          "/partner",
          "/dev",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
