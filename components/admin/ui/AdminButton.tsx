import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "info"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-500",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  info: "bg-sky-500 text-white hover:bg-sky-400",
  ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "rounded-2xl px-4 py-2 text-xs",
  md: "rounded-2xl px-5 py-2.5 text-sm",
  lg: "rounded-2xl px-6 py-3 text-sm",
};

interface AdminButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

export function AdminButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  href,
  target,
  rel,
  className,
  children,
  type = "button",
  ...rest
}: AdminButtonProps) {
  const isDisabled = disabled || loading;

  const styles = cn(
    "inline-flex items-center justify-center font-semibold transition-colors",
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    isDisabled && "cursor-not-allowed opacity-50",
    className,
  );

  if (href) {
    return (
      <Link href={href} target={target} rel={rel} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={styles} disabled={isDisabled} {...rest}>
      {children}
    </button>
  );
}
