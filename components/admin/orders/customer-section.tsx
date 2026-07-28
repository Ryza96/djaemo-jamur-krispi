"use client";

import { AdminKeyValue } from "@/components/admin/ui";
import { AdminSection } from "@/components/admin/patterns";

interface CustomerSectionProps {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
}

export function CustomerSection({
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
}: CustomerSectionProps) {
  return (
    <>
      <AdminSection title="Customer Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminKeyValue label="Nama" value={customerName ?? "-"} />
          <AdminKeyValue label="Email" value={customerEmail ?? "-"} />
          <AdminKeyValue label="WhatsApp" value={customerPhone ?? "-"} />
        </div>
      </AdminSection>

      <AdminSection title="Shipping Address">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AdminKeyValue label="Nama Penerima" value={customerName ?? "-"} />
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
