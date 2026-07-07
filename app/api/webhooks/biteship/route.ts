import { NextResponse } from "next/server";
import type { BiteshipWebhookPayload } from "@/lib/services/shipping/types";
import { ShipmentService } from "@/lib/services/shipping/shipment.service";

// TODO: Verify Biteship webhook signature

export async function POST(request: Request) {
  let payload: BiteshipWebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!payload.waybill_id || !payload.event) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    await ShipmentService.handleWebhook(payload);

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
