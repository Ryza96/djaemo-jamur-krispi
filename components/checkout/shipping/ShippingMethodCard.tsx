"use client";

import type { ShippingRate } from "@/types/checkout";
import { formatPrice } from "@/lib/utils";
import { formatEtd } from "@/lib/services/shipping/mapper";

interface ShippingMethodCardProps {
  rate: ShippingRate;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ShippingMethodCard({
  rate,
  isSelected,
  onSelect,
}: ShippingMethodCardProps) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
        isSelected
          ? "border-gold bg-gold/5 ring-1 ring-gold"
          : "border-ink/10 bg-white hover:border-teal-deep/30"
      }`}
    >
      <input
        type="radio"
        name="shipping-method"
        value={rate.id}
        checked={isSelected}
        onChange={() => onSelect(rate.id)}
        className="h-4 w-4 accent-gold"
        aria-label={`${rate.courier} ${rate.service}`}
      />

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {rate.courier}
          </p>
          <p className="text-xs text-muted">
            {rate.service}
            {rate.etd ? ` — ${formatEtd(rate.etd)}` : ""}
          </p>
        </div>

        <p className="whitespace-nowrap font-semibold text-gold">
          {formatPrice(rate.price)}
        </p>
      </div>
    </label>
  );
}
