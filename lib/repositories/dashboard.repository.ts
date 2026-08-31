import { supabase } from "@/lib/supabase";

const LOW_STOCK_THRESHOLD = 10;
const LOW_STOCK_LIMIT = 5;
const WEEKLY_SALES_DAYS = 7;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const WIB_MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function getWIBDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Parses a timestamp value that may come from a naive TIMESTAMP column
 * (no timezone suffix, e.g. "2026-04-05T07:30:00").
 *
 * Production columns `orders.created_at` / `orders.paid_at` are naive
 * TIMESTAMP that consistently store UTC wall-clock values (written via
 * `new Date().toISOString()` and a UTC Postgres server). JavaScript's
 * `new Date("...")` would otherwise interpret a tz-less string as LOCAL
 * server time, which silently shifts the WIB conversion if the runtime
 * is not running in UTC. Appending `Z` pins the value to UTC.
 */
function parseUTC(value: string | null | undefined): Date {
  const s = (value ?? "").trim();
  if (!s) return new Date(0);
  try {
    return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
  } catch {
    return new Date(0);
  }
}

function getWIBMonthStartUTC(now: Date): string {
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  const year = wibNow.getUTCFullYear();
  const month = wibNow.getUTCMonth();
  const wibMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return new Date(wibMonthStart.getTime() - WIB_OFFSET_MS).toISOString();
}

function getWIBPeriodLabel(now: Date): string {
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  const month = WIB_MONTH_NAMES[wibNow.getUTCMonth()];
  return `1 ${month} - sekarang (WIB)`;
}

export interface DashboardStats {
  revenue: number;
  pendingOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  lowStockItems: Array<{ name: string; stock: number }>;
  weeklySales: Array<{ date: string; total: number }>;
  periodLabel: string;
  waitingRestockCount: number;
}

export const DashboardRepository = {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();

    // Compute "7 days ago" in WIB, then convert boundary back to UTC for the query.
    // This ensures we cover the full WIB day (00:00-23:59) for each of the 7 days.
    const wibTodayKey = getWIBDateKey(now);
    const wibTodayStart = new Date(`${wibTodayKey}T00:00:00+07:00`);
    const wibBoundaryStart = new Date(wibTodayStart);
    wibBoundaryStart.setDate(wibBoundaryStart.getDate() - WEEKLY_SALES_DAYS);
    const weekAgoISO = wibBoundaryStart.toISOString();

    const wibMonthStartUTC = getWIBMonthStartUTC(now);

    const [revenueResult, pendingResult, customerResult, lowStockCountResult, lowStockItemsResult, weeklySalesResult, waitingRestockResult] =
      await Promise.all([
        // Revenue card: sums subtotal (product revenue only, excludes shipping fee).
        // Consistent with the weekly sales chart which also uses subtotal,
        // and both measure the same event (payment received via paid_at).
        // Orders cancelled after payment are NOT revenue, regardless of whether
        // the refund has been confirmed yet — a cancelled sale is void.
        supabase
          .from("orders")
          .select("subtotal", { count: "exact" })
          .eq("payment_status", "paid")
          .neq("fulfillment_status", "cancelled")
          .gte("paid_at", wibMonthStartUTC),

        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "paid")
          .eq("fulfillment_status", "new"),

        supabase
          .from("customers")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .lte("stock", LOW_STOCK_THRESHOLD),

        supabase
          .from("products")
          .select("name, stock")
          .lte("stock", LOW_STOCK_THRESHOLD)
          .order("stock", { ascending: true })
          .limit(LOW_STOCK_LIMIT),

        // Weekly sales: subtotal (product revenue, excludes shipping fee),
        // grouped by the day the payment was received (paid_at). This keeps the
        // chart consistent with the "Total Penjualan" card (both use paid_at)
        // and reflects actual sales (money received), not order creation.
        supabase
          .from("orders")
          .select("subtotal, paid_at")
          .eq("payment_status", "paid")
          .neq("fulfillment_status", "cancelled")
          .gte("paid_at", weekAgoISO),

        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "paid")
          .eq("fulfillment_status", "waiting_for_restock"),
      ]);

    if (revenueResult.error) throw revenueResult.error;
    if (pendingResult.error) throw pendingResult.error;
    if (customerResult.error) throw customerResult.error;
    if (lowStockCountResult.error) throw lowStockCountResult.error;
    if (lowStockItemsResult.error) throw lowStockItemsResult.error;
    if (weeklySalesResult.error) throw weeklySalesResult.error;
    if (waitingRestockResult.error) throw waitingRestockResult.error;

    const revenue = (revenueResult.data ?? []).reduce(
      (sum, row) => sum + (row.subtotal ?? 0),
      0,
    );

    // Use WIB date keys for bucket initialization (not UTC).
    const dailyRevenue = new Map<string, number>();
    for (let i = 0; i < WEEKLY_SALES_DAYS; i++) {
      const d = new Date(wibTodayStart);
      d.setDate(d.getDate() - i);
      dailyRevenue.set(getWIBDateKey(d), 0);
    }

    for (const row of weeklySalesResult.data ?? []) {
      // paid_at comes from a naive TIMESTAMP column storing UTC wall-clock;
      // parse it as UTC before converting to the WIB date key for grouping.
      const key = getWIBDateKey(parseUTC(row.paid_at));
      if (dailyRevenue.has(key)) {
        // Use subtotal (product revenue, excludes shipping) for consistency
        // with the "Total Penjualan" card above which also sums subtotal.
        dailyRevenue.set(key, (dailyRevenue.get(key) ?? 0) + (row.subtotal ?? 0));
      }
    }

    const weeklySales = Array.from(dailyRevenue.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    return {
      revenue,
      pendingOrders: pendingResult.count ?? 0,
      totalCustomers: customerResult.count ?? 0,
      lowStockCount: lowStockCountResult.count ?? 0,
      lowStockItems: lowStockItemsResult.data ?? [],
      weeklySales,
      periodLabel: getWIBPeriodLabel(now),
      waitingRestockCount: waitingRestockResult.count ?? 0,
    };
  },
};
