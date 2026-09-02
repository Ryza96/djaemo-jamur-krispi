import { Section } from "@/components/sections/Section";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/lib/constants";

export function FinalCTASection() {
  return (
    <Section className="bg-cream">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-teal-deep px-6 py-14 text-center shadow-xl sm:px-12 sm:py-16">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

        <p className="font-mono text-sm font-medium uppercase tracking-widest text-gold">
          Siap Mencoba?
        </p>

        <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold text-cream sm:text-4xl">
          Camilan jamur krispi yang otentik
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-cream/70">
          Pesan langsung untuk diri sendiri atau keluarga. Tim kami siap membantu
          dengan cepat dan ramah.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            href="/produk"
            className="bg-gold px-8 py-3 text-teal-deep hover:bg-gold-bright"
          >
            Beli Sekarang
          </Button>
          <Button
            variant="outline"
            href="/kontak"
            className="border-cream/40 text-cream hover:bg-cream hover:text-teal-deep"
          >
            Hubungi Kami
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-start justify-center gap-x-10 gap-y-6 text-left">
          <div>
            <p className="text-sm font-semibold text-gold">WhatsApp</p>
            <p className="mt-1 text-sm text-cream/70">{SITE.phone}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gold">Email</p>
            <p className="mt-1 text-sm text-cream/70">{SITE.email}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gold">Alamat</p>
            <p className="mt-1 text-sm text-cream/70">{SITE.address}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
