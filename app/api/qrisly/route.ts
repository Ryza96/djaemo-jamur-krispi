import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { transactionId, orderId } = body;

  if (!transactionId || !orderId) {
    return NextResponse.json({ error: "Data QRIS tidak valid." }, { status: 400 });
  }

  try {
    // Generate QR code URL using free QR code service
    const qrData = `mid://${transactionId}|${orderId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    return NextResponse.json({
      success: true,
      qr_url: qrUrl,
      image_url: qrUrl,
      transaction_id: transactionId,
      order_id: orderId,
      message: "QR code generated successfully.",
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat QR code." },
      { status: 500 }
    );
  }
}
