"use client";

import { useState, useCallback, useRef } from "react";

interface SaveResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function useAdminNotes() {
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const save = useCallback(
    async (orderId: string, adminNotes: string): Promise<SaveResult> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSaving(true);

      try {
        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_notes: adminNotes }),
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return { success: false };

        const json = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: json.error ?? "Gagal menyimpan catatan.",
          };
        }

        return { success: true, message: json.message };
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return { success: false };
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Gagal menyimpan catatan.",
        };
      } finally {
        if (!controller.signal.aborted) setSaving(false);
      }
    },
    [],
  );

  return { save, saving };
}
