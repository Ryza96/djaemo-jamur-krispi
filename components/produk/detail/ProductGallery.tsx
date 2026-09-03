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
  const [hasError, setHasError] = useState(false);

  const mainImage = images[selectedIndex] || "/images/produk/placeholder.svg";
  const hasMultipleImages = images.length > 1;
  const thumbnails = images.slice(0, 5);

  const handleSelect = (index: number) => {
    if (index === selectedIndex) return;
    setLoaded(false);
    setHasError(false);
    setSelectedIndex(index);
  };

  return (
    <div>
      <div className="relative h-[55vh] overflow-hidden rounded-2xl border border-gold/20 bg-cream shadow-[0_20px_50px_-20px_rgba(11,54,52,0.35)] md:aspect-square md:h-auto">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(227,179,61,0.16),rgba(227,179,61,0.04)_62%,transparent_74%)]" />
        {hasError ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gold" aria-hidden="true">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              <circle cx="9.5" cy="8.5" r="1.5" />
              <rect x="3" y="4" width="18" height="16" rx="2" />
            </svg>
            <p className="font-mono text-sm font-medium text-teal-deep">
              Gambar tidak tersedia
            </p>
          </div>
        ) : (
          <Image
            unoptimized={process.env.NODE_ENV === "development"}
            key={selectedIndex}
            src={mainImage}
            alt={productName}
            fill
            className={`relative z-10 object-contain p-4 transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
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
              className={`relative aspect-square w-16 overflow-hidden rounded-lg border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:shrink-0 ${
                i === selectedIndex
                  ? "scale-105 border-teal-deep ring-2 ring-teal-deep/20"
                  : "border-gold/20 bg-cream hover:scale-105 hover:border-gold/40"
              }`}
            >
              <Image
                unoptimized={process.env.NODE_ENV === "development"}
                src={url}
                alt={`${productName} ${i + 1}`}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
