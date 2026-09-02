import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-16 md:py-20", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-10 text-center sm:mb-12">
      <h1 className="font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[40px]">
        {title}
      </h1>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
