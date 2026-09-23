export type ShippingMode = "biteship" | "flat-rate";

/**
 * Server-side shipping mode for the current runtime.
 *
 * TEST/development isolation is enforced explicitly by environment, not by
 * the presence/absence of BITESHIP_API_KEY:
 *
 * - Production: defaults to `biteship` (existing behavior). The explicit
 *   `SHIPPING_MODE=flat-rate` override can force deterministic flat-rate
 *   shipping during incidents; production never degrades automatically.
 * - Non-production (development/test): defaults to `flat-rate` for safety.
 *   Biteship runs ONLY when `SHIPPING_MODE=biteship` is set explicitly
 *   (e.g. a Biteship Testing key in .env.development.local).
 */
export function getShippingMode(): ShippingMode {
  const override = (process.env.SHIPPING_MODE ?? "").trim().toLowerCase();

  if (process.env.NODE_ENV === "production") {
    return override === "flat-rate" ? "flat-rate" : "biteship";
  }

  return override === "biteship" ? "biteship" : "flat-rate";
}

export function isBiteshipShippingEnabled(): boolean {
  return getShippingMode() === "biteship";
}
