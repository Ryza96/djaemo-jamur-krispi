import type { Metadata } from "next";
import { SITE, PARTNER_COMING_SOON } from "@/lib/constants";
import { ComingSoonGate } from "@/components/partner/ComingSoonGate";
import { RegistrationForm } from "./RegistrationForm";

export const metadata: Metadata = {
  title: "Registrasi Partner",
  description: `Registrasi Partner ${SITE.name} — Program Kemitraan Resmi.`,
};

export default function PartnerRegisterPage() {
  if (PARTNER_COMING_SOON) {
    return (
      <ComingSoonGate
        description="Registrasi Program Kemitraan sedang kami siapkan. Nantikan info selanjutnya!"
        backHref="/partner"
        backLabel="Kembali ke Program Kemitraan"
      />
    );
  }

  return <RegistrationForm />;
}