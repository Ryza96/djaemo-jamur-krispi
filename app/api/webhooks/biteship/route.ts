import { NextResponse } from "next/server";
import type { BiteshipWebhookPayload } from "@/lib/services/shipping/types";
import { ShipmentService } from "@/lib/services/shipping/shipment.service";

// TODO: Verify Biteship webhook signature

// Biteship sends empty payload during webhook installation.
export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (!payload || Object.keys(payload).length === 0) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (!payload.waybill_id || !payload.event) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  console.log("==============================");
  console.log("BITESHIP WEBHOOK RECEIVED");
  console.log("==============================");
  console.log(JSON.stringify(payload, null, 2));

  console.log("HANDLING WEBHOOK");

  try {
    await ShipmentService.handleWebhook(payload as unknown as BiteshipWebhookPayload);

    console.log("WEBHOOK HANDLED SUCCESSFULLY");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
