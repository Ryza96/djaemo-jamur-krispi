"use client";

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from "react";
import type { CheckoutState, CheckoutAction } from "@/types/checkout";

const initialState: CheckoutState = {
  customerInfo: { name: "", whatsapp: "", email: "", notes: "" },
  shippingAddress: {
    street: "",
    kelurahan: "",
    kecamatan: "",
    city: "",
    province: "",
    postalCode: "",
    areaId: "",
    districtName: "",
    latitude: 0,
    longitude: 0,
  },
  shippingCourier: "",
  shippingService: "",
  shippingFee: 0,
  voucher: null,
  isSubmitting: false,
  error: null,
};

function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction,
): CheckoutState {
  switch (action.type) {
    case "SET_CUSTOMER_INFO":
      return {
        ...state,
        customerInfo: { ...state.customerInfo, ...action.payload },
      };
    case "SET_SHIPPING_ADDRESS":
      return {
        ...state,
        shippingAddress: { ...state.shippingAddress, ...action.payload },
      };
    case "SET_SHIPPING_SERVICE":
      return { ...state, shippingService: action.payload };
    case "SET_SHIPPING_FEE":
      return { ...state, shippingFee: action.payload };
    case "SET_SHIPPING_COURIER":
      return { ...state, shippingCourier: action.payload };
    case "SET_VOUCHER":
      return { ...state, voucher: action.payload };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface CheckoutContextValue {
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(
  undefined,
);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within CheckoutProvider");
  }
  return context;
}
