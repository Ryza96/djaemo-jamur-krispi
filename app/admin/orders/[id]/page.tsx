import { OrderDetailClient } from "@/components/admin/orders/detail-client";

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <OrderDetailClient id={id} />;
}
