import { PromoRepository, type PromoWithProducts } from "@/lib/repositories/promo.repository";

// ============================================================
// ARCHITECTURE (LOCKED)
// ============================================================
//
// Homepage → Product Service → Promo Engine → Repository → Database
// Checkout → Product Service → Promo Engine → Repository → Database
//
// Promo Engine is the SINGLE ENTRY POINT for all promo business logic.
// Promo Engine does NOT know about: Homepage, Checkout, Notification, Tracking.
// ============================================================

export type PromoStatus = "upcoming" | "active" | "ended" | "cancelled";

export interface PromoStatusResult {
  status: PromoStatus;
  label: string;
}

export interface PromoCountdown {
  display: string;
  value: number;
  unit: "hari" | "jam" | "menit" | "detik";
  direction: "lagi" | "yang lalu";
  type: PromoStatus;
}

export interface ValidatePromoDateResult {
  valid: boolean;
  error?: string;
}

export interface ValidatePromoProductResult {
  valid: boolean;
  error?: string;
}

export interface ValidateCheckoutPromoResult {
  has_promo: boolean;
  price: number;
  promo_price?: number;
}

export interface DuplicatePromoResult {
  products: Array<{
    product_id: string;
    product_name: string;
  }>;
  promo_prices: Array<{
    product_id: string;
    promo_price: number;
  }>;
}

export interface CancelPromoResult {
  success: boolean;
  error?: string;
}

export interface OverlapValidationResult {
  valid: boolean;
  error?: string;
}

export interface ValidateCreatePromoResult {
  valid: boolean;
  error?: string;
}

