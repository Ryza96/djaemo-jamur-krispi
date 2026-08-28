"use client";

import { useState, useEffect, useCallback } from "react";
import type { VoucherListItem } from "@/lib/services/voucher.service";

interface UseVouchersReturn {
  vouchers: VoucherListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useVouchers(): UseVouchersReturn {
  const [vouchers, setVouchers] = useState<VoucherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vouchers");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat data voucher");
      }
      setVouchers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data voucher");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  return { vouchers, loading, error, refresh: fetchVouchers };
}
