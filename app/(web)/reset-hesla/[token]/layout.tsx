import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obnovení hesla",
  description: "Nastavte si nové heslo pro přístup k vašemu účtu na CarMakléř.",
  robots: { index: false, follow: false },
};

export default function ResetHeslaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
