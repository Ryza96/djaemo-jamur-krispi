import { NextResponse } from "next/server";
import { z } from "zod";
import { VoucherService } from "@/lib/services/voucher.service";

const schema = z.object({
  code: z.string().min(1, "Masukkan kode voucher").max(50),
  subtotal: z.number().nonnegative(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body bukan JSON valid" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data voucher tidak valid" },
      { status: 400 },
    );
  }

  const { code, subtotal } = parsed.data;
  const result = await VoucherService.previewForCheckout(code, subtotal);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    discount: result.discount,
  });
}
