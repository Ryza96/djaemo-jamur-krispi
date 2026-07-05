"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";

export function useOrderDetail(id: string) {
  const [order, setOrder] = useState<OrderDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchOrder = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (res.status === 404) {
        throw new Error("NOT_FOUND");
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as {
        success: boolean;
        data: OrderDetailRow;
        error?: string;
      };

      if (!json.success) throw new Error(json.error ?? "Gagal memuat data.");
      if (controller.signal.aborted) return;
      setOrder(json.data);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof Error
          ? err.message === "NOT_FOUND"
            ? "NOT_FOUND"
            : err.message
          : "Terjadi kesalahan.",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
  }, [fetchOrder]);

  const refresh = useCallback(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refresh };
}
