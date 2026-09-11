import type { Metadata } from "next";
import { SITE, PARTNER_COMING_SOON } from "@/lib/constants";
import { ComingSoonGate } from "@/components/partner/ComingSoonGate";
import { PartnerStatusView } from "./PartnerStatusView";

export const metadata: Metadata = {
  title: "Status Partner",
  description: `Status akun Partner ${SITE.name}.`,
};

export default function PartnerStatusPage() {
  if (PARTNER_COMING_SOON) {
    return (
      <ComingSoonGate
        description="Halaman Status Partner sedang kami siapkan. Nantikan info selanjutnya!"
        backHref="/partner"
        backLabel="Kembali ke Program Kemitraan"
      />
    );
  }

  return <PartnerStatusView />;
}