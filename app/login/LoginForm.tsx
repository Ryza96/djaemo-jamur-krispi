"use client";

import Link from "next/link";
import { SITE } from "@/lib/constants";

export function LoginForm() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-primary/10 bg-white p-8 shadow-lg sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-primary sm:text-3xl">Masuk</h1>
            <p className="mt-2 text-sm text-muted">
              Selamat datang kembali di {SITE.name}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                className="mt-2 block w-full rounded-2xl border border-primary/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Masukkan email Anda"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
                className="mt-2 block w-full rounded-2xl border border-primary/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Masukkan password Anda"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Masuk
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
