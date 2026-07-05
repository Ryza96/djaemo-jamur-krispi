"use client";

import { cn } from "@/lib/utils";
import { AdminButton } from "./AdminButton";

interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function AdminDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "primary",
  loading = false,
  children,
  className,
}: AdminDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          "mx-4 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl",
          className,
        )}
      >
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        )}

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <AdminButton
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={variant === "danger" ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
