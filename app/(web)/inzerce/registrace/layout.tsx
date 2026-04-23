import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrace inzerenta",
  description:
    "Zaregistrujte se jako inzerent na CarMakléř. Podávejte inzeráty na prodej vozidel snadno a rychle.",
  robots: { index: false, follow: true },
};

export default function InzerceRegistraceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
