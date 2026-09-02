"use client";

import { useState, useRef, useEffect } from "react";
import type { ShippingRate } from "@/types/checkout";
import { formatPrice } from "@/lib/utils";
import { formatEtd } from "@/lib/services/shipping/mapper";

interface ShippingMethodListProps {
  rates: ShippingRate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ShippingMethodList({
  rates,
  selectedId,
  onSelect,
}: ShippingMethodListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = rates.find((r) => r.id === selectedId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(rateId: string) {
    onSelect(rateId);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 text-left text-sm transition focus:border-teal-deep focus:outline-none"
      >
        {selected ? (
          <span className="flex items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="font-semibold text-ink">
                {selected.courier}
              </span>{" "}
              <span className="text-muted">{selected.service}</span>
              {selected.etd && (
                <span className="ml-1 text-xs text-muted">
                  ({formatEtd(selected.etd)})
                </span>
              )}
            </span>
            <span className="whitespace-nowrap font-semibold text-gold">
              {formatPrice(selected.price)}
            </span>
          </span>
        ) : (
          <span className="text-muted">Pilih kurir pengiriman</span>
        )}
        <svg
          className={`float-right mt-1 h-4 w-4 text-muted transition ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Pilih kurir pengiriman"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-ink/10 bg-white shadow-lg"
        >
          {rates.map((rate) => (
            <li
              key={rate.id}
              role="option"
              aria-selected={selectedId === rate.id}
              className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm transition ${
                selectedId === rate.id
                  ? "bg-gold/10 text-gold"
                  : "text-foreground hover:bg-cream-2"
              }`}
              onMouseDown={() => handleSelect(rate.id)}
            >
              <span className="min-w-0">
                <span className="font-semibold">{rate.courier}</span>{" "}
                <span className="text-muted">{rate.service}</span>
                {rate.etd && (
                  <span className="ml-1 text-xs text-muted">
                    ({formatEtd(rate.etd)})
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap font-semibold">
                {formatPrice(rate.price)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
