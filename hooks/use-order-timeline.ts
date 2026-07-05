"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TimelineEntry {
  id: number;
  order_id: string;
  event: string;
  from_status: string | null;
  to_status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useOrderTimeline(orderId: string) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTimeline = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/timeline`,
        { signal: controller.signal },
      );

      if (controller.signal.aborted) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as {
        success: boolean;
        data: TimelineEntry[];
        error?: string;
      };

      if (controller.signal.aborted) return;
      if (!json.success) throw new Error(json.error ?? "Gagal memuat timeline.");

      setEntries(json.data);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTimeline();
  }, [fetchTimeline]);

  const refresh = useCallback(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return { entries, loading, error, refresh };
}
