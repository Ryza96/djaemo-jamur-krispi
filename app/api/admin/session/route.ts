import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
