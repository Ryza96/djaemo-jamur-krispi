import { NextResponse } from "next/server";
import { z } from "zod";
import { OrderService } from "@/lib/services/order.service";
import { createSnapTransaction } from "@/lib/services/payment/createSnap";
import { combineAddress } from "@/lib/services/payment/mapper";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { OrderRepository } from "@/lib/repositories";
import { PAYMENT_STATUS, FULFILLMENT_STATUS } from "@/lib/services/payment/types";
import {
  validateCheckoutRequest,
  CheckoutValidationError,
} from "@/lib/services/payment/checkoutValidation";

const MAX_QUANTITY_PER_PRODUCT = 50;
const MAX_DISTINCT_PRODUCTS_PER_ORDER = 20;

const createPaymentSchema = z.object({
  orderId: z.string().min(1, "orderId wajib diisi").max(50, "orderId maksimal 50 karakter"),
  customerInfo: z.object({
    name: z
      .string()
      .min(1, "Nama wajib diisi")
      .max(100, "Nama maksimal 100 karakter"),
    whatsapp: z
      .string()
      .min(1, "WhatsApp wajib diisi")
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,12}$/, "Nomor WhatsApp tidak valid"),
    email: z.preprocess(
      (val) => (val === undefined ? "" : val),
      z
        .string()
        .max(100, "Email maksimal 100 karakter")
        .refine(
          (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
          "Email tidak valid",
        ),
    ),
    notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  }),
    shippingAddress: z.object({
      street: z
        .string()
        .min(1, "Alamat wajib diisi")
        .max(200, "Alamat maksimal 200 karakter"),
      kelurahan: z
        .string()
        .min(1, "Kelurahan wajib diisi")
        .max(100, "Kelurahan maksimal 100 karakter"),
      kecamatan: z
        .string()
        .min(1, "Kecamatan wajib diisi")
        .max(100, "Kecamatan maksimal 100 karakter"),
      city: z.string().min(1, "Kota wajib diisi").max(100, "Kota maksimal 100 karakter"),
      province: z
        .string()
        .min(1, "Provinsi wajib diisi")
        .max(100, "Provinsi maksimal 100 karakter"),
      postalCode: z
        .string()
        .min(1, "Kode pos wajib diisi")
        .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit angka"),
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
        quantity: z
          .number()
          .int("Jumlah harus berupa angka bulat")
          .positive("Jumlah harus lebih dari 0")
          .max(
            MAX_QUANTITY_PER_PRODUCT,
            `Jumlah per produk maksimal ${MAX_QUANTITY_PER_PRODUCT}`,
          ),
      }),
    )
    .min(1, "Minimal satu item")
    .max(
      MAX_DISTINCT_PRODUCTS_PER_ORDER,
      `Maksimal ${MAX_DISTINCT_PRODUCTS_PER_ORDER} jenis produk per pesanan`,
    )
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      for (const [index, item] of items.entries()) {
        if (seen.has(item.product.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index],
            message: "Produk duplikat dalam pesanan tidak diizinkan",
          });
          continue;
        }
        seen.add(item.product.id);
      }
    }),
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

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as Record<string, unknown>).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim() !== "") {
      const code = (error as Record<string, unknown>).code;
      return code ? `[${String(code)}] ${maybeMessage}` : maybeMessage;
    }
  }

  return "Gagal membuat transaksi pembayaran";
}

function logFail(step: number, error: unknown) {
  console.log(`\n[STEP ${step} FAILED — RAW ERROR]`);
  console.log("  typeof:", typeof error);
  console.log("  constructor:", (error as object)?.constructor?.name ?? "N/A");
  console.log("  keys:", Object.keys(error as object));
  try { console.log("  JSON:", JSON.stringify(error, null, 2)); } catch {}
  if (error instanceof Error) {
    console.log("  message:", error.message);
    console.log("  stack:", error.stack ?? "N/A");
  }

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
  } = parsed.data;

  try {
    logStep(1, "Validating checkout request");

    let validated;
    try {
      validated = await validateCheckoutRequest(parsed.data);
    } catch (validationError) {
      if (validationError instanceof CheckoutValidationError) {
        return NextResponse.json(
          { error: validationError.message },
          { status: validationError.status },
        );
      }
      throw validationError;
    }

    logStep(2, "Creating order draft with server-validated prices");

    const orderRequest: typeof parsed.data = {
      ...parsed.data,
      items: validated.items.map((item) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
        },
        quantity: item.quantity,
      })),
      subtotal: validated.subtotal,
      shippingFee: validated.shippingFee,
    };

    const initialFulfillmentStatus = validated.stock.valid
      ? FULFILLMENT_STATUS.NEW
      : FULFILLMENT_STATUS.WAITING_FOR_RESTOCK;

    const { id: orderDbId, accessToken } = await OrderService.createDraft(
      orderRequest,
      initialFulfillmentStatus,
    );

    const totalAmount = validated.totalAmount;
    const fullAddress = combineAddress(shippingAddress);

    const snapItems = validated.items.map((item) => ({
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
        shippingFee: validated.shippingFee,
      };

      const result = await createSnapTransaction(snapParams);

      token = result.token;
      redirectUrl = result.redirectUrl;
    } catch (snapError) {
      logFail(4, snapError);

      try {
        await OrderRepository.updatePayment(orderDbId, {
          payment_status: PAYMENT_STATUS.FAILED,
        });
      } catch (rollbackError) {
        console.error(
          "[ROLLBACK FAILED] updatePayment after snap failure:",
          rollbackError,
        );
      }

      try {
        await AuditLogService.logPaymentEvent({
          orderId,
          event: AuditLogService.events.ROLLBACK,
          fromStatus: PAYMENT_STATUS.UNPAID,
          toStatus: PAYMENT_STATUS.FAILED,
          metadata: { reason: "snap_failed_after_retries" },
        });
      } catch (auditError) {
        console.error(
          "[ROLLBACK FAILED] audit log after snap failure:",
          auditError,
        );
      }

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
        error: extractErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
