import { NextResponse } from "next/server";
import {
  getProductLikeCount,
  hasUserLiked,
  toggleProductLike,
} from "@/lib/repositories/product-like.repository";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");

    const count = await getProductLikeCount(id);
    const liked = deviceId ? await hasUserLiked(id, deviceId) : false;

    return NextResponse.json({ count, liked });
  } catch (err) {
    console.error("[Product Likes GET]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Gagal memuat jumlah like" },
      { status: 500 }
    );
  }
};

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { device_id } = body;

    if (!device_id || typeof device_id !== "string") {
      return NextResponse.json(
        { error: "device_id wajib diisi" },
        { status: 400 }
      );
    }

    const result = await toggleProductLike(id, device_id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Product Likes POST]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Gagal memproses like" },
      { status: 500 }
    );
  }
};
