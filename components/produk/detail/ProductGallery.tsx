"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loaded, setLoaded] = useState(true);

  const mainImage = images[selectedIndex] || "/images/produk/placeholder.svg";
  const hasMultipleImages = images.length > 1;
  const thumbnails = images.slice(0, 5);

  const handleSelect = (index: number) => {
    if (index === selectedIndex) return;
    setLoaded(false);
    setSelectedIndex(index);
  };

  return (
    <div>
      <div className="relative h-[55vh] overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm md:aspect-square md:h-auto">
        <Image
          unoptimized={process.env.NODE_ENV === "development"}
          key={selectedIndex}
          src={mainImage}
          alt={productName}
          fill
          className={`object-contain p-4 transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {hasMultipleImages && (
        <div className="mt-4 flex flex-wrap gap-3 md:overflow-x-auto md:flex-nowrap md:gap-4" role="tablist" aria-label="Thumbnail gambar produk">
          {thumbnails.map((url, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={`${productName} gambar ${i + 1}`}
              onClick={() => handleSelect(i)}
              className={`relative aspect-square w-16 overflow-hidden rounded-lg border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep focus-visible:ring-offset-2 md:shrink-0 ${
                i === selectedIndex
                  ? "scale-105 border-teal-deep ring-2 ring-teal-deep/20"
                  : "border-ink/10 hover:scale-105 hover:border-teal-deep/30"
              }`}
            >
              <Image
                unoptimized={process.env.NODE_ENV === "development"}
                src={url}
                alt={`${productName} ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
