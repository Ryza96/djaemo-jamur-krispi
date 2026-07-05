import { cn } from "@/lib/utils";

type SectionPadding = "sm" | "md" | "lg";

const PADDING_STYLES: Record<SectionPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

interface AdminSectionProps {
  title?: string;
  titleTag?: "h2" | "h3" | "h4";
  action?: React.ReactNode;
  padding?: SectionPadding;
  className?: string;
  children: React.ReactNode;
}

export function AdminSection({
  title,
  titleTag: TitleTag = "h2",
  action,
  padding = "md",
  className,
  children,
}: AdminSectionProps) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white shadow-sm shadow-slate-200",
        PADDING_STYLES[padding],
        className,
      )}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <TitleTag className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </TitleTag>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
