import { Section } from "@/components/sections/Section";

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 3-.3 4.3-.9" />
      <path d="M17 8c-2-2-5-3-8-3 0 5 2 9 5 11 1-2 2-4 3-5" />
    </svg>
  );
}

function CrunchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function FlavorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

const REASONS = [
  {
    title: "Bahan Alami",
    description: "Jamur pilihan tanpa pengawet berlebihan.",
    icon: LeafIcon,
  },
  {
    title: "Tekstur Renyah",
    description: "Kerenyahan terjaga sampai ke gigitan terakhir.",
    icon: CrunchIcon,
  },
  {
    title: "Rasa Autentik",
    description: "Diracik khusus untuk lidah Indonesia.",
    icon: FlavorIcon,
  },
  {
    title: "Kemasan Rapi",
    description: "Tetap segar dan higienis.",
    icon: PackageIcon,
  },
] as const;

function IconWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold-bright">
      {children}
    </div>
  );
}

export function WhyDjaemoSection() {
  return (
    <Section className="bg-teal-deep">
      <div className="text-center">
        <p className="font-mono text-sm font-medium uppercase tracking-widest text-gold-bright">
          Keunggulan Kami
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-cream sm:text-3xl">
          Mengapa D&apos;JAEMO?
        </h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((reason) => (
          <div
            key={reason.title}
            className="rounded-2xl border border-gold/20 bg-white/5 p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
          >
            <div className="mb-4">
              <IconWrapper>
                <reason.icon />
              </IconWrapper>
            </div>
            <h3 className="font-semibold text-cream">{reason.title}</h3>
            <p className="mt-2 text-sm text-cream/70">{reason.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
