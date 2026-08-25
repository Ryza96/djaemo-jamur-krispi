"use client";

import { useState, useCallback, useRef } from "react";
import type { RefundInfo } from "@/lib/services/payment/types";

interface MarkRefundedResult {
  success: boolean;
  error?: string;
}

export function useOrderRefund() {
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const markRefunded = useCallback(
    async (orderId: string): Promise<MarkRefundedResult & { data?: RefundInfo }> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/refund`,
          {
            method: "POST",
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return { success: false };

        const json = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: json.error ?? "Gagal menandai refund.",
          };
        }

        return { success: true, data: json.data };
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return { success: false };
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat menandai refund.",
        };
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  return { markRefunded, loading };
}
