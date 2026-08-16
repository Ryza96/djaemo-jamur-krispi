import { isResumableOrder } from "@/lib/checkout/restoreOrder";

export const ORDER_STORAGE_KEY = "djaemo-last-order";

export interface StoredResumeIdentity {
  orderId: string;
  accessToken: string;
  status?: string | null;
}

export type ResumeDecision =
  | { kind: "resume"; orderId: string; redirectUrl: string }
  | { kind: "none" };

const RESUMABLE_STORAGE_STATUSES = new Set([
  "pending_payment",
  "pending",
  "unpaid",
]);

export function getStoredResumeIdentity(): StoredResumeIdentity | null {
  try {
    const stored = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed?.orderId || !parsed?.accessToken) return null;

    return {
      orderId: parsed.orderId,
      accessToken: parsed.accessToken,
      status: parsed.status ?? null,
    };
  } catch {
    return null;
  }
}

export function isResumableStorageStatus(
  status?: string | null,
): boolean {
  return !!status && RESUMABLE_STORAGE_STATUSES.has(status);
}

export function buildSnapRedirectUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_MIDTRANS_ENV === "production"
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";

  return `${base}/snap/v4/redirection/${encodeURIComponent(token)}`;
}

export async function decideResume(): Promise<ResumeDecision> {
  const identity = getStoredResumeIdentity();
  if (!identity) return { kind: "none" };

  if (!isResumableStorageStatus(identity.status)) return { kind: "none" };

  let res: Response;
  try {
    res = await fetch(
      `/api/orders/${encodeURIComponent(identity.orderId)}?token=${encodeURIComponent(identity.accessToken)}`,
      { cache: "no-store" },
    );
  } catch {
    return { kind: "none" };
  }

  if (!res.ok) return { kind: "none" };

  const json = await res.json();
  const order = json?.data as
    | {
        order_id?: string;
        payment_status?: string | null;
        transaction_id?: string | null;
      }
    | undefined;

  if (!order) return { kind: "none" };
  if (!isResumableOrder(order.payment_status)) return { kind: "none" };
  if (!order.transaction_id) return { kind: "none" };

  return {
    kind: "resume",
    orderId: order.order_id ?? identity.orderId,
    redirectUrl: buildSnapRedirectUrl(order.transaction_id),
  };
}
