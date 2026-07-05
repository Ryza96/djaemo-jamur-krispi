"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import type { OrderFilters } from "./types";
import {
  PAYMENT_STATUS_OPTIONS,
  FULFILLMENT_STATUS_OPTIONS,
  LIMIT_OPTIONS,
  SORT_OPTIONS,
} from "./types";

interface OrderToolbarProps {
  filters: OrderFilters;
  onFilterChange: (filters: OrderFilters) => void;
}

export function OrderToolbar({ filters, onFilterChange }: OrderToolbarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  });

  useEffect(() => {
    if (debouncedSearch !== filtersRef.current.search) {
      onFilterChange({ ...filtersRef.current, search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, onFilterChange]);

  const handleImmediateChange = (key: keyof OrderFilters, value: string | number) => {
    onFilterChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <AdminInput
        type="text"
        placeholder="Cari Order ID, Nama, Email, atau WhatsApp..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        inputSize="md"
        className="min-w-[280px]"
      />
      <AdminSelect
        value={filters.payment_status}
        onChange={(e) => handleImmediateChange("payment_status", e.target.value)}
        inputSize="md"
      >
        {PAYMENT_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        value={filters.fulfillment_status}
        onChange={(e) => handleImmediateChange("fulfillment_status", e.target.value)}
        inputSize="md"
      >
        {FULFILLMENT_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        value={filters.sort}
        onChange={(e) => handleImmediateChange("sort", e.target.value)}
        inputSize="md"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        value={String(filters.limit)}
        onChange={(e) => handleImmediateChange("limit", Number(e.target.value))}
        inputSize="md"
      >
        {LIMIT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt} / page
          </option>
        ))}
      </AdminSelect>
    </div>
  );
}
