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
                  <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.37 0 .07 5.3 0 12.02 0 17.38 3.44 22 8.21 23.5c.6.11.82-.26.82-.58 0-.29-.01-1.04-.01-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.31-5.47-1.34-5.47-5.94 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4 1.02 0 2.05.13 3 .4 2.29-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22 0 1.61-.02 2.9-.02 3.29 0 .32.22.7.83.58C20.56 22 24 17.38 24 12.02 23.93 5.3 18.63 0 12 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-foreground">WhatsApp</div>
                <a href={`https://wa.me/${SITE.phone.replace(/\D/g, "")}`} className="text-primary hover:underline">
                  {SITE.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/5 p-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M16.5 7.5h.01" />
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
                        <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.373 0 .072 5.3 0 12.021 0 17.377 3.438 22 8.207 23.5c.6.111.82-.26.82-.577 0-.285-.011-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.494.998.108-.775.418-1.305.76-1.605-2.664-.305-5.466-1.337-5.466-5.944 0-1.313.469-2.387 1.236-3.229-.124-.304-.536-1.527.118-3.182 0 0 1.008-.323 3.3 1.23a11.46 11.46 0 013.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.553 3.296-1.23 3.296-1.23.656 1.655.244 2.878.12 3.182.77.842 1.235 1.916 1.235 3.229 0 4.617-2.805 5.636-5.478 5.933.43.372.813 1.103.813 2.222 0 1.605-.015 2.899-.015 3.293 0 .32.216.694.825.576C20.565 22 24 17.377 24 12.021 23.928 5.3 18.627 0 12 0c-1.793 0-3.51.32-5.084.91" />
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
            <ContactForm defaultEmail={SITE.email} defaultPhone={SITE.phone} />
          </div>
        </div>
      </div>
    </Section>
  );
}
