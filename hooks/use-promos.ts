"use client";

import { useState, useEffect, useCallback } from "react";
import type { PromoListItem, PromoStatus } from "@/lib/services/promo.service";

interface UsePromosReturn {
  promos: PromoListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePromos(statusFilter?: PromoStatus): UsePromosReturn {
  const [promos, setPromos] = useState<PromoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/promos");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat data promo");
      }

      let promosData = data.data || [];

      if (statusFilter) {
        promosData = promosData.filter(
          (promo: PromoListItem) => promo.status === statusFilter
        );
      }

      setPromos(promosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data promo");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  return { promos, loading, error, refresh: fetchPromos };
}
