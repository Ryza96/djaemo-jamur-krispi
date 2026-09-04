import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifyAdminToken,
  ADMIN_SESSION_COOKIE,
} from "@/lib/services/admin-auth.service";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The /admin root page IS the login page — let it through
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!(await verifyAdminToken(token))) {
    const loginUrl = new URL("/admin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
