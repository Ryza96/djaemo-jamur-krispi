import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<SpinnerSize, string> = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

interface AdminSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export function AdminSpinner({ size = "md", className }: AdminSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-slate-300 border-t-transparent",
        SIZE_STYLES[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
