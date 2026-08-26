import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/admin-auth.service";
import { supabase } from "@/lib/supabase";
import { UPLOAD } from "@/lib/constants/upload";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;

    if (!file || !productId) {
      return NextResponse.json(
        { error: "file dan productId wajib diisi" },
        { status: 400 },
      );
    }

    if (file.size > UPLOAD.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file melebihi ${UPLOAD.MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Format file tidak didukung: .${ext}` },
        { status: 400 },
      );
    }

    const filePath = `${productId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(UPLOAD.STORAGE_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError.message);
      return NextResponse.json(
        { error: "Gagal mengunggah gambar ke penyimpanan" },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from(UPLOAD.STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: "Gagal mendapatkan tautan publik gambar" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengunggah gambar" },
      { status: 500 },
    );
  }
}
