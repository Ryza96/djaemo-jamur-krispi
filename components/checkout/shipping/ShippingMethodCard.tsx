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
          ? "border-secondary bg-secondary/5 ring-1 ring-secondary"
          : "border-slate-200 bg-white hover:border-primary/30"
      }`}
    >
      <input
        type="radio"
        name="shipping-method"
        value={rate.id}
        checked={isSelected}
        onChange={() => onSelect(rate.id)}
        className="h-4 w-4 accent-secondary"
        aria-label={`${rate.courier} ${rate.service}`}
      />

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-primary">
            {rate.courier}
          </p>
          <p className="text-xs text-muted">
            {rate.service}
            {rate.etd ? ` — ${formatEtd(rate.etd)}` : ""}
          </p>
        </div>

        <p className="whitespace-nowrap font-semibold text-secondary">
          {formatPrice(rate.price)}
        </p>
      </div>
    </label>
  );
}
