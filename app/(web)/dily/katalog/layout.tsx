import type { Metadata } from "next";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Katalog autodílů",
  description:
    "Prověřené použité i nové autodíly od ověřených dodavatelů. Hledejte podle značky, modelu nebo VIN. Bezpečný nákup s garancí.",
  alternates: pageCanonical("/dily/katalog"),
};

export default function DilyKatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
