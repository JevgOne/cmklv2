import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Objednávka",
  description: "Dokončete objednávku.",
  robots: { index: false, follow: false },
};

export default function ShopObjednavkaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
