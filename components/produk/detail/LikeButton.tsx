"use client";

import { useEffect, useState, useCallback } from "react";
import { getDeviceId } from "@/lib/device-id";

interface LikeButtonProps {
  productId: string;
}

export function LikeButton({ productId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    fetch(`/api/products/${productId}/likes?device_id=${deviceId}`)
      .then((res) => res.json())
      .then((data) => {
        setCount(data.count ?? 0);
        setLiked(data.liked ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const handleToggle = useCallback(async () => {
    if (toggling) return;
    const deviceId = getDeviceId();
    if (!deviceId) return;

    const prevLiked = liked;
    const prevCount = count;

    setLiked(!prevLiked);
    setCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setToggling(true);

    try {
      const res = await fetch(`/api/products/${productId}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId }),
      });
      const data = await res.json();
      setCount(data.count ?? prevCount);
      setLiked(data.liked ?? prevLiked);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setToggling(false);
    }
  }, [productId, liked, count, toggling]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 text-sm font-medium text-ink transition-all duration-200 hover:bg-teal-deep/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={liked ? "Hapus dari favorit" : "Tambah ke favorit"}
    >
      {liked ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-red">
          <path d="M12 21s-5.5-4.2-8.4-7.5C1.5 11 2.8 6.4 6.7 5.2c1.6-.5 3.3 0 4.3 1.3 1-1.3 2.7-1.8 4.3-1.3 3.9 1.2 5.2 5.8 2.1 8.3C17.5 16.8 12 21 12 21z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
          <path d="M12 21s-5.5-4.2-8.4-7.5C1.5 11 2.8 6.4 6.7 5.2c1.6-.5 3.3 0 4.3 1.3 1-1.3 2.7-1.8 4.3-1.3 3.9 1.2 5.2 5.8 2.1 8.3C17.5 16.8 12 21 12 21z" />
        </svg>
      )}
      {!loading && (
        <span className={liked ? "text-red" : ""}>
          {count > 0 ? count : ""}
        </span>
      )}
    </button>
  );
}
