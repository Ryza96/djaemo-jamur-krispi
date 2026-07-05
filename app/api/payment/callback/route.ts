import { NextResponse } from "next/server";
import type { MidtransNotification } from "@/lib/services/payment/types";
import { OrderService } from "@/lib/services/order.service";

export async function POST(request: Request) {
  let body: MidtransNotification;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body.order_id || !body.signature_key) {
    return NextResponse.json(
      { error: "Missing required fields: order_id, signature_key" },
      { status: 400 },
    );
  }

  try {
    const result = await OrderService.processCallback(body);
    const httpStatus = result.success ? 200 : 422;

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
