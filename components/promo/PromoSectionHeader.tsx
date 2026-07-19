import type { PromoSectionHeaderProps } from "./types";
import { PromoCountdown } from "./PromoCountdown";

export function PromoSectionHeader({ name, countdown, productCount, className }: PromoSectionHeaderProps) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className ?? ""}`}>
      <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
        Promo Hari Ini
      </p>
      <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
        {name}
      </h2>
      <PromoCountdown countdown={countdown} variant="detail" className="mt-3" />
      {productCount !== undefined && (
        <p className="mt-2 text-sm text-muted">
          {productCount} PRODUK
        </p>
      )}
    </div>
  );
}
