import { snap } from "@/lib/midtrans";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { PAYMENT_STATUS } from "./types";

interface SnapParams {
  orderId: string;
  accessToken: string;
  grossAmount: number;
  customerInfo: {
    name: string;
    email: string;
    whatsapp: string;
  };
  shippingAddress: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  shippingFee: number;
}

interface SnapResult {
  token: string;
  redirectUrl: string;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function buildItemDetails(
  items: SnapParams["items"],
  shippingFee: number,
): Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
}> {
  const details = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  if (shippingFee > 0) {
    details.push({
      id: "shipping",
      name: "Ongkos Kirim",
      price: shippingFee,
      quantity: 1,
    });
  }

  return details;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createSnapTransaction(
  params: SnapParams,
): Promise<SnapResult> {
  const { orderId, accessToken, grossAmount, customerInfo, shippingAddress, items, shippingFee } = params;

  if (orderId.length > 50) {
    throw new Error(`ORDER_ID_TOO_LONG: order_id length ${orderId.length} exceeds 50 character limit`);
  }

  const customerDetails: Record<string, unknown> = {
    first_name: customerInfo.name,
    phone: customerInfo.whatsapp,
    billing_address: {
      address: shippingAddress,
    },
  };

  if (customerInfo.email.trim() !== "") {
    customerDetails.email = customerInfo.email;
  }

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    customer_details: customerDetails,
    item_details: buildItemDetails(items, shippingFee),
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?order_id=${orderId}&token=${accessToken}`,
    },
  };

  console.log(`\n[STEP 2] Midtrans payload ready`);
  console.log(JSON.stringify(payload, null, 2));
  console.log("--------------------");

  const isProd = process.env.NODE_ENV === "production";
  const apiUrl = isProd
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`\n[STEP 3] Calling Midtrans (attempt ${attempt}/${MAX_RETRIES})`);
      console.log(`  URL: ${apiUrl}`);
      console.log("--------------------");

      const { token, redirect_url } = await snap.createTransaction(payload);

      console.log(`\n[STEP 4] Midtrans response (attempt ${attempt})`);
      console.log(JSON.stringify({ token, redirect_url }, null, 2));
      console.log("--------------------");

      if (attempt > 1) {
        await AuditLogService.logPaymentEvent({
          orderId,
          event: AuditLogService.events.SNAP_RETRY,
          fromStatus: PAYMENT_STATUS.UNPAID,
          toStatus: PAYMENT_STATUS.PENDING,
          metadata: { attempt, success: true },
        });
      }

      return { token, redirectUrl: redirect_url };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      const httpErr = err as Record<string, unknown>;
      const apiResponse = httpErr.ApiResponse
        ? JSON.stringify(httpErr.ApiResponse, null, 2)
        : "N/A";

      console.log(`\n[STEP ${attempt < MAX_RETRIES ? 3 : 4} FAILED] (attempt ${attempt}/${MAX_RETRIES})`);
      console.log("  Exception:", lastError.message);
      console.log("  httpStatusCode:", httpErr.httpStatusCode ?? "N/A");
      console.log("  ApiResponse:", apiResponse);
      console.log("  Stack:", lastError.stack ?? "N/A");
      console.log("  Cause:", lastError.cause ?? "N/A");
      console.log("--------------------");

      if (attempt < MAX_RETRIES) {
        await AuditLogService.logPaymentEvent({
          orderId,
          event: AuditLogService.events.SNAP_RETRY,
          fromStatus: PAYMENT_STATUS.UNPAID,
          toStatus: PAYMENT_STATUS.UNPAID,
          metadata: { attempt, error: lastError.message },
        });

        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  await AuditLogService.logPaymentEvent({
    orderId,
    event: AuditLogService.events.SNAP_RETRY,
    fromStatus: PAYMENT_STATUS.UNPAID,
    toStatus: PAYMENT_STATUS.UNPAID,
    metadata: { attempt: MAX_RETRIES, error: lastError?.message, exhausted: true },
  });

  throw lastError ?? new Error("Failed to create Snap transaction after retries");
}
