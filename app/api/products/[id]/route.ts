import { NextResponse } from 'next/server';
import { getProductById } from '@/lib/services/product.service';

export const GET = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error('[Product Detail]', { error: err instanceof Error ? err.message : String(err), detail: err });
    return NextResponse.json({ error: 'Gagal memuat produk' }, { status: 500 });
  }
};
