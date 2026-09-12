import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/admin-auth.service";
import { supabase } from "@/lib/supabase";
import { UPLOAD } from "@/lib/constants/upload";

const MAX_PATHS_PER_REQUEST = 20;

function isValidStoragePath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  const trimmed = path.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return false;
  if (trimmed.startsWith("/")) return false;
  if (trimmed.includes("..")) return false;
  return true;
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json().catch(() => null)) as {
      paths?: unknown;
    } | null;
    const rawPaths = Array.isArray(body?.paths) ? body.paths : [];
    const paths = rawPaths.filter(isValidStoragePath).map((p: string) => p.trim());

    if (paths.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    if (paths.length > MAX_PATHS_PER_REQUEST) {
      return NextResponse.json(
        { error: "Terlalu banyak path dalam satu permintaan." },
        { status: 400 },
      );
    }

    const { error } = await supabase.storage
      .from(UPLOAD.STORAGE_BUCKET)
      .remove(paths);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: paths.length });
  } catch (err) {
    console.error("Upload cleanup API error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Gagal membersihkan file unggahan",
      },
      { status: 500 },
    );
  }
}