export const PromoEngine = {
  getPromoStatus(promo: PromoWithProducts): PromoStatusResult {
    const status = this.derivePromoStatus(promo.start_date, promo.end_date, promo.cancelled_at);
    return { status, label: this.statusLabel(status) };
  },

  getCountdown(promo: PromoWithProducts): PromoCountdown {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    const status = this.derivePromoStatus(promo.start_date, promo.end_date, promo.cancelled_at);

    switch (status) {
      case "cancelled":
        return this.cancelledCountdown(now, promo);
      case "upcoming":
        return this.upcomingCountdown(now, start);
      case "active":
        return this.activeCountdown(now, end);
      default:
        return this.endedCountdown(now, end);
    }
  },

  cancelledCountdown(now: Date, promo: PromoWithProducts): PromoCountdown {
    const cancelledAt = new Date(promo.cancelled_at!);
    const diffMs = now.getTime() - cancelledAt.getTime();
    const { value, unit } = this.pickUnit(diffMs);
    return this.formatCountdown(value, unit, "yang lalu", "cancelled");
  },

  upcomingCountdown(now: Date, start: Date): PromoCountdown {
    const diffMs = start.getTime() - now.getTime();
    const { value, unit } = this.pickUnit(diffMs);
    return this.formatCountdown(value, unit, "lagi", "upcoming");
  },

  activeCountdown(now: Date, end: Date): PromoCountdown {
    const diffMs = end.getTime() - now.getTime();
    const { value, unit } = this.pickUnit(diffMs);
    return this.formatCountdown(value, unit, "lagi", "active");
  },

  endedCountdown(now: Date, end: Date): PromoCountdown {
    const diffMs = now.getTime() - end.getTime();
    const { value, unit } = this.pickUnit(diffMs);
    return this.formatCountdown(value, unit, "yang lalu", "ended");
  },

  calcTimeDiff(now: Date, target: Date): { value: number; unit: "hari" | "jam" | "menit" | "detik" } {
    const diffMs = Math.abs(target.getTime() - now.getTime());
    return this.pickUnit(diffMs);
  },

  pickUnit(diffMs: number): { value: number; unit: "hari" | "jam" | "menit" | "detik" } {
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return { value: diffDays, unit: "hari" };

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return { value: diffHours, unit: "jam" };

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) return { value: diffMinutes, unit: "menit" };

    const diffSeconds = Math.floor(diffMs / 1000);
    return { value: diffSeconds, unit: "detik" };
  },

  formatCountdown(value: number, unit: "hari" | "jam" | "menit" | "detik", direction: "lagi" | "yang lalu", status: PromoStatus): PromoCountdown {
    const prefix = this.countdownPrefix(status);
    return {
      display: `${prefix} ${value} ${unit} ${direction}`,
      value,
      unit,
      direction,
      type: status,
    };
  },

  countdownPrefix(status: PromoStatus): string {
    switch (status) {
      case "cancelled": return "dibatalkan";
      case "upcoming": return "dimulai";
      case "active": return "berakhir";
      case "ended": return "berakhir";
    }
  },

  async getActivePromo(productId: string): Promise<PromoWithProducts | null> {
    const promo = await PromoRepository.findActivePromoByProductId(productId);
    if (!promo) return null;
    if (this.getPromoStatus(promo).status !== "active") return null;
    return promo;
  },

  async checkOverlap(productId: string, startDate: string, endDate: string, excludePromoId?: string): Promise<OverlapValidationResult> {
    const rawPromos = await PromoRepository.findPromosByProductId(productId);

    const start = new Date(startDate);
    const end = new Date(endDate);

    const hasOverlap = rawPromos.some((promo) => {
      if (excludePromoId && promo.promo_id === excludePromoId) return false;

      const status = this.derivePromoStatus(promo.start_date, promo.end_date, promo.cancelled_at);
      if (status === "cancelled" || status === "ended") return false;

      return this.hasDateOverlap(start, end, new Date(promo.start_date), new Date(promo.end_date));
    });

    if (hasOverlap) {
      return { valid: false, error: "Produk sudah memiliki promo yang berlaku pada rentang waktu yang sama" };
    }

    return { valid: true };
  },

  validatePromoDate(startDate: string, endDate: string): ValidatePromoDateResult {
    if (!startDate || !endDate) {
      return { valid: false, error: "Tanggal mulai dan berakhir harus diisi" };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, error: "Format tanggal tidak valid" };
    }

    if (start >= end) {
      return { valid: false, error: "Tanggal mulai harus sebelum tanggal berakhir" };
    }

    return { valid: true };
  },

  validatePromoProduct(productId: string, promoPrice: number, normalPrice: number): ValidatePromoProductResult {
    if (!productId) {
      return { valid: false, error: "Product ID harus diisi" };
    }

    if (promoPrice <= 0) {
      return { valid: false, error: "Harga promo harus lebih dari 0" };
    }

    if (promoPrice >= normalPrice) {
      return { valid: false, error: "Harga promo harus lebih rendah dari harga normal" };
    }

    return { valid: true };
  },

  async validateCheckoutPromo(productId: string): Promise<ValidateCheckoutPromoResult> {
    const promo = await PromoRepository.findActivePromoByProductId(productId);

    if (!promo) {
      return { has_promo: false, price: 0 };
    }

    const promoProduct = promo.promo_products.find((pp) => pp.product_id === productId);

    if (!promoProduct) {
      return { has_promo: false, price: 0 };
    }

    return {
      has_promo: true,
      price: promoProduct.promo_price,
      promo_price: promoProduct.promo_price,
    };
  },

  async duplicatePromo(promoId: string): Promise<DuplicatePromoResult> {
    const promo = await PromoRepository.findById(promoId);

    if (!promo) {
      return { products: [], promo_prices: [] };
    }

    if (promo.cancelled_at) {
      return { products: [], promo_prices: [] };
    }

    const statusResult = this.getPromoStatus(promo);

    if (statusResult.status === "cancelled") {
      return { products: [], promo_prices: [] };
    }

    return {
      products: promo.promo_products.map((pp) => ({
        product_id: pp.product_id,
        product_name: pp.products?.name || pp.product_id,
      })),
      promo_prices: promo.promo_products.map((pp) => ({
        product_id: pp.product_id,
        promo_price: pp.promo_price,
      })),
    };
  },

  async cancelPromo(promoId: string): Promise<CancelPromoResult> {
    const promo = await PromoRepository.findById(promoId);

    if (!promo) {
      return { success: false, error: "Promo tidak ditemukan" };
    }

    if (promo.cancelled_at) {
      return { success: false, error: "Promo sudah dibatalkan" };
    }

    await PromoRepository.cancel(promoId);

    return { success: true };
  },

  derivePromoStatus(startDate: string, endDate: string, cancelledAt: string | null): PromoStatus {
    if (cancelledAt) return "cancelled";

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "active";
    return "ended";
  },

  statusLabel(status: PromoStatus): string {
    const labels: Record<PromoStatus, string> = {
      upcoming: "Akan Datang",
      active: "Aktif",
      ended: "Berakhir",
      cancelled: "Dibatalkan",
    };
    return labels[status];
  },

  hasDateOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && aEnd > bStart;
  },

  validatePromoName(name: string): ValidateCreatePromoResult {
    if (!name || !name.trim()) {
      return { valid: false, error: "Nama promo harus diisi" };
    }
    return { valid: true };
  },

  validatePromoProducts(products: Array<{ product_id: string; promo_price: number }>): ValidateCreatePromoResult {
    if (!products || products.length === 0) {
      return { valid: false, error: "Minimal 1 produk harus dipilih" };
    }
    return { valid: true };
  },

  validateProductExistence(
    productIds: string[],
    validProducts: Array<{ id: string; name: string; price: number }>
  ): ValidateCreatePromoResult {
    if (validProducts.length !== productIds.length) {
      return { valid: false, error: "Salah satu produk tidak ditemukan" };
    }
    return { valid: true };
  },

  async validateCreatePromo(
    name: string,
    products: Array<{ product_id: string; promo_price: number }>,
    validProducts: Array<{ id: string; name: string; price: number }>,
    startDate: string,
    endDate: string
  ): Promise<ValidateCreatePromoResult> {
    const nameValidation = this.validatePromoName(name);
    if (!nameValidation.valid) return nameValidation;

    const dateValidation = this.validatePromoDate(startDate, endDate);
    if (!dateValidation.valid) return dateValidation;

    const productsValidation = this.validatePromoProducts(products);
    if (!productsValidation.valid) return productsValidation;

    const productIds = products.map((p) => p.product_id);
    const existenceValidation = this.validateProductExistence(productIds, validProducts);
    if (!existenceValidation.valid) return existenceValidation;

    for (const product of products) {
      const validProduct = validProducts.find((p) => p.id === product.product_id);
      if (validProduct) {
        const productValidation = this.validatePromoProduct(
          product.product_id,
          product.promo_price,
          validProduct.price
        );
        if (!productValidation.valid) return productValidation;
      }
    }

    for (const product of products) {
      const overlapResult = await this.checkOverlap(product.product_id, startDate, endDate);
      if (!overlapResult.valid) return overlapResult;
    }

    return { valid: true };
  },

  async validateEditPromo(
    name: string,
    products: Array<{ product_id: string; promo_price: number }>,
    validProducts: Array<{ id: string; name: string; price: number }>,
    startDate: string,
    endDate: string,
    excludePromoId: string
  ): Promise<ValidateCreatePromoResult> {
    const nameValidation = this.validatePromoName(name);
    if (!nameValidation.valid) return nameValidation;

    const dateValidation = this.validatePromoDate(startDate, endDate);
    if (!dateValidation.valid) return dateValidation;

    const productsValidation = this.validatePromoProducts(products);
    if (!productsValidation.valid) return productsValidation;

    const productIds = products.map((p) => p.product_id);
    const existenceValidation = this.validateProductExistence(productIds, validProducts);
    if (!existenceValidation.valid) return existenceValidation;

    for (const product of products) {
      const validProduct = validProducts.find((p) => p.id === product.product_id);
      if (validProduct) {
        const productValidation = this.validatePromoProduct(
          product.product_id,
          product.promo_price,
          validProduct.price
        );
        if (!productValidation.valid) return productValidation;
      }
    }

    for (const product of products) {
      const overlapResult = await this.checkOverlap(product.product_id, startDate, endDate, excludePromoId);
      if (!overlapResult.valid) return overlapResult;
    }

    return { valid: true };
  },
};
