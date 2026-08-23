"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Check, Copy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import { buildSnapRedirectUrl, decideResume } from "@/lib/checkout/resumeOrder";

const ORDER_STORAGE_KEY = "djaemo-last-order";

type PaymentStatus = "success" | "pending" | "failed" | "expired" | "unknown";

interface OrderItem {
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderData {
  order_id: string;
  payment_status: string;
  fulfillment_status: string;
  status: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  shipping_address: string;
  shipping_service: string;
  destination: string;
  customer_phone: string;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  customers: {
    name: string;
    email: string;
    phone: string;
  };
  order_items: OrderItem[];
}

function mapTransactionStatus(status: string | null): PaymentStatus {
  switch (status) {
    case "settlement":
    case "capture":
    case "accept":
    case "paid":
      return "success";
    case "pending":
    case "pending_payment":
    case "unpaid":
    case "challenge":
    case "authorize":
      return "pending";
    case "deny":
    case "cancel":
    case "failure":
      return "failed";
    case "expire":
    case "expired":
      return "expired";
    default:
      return "unknown";
  }
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const cartClearedRef = useRef(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const orderIdFromUrl = searchParams?.get("order_id") ?? null;
  const tokenFromUrl = searchParams?.get("token") ?? null;
  const transactionStatusFromUrl = searchParams?.get("transaction_status") ?? null;
  const paymentStatus = mapTransactionStatus(transactionStatusFromUrl);

  const fetchOrder = useCallback(async (orderId: string, token: string) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      if (res.status === 401) throw new Error("Akses ditolak");
      if (res.status === 403) throw new Error("Token tidak valid");
      if (res.status === 404) throw new Error("Pesanan tidak ditemukan");
      throw new Error("Gagal memuat data pesanan");
    }
    const json = await res.json();
    if (!json.success || !json.data) throw new Error("Data pesanan tidak valid");
    return json.data as OrderData;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const id = orderIdFromUrl || (() => {
          try {
            const stored = localStorage.getItem(ORDER_STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              return parsed.orderId || null;
            }
          } catch {}
          return null;
        })();

        const token = tokenFromUrl || (() => {
          try {
            const stored = localStorage.getItem(ORDER_STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              return parsed.accessToken || null;
            }
          } catch {}
          return null;
        })();

        if (!id || !token) {
          setError("tidak-ada-pesanan");
          setLoading(false);
          return;
        }

        const data = await fetchOrder(id, token);

        if (!cancelled) {
          localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({
            orderId: data.order_id,
            accessToken: token,
            totalAmount: data.total_amount,
            createdAt: data.created_at,
            status: data.payment_status,
          }));

          setActiveToken(token);
          setOrder(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
          setLoading(false);
        }
      }
    }

    load();

