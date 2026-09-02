import type { PromoSectionHeaderProps } from "./types";
import { PromoCountdown } from "./PromoCountdown";

export function PromoSectionHeader({ name, countdown, productCount, className }: PromoSectionHeaderProps) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className ?? ""}`}>
      <p className="text-sm font-semibold uppercase tracking-widest text-gold">
        Promo Hari Ini
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
        {name}
      </h2>
      <PromoCountdown countdown={countdown} variant="detail" className="mt-3" />
      {productCount !== undefined && (
        <p className="mt-2 font-mono text-xs font-medium uppercase tracking-widest text-ink-soft">
          {productCount} PRODUK
        </p>
      )}
    </div>
  );
}
