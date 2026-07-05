"use client";

import { AdminKeyValue } from "@/components/admin/ui";
import { AdminSection } from "@/components/admin/patterns";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";

interface CustomerSectionProps {
  customer: OrderDetailRow["customers"];
  shippingAddress: string | null;
}

export function CustomerSection({
  customer,
  shippingAddress,
}: CustomerSectionProps) {
  return (
    <>
      <AdminSection title="Customer Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminKeyValue label="Nama" value={customer?.name ?? "-"} />
          <AdminKeyValue label="Email" value={customer?.email ?? "-"} />
          <AdminKeyValue label="WhatsApp" value={customer?.phone ?? "-"} />
        </div>
      </AdminSection>

      <AdminSection title="Shipping Address">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AdminKeyValue label="Nama Penerima" value={customer?.name ?? "-"} />
          </div>
          <div className="sm:col-span-2">
            <AdminKeyValue label="Alamat Lengkap" value={shippingAddress ?? "-"} />
          </div>
          <AdminKeyValue label="Kelurahan" value="-" />
          <AdminKeyValue label="Kecamatan" value="-" />
          <AdminKeyValue label="Kota" value="-" />
          <AdminKeyValue label="Provinsi" value="-" />
          <AdminKeyValue label="Kode Pos" value="-" />
        </div>
      </AdminSection>
    </>
  );
}
