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

// Token Snap Midtrans berlaku 8 jam sejak dibuat (default platform).
export const SNAP_TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000;

interface ResumeOrderSnapshot {
  order_id?: string | null;
  payment_status?: string | null;
  transaction_id?: string | null;
  created_at?: string | null;
}

// Timestamp dari Supabase REST bisa tanpa suffix zona (naive UTC).
// Tanpa normalisasi, Date mem-parsing-nya sebagai waktu lokal dan
// umur order terlihat lebih tua sebesar selisih zona pengguna.
function parseUtcTimestamp(value: string): number {
  const normalized = /^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(value)
    ? `${value}Z`
    : value;
  return new Date(normalized).getTime();
}

export function isStalePendingOrder(
  order: ResumeOrderSnapshot,
  now: number = Date.now(),
): boolean {
  if (!isResumableOrder(order.payment_status)) return false;
  if (!order.created_at) return false;

  const createdAt = parseUtcTimestamp(order.created_at);
  if (Number.isNaN(createdAt)) return false;

  return now - createdAt > SNAP_TOKEN_MAX_AGE_MS;
}

export function clearStoredResumeIdentity(): void {
  try {
    window.localStorage.removeItem(ORDER_STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

export async function expireStaleOrder(
  orderId: string,
  accessToken: string,
): Promise<void> {
  try {
    await fetch(
      `/api/orders/${encodeURIComponent(orderId)}/expire`,
      { method: "POST", headers: { "X-Order-Token": accessToken } },
    );
  } catch {
    // best effort; order tetap diabaikan untuk resume
  }
  clearStoredResumeIdentity();
}

export async function decideResume(): Promise<ResumeDecision> {
  const identity = getStoredResumeIdentity();
  if (!identity) return { kind: "none" };

  if (!isResumableStorageStatus(identity.status)) return { kind: "none" };

  let res: Response;
  try {
    res = await fetch(
      `/api/orders/${encodeURIComponent(identity.orderId)}`,
      { cache: "no-store", headers: { "X-Order-Token": identity.accessToken } },
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
        created_at?: string | null;
      }
    | undefined;

  if (!order) return { kind: "none" };
  if (!isResumableOrder(order.payment_status)) return { kind: "none" };

  if (isStalePendingOrder(order)) {
    await expireStaleOrder(identity.orderId, identity.accessToken);
    return { kind: "none" };
  }

  if (!order.transaction_id) return { kind: "none" };

  return {
    kind: "resume",
    orderId: order.order_id ?? identity.orderId,
    redirectUrl: buildSnapRedirectUrl(order.transaction_id),
  };
}
