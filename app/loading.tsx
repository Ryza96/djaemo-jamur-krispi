export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-4 border-ink/20 border-t-ink" />
        <p className="text-sm text-muted">Memuat...</p>
      </div>
    </div>
  );
}
