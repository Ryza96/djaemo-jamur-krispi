import { cn } from "@/lib/utils";

type GridCols = 1 | 2 | 3 | 4;
type GridGap = "sm" | "md" | "lg";

const COLS_STYLES: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const GAP_STYLES: Record<GridGap, string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
};

interface AdminGridProps {
  cols?: GridCols;
  gap?: GridGap;
  className?: string;
  children: React.ReactNode;
}

export function AdminGrid({
  cols = 1,
  gap = "md",
  className,
  children,
}: AdminGridProps) {
  return (
    <div className={cn("grid", COLS_STYLES[cols], GAP_STYLES[gap], className)}>
      {children}
    </div>
  );
}
