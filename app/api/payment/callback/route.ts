import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { MidtransNotification } from "@/lib/services/payment/types";
import { PAYMENT_STATUS } from "@/lib/services/payment/types";
import { OrderService } from "@/lib/services/order.service";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

export async function POST(request: Request) {
  let body: MidtransNotification;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      received: true,
      processed: false,
      reason: "Invalid JSON body",
    });
  }

  if (!body.order_id || !body.signature_key) {
    return NextResponse.json({
      received: true,
      processed: false,
      reason: "Missing required fields: order_id, signature_key",
    });
  }

  try {
    const result = await OrderService.processCallback(body);

    if (result.success && result.paymentStatus === PAYMENT_STATUS.PAID) {
      revalidatePath("/");
    }

    return NextResponse.json({
      received: true,
      processed: result.success,
      reason: result.message,
      result,
    });
  } catch (error) {
    console.error("Callback processing error:", error);
    return NextResponse.json(
      {
        received: true,
        processed: false,
        reason:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}
