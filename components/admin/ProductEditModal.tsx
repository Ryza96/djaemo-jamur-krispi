"use client";

import React, { useState } from "react";
import type { Product } from "@/types";

type Props = {
  product: Product | null;
  onSave: (p: Product) => void;
  onClose: () => void;
};

export default function ProductEditModal({ product, onSave, onClose }: Props) {
  const [form, setForm] = useState<Product | null>(product);

  React.useEffect(() => {
    setForm(product);
  }, [product]);

  if (!product || !form) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-bold">Edit Produk</h2>
        <div className="mt-4 grid gap-3">
          <label className="text-sm">Nama</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded border px-3 py-2" />

          <label className="text-sm">Deskripsi</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded border px-3 py-2" rows={3} />

          <label className="text-sm">Harga (angka)</label>
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="rounded border px-3 py-2" />

          <div className="mt-4 flex justify-end gap-3">
            <button onClick={onClose} className="rounded px-4 py-2">Batal</button>
            <button
              onClick={() => {
                onSave(form);
                onClose();
              }}
              className="rounded bg-slate-900 px-4 py-2 text-white"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
