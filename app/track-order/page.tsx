"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";

export default function TrackOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderIdFromUrl = searchParams?.get("orderId") ?? null;
  const tokenFromUrl = searchParams?.get("token") ?? null;

  const [orderId, setOrderId] = useState(orderIdFromUrl ?? "");
  const [token, setToken] = useState(tokenFromUrl ?? "");
  const [step, setStep] = useState<"order-id" | "token">(tokenFromUrl ? "token" : "order-id");
  const [error, setError] = useState<string | null>(null);

  function handleOrderIdSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedId = orderId.trim();
    if (!trimmedId) {
      setError("Nomor pesanan wajib diisi.");
      return;
    }

    if (token.trim()) {
      router.push(
        `/track-order/${encodeURIComponent(trimmedId)}?token=${encodeURIComponent(token.trim())}`
      );
      return;
    }

    setStep("token");
  }

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedId = orderId.trim();
    const trimmedToken = token.trim();

    if (!trimmedToken) {
      setError("Token akses wajib diisi.");
      return;
    }

    router.push(
      `/track-order/${encodeURIComponent(trimmedId)}?token=${encodeURIComponent(trimmedToken)}`
    );
  }

  return (
    <Section>
      <PageHeader
        title="Lacak Pesanan"
        description="Masukkan nomor pesanan Anda untuk melihat status pesanan."
      />

      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm sm:p-8">
          {step === "order-id" ? (
            <form onSubmit={handleOrderIdSubmit} className="space-y-5">
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
                  className="mt-2 block w-full rounded-2xl border border-primary/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full">
                Lacak Pesanan
              </Button>
            </form>
          ) : (
            <form onSubmit={handleTokenSubmit} className="space-y-5">
              <div className="rounded-2xl bg-surface p-3 text-sm text-muted">
                <span className="font-medium text-foreground">#{orderId.trim()}</span>
                {" — "}Masukkan token akses untuk melanjutkan.
              </div>

              <div>
                <label htmlFor="token" className="block text-sm font-medium text-foreground">
                  Token Akses
                </label>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Masukkan token akses"
                  className="mt-2 block w-full rounded-2xl border border-primary/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-muted">
                  Token akses terdapat pada halaman checkout atau struk pembelian Anda.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Lacak Pesanan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep("order-id");
                    setError(null);
                  }}
                >
                  Ganti Nomor Pesanan
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
