"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import type { OrderFilters } from "./types";
import {
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
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
    <div className="flex flex-wrap items-center gap-2.5 xl:flex-nowrap">
      <AdminInput
        type="search"
        placeholder="Cari Order ID, Nama, Email, WhatsApp..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        inputSize="sm"
        className="w-full sm:w-auto sm:min-w-[200px] xl:min-w-[200px] xl:flex-1"
      />
      <AdminInput
        type="date"
        value={filters.date_from}
        onChange={(e) => handleImmediateChange("date_from", e.target.value)}
        inputSize="sm"
        aria-label="Dari tanggal"
        title="Dari tanggal"
        className="w-full sm:w-[130px]"
      />
      <span className="-mx-1 hidden select-none text-slate-400 sm:inline">–</span>
      <AdminInput
        type="date"
        value={filters.date_to}
        onChange={(e) => handleImmediateChange("date_to", e.target.value)}
        inputSize="sm"
        aria-label="Sampai tanggal"
        title="Sampai tanggal"
        className="w-full sm:w-[130px]"
      />
      <AdminSelect
        value={filters.payment_method}
        onChange={(e) => handleImmediateChange("payment_method", e.target.value)}
        inputSize="sm"
        aria-label="Metode pembayaran"
        className="w-full sm:w-[120px]"
      >
        {PAYMENT_METHOD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        value={filters.payment_status}
        onChange={(e) => handleImmediateChange("payment_status", e.target.value)}
        inputSize="sm"
        aria-label="Status pembayaran"
        className="w-full sm:w-[150px]"
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
        inputSize="sm"
        aria-label="Status pemenuhan"
        className="w-full sm:w-[150px]"
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
        inputSize="sm"
        aria-label="Urutan"
        className="w-full sm:w-[100px]"
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
        inputSize="sm"
        aria-label="Jumlah per halaman"
        className="w-full sm:w-[108px]"
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