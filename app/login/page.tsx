import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Masuk",
  description: `Masuk ke akun ${SITE.name} Anda.`,
};

export default function LoginPage() {
  return <LoginForm />;
}
