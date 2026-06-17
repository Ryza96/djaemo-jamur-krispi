import { NextResponse } from "next/server";
import {
  calculateFlatRateShipping,
  parseDestinationFromAddress,
  type ShippingService,
  services,
} from "@/lib/flatRateShipping";

export async function POST(request: Request) {
  const body = await request.json();
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const service = typeof body.service === "string" ? body.service : "Reguler";

  if (!address) {
    return NextResponse.json({ error: "Alamat tidak boleh kosong." }, { status: 400 });
  }

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
}
