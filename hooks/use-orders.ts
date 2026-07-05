"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { OrderListItem, OrderListResponse, OrderFilters } from "@/components/admin/orders/types";

const DEFAULT_FILTERS: OrderFilters = {
  search: "",
  payment_status: "",
  fulfillment_status: "",
  sort: "newest",
  page: 1,
  limit: 20,
};

export function useOrders() {
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef(filters);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    filtersRef.current = filters;
  });

  const fetchOrders = useCallback(async (f: OrderFilters) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(f.page));
      params.set("limit", String(f.limit));
      params.set("sort", f.sort);
      if (f.search) params.set("search", f.search);
      if (f.payment_status) params.set("payment_status", f.payment_status);
      if (f.fulfillment_status) params.set("fulfillment_status", f.fulfillment_status);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as OrderListResponse & { error?: string };
      if (controller.signal.aborted) return;
      if (!json.success) throw new Error(json.error ?? "Gagal memuat data.");

      setOrders(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders(filters);
  }, [filters, fetchOrders]);

  const refresh = useCallback(() => {
    fetchOrders(filtersRef.current);
  }, [fetchOrders]);

  return {
    orders,
    total,
    totalPages,
    loading,
    error,
    filters,
    setFilters,
    refresh,
  };
}
