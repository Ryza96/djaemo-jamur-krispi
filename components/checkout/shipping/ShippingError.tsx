"use client";

interface ShippingErrorProps {
  message: string;
  onRetry: () => void;
}

export function ShippingError({ message, onRetry }: ShippingErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red/20 bg-red/10 p-4 text-center"
    >
      <p className="text-sm text-red">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
      >
        Coba Lagi
      </button>
    </div>
  );
}
