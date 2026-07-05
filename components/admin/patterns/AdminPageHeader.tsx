import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  badges?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  badges,
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          ← {backLabel}
        </Link>
      )}
      <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-mono text-2xl font-bold text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {badges && (
            <div className="flex flex-wrap items-center gap-2">{badges}</div>
          )}
          {action && <div>{action}</div>}
        </div>
      </div>
    </div>
  );
}
