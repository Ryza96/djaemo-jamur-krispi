"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-primary">Terjadi Kesalahan</h1>
      <p className="max-w-md text-sm text-muted">
        Maaf, terjadi masalah saat memuat halaman. Silakan coba lagi.
      </p>
      <Button onClick={reset}>Coba Lagi</Button>
    </div>
  );
}
