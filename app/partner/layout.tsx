import { PartnerAuthProvider } from "@/components/partner/PartnerAuthProvider";

export default function PartnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PartnerAuthProvider>{children}</PartnerAuthProvider>;
}
