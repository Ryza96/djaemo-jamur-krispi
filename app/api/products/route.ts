import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCatalogProducts } from '@/lib/services/product.service';
import { UPLOAD } from '@/lib/constants/upload';

const sanitizePriceToInt = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    return Math.trunc(raw);
  }
  const s = String(raw);
  const digits = s.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isNaN(n) ? null : n;
};

const extractImageUrls = (body: Record<string, unknown>): string[] => {
  const raw = Array.isArray(body.images) ? body.images : [];
  return raw
    .filter((u: unknown): u is string => typeof u === 'string')
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


export const GET = async () => {
  try {
    const products = await getCatalogProducts();
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to read products' }, { status: 500 });
  }
}


export const POST = async (request: Request) => {
  try {
    const body = await request.json() as Record<string, unknown>;

    const payload: Record<string, unknown> = {};
    if (typeof body?.name === 'string') payload.name = body.name;
    if (typeof body?.description === 'string') payload.description = body.description;
    if (body?.price !== undefined) payload.price = sanitizePriceToInt(body.price);
    if (typeof body?.weight === 'string') payload.weight = body.weight;
    if (typeof body?.id === 'string') payload.id = body.id;
    if (typeof body?.stock === 'number') payload.stock = Math.trunc(body.stock);

    const { data: product, error } = await supabase.from('products').insert([payload]).select().single();
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message, details: error.details ?? null }, { status: 500 });
    }

    const imagesToInsert = extractImageUrls(body);
    if (imagesToInsert.length > 0) {
      const { error: imgErr } = await supabase.from('product_images').insert(
        imagesToInsert.map((image_url) => ({ product_id: product.id, image_url }))
      );
      if (imgErr) {
        return NextResponse.json({ error: imgErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ...product, images: imagesToInsert }, { status: 201 });
  } catch (err) {
    console.error('POST /api/products exception', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}


export const PUT = async (request: Request) => {
  try {
    const body = await request.json() as Record<string, unknown>;

    const productId = body?.id;
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid product id' }, { status: 400 });
    }

    const productPayload: Record<string, unknown> = {};
    if (typeof body?.name === 'string') productPayload.name = body.name;
    if (typeof body?.description === 'string') productPayload.description = body.description;
    if (body?.price !== undefined) productPayload.price = sanitizePriceToInt(body.price);
    if (typeof body?.weight === 'string') productPayload.weight = body.weight;
    if (typeof body?.stock === 'number') productPayload.stock = Math.trunc(body.stock);

    const { data: updatedProduct, error: updateErr } = await supabase
      .from('products')
      .update(productPayload)
      .eq('id', productId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const imagesToInsert = extractImageUrls(body);

    const { error: deleteImgErr } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    if (deleteImgErr) {
      return NextResponse.json({ error: deleteImgErr.message }, { status: 500 });
    }

    if (imagesToInsert.length > 0) {
      const { error: insertImgErr } = await supabase
        .from('product_images')
        .insert(imagesToInsert.map((image_url) => ({ product_id: productId, image_url })));

      if (insertImgErr) {
        return NextResponse.json({ error: insertImgErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ...updatedProduct, images: imagesToInsert });
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}


export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data: existingImages } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', id);

    const urls = (existingImages as Array<{ image_url: string }> | null)?.map((r) => r.image_url) ?? [];
    await deleteStorageFiles(urls);

    const { error: deleteImgsErr } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id);
    if (deleteImgsErr) {
      return NextResponse.json({ error: deleteImgsErr.message }, { status: 500 });
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
