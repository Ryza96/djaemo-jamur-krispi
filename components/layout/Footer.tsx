import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { NAV_LINKS, SITE, SOCIAL_LINKS } from "@/lib/constants";

function SocialIcon({ label }: { label: string }) {
  if (label.toLowerCase().includes("instagram")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M7.75 2h8.5C19.55 2 22 4.45 22 7.75v8.5C22 19.55 19.55 22 16.25 22h-8.5C4.45 22 2 19.55 2 16.25v-8.5C2 4.45 4.45 2 7.75 2zm8.5 1.5h-8.5A3.75 3.75 0 0 0 4 7.25v8.5A3.75 3.75 0 0 0 7.75 19.5h8.5A3.75 3.75 0 0 0 20 15.75v-8.5A3.75 3.75 0 0 0 16.25 3.5zm-4.25 3.5a4.75 4.75 0 1 1 0 9.5 4.75 4.75 0 0 1 0-9.5zm0 1.5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5zm4.75-.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
      </svg>
    );
  }

  if (label.toLowerCase().includes("whatsapp")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.478A11.947 11.947 0 0 0 12.007 0C5.383 0 .002 5.378.002 12.003a11.892 11.892 0 0 0 1.672 6.031L0 24l6.105-1.646a11.948 11.948 0 0 0 5.9 1.52h.006c6.62 0 12.002-5.378 12.002-12.003a11.96 11.96 0 0 0-1.493-5.873zm-8.513 17.024a9.525 9.525 0 0 1-4.845-1.334l-.346-.205-3.623.977.97-3.526-.224-.363a9.51 9.51 0 0 1-1.471-5.42c0-5.246 4.264-9.51 9.51-9.51 2.536 0 4.918.99 6.701 2.775a9.46 9.46 0 0 1 2.795 6.73c0 5.246-4.265 9.51-9.51 9.51zm5.324-6.599c-.293-.147-1.732-.853-2.001-.95-.268-.098-.463-.147-.658.147-.196.293-.756.95-.928 1.146-.17.196-.347.22-.64.074-.292-.147-1.233-.454-2.35-1.45-.868-.773-1.455-1.73-1.626-2.023-.17-.294-.018-.453.129-.6.133-.132.293-.346.44-.52.147-.174.196-.294.293-.49.098-.196.049-.368-.025-.516-.074-.147-.658-1.587-.902-2.176-.237-.572-.478-.495-.658-.504l-.564-.01c-.194 0-.51.073-.778.368-.268.293-1.023 1-1.023 2.434 0 1.433 1.048 2.82 1.194 3.014.147.196 2.07 3.16 5.013 4.427.701.303 1.247.484 1.672.62.702.227 1.34.195 1.846.118.563-.085 1.732-.707 1.977-1.389.245-.683.245-1.268.171-1.389-.074-.122-.268-.196-.56-.343z" />
      </svg>
    );
  }

  return <span className="h-5 w-5" />;
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Logo
            showText={false}
            imageClassName="h-14 w-14 sm:h-16 sm:w-16"
            className="inline-flex"
          />
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            {SITE.tagline} Kami hadir sebagai pilihan terpercaya untuk camilan jamur premium di Indonesia.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span>Privacy Policy</span>
            <span className="inline-block h-1 w-1 rounded-full bg-slate-600" />
            <span>Terms of Service</span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-100">Navigasi Cepat</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-100">Kontak & Sosial</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>{SITE.email}</li>
              <li>{SITE.phone}</li>
              <li>{SITE.address}</li>
            </ul>
            <div className="mt-4 flex items-center gap-3">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-300 transition hover:border-secondary-light hover:bg-secondary-light hover:text-slate-950"
                >
                  <SocialIcon label={link.label} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {currentYear} {SITE.name}. Semua hak dilindungi.
      </div>
    </footer>
  );
}
