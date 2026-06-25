import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const sanitizePriceToInt = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    return Math.trunc(raw);
  }
  const s = String(raw);
  // Contoh: "Rp 14.499" -> 14499
  const digits = s.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isNaN(n) ? null : n;
};


export const GET = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(image_url)')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read products' }, { status: 500 });
  }
}

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    // Basic sanitization / normalization to avoid inserting unexpected types
    const payload: any = { ...body };
    if (payload.images && Array.isArray(payload.images)) {
      payload.images = payload.images.filter((u: any) => typeof u === 'string');
    } else {
      delete payload.images;
    }
    if (payload.image && typeof payload.image !== 'string') delete payload.image;
    if (payload.price && typeof payload.price === 'string') {
      const n = parseInt(payload.price, 10);
      payload.price = Number.isNaN(n) ? null : n;
    }

    // Remove any accidental File objects or large buffers
    delete payload.file;
    delete payload.files;

    const { data, error } = await supabase.from('products').insert([payload]).select();
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message, details: error.details ?? null }, { status: 500 });
    }
    return NextResponse.json(data?.[0] ?? null, { status: 201 });
  } catch (err) {
    console.error('POST /api/products exception', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export const PUT = async (request: Request) => {
  try {
    const body = await request.json();

    const payload: Record<string, unknown> = { ...body };
    if ('price' in payload) {
      payload.price = sanitizePriceToInt(payload.price);
    }


    // fetch existing product to determine removed images
    const { data: existing, error: fetchErr } = await supabase.from('products').select('*').eq('id', body.id).single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    const existingImages: string[] = existing?.images || (existing?.image ? [existing.image] : []);
    const incomingImages: string[] = payload?.images || (payload?.image ? [payload?.image as any] : []);


    const toDelete = existingImages.filter((u: string) => !incomingImages.includes(u));

    // remove files from storage for any removed image URLs (if they are Supabase URLs)

    for (const url of toDelete) {
      try {
        const parsed = new URL(url);
        const prefix = `/storage/v1/object/public/products/`;
        if (parsed.pathname.startsWith(prefix)) {
          const path = parsed.pathname.slice(prefix.length);
          await supabase.storage.from('products').remove([path]);
        }
      } catch (e) {
        // ignore malformed URLs or non-supabase urls
        console.warn('Could not parse image url for deletion', url);
      }
    }

    // Remove images fields from parent update payload (sync is handled explicitly below)
    const { images: _images, image: _image, ...productPayload } = payload as any;

    // 1) Update induk dulu
    const { data: updatedProduct, error: updateErr } = await supabase
      .from('products')
      .update(productPayload)
      .eq('id', (payload as any).id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 2) Sinkronisasi gambar (tabel anak) menggunakan product_id
    //    Disini kita asumsikan tabel product_images punya kolom: product_id, image_url.
    const productId = (updatedProduct as any)?.id ?? (payload as any).id;

    // Hapus dulu semua gambar lama, lalu insert yang baru.
    const { error: deleteImgErr } = await supabase.from('product_images').delete().eq('product_id', productId);
    if (deleteImgErr) {
      return NextResponse.json({ error: deleteImgErr.message }, { status: 500 });
    }

    const imagesToInsert = incomingImages.filter((u: string) => typeof u === 'string' && u.length > 0);

    if (imagesToInsert.length > 0) {
      const { error: insertImgErr } = await supabase
        .from('product_images')
        .insert(imagesToInsert.map((image_url: string) => ({ product_id: productId, image_url })));
      if (insertImgErr) {
        return NextResponse.json({ error: insertImgErr.message }, { status: 500 });
      }
    }

    return NextResponse.json(updatedProduct ?? null);

  } catch (err) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    // fetch product to remove associated files from storage
    const { data: existing, error: fetchErr } = await supabase.from('products').select('*').eq('id', id).single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    const images: string[] = existing?.images || (existing?.image ? [existing.image] : []);
    for (const url of images) {
      try {
        const parsed = new URL(url);
        const prefix = `/storage/v1/object/public/products/`;
        if (parsed.pathname.startsWith(prefix)) {
          const path = parsed.pathname.slice(prefix.length);
          await supabase.storage.from('products').remove([path]);
        }
      } catch (e) {
        console.warn('Could not parse image url for deletion', url);
      }
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
