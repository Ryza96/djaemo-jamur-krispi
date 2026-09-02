"use client";

import type { PartnerStatus } from "@/components/partner/PartnerAuthProvider";

interface StatusConfig {
  label: string;
  title: string;
  description: string;
  restrictions: string[];
  benefits: string[];
  color: string;
  bgColor: string;
}

const STATUS_CONFIG: Record<PartnerStatus, StatusConfig> = {
  PENDING_REVIEW: {
    label: "Pending Review",
    title: "Registrasi Menunggu Review",
    description:
      "Registrasi Partner Anda telah berhasil dilakukan dan saat ini sedang menunggu proses review oleh Admin D'JAEMO.",
    restrictions: [
      "Harga Partner",
      "Checkout Partner",
      "Benefit Partner",
    ],
    benefits: [],
    color: "text-gold",
    bgColor: "bg-gold/10",
  },
  RESELLER_ACTIVE: {
    label: "Reseller Active",
    title: "Selamat Datang, Partner Reseller D'JAEMO",
    description:
      "Akun Partner Reseller Anda telah aktif. Anda sudah dapat menikmati seluruh benefit yang tersedia.",
    restrictions: [],
    benefits: [
      "Harga Reseller",
      "Checkout Partner",
      "Benefit Partner",
    ],
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  DROPSHIPPER_ACTIVE: {
    label: "Dropshipper Active",
    title: "Selamat Datang, Partner Dropshipper D'JAEMO",
    description:
      "Akun Partner Dropshipper Anda telah aktif. Anda sudah dapat menikmati seluruh benefit yang tersedia.",
    restrictions: [],
    benefits: [
      "Harga Dropshipper",
      "Checkout Partner",
      "Benefit Partner",
    ],
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  REJECTED: {
    label: "Rejected",
    title: "Registrasi Belum Dapat Disetujui",
    description:
      "Registrasi Partner Anda belum dapat kami setujui pada saat ini.",
    restrictions: [
      "Harga Partner",
      "Checkout Partner",
      "Benefit Partner",
    ],
benefits: [],
    color: "text-red",
    bgColor: "bg-red/10",
  },
  SUSPENDED: {
    label: "Suspended",
    title: "Akun Partner Suspended",
    description:
      "Akun Partner Anda sedang dalam status Suspended untuk sementara waktu.",
    restrictions: [
      "Harga Partner",
      "Checkout Partner",
      "Benefit Partner",
    ],
    benefits: [],
    color: "text-red",
    bgColor: "bg-red/10",
  },
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-accent">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-red">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function StatusIcon({ status }: { status: PartnerStatus }) {
  if (status === "RESELLER_ACTIVE" || status === "DROPSHIPPER_ACTIVE") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10">
        <path d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "REJECTED" || status === "SUSPENDED") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

export function PartnerStatusCard({ status }: { status: PartnerStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="rounded-4xl border border-ink/10 bg-white p-8 shadow-sm sm:p-10">
      <div className="mb-6 flex items-center gap-4">
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${config.bgColor} ${config.color}`}>
          <StatusIcon status={status} />
        </div>
        <div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-ink sm:text-2xl">{config.title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{config.description}</p>

      {config.benefits.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Anda sudah dapat:</h3>
          <ul className="mt-3 space-y-2">
            {config.benefits.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {config.restrictions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Anda belum dapat:</h3>
          <ul className="mt-3 space-y-2">
            {config.restrictions.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                <XIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
