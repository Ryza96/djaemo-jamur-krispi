import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PARTNER_SESSION_COOKIE } from "@/lib/services/partner-auth.service";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(PARTNER_SESSION_COOKIE);

  return NextResponse.json({ success: true });
}
