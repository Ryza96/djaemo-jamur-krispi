import { cn } from "@/lib/utils";

type EmptyVariant = "empty" | "error" | "not-found";

interface AdminEmptyLayoutProps {
  variant?: EmptyVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function AdminEmptyLayout({
  variant = "empty",
  icon,
  title,
  description,
  action,
  className,
}: AdminEmptyLayoutProps) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-12 text-center shadow-sm shadow-slate-200",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mx-auto mb-4 flex items-center justify-center",
            variant === "error" ? "text-rose-400" : "text-slate-300",
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-slate-500">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
