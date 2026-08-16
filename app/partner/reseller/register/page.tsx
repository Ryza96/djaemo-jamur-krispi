import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { ResellerRegistrationForm } from "./ResellerRegistrationForm";

export const metadata: Metadata = {
  title: "Registrasi Reseller",
  description: `Registrasi Reseller ${SITE.name} — Program Kemitraan Resmi.`,
};

export default function ResellerRegisterPage() {
  return <ResellerRegistrationForm />;
}
