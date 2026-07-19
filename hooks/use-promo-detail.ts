"use client";

import { useState, useEffect, useCallback } from "react";
import type { PromoListItem } from "@/lib/services/promo.service";

interface UsePromoDetailReturn {
  promo: PromoListItem | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  cancelPromo: () => Promise<{ success: boolean; error?: string }>;
}

export function usePromoDetail(id: string): UsePromoDetailReturn {
  const [promo, setPromo] = useState<PromoListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/promos/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat data promo");
      }

      setPromo(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data promo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPromo();
  }, [fetchPromo]);

  const cancelPromo = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/admin/promos/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Gagal membatalkan promo" };
      }

      await fetchPromo();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Gagal membatalkan promo",
      };
    }
  }, [id, fetchPromo]);

  return { promo, loading, error, refresh: fetchPromo, cancelPromo };
}
