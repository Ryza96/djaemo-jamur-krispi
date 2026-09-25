import { NextResponse } from "next/server";
import { z } from "zod";
import { PartnerRepository } from "@/lib/repositories/partner.repository";

// Format dasar — regex identik dengan validasi email di
// /api/partner/register. Endpoint ini PUBLIK (dipanggil dari form
// registrasi publik saat user klik "Selanjutnya"), jadi TIDAK memakai
// requireAdmin/requirePartner; respons hanya berisi boolean + tipe
// partner sehingga tidak membocorkan data lain.
const emailQuerySchema = z.string().trim().refine(
  (value) => /^[^\s@]+@\S+\.\S+$/.test(value),
  "Email tidak valid",
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = emailQuerySchema.safeParse(searchParams.get("email") ?? "");

    if (!parsed.success) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const existing = await PartnerRepository.findByEmail(parsed.data);

    if (!existing) {
      return NextResponse.json({ taken: false });
    }

    return NextResponse.json({
      taken: true,
      partnerType: existing.partner_type,
    });
  } catch (error) {
    console.error("GET /api/partner/check-email error:", error);
    return NextResponse.json(
      { error: "Gagal memeriksa email" },
      { status: 500 },
    );
  }
}
