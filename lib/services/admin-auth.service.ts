import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "djaemo_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

interface AdminSessionPayload {
  role: "admin";
  exp: number;
}

function getAuthSecret(): string | null {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

export function createAdminSessionToken(): string | null {
  const secret = getAuthSecret();
  if (!secret) return null;

  const payload: AdminSessionPayload = {
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  return `${data}.${sig}`;
}

export function isValidAdminSessionToken(
  token: string | null | undefined,
): boolean {
  if (!token) return false;

  const [data, sig] = token.split(".");
  if (!data || !sig) return false;

  const secret = getAuthSecret();
  if (!secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(data).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(sig, "base64url");
  } catch {
    return false;
  }

  if (expected.length !== actual.length) return false;
  if (!crypto.timingSafeEqual(expected, actual)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as AdminSessionPayload;

    if (payload.role !== "admin") return false;

    return payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
