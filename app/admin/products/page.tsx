"use client";

import { useState } from "react";
import { products as initialProducts } from "@/data/products";
import ProductEditModal from "@/components/admin/ProductEditModal";
import { formatPrice } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<any | null>(null);

  const handleSave = (p: any) => {
    setProducts((prev) => prev.map((item) => (item.id === p.id ? p : item)));
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-bold">Produk</h1>
      <p className="mt-2 text-sm text-muted">Kelola postingan produk. Edit data langsung dari sini.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <img src={p.image} alt={p.name} className="h-40 w-full object-cover rounded" />
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <div className="text-sm font-semibold">{formatPrice(p.price)}</div>
              </div>
              <p className="mt-2 text-sm text-muted">{p.description}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setEditing(p)} className="rounded px-3 py-1 text-sm border">Edit</button>
                <button
                  onClick={() => {
                    const w = window.open("", "_blank", "noopener,noreferrer");
                    if (!w) return;
                    const html = `<html><head><title>Resi - ${p.name}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}</style></head><body><h1>${p.name}</h1><p>${p.description}</p><p>Harga: ${formatPrice(p.price)}</p></body></html>`;
                    w.document.write(html);
                    w.document.close();
                    w.print();
                  }}
                  className="rounded bg-slate-900 px-3 py-1 text-sm text-white"
                >
                  Cetak Resi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProductEditModal product={editing} onSave={handleSave} onClose={() => setEditing(null)} />
    </div>
  );
}
