"use client";

import { formatPrice } from "@/lib/utils";
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/patterns";

interface OrderItem {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface ItemsSectionProps {
  items: OrderItem[];
}

export function ItemsSection({ items }: ItemsSectionProps) {
  return (
    <div className="rounded-3xl bg-white shadow-sm shadow-slate-200">
      <div className="px-6 pt-6 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Order Items
        </h2>
      </div>
      {items.length === 0 ? (
        <div className="px-6 pb-6 text-sm text-slate-500">
          Tidak ada item dalam pesanan ini.
        </div>
      ) : (
        <AdminTable className="!rounded-none !shadow-none">
          <AdminTableHead>
            <AdminTableHeader>Product</AdminTableHeader>
            <AdminTableHeader>Qty</AdminTableHeader>
            <AdminTableHeader>Price</AdminTableHeader>
            <AdminTableHeader className="text-right">Subtotal</AdminTableHeader>
          </AdminTableHead>
          <AdminTableBody>
            {items.map((item) => (
              <AdminTableRow key={item.id}>
                <AdminTableCell className="font-medium text-slate-900">
                  {item.product_name}
                </AdminTableCell>
                <AdminTableCell className="text-slate-600">
                  {item.quantity}
                </AdminTableCell>
                <AdminTableCell className="text-slate-600">
                  {formatPrice(item.price)}
                </AdminTableCell>
                <AdminTableCell className="text-right font-medium text-slate-900">
                  {formatPrice(item.subtotal)}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminTable>
      )}
    </div>
  );
}
