"use client";

import { useEffect, useRef } from "react";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { useCart } from "@/components/cart/CartProvider";
import { ShippingProvider, useShipping } from "./ShippingProvider";
import { ShippingMethodList } from "./ShippingMethodList";
import { ShippingSkeleton } from "./ShippingSkeleton";
import { ShippingError } from "./ShippingError";

function ShippingSelectorInner() {
  const { state, dispatch } = useCheckout();
  const { state: shippingState, fetchRates, selectRate, retry } = useShipping();
  const { items } = useCart();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { shippingAddress } = state;

  const isAddressComplete =
    shippingAddress.province.trim().length > 0 &&
    shippingAddress.city.trim().length > 0 &&
    shippingAddress.kecamatan.trim().length > 0 &&
    shippingAddress.kelurahan.trim().length > 0;

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();

    if (!isAddressComplete || items.length === 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const controller = new AbortController();
    abortRef.current = controller;

    debounceRef.current = setTimeout(() => {
      fetchRates(shippingAddress, items, controller.signal);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    shippingAddress,
    items,
    fetchRates,
    isAddressComplete,
  ]);

  function handleSelect(rateId: string) {
    selectRate(rateId);
    const rate = shippingState.rates.find((r) => r.id === rateId);
    if (rate) {
      dispatch({ type: "SET_SHIPPING_COURIER", payload: rate.courier });
      dispatch({ type: "SET_SHIPPING_SERVICE", payload: rate.service });
      dispatch({ type: "SET_SHIPPING_FEE", payload: rate.price });
    }
  }

  function handleRetry() {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    retry(abortRef.current.signal);
  }

  const message = !isAddressComplete
    ? "Lengkapi provinsi, kota, kecamatan, dan kelurahan untuk melihat tarif pengiriman"
    : null;

  return (
    <div className="space-y-3">
      {message && (
        <p className="text-sm text-muted">{message}</p>
      )}

      {shippingState.isLoading && <ShippingSkeleton />}

      {shippingState.error && !shippingState.isLoading && (
        <ShippingError message={shippingState.error} onRetry={handleRetry} />
      )}

      {!shippingState.isLoading &&
        !shippingState.error &&
        shippingState.rates.length > 0 && (
          <ShippingMethodList
            rates={shippingState.rates}
            selectedId={shippingState.selectedId}
            onSelect={handleSelect}
          />
        )}
    </div>
  );
}

export function ShippingSelector() {
  return (
    <ShippingProvider>
      <ShippingSelectorInner />
    </ShippingProvider>
  );
}
