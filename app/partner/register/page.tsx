import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { RegistrationForm } from "./RegistrationForm";

export const metadata: Metadata = {
  title: "Registrasi Partner",
  description: `Registrasi Partner ${SITE.name} — Program Kemitraan Resmi.`,
};

export default function PartnerRegisterPage() {
  return <RegistrationForm />;
}
