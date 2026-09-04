import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
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

// Dummy bcrypt hash used solely to equalize response timing between the
// "username wrong" path and the "password wrong" path, so a timing side
// channel does not reveal whether a username is valid or not.
const DUMMY_TIMING_HASH =
  "$2b$10$qourL73e9C78Ia0/xhTVB.HDXX2FoqJmu/gsvm.D2ucTtJt/3ZIgS";

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

  if (username !== adminUsername) {
    // Run a dummy bcrypt compare so the "username wrong" path takes roughly
    // the same time as the "password wrong" path (timing side-channel guard).
    await bcrypt.compare(password ?? "", DUMMY_TIMING_HASH);
    await recordFailedLogin(identifier, username);
    return NextResponse.json(
      { success: false, error: "Username atau password salah." },
      { status: 401 },
    );
  }

  if (!adminPassword.startsWith("$2")) {
    console.error(
      "ADMIN_PASSWORD di env belum berformat bcrypt hash. " +
        "Generate hash dulu dan update env sebelum login bisa berhasil.",
    );
    return NextResponse.json(
      { success: false, error: "Server configuration error." },
      { status: 500 },
    );
  }

  const passwordOk = await bcrypt.compare(password ?? "", adminPassword);
  if (!passwordOk) {
    await recordFailedLogin(identifier, username);
    return NextResponse.json(
      { success: false, error: "Username atau password salah." },
      { status: 401 },
    );
  }

  await clearFailedLogins(identifier);

  const token = await createAdminSessionToken();
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
