"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { supabaseClient } from "@/lib/supabase-client";
import ProgressModal, { type PipelineStep } from "@/components/admin/ProgressModal";
import ProductImagePicker, { type ProductImagePickerHandle } from "@/components/admin/products/ProductImagePicker";
import { classifyUploadError } from "@/lib/errors/upload-errors";
import type { FileUploadStatusItem } from "@/lib/errors/upload-errors";
import { UPLOAD } from "@/lib/constants/upload";
import { validateImageFile, validateFileCount, validateTotalSize } from "@/lib/validation/product-image.validation";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const pickerRef = useRef<ProductImagePickerHandle | null>(null);
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [fileUploadStatuses, setFileUploadStatuses] = useState<FileUploadStatusItem[]>([]);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);
  const [restockSuccess, setRestockSuccess] = useState<string | null>(null);

  const pipelineLabels = [
    { id: 1, label: 'Validasi Data Produk' },
    { id: 2, label: 'Upload Gambar' },
    { id: 3, label: 'Generate Public URL' },
    { id: 4, label: 'Simpan Data Produk' },
    { id: 5, label: 'Simpan product_images' },
    { id: 6, label: 'Refresh Daftar Produk' },
    { id: 7, label: 'Selesai' },
  ];

  const createInitialPipeline = (): PipelineStep[] =>
    pipelineLabels.map(s => ({ ...s, status: 'WAITING' as const }));
  const pipelineRunning = (prev: PipelineStep[], id: number): PipelineStep[] =>
    prev.map(s => s.id === id ? { ...s, status: 'RUNNING' as const } : s);
  const pipelineSuccess = (prev: PipelineStep[], id: number): PipelineStep[] =>
    prev.map(s => s.id === id ? { ...s, status: 'SUCCESS' as const } : s);
  const pipelineFailed = (prev: PipelineStep[], id: number, error: string): PipelineStep[] =>
    prev.map(s => s.id === id ? { ...s, status: 'FAILED' as const, error } : s);
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", price: 0, weight: "", stock: 0, images: [] });
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowProductModal(true);
  };

  const sanitizePriceToInt = (raw: unknown): number | null => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') {
      if (!Number.isFinite(raw)) return null;
      return Math.trunc(raw);
    }
    const s = String(raw);
    const digits = s.replace(/[^0-9]/g, '');
    if (!digits) return null;
    const n = Number.parseInt(digits, 10);
    return Number.isNaN(n) ? null : n;
  };

  const handleSaveProduct = async () => {
    const sanitizedPrice = sanitizePriceToInt(formData.price);

    setShowPipeline(true);
    setPipelineError(null);
    let steps = createInitialPipeline();
    setPipelineSteps(steps);
    await delay(30);

    steps = pipelineRunning(steps, 1);
    setPipelineSteps(steps);
    await delay(30);

    if (!formData.name || sanitizedPrice === null) {
      const msg = "Nama dan harga produk harus diisi (angka integer).";
      steps = pipelineFailed(steps, 1, msg);
      setPipelineSteps(steps);
      setPipelineError(msg);
      return;
    }
    steps = pipelineSuccess(steps, 1);
    setPipelineSteps(steps);
    await delay(30);

    steps = pipelineRunning(steps, 2);
    setPipelineSteps(steps);
    await delay(30);

    const productId = editingProduct ? editingProduct.id : `produk-${Date.now()}`;
    const imageUrls: string[] = [];
    const uploadedFileRecords: Array<{ path: string; url: string }> = [];
    const items = pickerRef.current?.getItems() || [];

    const initialStatuses: FileUploadStatusItem[] = items.map((item) => ({
      id: item.id,
      fileName: item.file?.name || item.src.split('/').pop() || 'Gambar',
      status: item.type === 'existing' ? 'success' : 'pending',
    }));
    setFileUploadStatuses(initialStatuses);

    const newFiles = items.filter((p) => p.type === 'new' && p.file);
    const countErr = validateFileCount(items.length);
    if (countErr) {
      steps = pipelineFailed(steps, 2, countErr.message);
      setPipelineSteps(steps);
      setPipelineError(countErr.message);
      return;
    }

    for (const p of newFiles) {
      const f = p.file!;
      const fileErr = validateImageFile(f);
      if (fileErr) {
        setFileUploadStatuses((prev) =>
          prev.map((fs) =>
            fs.id === p.id ? { ...fs, status: 'failed', errorCode: fileErr.code as FileUploadStatusItem['errorCode'], errorMessage: fileErr.message } : fs
          )
        );
        steps = pipelineFailed(steps, 2, fileErr.message);
        setPipelineSteps(steps);
        setPipelineError(fileErr.message);
        return;
      }
    }

    const totalErr = validateTotalSize(newFiles.map((p) => p.file!));
    if (totalErr) {
      steps = pipelineFailed(steps, 2, totalErr.message);
      setPipelineSteps(steps);
      setPipelineError(totalErr.message);
      return;
    }

    try {
      for (let i = 0; i < Math.min(items.length, UPLOAD.MAX_IMAGES); i++) {
        const item = items[i];
        if (!item) continue;
        if (item.type === 'existing') {
          imageUrls.push(item.src);
          continue;
        }
        if (item.type === 'new' && item.file) {
          setUploadingMap((prev) => ({ ...prev, [item.id]: true }));
          setFileUploadStatuses((prev) =>
            prev.map((fs) => (fs.id === item.id ? { ...fs, status: 'uploading' } : fs))
          );
          try {
            const file = item.file;
            const uploadForm = new FormData();
            uploadForm.append("file", file);
            uploadForm.append("productId", productId);

            const res = await fetch("/api/admin/products/upload", {
              method: "POST",
              body: uploadForm,
            });

            if (!res.ok) {
              const errBody = await res.json().catch(() => null);
              throw new Error(errBody?.error || `Upload gagal (HTTP ${res.status})`);
            }

            const { url, path } = await res.json();
            imageUrls.push(url);
            uploadedFileRecords.push({ path, url });

            setFileUploadStatuses((prev) =>
              prev.map((fs) => (fs.id === item.id ? { ...fs, status: 'success' } : fs))
            );
          } catch (err) {
            const classified = classifyUploadError(err);
            setFileUploadStatuses((prev) =>
              prev.map((fs) =>
                fs.id === item.id
                  ? { ...fs, status: 'failed', errorCode: classified.code, errorMessage: classified.userMessage }
                  : fs
              )
            );
            throw err;
          } finally {
            setUploadingMap((prev) => ({ ...prev, [item.id]: false }));
            if (item.src && item.src.startsWith('blob:')) {
              try { URL.revokeObjectURL(item.src); } catch {}
            }
          }
        }
      }
    } catch (err) {
      const classified = classifyUploadError(err);
      const msg = classified.userMessage;
      steps = pipelineFailed(steps, 2, msg);
      setPipelineSteps(steps);
      setPipelineError(`Upload Gambar: ${msg}`);
      return;
    }

    steps = pipelineSuccess(steps, 2);
    setPipelineSteps(steps);
    await delay(30);

    steps = pipelineRunning(steps, 3);
    setPipelineSteps(steps);
    await delay(30);

    try {
      for (const record of uploadedFileRecords) {
        const headRes = await fetch(record.url, { method: 'HEAD' });
        if (!headRes.ok) {
          throw new Error(`URL tidak dapat diakses (HTTP ${headRes.status}): ${record.url}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      steps = pipelineFailed(steps, 3, msg);
      setPipelineSteps(steps);
      setPipelineError(`Generate Public URL: ${msg}`);
      return;
    }

    steps = pipelineSuccess(steps, 3);
    setPipelineSteps(steps);
    await delay(30);

    steps = pipelineRunning(steps, 4);
    setPipelineSteps(steps);
    await delay(30);

    try {
      if (editingProduct) {
        const payload = { id: editingProduct.id, ...formData, price: sanitizedPrice, images: imageUrls };
        const res = await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || `HTTP ${res.status}`);
        }
      } else {
        const payload = {
          id: productId,
          name: formData.name || "",
          description: formData.description || "",
          price: sanitizedPrice || 0,
          stock: formData.stock ?? 0,
          weight: formData.weight || "",
          images: imageUrls,
        };
        const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || `HTTP ${res.status}`);
        }
      }

      const lookupId = editingProduct ? editingProduct.id : productId;
      const { data: verifyProduct, error: verifyErr } = await supabaseClient
        .from('products')
        .select('id')
        .eq('id', lookupId)
        .maybeSingle();

      if (verifyErr) throw new Error(`Gagal verifikasi produk: ${verifyErr.message}`);
      if (!verifyProduct) throw new Error(`Produk dengan ID ${lookupId} tidak ditemukan setelah disimpan.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      steps = pipelineFailed(steps, 4, msg);
      setPipelineSteps(steps);
      setPipelineError(`Simpan Data Produk: ${msg}`);
      return;
    }
    steps = pipelineSuccess(steps, 4);
    setPipelineSteps(steps);
    await delay(30);

    steps = pipelineRunning(steps, 5);
    setPipelineSteps(steps);
    await delay(30);

    try {
      if (imageUrls.length > 0) {
        const lookupId = editingProduct ? editingProduct.id : productId;
        const { data: verifyImages, error: verifyImgErr } = await supabaseClient
          .from('product_images')
          .select('id')
          .eq('product_id', lookupId);

        if (verifyImgErr) throw new Error(`Gagal verifikasi product_images: ${verifyImgErr.message}`);
        if (!verifyImages || verifyImages.length === 0) throw new Error(`Data gambar tidak ditemukan untuk produk ${lookupId}.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      steps = pipelineFailed(steps, 5, msg);
      setPipelineSteps(steps);
      setPipelineError(`Simpan product_images: ${msg}`);
      return;
    }

    steps = pipelineSuccess(steps, 5);
    setPipelineSteps(steps);
    await delay(30);

    steps = pipelineRunning(steps, 6);
    setPipelineSteps(steps);
    await delay(30);

    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const lookupId = editingProduct ? editingProduct.id : productId;
      const found = Array.isArray(data) && (data as Array<{ id: string }>).some((p) => p.id === lookupId);
      if (!found) throw new Error(`Produk ${lookupId} tidak muncul di daftar produk setelah disimpan.`);
      setProducts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      steps = pipelineFailed(steps, 6, msg);
      setPipelineSteps(steps);
      setPipelineError(`Refresh Daftar Produk: ${msg}`);
      return;
    }
    steps = pipelineSuccess(steps, 6);
    setPipelineSteps(steps);
    await delay(30);

    steps = pipelineRunning(steps, 7);
    setPipelineSteps(steps);
    await delay(30);
    steps = pipelineSuccess(steps, 7);
    setPipelineSteps(steps);
    await delay(30);

    setShowProductModal(false);
    setFormData({});
    setUploadingMap({});
    pickerRef.current?.reset();

    setTimeout(() => setShowPipeline(false), 1500);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
        .then(() => fetch('/api/products'))
        .then((r) => r.json())
        .then((data) => setProducts(data))
        .catch(() => {});
    }
  };

  const openRestockModal = (product: Product) => {
    setRestockProduct(product);
    setRestockQty("");
    setRestockError(null);
    setRestockSuccess(null);
  };

  const closeRestockModal = () => {
    if (restockLoading) return;
    setRestockProduct(null);
    setRestockQty("");
    setRestockError(null);
    setRestockSuccess(null);
  };

  const handleRestock = async () => {
    if (!restockProduct) return;

    const parsedQty = Number(restockQty);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 100000) {
      setRestockError("Jumlah harus bilangan bulat antara 1 dan 100000.");
      return;
    }

    setRestockLoading(true);
    setRestockError(null);
    setRestockSuccess(null);

    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(restockProduct.id)}/restock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: parsedQty }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setRestockSuccess(
        `Stok "${restockProduct.name}" berhasil ditambah ${parsedQty}: ${data.previousStock} → ${data.newStock}.`,
      );
      setRestockProduct((prev) =>
        prev ? { ...prev, stock: data.newStock } : prev,
      );

      const listRes = await fetch('/api/products');
      const listData = await listRes.json();
      if (Array.isArray(listData)) setProducts(listData);
    } catch (err) {
      setRestockError(err instanceof Error ? err.message : "Gagal menambah stok.");
    } finally {
      setRestockLoading(false);
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Manajemen Produk</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Kelola stok dan informasi produk</h3>
        </div>
        <button
          onClick={handleAddProduct}
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          + Tambah Produk
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID Produk</th>
              <th className="px-4 py-3 font-medium">Nama Produk</th>
              <th className="px-4 py-3 font-medium">Harga</th>
              <th className="px-4 py-3 font-medium">Stok</th>
              <th className="px-4 py-3 font-medium">Berat</th>
              <th className="px-4 py-3 font-medium">Deskripsi</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-4 font-medium text-slate-900">{product.id}</td>
                <td className="px-4 py-4 text-slate-700">{product.name}</td>
                <td className="px-4 py-4 text-slate-700">Rp {product.price.toLocaleString("id-ID")}</td>
                <td className="px-4 py-4 text-slate-700">{product.stock}</td>
                <td className="px-4 py-4 text-slate-700">{product.weight}</td>
                <td className="px-4 py-4 text-slate-700 truncate max-w-xs">{product.description}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="rounded-2xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openRestockModal(product)}
                      className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Restock
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900">
              {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Produk</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama produk"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Masukkan deskripsi produk"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Harga (Rp)</label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stok</label>
                  <input
                    type="number"
                    value={formData.stock ?? 0}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Berat</label>
                  <input
                    type="text"
                    value={formData.weight || ""}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g., 72g"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div>
                <ProductImagePicker
                  key={editingProduct?.id || 'new'}
                  ref={pickerRef}
                  existingImages={editingProduct && Array.isArray(editingProduct.images) ? editingProduct.images : undefined}
                  uploadingMap={uploadingMap}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowProductModal(false)}
                className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={Object.values(uploadingMap).some(Boolean)}
                className={`flex-1 rounded-2xl bg-linear-to-r from-emerald-600 via-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white transition ${Object.values(uploadingMap).some(Boolean) ? 'opacity-60 cursor-not-allowed' : 'hover:from-emerald-500 hover:to-emerald-500'}`}
              >
                {Object.values(uploadingMap).some(Boolean) ? 'Mengunggah...' : (editingProduct ? 'Simpan Perubahan' : 'Tambah Produk')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProgressModal
        steps={pipelineSteps}
        error={pipelineError}
        isOpen={showPipeline}
        fileStatuses={fileUploadStatuses}
        onClose={() => {
          setShowPipeline(false);
          setPipelineError(null);
          setPipelineSteps([]);
          setFileUploadStatuses([]);
          setUploadingMap({});
          pickerRef.current?.reset();
        }}
      />

      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900">Tambah Stok</h2>

            <p className="mb-1 text-sm font-medium text-slate-700">Produk</p>
            <p className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900">{restockProduct.name}</p>

            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-sm text-slate-500">Stok saat ini:</span>
              <span className="text-lg font-semibold text-slate-900">{restockProduct.stock}</span>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-700">Jumlah Ditambah</label>
            <input
              type="number"
              min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder="Contoh: 10"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />

            {restockError && (
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{restockError}</p>
            )}
            {restockSuccess && (
              <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{restockSuccess}</p>
            )}

            <div className="mt-8 flex gap-4">
              <button
                onClick={closeRestockModal}
                disabled={restockLoading}
                className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tutup
              </button>
              <button
                onClick={handleRestock}
                disabled={restockLoading}
                className={`flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                  restockSuccess ? "pointer-events-none" : ""
                }`}
              >
                {restockLoading ? "Menambah..." : "Tambah Stok"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
