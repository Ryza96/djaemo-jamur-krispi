import { formatPrice } from "@/lib/utils";

interface ProductPriceProps {
  price: number;
}

export function ProductPrice({ price }: ProductPriceProps) {
  return (
    <p className="text-3xl font-bold text-secondary sm:text-4xl">
      {formatPrice(price)}
    </p>
  );
}
