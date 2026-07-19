"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/patterns/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminSection } from "@/components/admin/patterns/AdminSection";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface SelectedProduct {
  product_id: string;
  promo_price: number;
  product_name?: string;
}

type FormMode = "create" | "edit" | "duplicate";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function utcToWibDate(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + WIB_OFFSET_MS);
  return d.toISOString().split("T")[0];
}

function utcToWibTime(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + WIB_OFFSET_MS);
  return d.toISOString().split("T")[1].slice(0, 5);
}

function getFormTitle(mode: FormMode): string {
  switch (mode) {
    case "edit":
      return "Edit Promo";
    case "duplicate":
      return "Duplikat Promo";
    case "create":
    default:
      return "Tambah Promo";
  }
}

function getFormSubtitle(mode: FormMode): string {
  switch (mode) {
    case "edit":
      return "Ubah data promo";
    case "duplicate":
      return "Buat promo baru dari salinan";
    case "create":
    default:
      return "Buat promo baru";
  }
}

function getSaveLabel(mode: FormMode): string {
  switch (mode) {
    case "edit":
      return "Simpan Perubahan";
    case "duplicate":
      return "Simpan Salinan";
    case "create":
    default:
      return "Simpan Promo";
  }
}

export default function NewPromoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const modeParam = searchParams?.get("mode");
  const promoId = searchParams?.get("id");
  const mode: FormMode =
    modeParam === "edit" && promoId
      ? "edit"
      : modeParam === "duplicate" && promoId
        ? "duplicate"
        : "create";

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProducts(list.map((p: Product) => ({ id: p.id, name: p.name, price: p.price })));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mode === "create" || !promoId) return;

    fetch(`/api/admin/promos/${promoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data) {
          setError("Promo tidak ditemukan");
          return;
        }
        const promo = data.data;

        if (mode === "edit") {
          setName(promo.name);
          setStartDate(utcToWibDate(promo.start_date));
          setStartTime(utcToWibTime(promo.start_date));
          setEndDate(utcToWibDate(promo.end_date));
          setEndTime(utcToWibTime(promo.end_date));
          setSelectedProducts(
            promo.promo_products.map((pp: { product_id: string; promo_price: number; products?: { name: string } | null }) => ({
              product_id: pp.product_id,
              promo_price: pp.promo_price,
              product_name: pp.products?.name || pp.product_id,
            }))
          );
        }

        if (mode === "duplicate") {
          setName(`${promo.name} (COPY)`);
          setSelectedProducts(
            promo.promo_products.map((pp: { product_id: string; promo_price: number; products?: { name: string } | null }) => ({
              product_id: pp.product_id,
              promo_price: pp.promo_price,
              product_name: pp.products?.name || pp.product_id,
            }))
          );
        }
      })
      .catch(() => setError("Gagal memuat data promo"));
  }, [mode, promoId]);

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.product_id === productId);
      if (exists) {
        return prev.filter((p) => p.product_id !== productId);
      }
      const product = products.find((p) => p.id === productId);
      return [
        ...prev,
        {
          product_id: productId,
          promo_price: product ? product.price : 0,
        },
      ];
    });
  };

  const handlePromoPriceChange = (productId: string, price: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.product_id === productId ? { ...p, promo_price: price } : p
      )
    );
  };

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Nama promo harus diisi");
      return;
    }

    if (!startDate || !endDate) {
      setError("Tanggal mulai dan berakhir harus diisi");
      return;
    }

    if (selectedProducts.length === 0) {
      setError("Minimal 1 produk harus dipilih");
      return;
    }

    const startDateTime = new Date(new Date(`${startDate}T${startTime}:00`).getTime() - WIB_OFFSET_MS).toISOString();
    const endDateTime = new Date(new Date(`${endDate}T${endTime}:00`).getTime() - WIB_OFFSET_MS).toISOString();

    if (startDateTime >= endDateTime) {
      setError("Tanggal mulai harus sebelum tanggal berakhir");
      return;
    }

    for (const sp of selectedProducts) {
      if (sp.promo_price <= 0) {
        setError("Harga promo harus lebih dari 0");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        start_date: startDateTime,
        end_date: endDateTime,
        products: selectedProducts,
      };

      let res: Response;

      if (mode === "edit" && promoId) {
        res = await fetch(`/api/admin/promos/${promoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/promos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan promo");
      }

      router.push("/admin/promos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan promo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <AdminPageHeader
          title={getFormTitle(mode)}
          subtitle={getFormSubtitle(mode)}
          backHref="/admin/promos"
          className="mb-6"
        />

        {error && (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <AdminSection title="Informasi Promo">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nama Promo
              </label>
              <AdminInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Promo Kemerdekaan"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal Mulai
                </label>
                <AdminInput
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Jam Mulai
                </label>
                <AdminInput
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal Berakhir
                </label>
                <AdminInput
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Jam Berakhir
                </label>
                <AdminInput
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </AdminSection>

        <AdminSection title="Pilih Produk" className="mt-6">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Memuat daftar produk...
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Tidak ada produk tersedia
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const isSelected = selectedProducts.some(
                  (p) => p.product_id === product.id
                );
                const selectedProduct = selectedProducts.find(
                  (p) => p.product_id === product.id
                );

                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-4 rounded-3xl border p-4 transition ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleProduct(product.id)}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">
                        Harga Normal: {formatPrice(product.price)}
                      </p>
                    </div>
                    {isSelected && selectedProduct && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">
                          Harga Promo:
                        </label>
                        <input
                          type="number"
                          value={selectedProduct.promo_price}
                          onChange={(e) =>
                            handlePromoPriceChange(
                              product.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-32 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </AdminSection>

        <div className="mt-6 flex gap-4">
          <AdminButton
            variant="secondary"
            onClick={() => router.push("/admin/promos")}
          >
            Batal
          </AdminButton>
          <AdminButton
            variant="success"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            {getSaveLabel(mode)}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
