import { cn } from "@/lib/utils";

interface AdminMetricProps {
  title: string;
  value: string | number;
  accent?: string;
  className?: string;
}

export function AdminMetric({
  title,
  value,
  accent,
  className,
}: AdminMetricProps) {
  return (
    <article
      className={cn(
        "rounded-3xl bg-white p-6 shadow-sm shadow-slate-200",
        className,
      )}
    >
      {accent && (
        <div
          className={cn(
            "inline-flex rounded-2xl px-3 py-1 text-xs font-semibold",
            accent,
          )}
        >
          {title}
        </div>
      )}
      {!accent && (
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </div>
      )}
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
