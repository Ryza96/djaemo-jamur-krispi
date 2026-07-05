"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "md" | "lg";

const SIZE_STYLES: Record<ModalSize, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
};

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
  className?: string;
}

export function AdminModal({
  open,
  onClose,
  title,
  size = "md",
  children,
  className,
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          "mx-4 w-full rounded-3xl bg-white p-8 shadow-2xl",
          SIZE_STYLES[size],
          className,
        )}
      >
        {title && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {!title && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
