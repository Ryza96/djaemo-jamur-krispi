import { NextResponse } from "next/server";
import { z } from "zod";
import { OrderService } from "@/lib/services/order.service";
import { createSnapTransaction } from "@/lib/services/payment/createSnap";
import { combineAddress } from "@/lib/services/payment/mapper";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { OrderRepository } from "@/lib/repositories";
import { PAYMENT_STATUS } from "@/lib/services/payment/types";

const createPaymentSchema = z.object({
  orderId: z.string().min(1, "orderId wajib diisi").max(50, "orderId maksimal 50 karakter"),
  customerInfo: z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    whatsapp: z.string().min(1, "WhatsApp wajib diisi"),
    email: z.string().refine(
      (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Email tidak valid",
    ),
    notes: z.string().optional(),
  }),
    shippingAddress: z.object({
      street: z.string().min(1, "Alamat wajib diisi"),
      kelurahan: z.string().min(1, "Kelurahan wajib diisi"),
      kecamatan: z.string().min(1, "Kecamatan wajib diisi"),
      city: z.string().min(1, "Kota wajib diisi"),
      province: z.string().min(1, "Provinsi wajib diisi"),
      postalCode: z.string().min(1, "Kode pos wajib diisi"),
      areaId: z.string().optional(),
    }),
  shippingCourier: z.string().min(1, "Kurir wajib dipilih"),
  shippingService: z.string().min(1, "Layanan kurir wajib dipilih"),
  shippingFee: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        product: z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
        }),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Minimal satu item"),
  subtotal: z.number().nonnegative(),
});

function logStep(step: number, message: string, data?: unknown) {
  console.log(`\n[STEP ${step}] ${message}`);
  if (data !== undefined) {
    const text =
      typeof data === "object" && data !== null
        ? JSON.stringify(data, null, 2)
        : String(data);
    console.log(text);
  }
  console.log("--------------------");
}

function logFail(step: number, error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  const httpErr = error as Record<string, unknown>;
  const apiResponse = httpErr.ApiResponse
    ? JSON.stringify(httpErr.ApiResponse, null, 2)
    : "N/A";
  const cause =
    err.cause instanceof Error
      ? `{ message: "${err.cause.message}", stack: ${err.cause.stack} }`
      : err.cause ?? "N/A";

  console.log(`\n[STEP ${step} FAILED]`);
  console.log("  Exception:", err.message);
  console.log("  httpStatusCode:", httpErr.httpStatusCode ?? "N/A");
  console.log("  ApiResponse:", apiResponse);
  console.log("  Stack:", err.stack ?? "N/A");
  console.log("  Cause:", cause);
  console.log("--------------------");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body bukan JSON valid" },
      { status: 400 },
    );
  }

  console.log("\n====================");
  console.log("REQUEST BODY");
  console.log(JSON.stringify(body, null, 2));
  console.log("====================");

  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Data pembayaran tidak valid";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const {
    orderId,
    customerInfo,
    shippingAddress,
    shippingCourier,
    shippingService,
    shippingFee,
    items,
    subtotal,
  } = parsed.data;

  try {
    logStep(1, "Order inserted", { orderId });

    const { id: orderDbId, accessToken } = await OrderService.createDraft(parsed.data);

    const totalAmount = subtotal + shippingFee;
    const fullAddress = combineAddress(shippingAddress);

    const snapItems = items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    }));

    let token: string;
    let redirectUrl: string;

    try {
      const snapParams = {
        orderId,
        accessToken,
        grossAmount: totalAmount,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          whatsapp: customerInfo.whatsapp,
        },
        shippingAddress: fullAddress,
        items: snapItems,
        shippingFee,
      };

      const result = await createSnapTransaction(snapParams);

      token = result.token;
      redirectUrl = result.redirectUrl;
    } catch (snapError) {
      logFail(4, snapError);

      await OrderRepository.updatePayment(orderDbId, {
        payment_status: PAYMENT_STATUS.FAILED,
      });

      await AuditLogService.logPaymentEvent({
        orderId,
        event: AuditLogService.events.ROLLBACK,
        fromStatus: PAYMENT_STATUS.UNPAID,
        toStatus: PAYMENT_STATUS.FAILED,
        metadata: { reason: "snap_failed_after_retries" },
      });

      return NextResponse.json(
        { error: "Gagal membuat transaksi pembayaran setelah beberapa percobaan" },
        { status: 502 },
      );
    }

    logStep(5, "Payment saved", { orderId, token });

    await OrderService.confirmPayment(orderId, token);

    logStep(6, "Response to frontend", {
      success: true,
      orderId,
      token,
      redirectUrl,
      totalAmount,
    });

    return NextResponse.json({
      success: true,
      orderId,
      accessToken,
      token,
      redirectUrl,
      totalAmount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_ID_EXISTS") {
      return NextResponse.json(
        { error: "Order ID sudah ada, silakan coba lagi" },
        { status: 409 },
      );
    }

    logFail(5, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal membuat transaksi pembayaran",
      },
      { status: 500 },
    );
  }
}
