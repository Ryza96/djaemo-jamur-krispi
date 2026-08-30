import { supabase } from "@/lib/supabase";

export interface PromoRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

export interface PromoProductRow {
  id: string;
  promo_id: string;
  product_id: string;
  promo_price: number;
  created_at: string;
  updated_at: string;
}

export interface PromoWithProducts extends PromoRow {
  promo_products: Array<PromoProductRow & {
    products: { id: string; name: string; price: number } | null;
  }>;
}

export interface InsertPromoParams {
  name: string;
  start_date: string;
  end_date: string;
  products: Array<{
    product_id: string;
    promo_price: number;
  }>;
}

export const PromoRepository = {
  async findAll(): Promise<PromoWithProducts[]> {
    const { data, error } = await supabase
      .from("promos")
      .select("*, promo_products(*, products(id, name, price))")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async findById(id: string): Promise<PromoWithProducts | null> {
    const { data, error } = await supabase
      .from("promos")
      .select("*, promo_products(*, products(id, name, price))")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findActivePromos(): Promise<PromoWithProducts[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("promos")
      .select("*, promo_products(*, products(id, name, price))")
      .is("cancelled_at", null)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async insertAtomic(params: InsertPromoParams): Promise<string> {
    const { data, error } = await supabase.rpc("create_promo_atomic", {
      p_name: params.name,
      p_start_date: params.start_date,
      p_end_date: params.end_date,
      p_products: params.products.map((p) => ({
        product_id: p.product_id,
        promo_price: p.promo_price,
      })),
    });

    if (error) throw error;
    return data as string;
  },

  async updateAtomic(params: InsertPromoParams, promoId: string): Promise<string> {
    const { data, error } = await supabase.rpc("update_promo_atomic", {
      p_promo_id: promoId,
      p_name: params.name,
      p_start_date: params.start_date,
      p_end_date: params.end_date,
      p_products: params.products.map((p) => ({
        product_id: p.product_id,
        promo_price: p.promo_price,
      })),
    });

    if (error) throw error;
    return data as string;
  },

  async cancel(id: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("promos")
      .update({
        cancelled_at: now,
        end_date: now,
        updated_at: now,
      })
      .eq("id", id);

    if (error) throw error;
  },

  async findPromosByProductId(productId: string): Promise<Array<{ promo_id: string; start_date: string; end_date: string; cancelled_at: string | null }>> {
    const { data, error } = await supabase
      .from("promo_products")
      .select("promo_id, promos!inner(start_date, end_date, cancelled_at)")
      .eq("product_id", productId);

    if (error) throw error;

    return (data || []).map((row: Record<string, unknown>) => ({
      promo_id: row.promo_id as string,
      start_date: (row.promos as { start_date: string }).start_date,
      end_date: (row.promos as { end_date: string }).end_date,
      cancelled_at: (row.promos as { cancelled_at: string | null }).cancelled_at,
    }));
  },

  async findProductsByIds(ids: string[]): Promise<Array<{ id: string; name: string; price: number }>> {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price")
      .in("id", ids);

    if (error) throw error;
    return data || [];
  },

  async findActivePromoByProductId(productId: string): Promise<PromoWithProducts | null> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("promo_products")
      .select("promos!inner(id, name, start_date, end_date, created_at, updated_at), id, product_id, promo_price")
      .eq("product_id", productId)
      .is("promos.cancelled_at", null)
      .lte("promos.start_date", now)
      .gte("promos.end_date", now)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promoData = data.promos as any;
    const promoId = promoData.id as string;

    const { data: fullPromo, error: fullError } = await supabase
      .from("promos")
      .select("*, promo_products(*, products(id, name, price))")
      .eq("id", promoId)
      .maybeSingle();

    if (fullError) throw fullError;
    return fullPromo;
  },
};
