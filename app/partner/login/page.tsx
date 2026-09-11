import type { Metadata } from "next";
import { SITE, PARTNER_COMING_SOON } from "@/lib/constants";
import { ComingSoonGate } from "@/components/partner/ComingSoonGate";
import { PartnerLoginForm } from "./PartnerLoginForm";

export const metadata: Metadata = {
  title: "Masuk Partner",
  description: `Masuk ke akun Partner ${SITE.name}.`,
};

export default function PartnerLoginPage() {
  if (PARTNER_COMING_SOON) {
    return (
      <ComingSoonGate
        description="Portal Masuk Partner sedang kami siapkan. Nantikan info selanjutnya!"
        backHref="/partner"
        backLabel="Kembali ke Program Kemitraan"
      />
    );
  }

  return <PartnerLoginForm />;
}