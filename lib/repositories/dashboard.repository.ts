import { supabase } from "@/lib/supabase";

const LOW_STOCK_THRESHOLD = 10;
const LOW_STOCK_LIMIT = 5;
const WEEKLY_SALES_DAYS = 7;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const WIB_MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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
}

export const DashboardRepository = {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - WEEKLY_SALES_DAYS);
    const weekAgoISO = weekAgo.toISOString();

    const wibMonthStartUTC = getWIBMonthStartUTC(now);

    const [revenueResult, pendingResult, customerResult, lowStockCountResult, lowStockItemsResult, weeklySalesResult] =
      await Promise.all([
        supabase
          .from("orders")
          .select("subtotal", { count: "exact" })
          .eq("payment_status", "paid")
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

        supabase
          .from("orders")
          .select("subtotal, created_at")
          .eq("payment_status", "paid")
          .gte("created_at", weekAgoISO),
      ]);

    if (revenueResult.error) throw revenueResult.error;
    if (pendingResult.error) throw pendingResult.error;
    if (customerResult.error) throw customerResult.error;
    if (lowStockCountResult.error) throw lowStockCountResult.error;
    if (lowStockItemsResult.error) throw lowStockItemsResult.error;
    if (weeklySalesResult.error) throw weeklySalesResult.error;

    const revenue = (revenueResult.data ?? []).reduce(
      (sum, row) => sum + (row.subtotal ?? 0),
      0,
    );

    const dailyRevenue = new Map<string, number>();
    for (let i = 0; i < WEEKLY_SALES_DAYS; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyRevenue.set(key, 0);
    }

    for (const row of weeklySalesResult.data ?? []) {
      const key = row.created_at.slice(0, 10);
      if (dailyRevenue.has(key)) {
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
    };
  },
};
