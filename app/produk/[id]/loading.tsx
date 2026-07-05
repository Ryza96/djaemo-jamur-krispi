import { Section } from "@/components/sections/Section";

export default function ProdukDetailLoading() {
  return (
    <Section>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        {/* Gallery skeleton */}
        <div>
          <div className="aspect-square animate-pulse rounded-xl bg-surface-dark" />
          <div className="mt-4 flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square w-20 animate-pulse rounded-lg bg-surface-dark" />
            ))}
          </div>
        </div>

        {/* Info skeleton */}
        <div className="flex flex-col">
          <div className="h-8 w-3/4 animate-pulse rounded bg-surface-dark sm:h-9" />
          <div className="mt-2 flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-4 animate-pulse rounded bg-surface-dark" />
            ))}
            <div className="ml-1 h-4 w-28 animate-pulse rounded bg-surface-dark" />
          </div>
          <div className="mt-4 h-10 w-1/3 animate-pulse rounded bg-surface-dark sm:h-12" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-surface-dark" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-surface-dark" />
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded bg-surface-dark" />
                <div className="h-4 w-32 animate-pulse rounded bg-surface-dark" />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="h-6 w-20 animate-pulse rounded-full bg-surface-dark" />
          </div>
          <div className="my-6 h-px w-full animate-pulse bg-surface-dark" />
          <div className="space-y-4">
            <div className="h-5 w-12 animate-pulse rounded bg-surface-dark" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-surface-dark" />
              <div className="h-8 w-8 animate-pulse rounded bg-surface-dark" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-surface-dark" />
            </div>
            <div className="h-12 w-full animate-pulse rounded-full bg-surface-dark" />
            <div className="h-11 w-full animate-pulse rounded-full bg-surface-dark" />
          </div>
        </div>
      </div>
    </Section>
  );
}
