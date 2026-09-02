import { Section } from "@/components/sections/Section";

const TESTIMONIALS = [
  {
    name: "Rina S.",
    city: "Jakarta",
    rating: 5,
    text: "Teksturnya renyah banget! Anak-anak langsung habis sebungkus. Pasti bakal repeat order.",
  },
  {
    name: "Andi P.",
    city: "Surabaya",
    rating: 5,
    text: "Rasanya autentik, berasa jamur aslinya. Cocok buat camilan nonton bareng keluarga.",
  },
  {
    name: "Maya L.",
    city: "Bandung",
    rating: 5,
    text: "Kemasannya rapi dan produknya fresh. Pengiriman juga cepat. Recommended!",
  },
  {
    name: "Budi K.",
    city: "Yogyakarta",
    rating: 5,
    text: "Varian baladonya juara! Pedas manisnya pas. Udah beli berkali-kali.",
  },
  {
    name: "Sari D.",
    city: "Semarang",
    rating: 5,
    text: "Jarang nemu camilan jamur yang seenak ini. Bahan alaminya berasa banget.",
  },
  {
    name: "Rio A.",
    city: "Medan",
    rating: 5,
    text: "Pengemasannya aman, produk sampai dengan sempurna. Rasa BBQ-nya favorit!",
  },
] as const;

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-gold">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
}) {
  const initials = testimonial.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="rounded-2xl border border-cream-2 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gold/40 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-cream text-sm font-semibold text-teal-mid">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-ink">{testimonial.name}</p>
          <p className="text-xs text-ink-soft">{testimonial.city}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-0.5">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <StarIcon key={i} />
        ))}
      </div>

      <p className="mt-4 font-display text-sm italic leading-relaxed text-ink-soft">
        &ldquo;{testimonial.text}&rdquo;
      </p>
    </div>
  );
}

export function TestimoniSection() {
  return (
    <Section>
      <div className="text-center">
        <p className="font-mono text-sm font-medium uppercase tracking-widest text-gold">
          Testimoni
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Kata Mereka tentang D&apos;JAEMO
        </h2>
        <p className="mt-3 text-ink-soft">
          100+ Customer telah mempercayai D&apos;JAEMO
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} />
        ))}
      </div>
    </Section>
  );
}
