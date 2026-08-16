import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { DropshipperRegistrationForm } from "./DropshipperRegistrationForm";

export const metadata: Metadata = {
  title: "Registrasi Dropshipper",
  description: `Registrasi Dropshipper ${SITE.name} — Program Kemitraan Resmi.`,
};

export default function DropshipperRegisterPage() {
  return <DropshipperRegistrationForm />;
}
