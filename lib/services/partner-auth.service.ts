import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { PartnerType } from "@/lib/repositories/partner.repository";

// Partner session model — mirrors admin-auth.service.ts exactly
// (HMAC-SHA256 signed cookie, Web Crypto so it runs on the Edge
// middleware too). The only differences are the cookie name and the
// payload: { role: "partner", partnerId, partnerType, exp }.
//
// The signing secret defaults to PARTNER_AUTH_SECRET when set, and falls
// back to ADMIN_AUTH_SECRET so no new environment variable is required.
// A partner token can never pass verifyAdminToken (role check) and vice
// versa, so sharing the secret is safe.

export const PARTNER_SESSION_COOKIE = "djaemo_partner_session";
export const PARTNER_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

interface PartnerSessionPayload {
  role: "partner";
  partnerId: string;
  partnerType: PartnerType;
  exp: number;
}

// ── base64url helpers (Edge + Node compatible) ────────────────────────

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeString(str: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(str));
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── secret ────────────────────────────────────────────────────────────

function getAuthSecret(): string | null {
  const secret =
    process.env.PARTNER_AUTH_SECRET?.trim() ||
    process.env.ADMIN_AUTH_SECRET?.trim() ||
    "";
  return secret.length >= 16 ? secret : null;
}

// ── HMAC helpers (Web Crypto API — Edge + Node compatible) ────────────

async function hmacSign(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

async function hmacVerify(
  secret: string,
  data: string,
  signatureBytes: Uint8Array,
): Promise<boolean> {
  const expected = await hmacSign(secret, data);

  if (expected.length !== signatureBytes.length) return false;

  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected[i] ^ signatureBytes[i];
  }
  return diff === 0;
}

// ── Token creation ────────────────────────────────────────────────────

export async function createPartnerSessionToken(params: {
  partnerId: string;
  partnerType: PartnerType;
}): Promise<string | null> {
  const secret = getAuthSecret();
  if (!secret) return null;

  const payload: PartnerSessionPayload = {
    role: "partner",
    partnerId: params.partnerId,
    partnerType: params.partnerType,
    exp: Math.floor(Date.now() / 1000) + PARTNER_SESSION_MAX_AGE_SECONDS,
  };

  const data = base64UrlEncodeString(JSON.stringify(payload));
  const sigBytes = await hmacSign(secret, data);
  const sig = base64UrlEncodeBytes(sigBytes);

  return `${data}.${sig}`;
}

// ── Token verification (single source of truth) ───────────────────────

/**
 * Verifies the HMAC signature, role and expiry of a partner session
 * token. Same contract as verifyAdminToken — used both by a future
 * Edge middleware gate and by requirePartner() in API routes.
 */
export async function verifyPartnerToken(
  token: string | null | undefined,
): Promise<boolean> {
  if (!token) return false;

  const [data, sigB64] = token.split(".");
  if (!data || !sigB64) return false;

  const secret = getAuthSecret();
  if (!secret) return false;

  try {
    const signatureBytes = base64UrlDecode(sigB64);
    const valid = await hmacVerify(secret, data, signatureBytes);
    if (!valid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(data)),
    ) as PartnerSessionPayload;

    if (payload.role !== "partner") return false;
    if (typeof payload.partnerId !== "string" || !payload.partnerId) return false;

    return payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// ── Cookie options ────────────────────────────────────────────────────

export function partnerSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PARTNER_SESSION_MAX_AGE_SECONDS,
  };
}

// ── requirePartner (mirror of requireAdmin, used by API routes) ───────

export async function requirePartner(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARTNER_SESSION_COOKIE)?.value;

  if (!(await verifyPartnerToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
