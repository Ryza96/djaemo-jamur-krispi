"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationDropdown } from "@/components/admin/notifications/NotificationDropdown";

type NavItem = { label: string; icon: string; href?: string; disabled?: boolean };

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "📊", href: "/admin/dashboard" },
  { label: "Orders", icon: "📋", href: "/admin/orders" },
  { label: "Produk", icon: "🍪", href: "/admin/products" },
  { label: "Promo", icon: "🏷️", href: "/admin/promos" },
  { label: "Pelanggan", icon: "👥", disabled: true },
  { label: "Pengaturan", icon: "⚙️", disabled: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        if (!cancelled) setIsAuthenticated(res.ok);
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setIsCheckingAuth(false);
      }
    }
    checkSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.replace("/admin");
    }
  }, [isAuthenticated, isCheckingAuth, router]);

  if (pathname === "/admin") {
    return <>{children}</>;
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-sm text-slate-500">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // non-fatal — cookie is best-effort cleared server-side
    }
    router.push("/admin");
  };

  const activeItem = navItems.find((item) => item.href && pathname?.startsWith(item.href));
  const activeLabel = activeItem?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 md:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl bg-slate-950 p-6 text-slate-100 shadow-2xl shadow-slate-900/10 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/30">
              D
            </div>
            <div>
              <p className="text-sm uppercase text-slate-400">Toko</p>
              <h1 className="text-xl font-semibold">D&apos;Jaemo</h1>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = item.href && item.label === activeLabel;
              if (item.disabled) {
                return (
                  <div
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate-500 cursor-not-allowed"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-600">Coming Soon</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                    active
                      ? "bg-slate-800 text-white shadow-inner"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-10 rounded-3xl bg-slate-900/80 p-5 text-sm text-slate-300 shadow-inner">
            <p className="font-medium text-slate-100">Fast snacks</p>
            <p className="mt-2 leading-relaxed">Kelola produk, pesanan, dan pelanggan dari satu dashboard yang simpel.</p>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Selamat datang kembali,</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{activeLabel}</h2>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <NotificationDropdown />
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-100"
              >
                Logout
              </button>
              <div className="flex items-center gap-3 rounded-3xl bg-slate-950 px-4 py-2 text-white shadow-lg shadow-slate-900/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-semibold">A</div>
                <div>
                  <p className="text-sm text-slate-300">Admin</p>
                  <p className="font-semibold">Jamur Krispi</p>
                </div>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
