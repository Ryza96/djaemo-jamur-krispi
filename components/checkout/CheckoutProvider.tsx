"use client";

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type { CheckoutState, CheckoutAction } from "@/types/checkout";
import {
  isResumableOrder,
  restoreToCheckout,
} from "@/lib/checkout/restoreOrder";
import { buildSnapRedirectUrl } from "@/lib/checkout/resumeOrder";

const ORDER_STORAGE_KEY = "djaemo-last-order";

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
  resume: null,
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
    case "SET_RESUME":
      return { ...state, resume: action.payload };
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

  useEffect(() => {
    let cancelled = false;

    async function restorePendingOrder() {
      try {
        const stored = window.localStorage.getItem(ORDER_STORAGE_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored);
        const { orderId, accessToken } = parsed ?? {};
        if (!orderId || !accessToken) return;

        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(accessToken)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;

        const json = await res.json();
        if (!json.success || !json.data) return;

        const order = json.data;
        if (!isResumableOrder(order.payment_status)) return;
        if (cancelled) return;

        const snapToken: string | undefined = order.transaction_id;
        if (snapToken) {
          dispatch({
            type: "SET_RESUME",
            payload: {
              orderId: order.order_id,
              accessToken,
              token: snapToken,
              redirectUrl: buildSnapRedirectUrl(snapToken),
            },
          });
        }

        const restored = restoreToCheckout(order);
        dispatch({ type: "SET_CUSTOMER_INFO", payload: restored.customerInfo });
        dispatch({
          type: "SET_SHIPPING_ADDRESS",
          payload: restored.shippingAddress,
        });
        dispatch({
          type: "SET_SHIPPING_COURIER",
          payload: restored.shippingCourier,
        });
        dispatch({
          type: "SET_SHIPPING_SERVICE",
          payload: restored.shippingService,
        });
        dispatch({ type: "SET_SHIPPING_FEE", payload: restored.shippingFee });
      } catch {
        // ignore; a fresh checkout stays empty
      }
    }

    restorePendingOrder();

    return () => {
      cancelled = true;
    };
  }, []);

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
