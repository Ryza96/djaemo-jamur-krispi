"use client";

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { ShippingRate } from "@/types/checkout";
import { getRates } from "@/lib/services/shipping/getRates";
import type { CartItem } from "@/types";
import type { ShippingAddress } from "@/types/checkout";

interface ShippingState {
  rates: ShippingRate[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
}

type ShippingAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: ShippingRate[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SELECT_RATE"; payload: string }
  | { type: "CLEAR" };

const initialState: ShippingState = {
  rates: [],
  selectedId: null,
  isLoading: false,
  error: null,
};

function shippingReducer(
  state: ShippingState,
  action: ShippingAction,
): ShippingState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null, rates: [], selectedId: null };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, rates: action.payload };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "SELECT_RATE":
      return { ...state, selectedId: action.payload };
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
}

interface ShippingContextValue {
  state: ShippingState;
  fetchRates: (address: ShippingAddress, items: CartItem[], signal?: AbortSignal) => void;
  selectRate: (rateId: string) => void;
  retry: (signal?: AbortSignal) => void;
}

const ShippingContext = createContext<ShippingContextValue | undefined>(
  undefined,
);

export function ShippingProvider({
  children,
  onRateSelect,
}: {
  children: ReactNode;
  onRateSelect?: (rate: ShippingRate) => void;
}) {
  const [state, dispatch] = useReducer(shippingReducer, initialState);
  const lastParams = useRef<{ address: ShippingAddress; items: CartItem[] } | null>(null);

  const fetchRates = useCallback(
    async (address: ShippingAddress, items: CartItem[], signal?: AbortSignal) => {
      lastParams.current = { address, items };
      dispatch({ type: "FETCH_START" });
      const result = await getRates({ address, items }, signal);
      if (signal?.aborted) return;
      if (result.error) {
        dispatch({ type: "FETCH_ERROR", payload: result.error });
      } else {
        dispatch({ type: "FETCH_SUCCESS", payload: result.rates });
      }
    },
    [],
  );

  const retry = useCallback(
    (signal?: AbortSignal) => {
      if (lastParams.current) {
        fetchRates(lastParams.current.address, lastParams.current.items, signal);
      }
    },
    [fetchRates],
  );

  const selectRate = useCallback(
    (rateId: string) => {
      dispatch({ type: "SELECT_RATE", payload: rateId });
      const rate = state.rates.find((r) => r.id === rateId);
      if (rate && onRateSelect) {
        onRateSelect(rate);
      }
    },
    [state.rates, onRateSelect],
  );

  const value = useMemo(
    () => ({ state, fetchRates, selectRate, retry }),
    [state, fetchRates, selectRate, retry],
  );

  return (
    <ShippingContext.Provider value={value}>
      {children}
    </ShippingContext.Provider>
  );
}

export function useShipping() {
  const context = useContext(ShippingContext);
  if (!context) {
    throw new Error("useShipping must be used within ShippingProvider");
  }
  return context;
}
