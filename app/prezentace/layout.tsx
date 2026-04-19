import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CarMakléř — Partnerská prezentace",
  description:
    "Staňte se partnerem CarMakléř. Nabízíme spolupráci pro autobazary a vrakoviště.",
  robots: { index: false, follow: false },
};

export default function PrezentaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
