import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/admin-auth.service";
import { supabase } from "@/lib/supabase";
import { UPLOAD } from "@/lib/constants/upload";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Validate file content via magic bytes (first 12 bytes).
 * Returns true if the bytes match a known image format.
 */
async function hasValidMagicBytes(file: File, ext: string): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  switch (ext) {
    case "jpg":
    case "jpeg":
      // JPEG: starts with FF D8 FF
      return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    case "png":
      // PNG: starts with 89 50 4E 47 (89PNG)
      return (
        header[0] === 0x89 &&
        header[1] === 0x50 &&
        header[2] === 0x4e &&
        header[3] === 0x47
      );
    case "webp":
      // WebP: RIFF....WEBP — bytes 0-3 = "RIFF", bytes 8-11 = "WEBP"
      return (
        header[0] === 0x52 &&
        header[1] === 0x49 &&
        header[2] === 0x46 &&
        header[3] === 0x46 &&
        header[8] === 0x57 &&
        header[9] === 0x45 &&
        header[10] === 0x42 &&
        header[11] === 0x50
      );
    default:
      return false;
  }
}

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

    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipe MIME tidak valid: ${file.type}` },
        { status: 400 },
      );
    }

    if (!(await hasValidMagicBytes(file, ext))) {
      return NextResponse.json(
        { error: "File bukan gambar yang valid (magic bytes tidak cocok)" },
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
