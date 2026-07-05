"use client";

import { useMemo } from "react";
import type { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  items: CartItem[];
}

export function CartSummary({ items }: CartSummaryProps) {
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Total Item</span>
        <span>{totalItems}</span>
      </div>
      <div className="flex items-center justify-between text-base font-semibold text-foreground">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
    </div>
  );
}
