"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePartnerAuth, type PartnerStatus } from "@/components/partner/PartnerAuthProvider";
import { PartnerStatusCard } from "@/components/partner/PartnerStatusCard";

function getStatusActions(status: PartnerStatus) {
  switch (status) {
    case "PENDING_REVIEW":
    case "RESELLER_ACTIVE":
    case "DROPSHIPPER_ACTIVE":
      return {
        primary: { href: "/produk", label: "Lihat Produk" },
        secondary: { href: "/partner", label: "Program Kemitraan" },
      };
    case "REJECTED":
    case "SUSPENDED":
      return {
        primary: { href: "/partner", label: "Program Kemitraan" },
        secondary: null,
      };
  }
}

export function PartnerStatusView() {
  const router = useRouter();
  const { partner, isLoading, logout } = usePartnerAuth();

  useEffect(() => {
    if (!isLoading && !partner) {
      router.push("/partner/login");
    }
  }, [partner, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <p className="text-sm text-muted">Memuat...</p>
      </div>
    );
  }

  if (!partner) return null;

  const actions = getStatusActions(partner.status);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">Status Partner</h1>
          <p className="mt-2 text-sm text-muted">
            {partner.email}
          </p>
        </div>

        <PartnerStatusCard status={partner.status} />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            href={actions.primary.href}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {actions.primary.label}
          </Link>
          {actions.secondary && (
            <Link
              href={actions.secondary.href}
              className="inline-flex items-center justify-center rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {actions.secondary.label}
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/partner/login");
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
