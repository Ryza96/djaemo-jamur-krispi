import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600; // regenerate sitemap every 1 hour (ISR)

function baseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.trim() !== "") {
    return configured.replace(/\/+$/, "");
  }
  return "https://jamurkrispi.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();

  // Query all products (there is no is_active/status column in the products
  // table, so every product is included).
  const { data: products, error } = await supabase
    .from("products")
    .select("id");

  if (error) {
    console.error("sitemap: failed to load products:", error);
  }

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map(
    (product) => ({
      url: `${base}/produk/${product.id}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  return [
    {
      url: base,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/produk`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/tentang`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/kontak`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...productEntries,
  ];
}
