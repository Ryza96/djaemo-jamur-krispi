import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "djaemo_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

interface AdminSessionPayload {
  role: "admin";
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
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── secret ────────────────────────────────────────────────────────────

function getAuthSecret(): string | null {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
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

export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getAuthSecret();
  if (!secret) return null;

  const payload: AdminSessionPayload = {
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
  };

  const data = base64UrlEncodeString(JSON.stringify(payload));
  const sigBytes = await hmacSign(secret, data);
  const sig = base64UrlEncodeBytes(sigBytes);

  return `${data}.${sig}`;
}

// ── Token verification (single source of truth) ───────────────────────

/**
 * Verifies the HMAC signature and expiry of an admin session token.
 *
 * This is the SINGLE source of truth for token validation — used by both
 * the Edge middleware (lightweight gate) and requireAdmin() (full check
 * in API routes).
 *
 * Edge-compatible: uses Web crypto.subtle, no Node.js `crypto` module.
 */
export async function verifyAdminToken(
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
    ) as AdminSessionPayload;

    if (payload.role !== "admin") return false;

    return payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// ── Cookie options ────────────────────────────────────────────────────

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

// ── requireAdmin (used by every API route handler) ────────────────────

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
