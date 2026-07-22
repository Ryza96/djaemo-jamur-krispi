import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { PartnerLoginForm } from "./PartnerLoginForm";

export const metadata: Metadata = {
  title: "Masuk Partner",
  description: `Masuk ke akun Partner ${SITE.name}.`,
};

export default function PartnerLoginPage() {
  return <PartnerLoginForm />;
}
