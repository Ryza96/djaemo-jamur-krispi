import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCatalogProducts } from "@/lib/services/product.service";
import { UPLOAD } from "@/lib/constants/upload";
import { requireAdmin } from "@/lib/services/admin-auth.service";

const NAME_MAX = 150;
const DESCRIPTION_MAX = 2000;

function parseIntStrict(raw: unknown, allowZero: boolean): number | null {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || !Number.isInteger(raw)) return null;
    return allowZero ? (raw >= 0 ? raw : null) : raw > 0 ? raw : null;
  }
  if (typeof raw === "string") {
    const s = raw.trim().replace(/^\+/, "");
    if (!/^\d+$/.test(s)) return null;
    const n = Number.parseInt(s, 10);
    if (Number.isNaN(n)) return null;
    return allowZero ? n : n > 0 ? n : null;
  }
  return null;
}

const extractImageUrls = (body: Record<string, unknown>): string[] => {
  const raw = Array.isArray(body.images) ? body.images : [];
  return raw
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
};

const deleteStorageFiles = async (urls: string[]) => {
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const prefix = `/storage/v1/object/public/${UPLOAD.STORAGE_BUCKET}/`;
      if (parsed.pathname.startsWith(prefix)) {
        const path = parsed.pathname.slice(prefix.length);
        await supabase.storage.from(UPLOAD.STORAGE_BUCKET).remove([path]);
      }
    } catch {
      // non-fatal — skip invalid url
    }
  }
};

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  weight: string;
  weight_grams: number;
  images: string[];
};

type ValidationResult =
  | { ok: true; payload: ProductPayload }
  | { ok: false; errors: string[] };

function validateProductPayload(body: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    errors.push("Nama produk wajib diisi.");
  } else if (name.length > NAME_MAX) {
    errors.push(`Nama produk maksimal ${NAME_MAX} karakter.`);
  }

  const price = parseIntStrict(body?.price, false);
  if (price === null) {
    errors.push("Harga wajib diisi angka bulat lebih dari 0.");
  }

  const stock = parseIntStrict(body?.stock, true);
  if (stock === null) {
    errors.push("Stok wajib diisi angka bulat (boleh 0, tidak boleh negatif).");
  }

  const weightRaw =
    body?.weight !== undefined && body?.weight !== null ? body?.weight : body?.weight_grams;
  const weight = parseIntStrict(weightRaw, false);
  if (weight === null) {
    errors.push(
      "Berat (gram) wajib diisi angka bulat lebih dari 0. Berat dipakai untuk menghitung ongkir.",
    );
  }

  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (description.length > DESCRIPTION_MAX) {
    errors.push(`Deskripsi maksimal ${DESCRIPTION_MAX} karakter.`);
  }

  const images = extractImageUrls(body);
  if (images.length === 0) {
    errors.push("Minimal 1 foto produk wajib diunggah.");
  }

  if (errors.length > 0) return { ok: false, errors };

  if (price === null || stock === null || weight === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    payload: {
      name,
      description,
      price,
      stock,
      weight: String(weight),
      weight_grams: weight,
      images,
    },
  };
}

export const GET = async () => {
  try {
    const products = await getCatalogProducts();
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to read products" }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const body = await request.json() as Record<string, unknown>;

    const result = validateProductPayload(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.errors[0], errors: result.errors }, { status: 400 });
    }

    const { images, ...productPayload } = result.payload;

    const { data: product, error } = await supabase
      .from("products")
      .insert([{ id: crypto.randomUUID(), ...productPayload }])
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message, details: error.details ?? null }, { status: 500 });
    }

    if (images.length > 0) {
      const rows = images.map((image_url) => ({ product_id: product.id, image_url }));
      const { error: imgErr } = await supabase.from("product_images").insert(rows);
      if (imgErr) {
        return NextResponse.json({ error: imgErr.message, details: imgErr.details, hint: imgErr.hint, code: imgErr.code }, { status: 500 });
      }
    }

    return NextResponse.json({ ...product, images }, { status: 201 });
  } catch (err) {
    console.error("POST /api/products exception", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
};

export const PUT = async (request: Request) => {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const body = await request.json() as Record<string, unknown>;

    const productId = body?.id;
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "ID produk tidak valid" }, { status: 400 });
    }

    const result = validateProductPayload(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.errors[0], errors: result.errors }, { status: 400 });
    }

    const { images, ...productPayload } = result.payload;

    const { data: updatedProduct, error: updateErr } = await supabase
      .from("products")
      .update(productPayload)
      .eq("id", productId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const { error: deleteImgErr } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId);
    if (deleteImgErr) {
      return NextResponse.json({ error: deleteImgErr.message }, { status: 500 });
    }

    if (images.length > 0) {
      const rows = images.map((image_url) => ({ product_id: productId, image_url }));
      const { error: insertImgErr } = await supabase.from("product_images").insert(rows);
      if (insertImgErr) {
        return NextResponse.json({ error: insertImgErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ...updatedProduct, images });
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
};

export const DELETE = async (request: Request) => {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data: existingImages } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", id);

    const urls = (existingImages as Array<{ image_url: string }> | null)?.map((r) => r.image_url) ?? [];
    await deleteStorageFiles(urls);

    const { error: deleteImgsErr } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);
    if (deleteImgsErr) {
      return NextResponse.json({ error: deleteImgsErr.message }, { status: 500 });
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
};