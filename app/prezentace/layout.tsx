import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prezentace | Carmakler — Partnersky program",
  description:
    "Stante se partnerem Carmakler. Nabizime spolupraci pro autobazary a vrakoviste.",
};

export default function PrezentaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
