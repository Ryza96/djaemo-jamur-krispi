import type { PromoCountdownProps } from "./types";
import { formatCountdownLabel } from "./utils";

export function PromoCountdown({ data, countdown, variant = "inline", className }: PromoCountdownProps) {
  const countdownData = countdown ?? data?.promo_countdown;
  if (!countdownData) return null;

  const label = formatCountdownLabel(countdownData);

  if (variant === "inline") {
    return (
      <span className={`text-xs text-muted ${className ?? ""}`}>
        {label}
      </span>
    );
  }

  return (
    <p className={`text-lg text-muted ${className ?? ""}`}>
      {label}
    </p>
  );
}