    return () => { cancelled = true; };
  }, [orderIdFromUrl, tokenFromUrl, fetchOrder]);

  useEffect(() => {
    const orderStatus = order ? mapTransactionStatus(order.payment_status) : null;
    const isSuccess =
      mapTransactionStatus(transactionStatusFromUrl) === "success" ||
      orderStatus === "success";

    if (isSuccess && !cartClearedRef.current) {
      cartClearedRef.current = true;
      clearCart();
    }
  }, [transactionStatusFromUrl, order, clearCart]);

  const handleResumePayment = useCallback(async () => {
    if (resuming) return;
    setResumeError(null);
    setResuming(true);
    try {
      const resume = await decideResume();
      const redirectUrl =
        resume.kind === "resume"
          ? resume.redirectUrl
          : order?.transaction_id
            ? buildSnapRedirectUrl(order.transaction_id)
            : null;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setResumeError("Tidak dapat melanjutkan pembayaran. Silakan hubungi layanan pelanggan.");
    } finally {
      setResuming(false);
    }
  }, [resuming, order]);

  const handleCancelOrder = useCallback(async () => {
    if (!order || cancelling) return;
    const token = activeToken ?? tokenFromUrl;
    if (!token) {
      setCancelError("Token tidak tersedia untuk membatalkan pesanan.");
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.order_id)}/expire?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        try {
          window.localStorage.removeItem(ORDER_STORAGE_KEY);
        } catch {}
        router.push("/checkout");
        return;
      }

      const friendlyErrors: Record<string, string> = {
        ORDER_ALREADY_PAID: "Pesanan sudah dibayar dan tidak dapat dibatalkan.",
        ORDER_NOT_EXPIRABLE: "Status pesanan tidak dapat dibatalkan.",
        ORDER_NOT_FOUND: "Pesanan tidak ditemukan.",
      };
      setCancelError(
        (json?.error && friendlyErrors[json.error]) ||
          json?.error ||
          "Gagal membatalkan pesanan. Silakan coba lagi.",
      );
    } catch {
      setCancelError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setCancelling(false);
    }
  }, [order, cancelling, activeToken, tokenFromUrl, router]);

  function handleCopyOrderId() {
    if (!order?.order_id) return;
    navigator.clipboard.writeText(order.order_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const formattedDate = order
    ? new Date(order.created_at).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  if (loading) {
    return (
      <Section>
        <PageHeader title="Memuat Status Pesanan" description="Memeriksa status pembayaran pesanan Anda..." />
        <div className="flex flex-col items-center justify-center gap-6 py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted">Sedang memeriksa status pembayaran...</p>
        </div>
      </Section>
    );
  }

  if (error === "tidak-ada-pesanan") {
    return (
      <Section>
        <PageHeader
          title="Tidak Ada Pesanan"
          description="Tidak ada data pesanan yang ditemukan."
        />
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-primary">Belum ada pesanan terakhir.</p>
          <p className="mt-3 text-sm text-muted">
            Data pesanan tidak ditemukan. Silakan lakukan checkout terlebih dahulu.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => router.push("/produk")} className="w-full sm:w-auto">
              Kembali ke Produk
            </Button>
            <Button variant="outline" onClick={() => router.push("/cart")} className="w-full sm:w-auto">
              Lihat Keranjang
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  if (error || !order) {
    return (
      <Section>
        <PageHeader
          title="Gagal Memuat"
          description="Terjadi kesalahan saat memuat data pesanan."
        />
        <div className="rounded-3xl border border-border bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-muted">{error || "Data pesanan tidak tersedia."}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => router.refresh()} className="w-full sm:w-auto">
              Coba Lagi
            </Button>
            <Button variant="outline" onClick={() => router.push("/produk")} className="w-full sm:w-auto">
              Kembali ke Produk
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  const serverPaymentStatus = mapTransactionStatus(order.payment_status);
  const effectiveStatus: PaymentStatus =
    serverPaymentStatus !== "unknown"
      ? serverPaymentStatus
      : paymentStatus;

  const statusConfig: Record<PaymentStatus, { icon: string; title: string; description: string; color: string }> = {
    success: {
      icon: "✓",
      title: "Pembayaran Berhasil",
      description: "Pesanan Anda telah dikonfirmasi dan akan segera diproses.",
      color: "text-green-600",
    },
    pending: {
      icon: "⏳",
      title: "Menunggu Pembayaran",
      description: "Pesanan Anda telah tersimpan. Silakan selesaikan pembayaran melalui Midtrans.",
      color: "text-amber-600",
    },
    failed: {
      icon: "✕",
      title: "Pembayaran Gagal",
      description: "Pembayaran tidak berhasil diproses. Silakan coba checkout kembali.",
      color: "text-red-600",
    },
    expired: {
      icon: "✕",
      title: "Pembayaran Kedaluwarsa",
      description: "Waktu pembayaran telah habis. Silakan lakukan checkout ulang.",
      color: "text-slate-500",
    },
    unknown: {
      icon: "?",
      title: "Status Tidak Diketahui",
      description: "Status pembayaran tidak dapat ditentukan. Silakan hubungi layanan pelanggan.",
      color: "text-slate-500",
    },
  };

  const headerConfig: Record<PaymentStatus, { title: string; description: string }> = {
    success: {
      title: "Pembayaran Berhasil",
      description: "Pembayaran Anda telah diterima. Pesanan akan segera diproses oleh tim kami.",
    },
    pending: {
      title: "Pesanan Berhasil Dibuat",
      description: "Pesanan Anda telah tersimpan. Silakan selesaikan pembayaran untuk memproses pesanan.",
    },
    failed: {
      title: "Pembayaran Gagal",
      description: "Pembayaran tidak berhasil diproses. Silakan lakukan checkout kembali.",
    },
    expired: {
      title: "Pembayaran Kedaluwarsa",
      description: "Waktu pembayaran telah habis. Silakan lakukan checkout ulang.",
    },
    unknown: {
      title: "Status Pembayaran Tidak Diketahui",
      description: "Status pembayaran tidak dapat ditentukan. Silakan hubungi layanan pelanggan.",
    },
  };

  const status = statusConfig[effectiveStatus];

  return (
    <Section>
      <PageHeader
        title={headerConfig[effectiveStatus].title}
        description={headerConfig[effectiveStatus].description}
      />

      <div className="grid gap-10 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className={`rounded-2xl border p-6 text-center shadow-sm ${
            effectiveStatus === "success"
              ? "border-green-200 bg-green-50"
              : effectiveStatus === "pending"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
          }`}>
            <div className={`text-4xl font-bold ${status.color}`}>{status.icon}</div>
            <h2 className={`mt-3 text-xl font-semibold ${status.color}`}>{status.title}</h2>
            <p className="mt-1 text-sm text-muted">{status.description}</p>
          </div>

          <div className="space-y-4 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-primary">Detail Pesanan</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <p className="text-sm text-muted">Nomor Pesanan</p>
                <p className="font-semibold text-foreground">{order.order_id}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Tersalin!" : "Salin Nomor Pesanan"}
                </button>
                <div>
                  <p className="text-sm text-muted">Dibuat pada</p>
                  <p className="font-semibold text-foreground">{formattedDate}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-primary/10 bg-surface p-6">
            <h3 className="text-base font-semibold text-primary">Informasi Pembeli</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted">Nama</p>
                <p className="font-semibold text-foreground">{order.customers.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Email</p>
                <p className="font-semibold text-foreground">{order.customers.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Telepon</p>
                <p className="font-semibold text-foreground">{order.customers.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Alamat</p>
                <p className="font-semibold text-foreground">{order.shipping_address}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-primary">Barang Pesanan</h3>
            <div className="space-y-3">
              {order.order_items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.product_name}</p>
                    <p className="text-sm text-muted">Jumlah: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-primary">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-primary">Ringkasan Pembayaran</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Ongkos Kirim</span>
                <span className="font-semibold">{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Total Bayar</span>
                  <span className="text-xl font-semibold text-primary">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Pengiriman</span>
                <span className="font-semibold">{order.shipping_service || "-"}</span>
              </div>
              {order.payment_method && (
                <div className="flex justify-between">
                  <span className="text-muted">Metode Pembayaran</span>
                  <span className="font-semibold">{order.payment_method}</span>
                </div>
              )}
            </div>
          </div>

          {effectiveStatus === "success" && (
            <div className="rounded-3xl bg-green-950 p-5 text-sm text-green-200">
              <p className="font-semibold text-green-100">Langkah Selanjutnya</p>
              <ul className="mt-3 space-y-2">
                <li>1. Pesanan akan segera diproses oleh tim kami.</li>
                <li>2. Simpan nomor pesanan sebagai referensi.</li>
                <li>3. Pantau status pesanan melalui halaman pesanan.</li>
              </ul>
            </div>
          )}

          {effectiveStatus === "pending" && (
            <div className="rounded-3xl bg-amber-950 p-5 text-sm text-amber-200">
              <p className="font-semibold text-amber-100">Menunggu Pembayaran</p>
              <ul className="mt-3 space-y-2">
                <li>1. Selesaikan pembayaran melalui halaman Midtrans.</li>
                <li>2. Status akan diperbarui otomatis setelah pembayaran dikonfirmasi.</li>
                <li>3. Hubungi layanan pelanggan jika mengalami kendala.</li>
              </ul>
            </div>
          )}

          {(effectiveStatus === "failed" || effectiveStatus === "expired") && (
            <div className="rounded-3xl bg-red-950 p-5 text-sm text-red-200">
              <p className="font-semibold text-red-100">Pembayaran Gagal</p>
              <ul className="mt-3 space-y-2">
                <li>1. Silakan lakukan checkout ulang untuk mencoba lagi.</li>
                <li>2. Pastikan metode pembayaran yang dipilih benar.</li>
                <li>3. Hubungi layanan pelanggan jika dana sudah terpotong.</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {effectiveStatus === "pending" && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleResumePayment}
                  disabled={resuming || cancelling}
                >
                  {resuming ? "Memproses..." : "Lanjutkan Pembayaran"}
                </Button>
                {resumeError && (
                  <p className="text-center text-xs text-red-600">{resumeError}</p>
                )}
                <Button
                  variant="outline"
                  className="w-full border-red/30 text-red hover:border-red hover:bg-red hover:text-white focus-visible:ring-red"
                  onClick={() => {
                    setCancelError(null);
                    setShowCancelConfirm(true);
                  }}
                  disabled={cancelling}
                >
                  Batalkan & Buat Pesanan Baru
                </Button>
              </div>
            )}
            {effectiveStatus === "success" && orderIdFromUrl && (
              <Button
                className="w-full"
                href={`/track-order/${encodeURIComponent(orderIdFromUrl)}`}
              >
                Lacak Pesanan
              </Button>
            )}
            <Button
              variant={
                effectiveStatus === "pending" ||
                (effectiveStatus === "success" && orderIdFromUrl)
                  ? "outline"
                  : "primary"
              }
              className="w-full"
              onClick={() => router.push("/")}
            >
              Kembali ke Beranda
            </Button>
            {(effectiveStatus === "failed" || effectiveStatus === "expired") && (
              <Button variant="outline" className="w-full" onClick={() => router.push("/cart")}>
                Checkout Ulang
              </Button>
            )}
          </div>
        </aside>
      </div>

      {showCancelConfirm && effectiveStatus === "pending" && order && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelling) {
              setShowCancelConfirm(false);
              setCancelError(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-primary">Batalkan Pesanan?</h3>
            <p className="mt-3 text-sm text-muted">
              Yakin ingin membatalkan pesanan ini? Pesanan{" "}
              <span className="font-semibold text-foreground">{order.order_id}</span> akan
              dibatalkan, lalu Anda dapat membuat pesanan baru dengan metode pembayaran yang
              berbeda.
            </p>
            {cancelError && (
              <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {cancelError}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelError(null);
                }}
                disabled={cancelling}
              >
                Kembali
              </Button>
              <Button onClick={handleCancelOrder} disabled={cancelling}>
                {cancelling ? "Membatalkan..." : "Ya, Batalkan Pesanan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
