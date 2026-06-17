import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-16 sm:py-20", className)}>
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
      <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
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
