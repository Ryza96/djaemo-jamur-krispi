import { NextResponse } from "next/server";
import { z } from "zod";
import {
  calculateFlatRateShipping,
  parseDestinationFromAddress,
  type ShippingService,
  services,
} from "@/lib/flatRateShipping";

const shippingSchema = z.object({
  address: z.string().min(1, "Alamat tidak boleh kosong."),
  service: z.string().optional().default("Reguler"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = shippingSchema.parse(body);

    const address = parsed.address.trim();
    const service = parsed.service;

    const validService = services.some((item) => item.label === service)
      ? (service as ShippingService)
      : "Reguler";

    const destination = parseDestinationFromAddress(address);
    const shippingFee = calculateFlatRateShipping(destination, validService);

    return NextResponse.json({
      destination,
      service: validService,
      shippingFee,
      message: "Biaya pengiriman menggunakan sistem flat rate.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Data tidak valid." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menghitung biaya pengiriman." },
      { status: 500 }
    );
  }
}
