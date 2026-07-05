"use client";

import { cn } from "@/lib/utils";

interface OrderPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function OrderPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: OrderPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = (): number[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <div className="text-slate-500">
        {startItem}–{endItem} of {total}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
            page <= 1
              ? "cursor-not-allowed border-slate-200 text-slate-400"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
          )}
        >
          ← Prev
        </button>
        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
              pageNum === page
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
            )}
          >
            {pageNum}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
            page >= totalPages
              ? "cursor-not-allowed border-slate-200 text-slate-400"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
          )}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
