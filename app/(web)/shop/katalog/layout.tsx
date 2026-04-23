import type { Metadata } from "next";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Shop autodílů",
  description:
    "Nakupujte ověřené autodíly online. Široký výběr použitých i nových dílů s rychlým doručením po celé ČR.",
  alternates: pageCanonical("/shop/katalog"),
};

export default function ShopKatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
