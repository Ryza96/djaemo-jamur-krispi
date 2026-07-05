"use client";

import type { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  compact?: boolean;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove, compact }: CartItemRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-5">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-foreground">
          {item.product.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {formatPrice(item.product.price)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-primary/15">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground disabled:opacity-30"
            aria-label="Kurangi jumlah"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
              <path d="M3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8z" />
            </svg>
          </button>
          <span className="min-w-[1.5rem] text-center text-xs font-medium text-foreground">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
            aria-label="Tambah jumlah"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
              <path d="M8 3a.5.5 0 0 1 .5.5v4h4a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0v-4h-4a.5.5 0 0 1 0-1h4v-4A.5.5 0 0 1 8 3z" />
            </svg>
          </button>
        </div>

        <span className="min-w-[4.5rem] text-right text-sm font-medium text-foreground">
          {formatPrice(item.product.price * item.quantity)}
        </span>

        {!compact && (
          <button
            type="button"
            onClick={() => onRemove(item.product.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:text-red-500"
            aria-label={`Hapus ${item.product.name} dari keranjang`}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
