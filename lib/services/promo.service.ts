import { PromoRepository, type PromoWithProducts } from "@/lib/repositories/promo.repository";
import { PromoEngine, type PromoStatus } from "@/lib/services/promo-engine";

export type { PromoStatus };

export interface PromoListItem extends PromoWithProducts {
  status: PromoStatus;
  countdown: string;
}

export interface CreatePromoParams {
  name: string;
  start_date: string;
  end_date: string;
  products: Array<{
    product_id: string;
    promo_price: number;
  }>;
}

export interface CreatePromoResult {
  success: boolean;
  promo_id?: string;
  error?: string;
}

export const PromoService = {
  calculateStatus(promo: PromoWithProducts): PromoStatus {
    return PromoEngine.getPromoStatus(promo).status;
  },

  getCountdown(promo: PromoWithProducts): string {
    return PromoEngine.getCountdown(promo).display;
  },

  async getAllPromos(): Promise<PromoListItem[]> {
    const promos = await PromoRepository.findAll();
    return promos.map((promo) => ({
      ...promo,
      status: PromoEngine.getPromoStatus(promo).status,
      countdown: PromoEngine.getCountdown(promo).display,
    }));
  },

  async getPromoById(id: string): Promise<PromoListItem | null> {
    const promo = await PromoRepository.findById(id);
    if (!promo) return null;

    return {
      ...promo,
      status: PromoEngine.getPromoStatus(promo).status,
      countdown: PromoEngine.getCountdown(promo).display,
    };
  },

  async createPromo(params: CreatePromoParams): Promise<CreatePromoResult> {
    const productIds = params.products.map((p) => p.product_id);
    const validProducts = await PromoRepository.findProductsByIds(productIds);

    const validation = await PromoEngine.validateCreatePromo(
      params.name,
      params.products,
      validProducts,
      params.start_date,
      params.end_date
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const promoId = await PromoRepository.insertAtomic({
      name: params.name.trim(),
      start_date: params.start_date,
      end_date: params.end_date,
      products: params.products,
    });

    return { success: true, promo_id: promoId };
  },

  async updatePromo(id: string, params: CreatePromoParams): Promise<CreatePromoResult> {
    const existingPromo = await PromoRepository.findById(id);
    if (!existingPromo) {
      return { success: false, error: "Promo tidak ditemukan" };
    }

    if (existingPromo.cancelled_at) {
      return { success: false, error: "Promo sudah dibatalkan" };
    }

    const productIds = params.products.map((p) => p.product_id);
    const validProducts = await PromoRepository.findProductsByIds(productIds);

    const validation = await PromoEngine.validateEditPromo(
      params.name,
      params.products,
      validProducts,
      params.start_date,
      params.end_date,
      id
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const promoId = await PromoRepository.updateAtomic({
      name: params.name.trim(),
      start_date: params.start_date,
      end_date: params.end_date,
      products: params.products,
    }, id);

    return { success: true, promo_id: promoId };
  },

  async cancelPromo(id: string): Promise<{ success: boolean; error?: string }> {
    return PromoEngine.cancelPromo(id);
  },

  async getActivePromo(productId: string): Promise<PromoWithProducts | null> {
    return PromoEngine.getActivePromo(productId);
  },

  async getHomepagePromo(): Promise<PromoWithProducts | null> {
    const promos = await PromoRepository.findActivePromos();
    if (promos.length === 0) return null;
    return promos[0];
  },

  async duplicatePromo(promoId: string) {
    return PromoEngine.duplicatePromo(promoId);
  },
};
