import type { Metadata } from "next";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { PageHeader, Section } from "@/components/sections/Section";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Kontak",
  description: `Hubungi ${SITE.name} untuk pemesanan dan kerja sama.`,
};

export default function KontakPage() {
  return (
    <Section>
      <PageHeader
        title="Hubungi Kami"
        description="Ada pertanyaan atau ingin memesan? Tim kami siap membantu Anda."
      />

      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-primary/10 bg-white p-8 shadow-lg">
          <h2 className="text-lg font-semibold text-primary">Informasi Kontak</h2>
          <p className="mt-2 text-sm text-muted">Hubungi kami lewat email, WhatsApp, atau kirim pesan lewat formulir.</p>

          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/5 p-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1 3L12 11.5 5 7V6l7 4.5L19 6v1z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-foreground">Email</div>
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/5 p-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-foreground">WhatsApp</div>
                <a href={`https://wa.me/62${SITE.phone.replace(/\D/g, "").replace(/^0/, "")}`} className="text-primary hover:underline">
                  {SITE.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/5 p-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-foreground">Alamat</div>
                <div className="text-muted">{SITE.address}</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-foreground">Media Sosial</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((link) => {
                const isWhatsApp = link.href.includes("wa.me") || link.href.includes("whatsapp");
                const isInstagram = link.href.includes("instagram");
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-sm text-primary hover:bg-primary/10"
                  >
                    {isWhatsApp ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    ) : isInstagram ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                        <path d="M17.5 6.5h.01" />
                      </svg>
                    ) : null}
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white p-8 shadow-lg">
          <h2 className="text-lg font-semibold text-primary">Kirim Pesan</h2>
          <p className="mt-1 text-sm text-muted">Kirim pesan dan tim kami akan menghubungi Anda sesegera mungkin.</p>

          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </Section>
  );
}
