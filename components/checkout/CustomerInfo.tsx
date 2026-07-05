"use client";

import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { customerInfoSchema } from "@/lib/validation/checkout";
import type { CustomerInfoInput } from "@/lib/validation/checkout";
import { useState } from "react";

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary";

const labelClass = "mb-2 block text-sm font-medium text-muted";

export function CustomerInfo() {
  const { state, dispatch } = useCheckout();
  const { customerInfo } = state;
  const [errors, setErrors] = useState<
    Partial<Record<keyof CustomerInfoInput, string>>
  >({});

  function validate(field: keyof CustomerInfoInput) {
    const result = customerInfoSchema.safeParse(customerInfo);
    if (!result.success) {
      const fieldError = result.error.issues.find((e) =>
        e.path.includes(field),
      );
      setErrors((prev) => ({
        ...prev,
        [field]: fieldError?.message ?? "",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function update(field: keyof CustomerInfoInput, value: string) {
    dispatch({
      type: "SET_CUSTOMER_INFO",
      payload: { [field]: value },
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="customer-name" className={labelClass}>
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          id="customer-name"
          type="text"
          value={customerInfo.name}
          onChange={(e) => update("name", e.target.value)}
          onBlur={() => validate("name")}
          placeholder="Nama lengkap"
          className={inputClass}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "customer-name-error" : undefined}
        />
        {errors.name && (
          <p id="customer-name-error" className="mt-1 text-xs text-red-500">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="customer-whatsapp" className={labelClass}>
          WhatsApp <span className="text-red-500">*</span>
        </label>
        <input
          id="customer-whatsapp"
          type="tel"
          value={customerInfo.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          onBlur={() => validate("whatsapp")}
          placeholder="0812xxxxxxx"
          className={inputClass}
          aria-invalid={!!errors.whatsapp}
          aria-describedby={
            errors.whatsapp ? "customer-whatsapp-error" : undefined
          }
        />
        {errors.whatsapp && (
          <p
            id="customer-whatsapp-error"
            className="mt-1 text-xs text-red-500"
          >
            {errors.whatsapp}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="customer-email" className={labelClass}>
          Email <span className="text-xs text-muted">(opsional)</span>
        </label>
        <input
          id="customer-email"
          type="email"
          value={customerInfo.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={() => validate("email")}
          placeholder="email@domain.com"
          className={inputClass}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "customer-email-error" : undefined}
        />
        {errors.email && (
          <p id="customer-email-error" className="mt-1 text-xs text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="customer-notes" className={labelClass}>
          Catatan Pesanan{" "}
          <span className="text-xs text-muted">(opsional)</span>
        </label>
        <textarea
          id="customer-notes"
          value={customerInfo.notes}
          onChange={(e) => update("notes", e.target.value)}
          onBlur={() => validate("notes")}
          placeholder="Catatan untuk pesanan..."
          rows={3}
          className={`${inputClass} min-h-[80px] resize-none`}
        />
        {errors.notes && (
          <p id="customer-notes-error" className="mt-1 text-xs text-red-500">
            {errors.notes}
          </p>
        )}
      </div>
    </div>
  );
}
