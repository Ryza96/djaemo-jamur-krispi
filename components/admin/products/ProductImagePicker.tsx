"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";

export type ImagePickerItem = {
  id: string;
  type: "existing" | "new";
  src: string;
  file?: File;
};

export type ProductImagePickerHandle = {
  getItems: () => ImagePickerItem[];
  reset: () => void;
};

type Props = {
  existingImages?: string[];
  uploadingMap?: Record<string, boolean>;
};

const MAX_IMAGES = 5;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ProductImagePicker = forwardRef<ProductImagePickerHandle, Props>(
  function ProductImagePicker({ existingImages, uploadingMap = {} }, ref) {
    const [items, setItems] = useState<ImagePickerItem[]>(() =>
      (existingImages || []).map((url, i) => ({
        id: `existing-${Date.now()}-${i}`,
        type: "existing" as const,
        src: url,
      }))
    );
    const itemsRef = useRef(items);
    itemsRef.current = items;

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const idCounter = useRef(0);

    // Cleanup blob URLs on unmount
    useEffect(() => {
      return () => {
        for (const it of itemsRef.current) {
          if (it.type === "new" && it.src.startsWith("blob:")) {
            URL.revokeObjectURL(it.src);
          }
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      getItems: () => itemsRef.current,
      reset: () => {
        const current = itemsRef.current;
        for (const it of current) {
          if (it.type === "new" && it.src.startsWith("blob:")) {
            URL.revokeObjectURL(it.src);
          }
        }
        setItems(
          existingImages
            ? existingImages.map((url, i) => ({
                id: `existing-${Date.now()}-${i}`,
                type: "existing" as const,
                src: url,
              }))
            : []
        );
      },
    }));

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setItems((prev) => {
          const remaining = Math.max(0, MAX_IMAGES - prev.length);
          if (remaining <= 0) return prev;
          const arr = Array.from(files).slice(0, remaining);
          const ctr = idCounter.current;
          const newItems = arr.map((f, i) => ({
            id: `new-${Date.now()}-${ctr + i}`,
            type: "new" as const,
            src: URL.createObjectURL(f),
            file: f,
          }));
          idCounter.current = ctr + arr.length;
          return [...prev, ...newItems];
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      []
    );

    const handleRemovePreview = useCallback((index: number) => {
      setItems((prev) => {
        const item = prev[index];
        if (!item) return prev;
        if (item.type === "new" && item.src.startsWith("blob:")) {
          URL.revokeObjectURL(item.src);
        }
        return prev.filter((_, i) => i !== index);
      });
    }, []);

    const makePrimary = useCallback((index: number) => {
      setItems((prev) => {
        const next = [...prev];
        const [item] = next.splice(index, 1);
        next.unshift(item);
        return next.slice(0, MAX_IMAGES);
      });
    }, []);

    const handleDragStart = useCallback(
      (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("text/plain", String(index));
      },
      []
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, index: number) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData("text/plain"));
      if (isNaN(from)) return;
      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(index, 0, moved);
        return next;
      });
    }, []);

    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Upload Gambar (maks {MAX_IMAGES})
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full text-sm"
        />

        {items.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-3">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="relative"
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                aria-roledescription="Draggable image"
              >
                <img
                  src={item.src}
                  alt={`preview-${i}`}
                  className="h-24 w-24 rounded-md object-cover"
                />
                <div className="absolute left-1 top-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    title="Set sebagai gambar utama"
                    className="rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-slate-700 shadow"
                  >
                    Utama
                  </button>
                </div>
                <div className="absolute -top-2 -right-2">
                  <button
                    type="button"
                    onClick={() => handleRemovePreview(i)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="absolute bottom-1 left-1">
                  <span className="rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                    {item.type === "new" && item.file
                      ? formatFileSize(item.file.size)
                      : "—"}
                  </span>
                </div>
                <div className="absolute bottom-1 right-1 flex items-center gap-2">
                  <div className="cursor-grab rounded bg-white/70 px-1 py-0.5 text-xs">
                    ≡
                  </div>
                </div>
                {uploadingMap[item.id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Pilih Gambar dari PC
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    );
  }
);

export default ProductImagePicker;
