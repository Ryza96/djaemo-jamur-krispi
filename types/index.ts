export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  image: string;
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
