"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";

export default function TrackOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderIdFromUrl = searchParams?.get("orderId") ?? null;

  const [orderId, setOrderId] = useState(orderIdFromUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedId = orderId.trim();
    if (!trimmedId) {
      setError("Nomor pesanan wajib diisi.");
      return;
    }

    router.push(`/track-order/${encodeURIComponent(trimmedId)}`);
  }

  return (
    <Section>
      <PageHeader
        title="Lacak Pesanan"
        description="Masukkan nomor pesanan Anda untuk melihat status pesanan."
      />

      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="orderId" className="block text-sm font-medium text-foreground">
                Nomor Pesanan
              </label>
              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="DJ-12345678"
                className="mt-2 block w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-deep/20"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red/20 bg-red/10 p-3 text-sm text-red">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">
              Lacak Pesanan
            </Button>
          </form>
        </div>
      </div>
    </Section>
  );
}
