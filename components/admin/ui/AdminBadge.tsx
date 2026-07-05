import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";
type BadgeSize = "sm" | "md" | "lg";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-slate-100 text-slate-600",
};

const DOT_STYLES: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-xs",
};

interface AdminBadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  uppercase?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AdminBadge({
  variant = "neutral",
  size = "md",
  dot = true,
  uppercase = true,
  className,
  children,
}: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        SIZE_STYLES[size],
        uppercase && "uppercase tracking-[0.2em]",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[variant])} />
      )}
      {children}
    </span>
  );
}
