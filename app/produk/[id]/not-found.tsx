import Link from "next/link";

export default function ProdukNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-dark">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-primary">Produk Tidak Ditemukan</h1>
      <p className="max-w-md text-sm text-muted">
        Produk yang Anda cari tidak tersedia atau telah dihapus.
      </p>
      <Link
        href="/produk"
        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
      >
        Kembali ke Produk
      </Link>
    </div>
  );
}
