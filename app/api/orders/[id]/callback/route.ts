import { NextResponse, NextRequest } from "next/server";
import { core } from "@/lib/midtrans";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: NextRequest, context: { params: any }) {
  const params = await context.params;
  const orderId = params.id;
  const body = await request.json();

  try {
    // Verify Midtrans signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: "Server key tidak dikonfigurasi." }, { status: 500 });
    }

    const ordinal = body.order_id;
    const statusCode = body.status_code;
    const grossAmount = body.gross_amount;
    const signature = body.signature_key;

    // Create signature
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${ordinal}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Invalid Midtrans signature");
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    // Get transaction status from Midtrans
    let transactionStatus: any;
    try {
      transactionStatus = await core.transaction.status(ordinal);
    } catch (error) {
      console.error("Error getting transaction status from Midtrans:", error);
      transactionStatus = { transaction_status: body.transaction_status };
    }

    // Map Midtrans status to our order status
    let orderStatus = "pending";
    let paymentMethod = "credit_card";

    if (transactionStatus.transaction_status === "settlement") {
      orderStatus = "paid";
    } else if (transactionStatus.transaction_status === "pending") {
      orderStatus = "pending";
    } else if (
      transactionStatus.transaction_status === "deny" ||
      transactionStatus.transaction_status === "cancel" ||
      transactionStatus.transaction_status === "expire"
    ) {
      orderStatus = "failed";
    }

    // Get payment type
    if (transactionStatus.payment_type) {
      paymentMethod = transactionStatus.payment_type;
    }

    // Update order status in database
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", ordinal);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return NextResponse.json({ error: "Gagal mengupdate status order." }, { status: 500 });
    }

    // Return success response to Midtrans
    return NextResponse.json({
      success: true,
      message: "Order status updated successfully.",
      order_id: ordinal,
      new_status: orderStatus,
    });
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Callback processing error." },
      { status: 500 }
    );
  }
}
