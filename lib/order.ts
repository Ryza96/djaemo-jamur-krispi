import { Product } from "@/types";

export function buildOrderId(items: { product: Product; quantity: number }[]) {
  const timestamp = Date.now().toString(36);
  const summary = items.map((item) => `${item.product.id}-${item.quantity}`).join("-");
  return `DJ-${timestamp}-${summary}`;
}
