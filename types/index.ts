export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  stock: number;
  images: string[];
  has_active_promo: boolean;
  normal_price: number;
  final_price: number;
  promo_price: number | null;
  discount_amount: number;
  promo_name: string | null;
  promo_status: string | null;
  promo_countdown: {
    value: number;
    unit: "hari" | "jam" | "menit" | "detik";
    direction: "lagi" | "yang lalu";
    type: "upcoming" | "active" | "ended" | "cancelled";
    display: string;
  } | null;
}

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  stock: number;
  created_at?: string;
  product_images?: Array<{ image_url: string }>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface NavLink {
  href: string;
  label: string;
}

export interface Order {
  orderId: string;
  transactionId: string;
  qrCodeUrl: string;
  items: CartItem[];
  subtotal: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  status: string;
  createdAt: string;
}
