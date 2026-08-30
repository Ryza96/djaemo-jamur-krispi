import { NextResponse, NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import type { MidtransNotification } from "@/lib/services/payment/types";
import { PAYMENT_STATUS } from "@/lib/services/payment/types";
import { OrderService } from "@/lib/services/order.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const orderId = params.id;

  let body: MidtransNotification;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body || !body.order_id || !body.signature_key) {
    return NextResponse.json(
      { error: "Missing required fields: order_id, signature_key" },
      { status: 400 },
    );
  }

  if (orderId && body.order_id !== orderId) {
    return NextResponse.json(
      { error: "Order identity mismatch" },
      { status: 422 },
    );
  }

  try {
    const result = await OrderService.processCallback(body);
    const httpStatus = result.success ? 200 : 422;

    if (result.success && result.paymentStatus === PAYMENT_STATUS.PAID) {
      revalidatePath("/");
    }

    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    console.error("Callback processing error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}
