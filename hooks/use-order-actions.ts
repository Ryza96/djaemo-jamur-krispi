"use client";

import { useState, useCallback, useRef } from "react";

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function useOrderActions() {
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (
      orderId: string,
      action: "confirm" | "pack" | "ship" | "complete" | "cancel",
      extra?: { waybill_id?: string; cancellation_reason?: string },
    ): Promise<ActionResult> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const body: Record<string, unknown> = { action };
        if (extra?.waybill_id) body.waybill_id = extra.waybill_id;
        if (extra?.cancellation_reason)
          body.cancellation_reason = extra.cancellation_reason;

        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/actions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return { success: false };

        const json = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: json.error ?? "Gagal mengeksekusi aksi.",
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
              : "Terjadi kesalahan saat mengeksekusi aksi.",
        };
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  return { execute, loading };
}
