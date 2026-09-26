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
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink md:text-[30px]">Status Partner</h1>
          <p className="mt-2 text-sm text-muted">
            Profil akun Partner Anda
          </p>
        </div>

        <div className="rounded-4xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-sm font-semibold text-foreground">Informasi Akun</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Nama Lengkap</dt>
              <dd className="text-right font-medium text-foreground">{partner.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Username</dt>
              <dd className="font-mono text-foreground">{partner.username}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="break-all text-right text-foreground">{partner.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Jenis Partner</dt>
              <dd className="text-right font-medium capitalize text-foreground">{partner.partnerType}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <PartnerStatusCard status={partner.status} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            href={actions.primary.href}
            className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
          >
            {actions.primary.label}
          </Link>
          {actions.secondary && (
            <Link
              href={actions.secondary.href}
              className="inline-flex items-center justify-center rounded-full border-2 border-gold px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-teal-deep focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
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
            className="inline-flex items-center justify-center rounded-full bg-teal-deep/10 px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-teal-deep/20 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
