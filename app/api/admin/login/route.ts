import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
} from "@/lib/services/admin-auth.service";

export async function POST(request: Request) {
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
    return NextResponse.json(
      { success: false, error: "Username atau password salah." },
      { status: 401 },
    );
  }

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
