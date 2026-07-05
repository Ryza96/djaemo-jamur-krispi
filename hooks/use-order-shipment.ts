"use client";

import { useState, useCallback, useRef } from "react";

interface ShipmentResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function useOrderShipment() {
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const create = useCallback(
    async (orderId: string): Promise<ShipmentResult> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/shipment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return { success: false };

        const json = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: json.error ?? "Gagal membuat resi.",
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
              : "Terjadi kesalahan saat membuat resi.",
        };
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  return { create, loading };
}
