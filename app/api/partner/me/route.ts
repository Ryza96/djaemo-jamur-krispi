import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PartnerRepository } from "@/lib/repositories/partner.repository";
import {
  PARTNER_SESSION_COOKIE,
  verifyPartnerToken,
} from "@/lib/services/partner-auth.service";

/**
 * partner-auth.service.ts intentionally exposes verification, not payload
 * decoding. After verifyPartnerToken() succeeds, the signed payload can be
 * read with the same base64url encoding used to create the token.
 */
function decodePartnerId(token: string | null | undefined): string | null {
  if (!token) return null;

  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const padding =
      base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const binary = atob(base64 + padding);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof payload !== "object" || payload === null) return null;

    const partnerId = (payload as { partnerId?: unknown }).partnerId;
    return typeof partnerId === "string" && partnerId ? partnerId : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARTNER_SESSION_COOKIE)?.value;

  if (!(await verifyPartnerToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = decodePartnerId(token);
  if (!partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partner = await PartnerRepository.findById(partnerId);
  if (!partner) {
    // The account may have been deleted while the signed cookie was still
    // inside its expiry window; never expose a session for a missing user.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
