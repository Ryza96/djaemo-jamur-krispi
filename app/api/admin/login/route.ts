import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
} from "@/lib/services/admin-auth.service";
import {
  clearFailedLogins,
  getClientIdentifier,
  isLoginRateLimited,
  recordFailedLogin,
} from "@/lib/services/admin-login-rate-limit.service";

export async function POST(request: Request) {
  const identifier = getClientIdentifier(request);

  if (await isLoginRateLimited(identifier)) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit." },
      { status: 429 },
    );
  }

  let body: { username?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "Username and password are required." },
      { status: 400 },
    );
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error("ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set.");
    return NextResponse.json(
      { success: false, error: "Server configuration error." },
      { status: 500 },
    );
  }

  if (username !== adminUsername || password !== adminPassword) {
    await recordFailedLogin(identifier, username);
    return NextResponse.json(
      { success: false, error: "Username atau password salah." },
      { status: 401 },
    );
  }

  await clearFailedLogins(identifier);

  const token = createAdminSessionToken();
  if (!token) {
    console.error("ADMIN_AUTH_SECRET environment variable is not configured.");
    return NextResponse.json(
      { success: false, error: "Server configuration error." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());

  return NextResponse.json({ success: true });
}
