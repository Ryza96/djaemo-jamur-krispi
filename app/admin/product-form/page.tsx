"use client";

import { useMemo, useState } from "react";

type PhotoPreview = {
  id: string;
  url: string;
  name: string;
};

const categoryOptions = ["Original", "Balado", "Spicy", "Keju"];

export default function ProductFormPage() {
  const [name, setName] = useState("Jamur Krispi Original 150g");
  const [category, setCategory] = useState("Original");
  const [price, setPrice] = useState("88000");
  const [stock, setStock] = useState("25");
  const [description, setDescription] = useState(
    "Jamur Krispi Original terbuat dari jamur pilihan yang diolah dengan bumbu rahasia, renyah dan gurih untuk cemilan setiap saat."
  );
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);

  const totalPhotos = photos.length;
  const formattedPrice = useMemo(() => {
    const numeric = Number(price.replace(/[^0-9]/g, ""));
    return numeric ? numeric.toLocaleString("id-ID") : "0";
  }, [price]);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newPhotos: PhotoPreview[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleFileChange(event.dataTransfer.files);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Integrasikan dengan API backend untuk simpan data produk
    alert("Produk berhasil disimpan. Lanjutkan integrasi ke backend.");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-4xl bg-white p-6 shadow-xl shadow-slate-200/80 sm:p-8">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Dashboard Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Form Tambah & Edit Produk</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Kelola detail produk Jamur Krispi dengan form modern. Isi data produk, pilih kategori, dan tambahkan foto agar tampilan katalog lebih menarik.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-200/60">
            <div>
              <label htmlFor="product-name" className="mb-3 block text-sm font-semibold text-slate-700">
                Nama Produk
              </label>
              <input
                id="product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                placeholder="Contoh: Jamur Krispi Original 150g"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="product-category" className="mb-3 block text-sm font-semibold text-slate-700">
                  Kategori
                </label>
                <select
                  id="product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product-price" className="mb-3 block text-sm font-semibold text-slate-700">
                  Harga (Rupiah)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">Rp</span>
                  <input
                    id="product-price"
                    type="text"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-14 py-4 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                    placeholder="88.000"
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">Nilai terformat: Rp {formattedPrice}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="product-stock" className="mb-3 block text-sm font-semibold text-slate-700">
                  Stok (Angka)
                </label>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                  placeholder="25"
                />
              </div>
            </div>

            <div>
              <label htmlFor="product-description" className="mb-3 block text-sm font-semibold text-slate-700">
                Deskripsi Produk
              </label>
              <textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="w-full rounded-4xl border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                placeholder="Tulis deskripsi produk yang menarik dan ringkas."
              />
              <p className="mt-3 text-sm text-slate-500">
                Deskripsi ini akan ditampilkan di halaman produk untuk membantu pelanggan memahami rasa, ukuran, dan keunggulan cemilan Anda.
              </p>
            </div>
          </section>

          <section className="space-y-6 rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-200/60">
            <div className="rounded-4xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center transition hover:border-slate-400 hover:bg-slate-50">
              <label htmlFor="product-images" className="mx-auto flex max-w-xs cursor-pointer flex-col items-center gap-4 text-slate-600">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-3xl">📷</span>
                <span className="text-lg font-semibold text-slate-900">Seret file foto di sini</span>
                <span className="text-sm text-slate-500">Unggah foto utama dan foto pendukung produk.</span>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">Klik untuk pilih file</span>
              </label>
              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleFileChange(event.target.files)}
                className="hidden"
              />
            </div>

            <div className="rounded-4xl bg-white p-5 shadow-sm shadow-slate-200">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Preview Foto</h2>
                  <p className="mt-1 text-sm text-slate-500">Foto yang sudah diunggah akan muncul di sini.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {totalPhotos} foto
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {photos.length === 0 ? (
                  <div className="col-span-full rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Belum ada foto. Unggah minimal 1 foto utama untuk menampilkan produk.
                  </div>
                ) : (
                  photos.map((photo) => (
                    <div key={photo.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                      <img src={photo.url} alt={photo.name} className="h-48 w-full object-cover transition duration-300 group-hover:scale-105" />
                      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
                        <p className="truncate text-sm text-slate-700">{photo.name}</p>
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <div className="col-span-full flex flex-col gap-3 rounded-4xl bg-slate-50 px-6 py-5 text-right shadow-sm shadow-slate-200 sm:flex-row sm:justify-end sm:gap-4">
            <button
              type="button"
              className="rounded-3xl border border-slate-300 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={() => {
                setName("");
                setCategory("Original");
                setPrice("");
                setStock("");
                setDescription("");
                setPhotos([]);
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
