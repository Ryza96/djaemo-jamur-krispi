import { NextResponse } from "next/server";
import { z } from "zod";
import { PartnerService } from "@/lib/services/partner.service";

// Mirrors the exact fields submitted by ResellerRegistrationForm.tsx
// (Data Diri + Cara Menjual + Konfirmasi steps). `username`/`password`
// are the partner credentials hashed by PartnerService.register (bcrypt).
const registerPartnerSchema = z.object({
  partnerType: z.enum(["reseller", "dropshipper"]),
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[A-Za-z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
  fullName: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,12}$/, "Nomor WhatsApp tidak valid"),
  email: z
    .string()
    .trim()
    .max(100, "Email maksimal 100 karakter")
    .refine(
      (val) => /^[^\s@]+@\S+\.\S+$/.test(val),
      "Email tidak valid",
    ),
  salesChannels: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "Pilih minimal 1 saluran penjualan")
    .max(10, "Saluran penjualan maksimal 10"),
  links: z
    .string()
    .trim()
    .max(200, "Link maksimal 200 karakter")
    .refine((val) => val === "" || /^https?:\/\/\S+$/.test(val), "Link harus berupa URL valid"),
  salesPlan: z
    .string()
    .trim()
    .min(1, "Cara menjual produk wajib diisi")
    .max(2000, "Cara menjual produk maksimal 2000 karakter"),
  confirmData: z
    .boolean()
    .refine((val) => val === true, "Centang konfirmasi: data yang saya berikan benar"),
  confirmReview: z
    .boolean()
    .refine(
      (val) => val === true,
      "Centang konfirmasi: pendaftaran akan ditinjau oleh D'JAEMO",
    ),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = registerPartnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  try {
    const result = await PartnerService.register(parsed.data);

    if (!result.success) {
      const status =
        result.code === "USERNAME_TAKEN" || result.code === "EMAIL_TAKEN"
          ? 409
          : 500;
      return NextResponse.json(
        { success: false, error: result.error ?? "Gagal mendaftar" },
        { status },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/partner/register error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat mendaftar. Coba lagi nanti." },
      { status: 500 },
    );
  }
}
