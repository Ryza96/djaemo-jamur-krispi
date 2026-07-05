"use client";

import { cn } from "@/lib/utils";
import { AdminSelect } from "../ui/AdminInput";

interface FilterDef {
  id: string;
  label: string;
  value: string;
  options?: { label: string; value: string }[];
  onChange: (value: string) => void;
  type?: "select" | "date" | "text";
  placeholder?: string;
}

interface AdminFilterBarProps {
  filters: FilterDef[];
  onClear?: () => void;
  className?: string;
}

export function AdminFilterBar({
  filters,
  onClear,
  className,
}: AdminFilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {filters.map((filter) => {
        if (filter.type === "select" || (!filter.type && filter.options)) {
          return (
            <AdminSelect
              key={filter.id}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              inputSize="md"
              aria-label={filter.label}
            >
              {(filter.options ?? []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
          );
        }
        return null;
      })}
      {onClear && (
        <button
          onClick={onClear}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}
