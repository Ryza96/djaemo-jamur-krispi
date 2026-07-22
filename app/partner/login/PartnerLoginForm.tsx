"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/constants";
import { usePartnerAuth } from "@/components/partner/PartnerAuthProvider";

export function PartnerLoginForm() {
  const router = useRouter();
  const { login } = usePartnerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      router.push("/partner/status");
    } else {
      setError(result.error || "Login gagal. Silakan coba lagi.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-primary/10 bg-white p-8 shadow-lg sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-primary sm:text-3xl">Masuk Partner</h1>
            <p className="mt-2 text-sm text-muted">
              Program Kemitraan Resmi {SITE.name}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="partner-email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                id="partner-email"
                name="email"
                autoComplete="email"
                required
                className="mt-2 block w-full rounded-2xl border border-primary/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="partner-password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                type="password"
                id="partner-password"
                name="password"
                autoComplete="current-password"
                required
                className="mt-2 block w-full rounded-2xl border border-primary/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted">
              Belum menjadi partner?{" "}
              <Link href="/partner" className="font-medium text-primary hover:underline">
                Daftar menjadi partner
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
