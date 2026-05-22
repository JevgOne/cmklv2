import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moje objednávky | Shop",
  robots: { index: false, follow: false },
};

export default function MojeObjednavkyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
