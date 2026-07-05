export interface CustomerInfo {
  name: string;
  whatsapp: string;
  email: string;
  notes: string;
}

export interface ShippingAddress {
  street: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
  areaId: string;
  districtName: string;
  latitude: number;
  longitude: number;
}

export interface Voucher {
  code: string;
  discount: number;
}

export interface ShippingRate {
  id: string;
  courier: string;
  service: string;
  price: number;
  etd: string | null;
}

export interface CheckoutState {
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  shippingCourier: string;
  shippingService: string;
  shippingFee: number;
  voucher: Voucher | null;
  isSubmitting: boolean;
  error: string | null;
}

export type CheckoutAction =
  | { type: "SET_CUSTOMER_INFO"; payload: Partial<CustomerInfo> }
  | { type: "SET_SHIPPING_ADDRESS"; payload: Partial<ShippingAddress> }
  | { type: "SET_SHIPPING_SERVICE"; payload: string }
  | { type: "SET_SHIPPING_FEE"; payload: number }
  | { type: "SET_SHIPPING_COURIER"; payload: string }
  | { type: "SET_VOUCHER"; payload: Voucher | null }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
