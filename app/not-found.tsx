import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-bold text-primary/30">404</p>
      <h1 className="text-2xl font-bold text-primary">Halaman Tidak Ditemukan</h1>
      <p className="max-w-md text-sm text-muted">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
