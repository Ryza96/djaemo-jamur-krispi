"use client";

import { cn } from "@/lib/utils";
import { AdminInput } from "../ui/AdminInput";

interface AdminToolbarProps {
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function AdminToolbar({
  searchValue,
  onSearch,
  searchPlaceholder = "Search...",
  filters,
  action,
  className,
}: AdminToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {onSearch && (
        <AdminInput
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          inputSize="md"
          className="min-w-[280px]"
        />
      )}
      {filters}
      {action && <div>{action}</div>}
    </div>
  );
}
