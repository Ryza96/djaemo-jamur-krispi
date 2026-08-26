import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { supabase } from "@/lib/supabase";
import type { BiteshipWebhookPayload } from "@/lib/services/shipping/types";
import { ShipmentService } from "@/lib/services/shipping/shipment.service";

const BITESHIP_SIGNATURE_HEADER =
  process.env.BITESHIP_WEBHOOK_SIGNATURE_HEADER ?? "x-biteship-signature";
const BITESHIP_SIGNATURE_SECRET = process.env.BITESHIP_WEBHOOK_SIGNATURE_SECRET;

function signaturesMatch(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

// Biteship webhook security: a signature header (name + secret configured in
// the Biteship dashboard) is sent with every webhook request. Validate it
// before processing any payload.

// Biteship sends an empty payload during webhook installation.

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (!BITESHIP_SIGNATURE_SECRET) {
    console.error(
      "Biteship webhook rejected: BITESHIP_WEBHOOK_SIGNATURE_SECRET is not configured.",
    );
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 },
    );
  }

  const receivedSignature = request.headers.get(BITESHIP_SIGNATURE_HEADER);
  if (!receivedSignature || !signaturesMatch(receivedSignature, BITESHIP_SIGNATURE_SECRET)) {
    console.error(
      `Biteship webhook rejected: invalid signature (header "${BITESHIP_SIGNATURE_HEADER}").`,
    );
    return NextResponse.json(
      { success: false, error: "Invalid signature" },
      { status: 401 },
    );
  }

  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody);
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

  try {
    await supabase.from("webhook_debug_logs").insert({
      provider: "biteship",
      event: payload.event,
      payload,
    });
  } catch (err) {
    console.error("Failed to persist webhook debug log:", err);
  }

  try {
    await ShipmentService.handleWebhook(payload as unknown as BiteshipWebhookPayload);

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
