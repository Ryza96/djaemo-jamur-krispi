import type { PromoNameProps } from "./types";

export function PromoName({ name, className }: PromoNameProps) {
  return (
    <h2 className={`text-2xl font-bold text-primary sm:text-3xl ${className ?? ""}`}>
      {name}
    </h2>
  );
}
