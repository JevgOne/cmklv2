import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podat inzerát",
  description:
    "Podejte inzerát na prodej vašeho vozu na CarMakléř. Jednoduchý formulář, rychlé zveřejnění.",
  robots: { index: true, follow: true },
};

export default function InzeratPridatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
