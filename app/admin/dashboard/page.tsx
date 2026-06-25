"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabase-client";

type NavItem = {
  label: string;
  icon: string;
};

type OrderRow = {
  id: string;
  customer: string;
  product: string;
  amount: string;
  proof: string;
  status: "pending" | "confirmed" | "rejected";
};

type OrderItemDetail = {
  id: string;
  product_id?: string;
  product_name?: string;
  price: number;
  quantity: number;
  subtotal: number;
  weight?: number;
};

type OrderDetail = {
  id: string;
  order_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  status: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
  order_items: OrderItemDetail[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "📊" },
  { label: "Pesanan", icon: "🛒" },
  { label: "Produk", icon: "🍪" },
  { label: "Pelanggan", icon: "👥" },
  { label: "Pengaturan", icon: "⚙️" },
];

const initialOrders: OrderRow[] = [
  {
    id: "DJ-0219",
    customer: "Rina Saputri",
    product: "Jamur Krispi Balado 100g",
    amount: "Rp 88.000",
    proof: "Bukti_Transfer_0219.jpg",
    status: "pending",
  },
  {
    id: "DJ-0220",
    customer: "Hendra Wijaya",
    product: "Jamur Krispi Original 150g",
    amount: "Rp 105.000",
    proof: "Bukti_Transfer_0220.jpg",
    status: "pending",
  },
  {
    id: "DJ-0221",
    customer: "Sari Dewi",
    product: "Jamur Krispi Keju 100g",
    amount: "Rp 92.000",
    proof: "Bukti_Transfer_0221.jpg",
    status: "pending",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [previewItems, setPreviewItems] = useState<Array<{ id: string; type: 'existing' | 'new'; src: string; file?: File; uploading?: boolean; progress?: number }>>([]);
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [supabaseOrders, setSupabaseOrders] = useState<Array<{ id: string; order_id?: string; nama_pelanggan: string; total_harga: number; status: string; tanggal_dibuat: string; alamat?: string; customers?: any }>>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; order_id?: string; customer_name?: string; subtotal: number; status: string; created_at?: string }>>([]);
  
  // Order Modal State - Disederhanakan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItemDetail[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editingPostalCode, setEditingPostalCode] = useState<string>("");
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  // State untuk total penjualan (revenue)
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const summaryCards = useMemo(
    () => [
      {
        title: "Total Penjualan",
        value: revenueLoading ? "Loading..." : `Rp ${totalRevenue.toLocaleString('id-ID')}`,
        description: "Bulan ini",
        accent: "bg-emerald-50 text-emerald-700",
      },
      {
        title: "Pesanan Baru",
        value: pendingCount.toString(),
        description: "Menunggu konfirmasi",
        accent: "bg-sky-50 text-sky-700",
      },
      {
        title: "Stok Menipis",
        value: "4 Produk",
        description: "Segera restock",
        accent: "bg-amber-50 text-amber-700",
      },
      {
        title: "Total Pelanggan",
        value: "1.540",
        description: "Terdaftar aktif",
        accent: "bg-violet-50 text-violet-700",
      },
    ],
    [totalRevenue, revenueLoading, pendingCount]
  );

  // Fetch dashboard stats: total revenue (paid), pending count, and recent orders
  const fetchDashboardData = async () => {
    try {
      setRevenueLoading(true);

      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`Failed to fetch /api/orders (${res.status})`);
      const payload = await res.json();

      // /api/orders mengembalikan shape: { success: true, data: orders }
      // Pastikan payload.data selalu array sebelum dipakai .filter/.reduce.
      const data = payload?.data;
      const orders = Array.isArray(data) ? data : [];

      // total revenue untuk transaksi yang sudah benar-benar diproses:
      // status 'paid' DAN/ATAU 'shipped' (case-insensitive)
      const revenueStatuses = new Set(['paid', 'shipped']);

      const total = orders
        .filter((r: any) => revenueStatuses.has((r?.status ?? '').toString().toLowerCase()))
        .reduce(
          (s: number, r: any) =>
            s + (Number(r.subtotal ?? r.total_amount ?? r.total ?? 0) || 0),
          0
        );
      setTotalRevenue(total);


      // pending count (status 'pending')
      const pendingCnt = orders.filter((r: any) => (r.status || '').toString().toLowerCase() === 'pending').length;
      setPendingCount(pendingCnt);

      // recent orders (API already returns ordered by created_at desc), take latest 8
      const recent = orders.slice(0, 8).map((r: any) => ({
        id: r.id,
        order_id: r.order_id,
        customer_name:
          r.customer_name ??
          (r.customer_name === undefined ? (r.customer_id ?? '-') : r.customer_name),
        subtotal: Number(r.subtotal ?? r.total_amount ?? r.total ?? 0),
        status: r.status ?? 'unknown',
        created_at: r.created_at,
      }));

      setRecentOrders(recent);
    } catch (err: any) {
      console.error('fetchDashboardData error:', err);
    } finally {
      setRevenueLoading(false);
    }
  };

  // Handler Detail Button - Fetch data dan buka modal
  const handleDetail = async (orderData: any) => {
    if (!orderData) return;

    // Debug

    // 1. Ambil data order utama terlebih dahulu agar modal bisa terbuka
    setActiveOrder(orderData);
    const initialPostalCode = orderData.postal_code || orderData.customer_postal_code || '';
    setEditingPostalCode(initialPostalCode);
    setIsModalOpen(true);
    setSelectedOrderItems([]);

    try {
      const targetId = orderData.id || orderData.order_id;
      if (!targetId) {
        console.error('Order data tidak memiliki ID untuk order detail:', orderData);
        return;
      }

      const response = await fetch(`/api/orders/${encodeURIComponent(targetId)}`);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Gagal fetch order detail:', response.status, errorBody);
        return;
      }

      const payload = await response.json();
      const orderDetail = payload?.success ? payload.data : payload;
      if (!orderDetail) {
        console.error('Order detail kosong dari API:', payload);
        return;
      }

      

      if (Array.isArray(orderDetail.order_items) && orderDetail.order_items.length > 0) {
        const normalizedItems = orderDetail.order_items.map((item: any) => {
          const itemWeight = Number(item.products?.weight ?? item.weight ?? 100) || 100;
          return {
            id: item.id ?? `${item.product_id ?? 'item'}-${item.product_name ?? item.name ?? 'unknown'}`,
            product_id: item.product_id,
            product_name: item.product_name ?? item.name ?? 'Item Pesanan',
            price: Number(item.price ?? 0),
            quantity: Number(item.quantity ?? 0),
            subtotal: Number(item.subtotal ?? (item.price ?? 0) * (item.quantity ?? 0)),
            weight: itemWeight,
          };
        });
        setSelectedOrderItems(normalizedItems);
        const detailedPostalCode = orderDetail.postal_code || orderDetail.customer_postal_code || '';
        setEditingPostalCode(detailedPostalCode);
        setActiveOrder(orderDetail);
        return;
      }

      console.warn('Order tidak memiliki order_items:', orderDetail);
      setSelectedOrderItems([]);
      const detailedPostalCode = orderDetail.postal_code || orderDetail.customer_postal_code || '';
      setEditingPostalCode(detailedPostalCode);
      setActiveOrder(orderDetail);
    } catch (err) {
      console.error('Catch error:', err);
    }
  };

  const handleConfirmOrder = async () => {
    if (!activeOrder) return;
    setConfirmLoading(true);

    try {
      const orderId = activeOrder.id || activeOrder.order_id;
      if (!orderId) {
        throw new Error('Order id tidak tersedia untuk konfirmasi');
      }

      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const updatedOrder = data?.success ? data.data : data;

      if (!updatedOrder) {
        throw new Error('Gagal menerima response order yang diperbarui');
      }

      setActiveOrder((prev: any) => (prev ? { ...prev, status: 'paid' } : prev));

      await fetchDashboardData();
      if (activeMenu === 'Pesanan') {
        await fetchOrders();
      }
    } catch (err: any) {
      console.error('Error confirming order:', err);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCetakResi = async () => {
    if (!activeOrder || !selectedOrderItems || selectedOrderItems.length === 0) {
      alert('Data pesanan atau item tidak lengkap');
      return;
    }

    // Visual feedback untuk admin (state sudah dipakai untuk disable button)



    // Validate postal code - must be non-empty and not default
    const trimmedPostal = editingPostalCode.trim();
    
    

    if (!trimmedPostal) {
      alert('❌ Kode pos penerima HARUS diisi!\n\nSilakan masukkan kode pos yang sesuai (bukan kosong atau "00000")');
      return;
    }

    if (trimmedPostal === '00000' || trimmedPostal === '0000' || trimmedPostal === '00') {
      alert('❌ Kode pos tidak valid!\n\nKode pos masih bernilai default. Silakan ubah dengan kode pos yang sebenarnya.\n\nContoh: 12345, 40123, 60241, dll.');
      return;
    }

    const receiptWindow = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
    setConfirmLoading(true);

    try {
      const itemsPayload = selectedOrderItems
        .filter((item) => {
          const name = (item.product_name || (item as any).name || '').toString().toLowerCase();
          return ![
            'ongkos kirim',
            'biaya layanan',
            'ongkir',
            'shipping fee',
            'delivery fee',
          ].some((term) => name.includes(term));
        })
        .map((item) => {
          const name = item.product_name || (item as any).name || 'Produk';
          const quantity = Number(item.quantity ?? 1);
          const value = Number(item.price ?? 0);
          const weight = Number(item.weight ?? 100) || 100;

          return {
            name,
            value,
            quantity,
            weight,
          };
        });

      if (itemsPayload.length === 0) {
        throw new Error('Tidak ada item produk valid untuk dikirim ke Biteship. Pastikan item ongkir tidak termasuk.');
      }

      // Build order object dengan data yang diperlukan Biteship
      // Ambil alamat dari relasi customers dengan fallback yang sama seperti UI modal
      const validatedCustomerAddress = (
        activeOrder?.customers?.address ??
        activeOrder?.customers?.alamat ??
        activeOrder?.customer_address ??
        activeOrder?.alamat ??
        activeOrder?.customer?.address ??
        ''
      ).toString().trim();

      if (!validatedCustomerAddress || validatedCustomerAddress === '-') {
        alert('❌ Alamat pelanggan tidak ditemukan. Pastikan data alamat terisi di profil pelanggan.');
        setConfirmLoading(false);
        return;
      }

      const postal_code_value = (
        editingPostalCode ||
        activeOrder?.postal_code ||
        '62184'
      )
        .toString()
        .trim();

      const postalCodeInt = Number.parseInt(postal_code_value, 10);

      // Validasi ketat kode pos sebelum mengirim ke Biteship
      if (!Number.isFinite(postalCodeInt) || postalCodeInt <= 0) {
        alert('❌ Kode pos penerima tidak valid. Pastikan hanya angka (contoh: 60241).');
        setConfirmLoading(false);
        return;
      }

      if (!postal_code_value || postal_code_value === '00000' || postal_code_value.length < 5) {
        alert('❌ Kode pos penerima tidak valid atau tidak ditemukan.\n\nSilakan pastikan:\n- Kode pos tersedia di order (orders.postal_code)\n- Atau masukkan di form modal jika belum ada\n- Minimal 5 digit\n- Bukan "00000"');
        setConfirmLoading(false);
        return;
      }

      const STORE_CONTACT_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Djaemo Admin";
      const STORE_CONTACT_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE || "081239047565";
      const STORE_ADDRESS = process.env.NEXT_PUBLIC_STORE_ADDRESS || "Jl. Danau Sunter Utara No.57, Sunter Agung, Kecamatan Tanjung Priok, Jakarta Utara";

      const STORE_POSTAL_CODE = Number(process.env.NEXT_PUBLIC_STORE_POSTAL_CODE || 14350);

      const normalizeTimeString = (time?: string | null) => {
        const raw = String(time ?? '').trim();
        if (!raw) return undefined;
        const normalized = raw.replace(/\./g, ':');
        const match = normalized.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
        if (!match) return undefined;
        const [, hours, minutes] = match;
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      };

      // Calculate delivery date (next day)
      const deliveryDateObj = new Date();
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 1);
      const yyyy = deliveryDateObj.getFullYear();
      const mm = String(deliveryDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(deliveryDateObj.getDate()).padStart(2, '0');
      const deliveryDate = `${yyyy}-${mm}-${dd}`;

      const formattedDeliveryTimeFrom =
        normalizeTimeString(activeOrder?.deliveryTimeFrom || activeOrder?.delivery_time_from) || '09:00';
      const formattedDeliveryTimeTo =
        normalizeTimeString(activeOrder?.deliveryTimeTo || activeOrder?.delivery_time_to) || '17:00';

      const rawOrderDate =
        activeOrder?.deliveryDate ||
        activeOrder?.delivery_date ||
        activeOrder?.created_at ||
        activeOrder?.tanggal_dibuat ||
        deliveryDate ||
        '';

      let normalizedDeliveryDate = String(rawOrderDate).trim();
      const datePart = normalizedDeliveryDate.split(' ')[0];
      const parts = datePart.split('/').map((part) => part.trim());
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        normalizedDeliveryDate = `${year}-${month}-${day}`;
      } else {
        const isoMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
          normalizedDeliveryDate = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
        } else {
          const parsed = new Date(datePart);
          if (!Number.isNaN(parsed.getTime())) {
            const yyyy = parsed.getFullYear();
            const mm = String(parsed.getMonth() + 1).padStart(2, '0');
            const dd = String(parsed.getDate()).padStart(2, '0');
            normalizedDeliveryDate = `${yyyy}-${mm}-${dd}`;
          } else {
            normalizedDeliveryDate = deliveryDate;
          }
        }
      }

      const rawCourierCompany = String(
        activeOrder?.courier_company ||
        activeOrder?.courierCompany ||
        activeOrder?.courier ||
        activeOrder?.shipping_service ||
        activeOrder?.courier_type ||
        'jne'
      ).trim().toLowerCase();
      const regularCouriers = new Set(['jne', 'jnt', 'sicepat', 'tiki', 'wahana', 'pos', 'ninja', 'anteraja']);
      const useNowDelivery = regularCouriers.has(rawCourierCompany);

      const deliveryFields = useNowDelivery
        ? { delivery_type: 'now' }
        : {
            delivery_type: 'scheduled',
            delivery_date: normalizedDeliveryDate || deliveryDate || '2026-06-25',
            delivery_time: formattedDeliveryTimeFrom,
          };

      // Map courier_service/type dari UI ke kode yang dimengerti Biteship
      // DB kadang menyimpan teks pajangan seperti "JNE Reguler".
      let courierService = (activeOrder?.courier_type || activeOrder?.courierType || activeOrder?.shipping_service || "reg").toString();
      const lowerService = courierService.toLowerCase();
      if (lowerService.includes("reguler") || lowerService.includes("reg")) {
        courierService = "reg";
      } else if (lowerService.includes("yes") || lowerService.includes("express") || lowerService.includes("exp")) {
        courierService = "yes";
      } else if (lowerService.includes("trucking") || lowerService.includes("gokil")) {
        courierService = "gokil";
      }

      // courier company (jne/tiki/etc) biasanya sudah kode pendek.
      const courierCompany = (activeOrder?.courier_company || activeOrder?.courierCompany || "jne").toString().trim().toLowerCase() || "jne";

      const orderPayload = {
        order_id: activeOrder.order_id,

        // origin/shipper (toko/kirim dari)
        shipper_contact_name: STORE_CONTACT_NAME,
        shipper_contact_phone: STORE_CONTACT_PHONE,
        shipper_contact_email: process.env.NEXT_PUBLIC_STORE_EMAIL || 'info@jamurkrispi.com',
        origin_address: STORE_ADDRESS,
        origin_postal_code: STORE_POSTAL_CODE,

        // origin compatibility fields
        origin_contact_name: STORE_CONTACT_NAME,
        origin_contact_phone: STORE_CONTACT_PHONE,

        customer_id: activeOrder.customer_id || '',
        customer_name: activeOrder.customer_name || 'Customer',
        customer_email: activeOrder.customer_email || '',
        customer_phone: activeOrder.customer_phone || '',
        customer_address: validatedCustomerAddress,

        // destination/penerima (use validated address from modal)
        destination_contact_name:
          activeOrder.customer_name || activeOrder.customers?.name || 'Penerima',
        destination_contact_phone:
          activeOrder.customer_phone || activeOrder.customers?.phone || activeOrder.phone || '081234567801',
        destination_address: validatedCustomerAddress,
        destination_postal_code: postalCodeInt,

        // compatibility fields for Biteship
        destination: validatedCustomerAddress,
        postal_code: postalCodeInt,
        postal_code_value: postalCodeInt,

        // Delivery timing in flat root payload as required by Biteship API v1
        ...deliveryFields,

        // courier/service codes yang sudah dibersihkan
        shipping_service: courierService,
        courier_company: courierCompany,
        courier_type: courierService,

        city: activeOrder.city || '',
      };

      

      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_order',
          order: orderPayload,
          items: itemsPayload,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        // Biteship biasanya mengirim detail error di dalam errorBody.error, errorBody.message, atau errorBody.errors
        const detailError =
          errorBody.error ||
          errorBody.message ||
          (errorBody.errors && errorBody.errors.join(', ')) ||
          `HTTP ${response.status}`;
        throw new Error(`Biteship API error: ${detailError}`);
      }

      const data = await response.json();
      const waybillId = data?.waybill_id;

      if (!waybillId) {
        throw new Error('Tidak ada nomor resi dari Biteship');
      }

      // Update Supabase via server API (uses service role, not anon key)
      // Jangan hanya notes; kita juga set status jadi SHIPPED.
      const updateRes = await fetch(`/api/orders/${activeOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SHIPPED',
          notes: `Waybill: ${waybillId}`,
        }),
      });

      if (!updateRes.ok) {
        throw new Error(`Gagal menyimpan nomor resi/status: ${updateRes.statusText}`);
      }

      setConfirmLoading(false);
      setIsModalOpen(false);
      await fetchOrders();
      await fetchDashboardData();
      setActiveOrder((prev: any) => (prev ? { ...prev, notes: `Waybill: ${waybillId}`, status: 'SHIPPED' } : prev));

      // 1) Ambil nomor resi asli + link label/track dari response Biteship
      const waybillFromApi: string | null =
        (data?.waybill_id as string) ||
        (data?.id as string) ||
        waybillId;

      const trackingLink: string | null =
        (data?.courier?.link as string) ||
        (data?.courier?.tracking_link as string) ||
        (data?.tracking_url as string) ||
        (data?.link as string) ||
        null;

      // 2) Update status pesanan di Supabase + simpan nomor resi
      // Endpoint PUT /api/orders/[id] saat ini hanya update status jadi 'paid' jika status dikirim.
      // Kita tetap simpan nomor resi pada notes (sudah dilakukan di bawah), lalu status ke SHIPPED.
      try {
        const updateStatusRes = await fetch(`/api/orders/${activeOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SHIPPED', notes: `Waybill: ${waybillFromApi}` }),
        });

        // Jika API PUT backend kamu menolak status selain paid, jangan hard-fail.
        // Tujuannya: minimal status harus ter-update semaksimal mungkin.
        if (!updateStatusRes.ok) {
          console.warn('Update order status SHIPPED gagal:', updateStatusRes.status);
        }
      } catch (e) {
        console.warn('Update order status SHIPPED exception:', e);
      }

      // 3) Buka tab label/cetak.
      // Karena response Biteship kadang tidak mengembalikan link label yang bisa langsung di-print,
      // kita buat halaman custom yang isinya resi + tombol Print.
      if (receiptWindow) {
        const courierName =
          (data?.courier?.company as string) ||
          (data?.courier_company as string) ||
          (data?.courier?.name as string) ||
          (data?.courier?.type as string) ||
          (activeOrder?.courier_company as string) ||
          (activeOrder?.courier_type as string) ||
          '—';

        const safeWaybill = waybillFromApi || '—';
        const trackingText = trackingLink ? `\nTracking link: ${trackingLink}` : '';

        receiptWindow.document.open();
        const storeName = "D'Jaemo Jamur Krispi";
        const recipientName =
          activeOrder?.customer_name ||
          activeOrder?.customers?.name ||
          activeOrder?.destination_contact_name ||
          activeOrder?.to_name ||
          "Penerima";
        const recipientAddress =
          activeOrder?.customer_address ||
          activeOrder?.customers?.address ||
          activeOrder?.shipping_address ||
          activeOrder?.destination_address ||
          activeOrder?.alamat ||
          "-";

        receiptWindow.document.write(`
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Biteship Waybill</title>
              <style>
                body { font-family: Arial, Helvetica, sans-serif; padding: 18px; color: #111; background: #fff; }
                .label { max-width: 720px; margin: 0 auto; border: 2px dashed #e5e7eb; border-radius: 14px; padding: 16px; }
                .top { display:flex; align-items:center; justify-content:space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; margin-bottom: 12px; }
                .brand { display:flex; flex-direction:column; }
                .brand .name { font-size: 16px; font-weight: 800; letter-spacing: 0.2px; }
                .brand .sub { font-size: 12px; color:#6b7280; margin-top: 2px; }
                .badge { font-size: 12px; font-weight: 800; background: #f8fafc; border: 1px solid #e5e7eb; padding: 6px 10px; border-radius: 999px; color:#0f172a; }
                .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .box { border:1px solid #e5e7eb; border-radius: 12px; padding: 10px; background:#fff; }
                .row { display:flex; justify-content:space-between; gap: 10px; margin: 8px 0; }
                .k { color:#6b7280; font-size: 12px; }
                .v { font-weight: 800; font-size: 13px; }
                .title { font-size: 13px; font-weight: 900; margin: 0 0 6px 0; }
                .addr { font-size: 13px; font-weight: 700; line-height: 1.35; white-space: pre-wrap; }
                .fine { color:#6b7280; font-size: 11px; line-height: 1.35; white-space: pre-wrap; }
                .btn { margin-top: 14px; display: inline-block; padding: 10px 14px; border-radius: 12px; background: #2563eb; color: white; text-decoration: none; cursor: pointer; border: none; font-weight: 800; }
                .stamp { font-size: 12px; font-weight: 900; padding: 8px 10px; border-radius: 10px; border: 1px solid #bae6fd; background: #ecfeff; color: #075985; display:inline-block; }
                @media print {
                  body { padding: 0; }
                  .label { border: 2px solid #e5e7eb; border-radius: 0; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="label">
                <div class="top">
                  <div class="brand">
                    <div class="name">${storeName}</div>
                    <div class="sub">Dikirim dengan Biteship</div>
                  </div>
                  <div class="badge">SHIPPING LABEL</div>
                </div>

                <div class="grid">
                  <div class="box">
                    <div class="title">RESI</div>
                    <div class="row"><div class="k">Nomor Resi / Waybill</div><div class="v">${safeWaybill}</div></div>
                    <div class="row"><div class="k">Kurir</div><div class="v">${courierName}</div></div>
                    <div class="row"><div class="k">Status</div><div class="v"><span class="stamp">SHIPPED</span></div></div>
                  </div>

                  <div class="box">
                    <div class="title">TUJUAN (PENERIMA)</div>
                    <div class="addr">${recipientName}</div>
                    <div class="fine" style="margin-top:6px;">${recipientAddress}</div>
                  </div>
                </div>

                <div class="box" style="margin-top: 10px;">
                  <div class="title">CATATAN</div>
                  <div class="fine">${trackingText}</div>
                </div>

                <button class="btn no-print" onclick="window.print()">Print Halaman Ini</button>
              </div>
            </body>
          </html>
        `);
        receiptWindow.document.close();
      }

      // 4) Jika trackingLink ada, tetap coba buka link itu juga (terpisah dari custom print),
      // tapi jangan menghilangkan custom window yang sudah kita buat.
      if (trackingLink) {
        try {
          if (typeof window !== 'undefined') window.open(trackingLink, '_blank');
        } catch {}
      }
    } catch (err: any) {
      console.error('Error creating receipt:', err);
      alert(`Gagal membuat resi: ${err.message}`);
    } finally {
      // Pastikan tombol tidak stuck loading ketika API error/throw
      setConfirmLoading(false);
    }
  };


  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = localStorage.getItem("admin-authenticated") === "true";
    setIsAuthenticated(auth);
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    // load products from API
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, isCheckingAuth, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin-authenticated");
    router.push("/admin");
  };

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    // Placeholder init Chart.js. Replace dengan Chart.js real implementation.
    // import("chart.js").then(({ Chart, registerables }) => {
    //   Chart.register(...registerables);
    //   new Chart(ctx, {
    //     type: "line",
    //     data: {
    //       labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    //       datasets: [
    //         {
    //           label: "Penjualan",
    //           data: [1500000, 2300000, 1800000, 2100000, 2500000, 2200000, 2700000],
    //           tension: 0.4,
    //           borderColor: "#4f46e5",
    //           backgroundColor: "rgba(79, 70, 229, 0.18)",
    //         },
    //       ],
    //     },
    //     options: {
    //       responsive: true,
    //       plugins: {
    //         legend: { display: false },
    //       },
    //       scales: {
    //         y: { beginAtZero: true },
    //       },
    //     },
    //   });
    // });
  }, []);

  const handleConfirm = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: "confirmed" } : order
      )
    );
  };

  const handleReject = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: "rejected" } : order
      )
    );
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", price: 0, weight: "", image: "" });
    setPreviewItems([]);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);

    // Type `Product` di project ini hanya punya `image`, bukan `images`.
    // Untuk kompatibilitas UI, kalau backend suatu saat mengembalikan array gambar,
    // kita tetap fallback secara aman.
    const imagesLike: unknown = (product as any).images;
    const normalized = Array.isArray(imagesLike)
      ? (imagesLike as string[])
      : product.image
        ? [product.image]
        : [];

    const items = normalized.map((u, i) => ({
      id: `${Date.now()}-${i}`,
      type: 'existing' as const,
      src: u,
    }));

    setPreviewItems(items);
    setRemovedExistingImages([]);
    setShowProductModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setPreviewItems((prev) => {
      const remaining = Math.max(0, 5 - prev.length);
      if (remaining <= 0) return prev;
      const arr = Array.from(files).slice(0, remaining);
      const newItems = arr.map((f, i) => ({ id: `${Date.now()}-new-${i}`, type: 'new' as const, src: URL.createObjectURL(f), file: f, uploading: false, progress: 0 }));
      return [...prev, ...newItems];
    });
    // clear native input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePreview = (index: number) => {
    const item = previewItems[index];
    if (!item) return;
    if (item.type === 'existing') {
      setRemovedExistingImages((s) => [...s, item.src]);
    }
    // revoke object URL for newly added files to free memory
    if (item.type === 'new' && item.src && item.src.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(item.src);
      } catch (e) {}
    }
    setPreviewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const makePrimary = (index: number) => {
    setPreviewItems((prev) => {
      const items = [...prev];
      const [item] = items.splice(index, 1);
      items.unshift(item);
      return items.slice(0, 5);
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      // Fetch orders from server API (uses service role key, not anon key)
      const res = await fetch('/api/orders');
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          order_id: r.order_id,
          nama_pelanggan: r.customer_name || r.customer_id || r.customers?.name || '—',
          total_harga: r.total_amount ?? r.total ?? r.subtotal ?? 0,
          status: r.status || 'unknown',
          tanggal_dibuat: r.created_at || r.tanggal_dibuat || '',
          created_at: r.created_at || r.tanggal_dibuat || '',
          alamat: (typeof r.customers?.address === 'string' ? r.customers.address : (r.customer_address || r.address || '')),
          customers: r.customers,
        }));

        setSupabaseOrders(mapped);
        setOrdersError(null);
        return;
      }

      throw new Error('Tidak ada order yang ditemukan');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Fetch orders error:', err);
      setOrdersError(msg);
      setSupabaseOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'Pesanan') fetchOrders();
  }, [activeMenu]);

  // fetch dashboard values on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const confirmOrder = async (id?: string) => {
    if (!id) return;
    try {
      await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      // refresh data
      await fetchDashboardData();
    } catch (e) {
      console.error("confirmOrder error", e);
      alert("Gagal mengonfirmasi pesanan");
    }
  };

  const rejectOrder = async (id?: string) => {
    if (!id) return;
    try {
      await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      // refresh data
      await fetchDashboardData();
    } catch (e) {
      console.error("rejectOrder error", e);
      alert("Gagal menolak pesanan");
    }
  };

  // cleanup blob URLs when previewItems change or component unmounts
  useEffect(() => {
    return () => {
      for (const it of previewItems) {
        if (it.type === 'new' && it.src && it.src.startsWith('blob:')) {
          try { URL.revokeObjectURL(it.src); } catch (e) {}
        }
      }
    };
  }, [previewItems]);

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(from)) return;
    setPreviewItems((prev) => {
      const items = [...prev];
      const [moved] = items.splice(from, 1);
      items.splice(index, 0, moved);
      return items;
    });
  };

  const sanitizePriceToInt = (raw: unknown): number | null => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') {
      if (!Number.isFinite(raw)) return null;
      return Math.trunc(raw);
    }

    const s = String(raw);
    // Contoh: "Rp 14.499" -> 14499
    const digits = s.replace(/[^0-9]/g, '');
    if (!digits) return null;
    const n = Number.parseInt(digits, 10);
    return Number.isNaN(n) ? null : n;
  };

  const handleSaveProduct = async () => {
    const sanitizedPrice = sanitizePriceToInt(formData.price);

    if (!formData.name || sanitizedPrice === null) {
      alert("Nama dan harga produk harus diisi (angka integer)." );
      return;
    }

    try {
      let imageUrls: string[] = [];

      const productId = editingProduct ? editingProduct.id : `produk-${Date.now()}`;

      // iterate previewItems in order, upload new files and keep existing URLs in order
      // upload new files sequentially, updating upload state per item
      for (let i = 0; i < Math.min(previewItems.length, 5); i++) {
        const item = previewItems[i];
        if (!item) continue;
        if (item.type === 'existing') {
          imageUrls.push(item.src);
          continue;
        }
        if (item.type === 'new' && item.file) {
          // mark uploading
          setPreviewItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, uploading: true } : p)));
          try {
            const file = item.file;
            const filePath = `${productId}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabaseClient.storage.from('products').upload(filePath, file, { upsert: true });
            if (uploadError) {
              console.error('Upload error:', uploadError.message);
              setPreviewItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, uploading: false } : p)));
              continue;
            }
            const { data: urlData } = supabaseClient.storage.from('products').getPublicUrl(filePath);
            if (urlData && urlData.publicUrl) imageUrls.push(urlData.publicUrl);
          } catch (e) {
            console.error('Upload exception', e);
          } finally {
            // clear uploading flag and revoke blob URL
            setPreviewItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, uploading: false } : p)));
            if (item.src && item.src.startsWith('blob:')) {
              try { URL.revokeObjectURL(item.src); } catch (e) {}
            }
          }
        }
      }

      if (editingProduct) {
        // also ensure we excluded removedExistingImages (server will delete storage objects)
        const payload = { id: editingProduct.id, ...formData, price: sanitizedPrice, images: imageUrls };

        const res = await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || `HTTP ${res.status}`);
        }
      } else {

        // `Product` type di project ini hanya punya `image`, bukan `images`.
        // Jadi simpan gambar pertama sebagai primary image.
        const newProduct: Product = {
          id: productId,
          name: formData.name || "",
          description: formData.description || "",
          price: formData.price || 0,
          weight: formData.weight || "",
          image: imageUrls[0] || "",
        };
        const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct) });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || `HTTP ${res.status}`);
        }
      }

      const res = await fetch('/api/products');

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }

    setShowProductModal(false);
    setFormData({});
    setPreviewItems([]);
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

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-sm text-slate-500">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 md:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl bg-slate-950 p-6 text-slate-100 shadow-2xl shadow-slate-900/10 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/30">
              D
            </div>
            <div>
              <p className="text-sm uppercase text-slate-400">Toko</p>
              <h1 className="text-xl font-semibold">D'Jaemo</h1>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = item.label === activeMenu;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveMenu(item.label)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                    active
                      ? "bg-slate-800 text-white shadow-inner"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-10 rounded-3xl bg-slate-900/80 p-5 text-sm text-slate-300 shadow-inner">
            <p className="font-medium text-slate-100">Fast snacks</p>
            <p className="mt-2 leading-relaxed">Kelola produk, pesanan, dan pelanggan dari satu dashboard yang simpel.</p>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Selamat datang kembali,</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{activeMenu === "Dashboard" ? "Dashboard Admin" : activeMenu}</h2>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">3</span>
                Notifikasi
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-100"
              >
                Logout
              </button>
              <div className="flex items-center gap-3 rounded-3xl bg-slate-950 px-4 py-2 text-white shadow-lg shadow-slate-900/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-semibold">A</div>
                <div>
                  <p className="text-sm text-slate-300">Admin</p>
                  <p className="font-semibold">Jamur Krispi</p>
                </div>
              </div>
            </div>
          </header>

          {activeMenu === "Dashboard" && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article key={card.title} className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200">
                <div className={`inline-flex rounded-2xl px-3 py-1 text-xs font-semibold ${card.accent}`}>{card.title}</div>
                <p className="mt-6 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-500">{card.description}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Grafik Penjualan</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Performanya minggu ini</h3>
                </div>
                <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">Marketplace</span>
              </div>
              <div className="rounded-4xl border border-slate-200 bg-slate-50 p-4">
                <canvas ref={chartRef} className="h-80 w-full" aria-label="Penjualan mingguan" />
                <div className="mt-4 rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm shadow-slate-100">
                  <p className="font-medium text-slate-900">Chart.js placeholder</p>
                  <p className="mt-2">Script Chart.js bisa dihubungkan di sini, lalu gunakan data penjualan mingguan untuk menampilkan tren.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Ringkasan stok</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Produk hampir habis</h3>
                </div>
                <button className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-800">Kelola Stok</button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Jamur Krispi Balado 100g", stock: "12 paket" },
                  { label: "Jamur Krispi Original 150g", stock: "8 paket" },
                  { label: "Jamur Krispi Keju 100g", stock: "6 paket" },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-sm text-slate-500">Sisa stok kritis</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">{item.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Pesanan Terbaru</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Tindakan dibutuhkan</h3>
              </div>
              <span className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">{recentOrders.filter((o) => o.status === "pending").length} belum dikonfirmasi</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID Pesanan</th>
                    <th className="px-4 py-3 font-medium">Nama Pelanggan</th>
                    <th className="px-4 py-3 font-medium">Total Harga</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Tanggal Dibuat</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {recentOrders.map((order) => (
                    <tr key={order.order_id ?? order.id} className={order.status !== "pending" ? "opacity-80" : ""}>
                      <td className="px-4 py-4 font-medium text-slate-900">{order.order_id ?? order.id}</td>
                      <td className="px-4 py-4 text-slate-700">{order.customer_name ?? '-'}</td>
                      <td className="px-4 py-4 text-slate-700">{formatPrice(order.subtotal)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : ''}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDetail(order)}
                          className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
            </>
          )}

          {activeMenu === "Pesanan" && (
            <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Daftar Pesanan</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Kelola pesanan pelanggan</h3>
                </div>
                <span className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">{supabaseOrders.filter((o) => o.status === 'pending').length} belum dikonfirmasi</span>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-transparent" />
                </div>
              ) : ordersError ? (
                <div className="p-6 text-sm text-rose-600">Gagal memuat pesanan: {ordersError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">ID Pesanan</th>
                        <th className="px-4 py-3 font-medium">Nama Pelanggan</th>
                        <th className="px-4 py-3 font-medium">Total Harga</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Tanggal Dibuat</th>
                        <th className="px-4 py-3 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {supabaseOrders.map((order) => (
                        <tr key={order.order_id ?? order.id} className={order.status !== 'pending' ? 'opacity-80' : ''}>
                          <td className="px-4 py-4 font-medium text-slate-900">{order.order_id ?? order.id}</td>
                          <td className="px-4 py-4 text-slate-700">{order.nama_pelanggan ?? '-'}</td>
                          <td className="px-4 py-4 text-slate-700">{formatPrice(order.total_harga)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-700">{order.tanggal_dibuat ? new Date(order.tanggal_dibuat).toLocaleString('id-ID') : ''}</td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleDetail(order)}
                              className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeMenu === "Produk" && (
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Nama Produk
                        </label>
                        <input
                          type="text"
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Masukkan nama produk"
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Deskripsi
                        </label>
                        <textarea
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Masukkan deskripsi produk"
                          rows={3}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Harga (Rp)
                          </label>
                          <input
                            type="number"
                            value={formData.price || 0}
                            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                            placeholder="0"
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Berat
                          </label>
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">Upload Gambar (maks 5)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="w-full text-sm"
                        />

                        {previewItems && previewItems.length > 0 && (
                          <div className="mt-3 grid grid-cols-5 gap-3">
                            {previewItems.map((item, i) => (
                              <div
                                key={item.id}
                                className="relative"
                                draggable
                                onDragStart={(e) => handleDragStart(e, i)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, i)}
                                aria-roledescription="Draggable image"
                              >
                                <img src={item.src} alt={`preview-${i}`} className="h-24 w-24 rounded-md object-cover" />
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
                                    className="rounded-full bg-red-600 text-white w-6 h-6 flex items-center justify-center text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="absolute bottom-1 right-1 flex items-center gap-2">
                                  <div className="cursor-grab rounded bg-white/70 px-1 py-0.5 text-xs">≡</div>
                                </div>
                                {item.uploading ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                                  </div>
                                ) : null}
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
                          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                        </div>
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
                        disabled={previewItems.some((p) => p.uploading)}
                        className={`flex-1 rounded-2xl bg-linear-to-r from-emerald-600 via-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white transition ${previewItems.some((p) => p.uploading) ? 'opacity-60 cursor-not-allowed' : 'hover:from-emerald-500 hover:to-emerald-500'}`}
                      >
                        {previewItems.some((p) => p.uploading) ? 'Mengunggah...' : (editingProduct ? 'Simpan Perubahan' : 'Tambah Produk')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeMenu === "Pelanggan" && (
            <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Data Pelanggan</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Kelola informasi pelanggan terdaftar</h3>
              </div>
              <div className="rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center">
                <p className="text-slate-500">Fitur manajemen pelanggan akan segera hadir</p>
              </div>
            </section>
          )}

          {activeMenu === "Pengaturan" && (
            <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Pengaturan</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Konfigurasi aplikasi</h3>
              </div>
              <div className="rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center">
                <p className="text-slate-500">Fitur pengaturan akan segera hadir</p>
              </div>
            </section>
          )}

          {isModalOpen && activeOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900">Detail Pesanan</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                  >
                    ✕
                  </button>
                </div>

                {/* Info Pesanan */}
                <div className="mb-6 space-y-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">ID Pesanan:</span>
                    <span className="font-medium">{activeOrder.order_id ?? activeOrder.id ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Nama Pelanggan:</span>
                    <span className="font-medium">{activeOrder.customers?.name ?? activeOrder.customers?.nama_pelanggan ?? activeOrder.customer_name ?? activeOrder.nama_pelanggan ?? activeOrder.customer?.name ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Status:</span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase ${activeOrder.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {activeOrder.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Tanggal:</span>
                    <span className="font-medium">{activeOrder.created_at ? new Date(activeOrder.created_at).toLocaleDateString('id-ID') : activeOrder.tanggal_dibuat ? new Date(activeOrder.tanggal_dibuat).toLocaleDateString('id-ID') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Alamat:</span>
                    <span className="font-medium">{activeOrder.customers?.address ?? activeOrder.customers?.alamat ?? activeOrder.customer_address ?? activeOrder.alamat ?? activeOrder.customer?.address ?? '-'}</span>
                  </div>
                  <div className="mb-4">
                    <span className="block text-sm font-medium text-gray-700">Kode Pos</span>
                    <div className="mt-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-black">
                      {editingPostalCode || activeOrder?.postal_code || "-"}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Harga:</span>
                    <span className="font-medium">{formatPrice(activeOrder.subtotal ?? activeOrder.total_amount ?? activeOrder.total_harga ?? 0)}</span>
                  </div>
                </div>

                {/* Item Pesanan */}
                <div className="mb-6">
                  <h3 className="mb-3 font-medium text-slate-900">Item Pesanan</h3>
                  <table className="w-full text-left border-collapse mt-2">
                    <thead>
                      <tr className="border-b border-gray-200 text-sm font-semibold text-gray-600">
                        <th className="py-2">Nama Produk</th>
                        <th className="py-2 text-center">Jumlah</th>
                        <th className="py-2 text-right">Harga Satuan</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderItems.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100 text-sm text-gray-700">
                          <td className="py-2.5 font-medium">{item.product_name || 'Jamur Krispi'}</td>
                          <td className="py-2.5 text-center">{item.quantity ?? 1}x</td>
                          <td className="py-2.5 text-right">Rp {(item.price ?? 160000).toLocaleString('id-ID')}</td>
                          <td className="py-2.5 text-right">Rp {((item.price ?? 160000) * (item.quantity ?? 1)).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                      <tr className="text-sm text-gray-600 border-b border-gray-100">
                        <td className="py-2.5 italic text-gray-400">Ongkos Kirim / Biaya Layanan</td>
                        <td className="py-2.5 text-center">-</td>
                        <td className="py-2.5 text-right">-</td>
                        <td className="py-2.5 text-right">{formatPrice(activeOrder?.shipping_fee ?? 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="mb-6 flex justify-between rounded-2xl bg-slate-50 p-4 text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatPrice((activeOrder?.subtotal ?? 0) + (activeOrder?.shipping_fee ?? 0) || (activeOrder?.total_amount ?? 0))}</span>
                </div>

                {/* Tombol Aksi - Tetap bisa diproses meski item kosong */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Tutup
                  </button>
                  {activeOrder.status !== 'paid' && (
                    <button
                      onClick={handleConfirmOrder}
                      disabled={confirmLoading}
                      className={`flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition ${confirmLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-emerald-500'}`}
                    >
                      {confirmLoading ? 'Memproses...' : 'Konfirmasi Pesanan'}
                    </button>
                  )}
                  <button
                    onClick={handleCetakResi}
                    disabled={confirmLoading || !editingPostalCode.trim() || editingPostalCode === '00000'}
                    className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      confirmLoading || !editingPostalCode.trim() || editingPostalCode === '00000'
                        ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-slate-300 bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                    title={!editingPostalCode.trim() || editingPostalCode === '00000' ? 'Kode pos harus valid (bukan kosong atau 00000)' : ''}
                  >
                    {confirmLoading ? 'Membuat Resi...' : 'Cetak Resi'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
