import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { PartnerRepository } from "@/lib/repositories/partner.repository";
import {
  PARTNER_SESSION_COOKIE,
  createPartnerSessionToken,
  partnerSessionCookieOptions,
} from "@/lib/services/partner-auth.service";

const INVALID_CREDENTIALS_ERROR = "Username atau password salah.";

// Dummy bcrypt hash used only to equalize response timing between the
// "username wrong" path and the "password wrong" path, mirroring the admin
// login guard so timing does not reveal whether a username exists.
const DUMMY_TIMING_HASH =
  "$2b$10$qourL73e9C78Ia0/xhTVB.HDXX2FoqJmu/gsvm.D2ucTtJt/3ZIgS";

export async function POST(request: Request) {
  let body: { username?: string; password?: string } | null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const username =
    typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "Username and password are required." },
      { status: 400 },
    );
  }

  const partner = await PartnerRepository.findByUsernameForAuth(username);

  if (!partner) {
    // Keep the username-not-found path close to the wrong-password path.
    await bcrypt.compare(password, DUMMY_TIMING_HASH);
    return NextResponse.json(
      { success: false, error: INVALID_CREDENTIALS_ERROR },
      { status: 401 },
    );
  }

  const passwordOk = await bcrypt.compare(password, partner.password_hash);
  if (!passwordOk) {
    return NextResponse.json(
      { success: false, error: INVALID_CREDENTIALS_ERROR },
      { status: 401 },
    );
  }

  // Status is intentionally not checked here. PENDING_REVIEW, ACTIVE,
//  REJECTED, and SUSPENDED accounts may all receive a session; authorization
  // decisions belong to the routes that serve partner data.
  const token = await createPartnerSessionToken({
    partnerId: partner.id,
    partnerType: partner.partner_type,
  });

  if (!token) {
    console.error("Partner session secret is not configured.");
    return NextResponse.json(
      { success: false, error: "Server configuration error." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(PARTNER_SESSION_COOKIE, token, partnerSessionCookieOptions());

  return NextResponse.json({
    success: true,
    data: {
      id: partner.id,
      full_name: partner.full_name,
      username: partner.username,
      partner_type: partner.partner_type,
      status: partner.status,
      email: partner.email,
    },
  });
}
