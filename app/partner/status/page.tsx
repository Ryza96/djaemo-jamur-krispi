import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { PartnerStatusView } from "./PartnerStatusView";

export const metadata: Metadata = {
  title: "Status Partner",
  description: `Status akun Partner ${SITE.name}.`,
};

export default function PartnerStatusPage() {
  return <PartnerStatusView />;
}
