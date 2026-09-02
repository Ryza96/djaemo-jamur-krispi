export function ShippingSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Memuat tarif pengiriman">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-ink/10 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-cream-2" />
              <div className="h-3 w-32 rounded bg-cream-2" />
            </div>
            <div className="h-4 w-20 rounded bg-cream-2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Sedang memuat tarif pengiriman...</span>
    </div>
  );
}
