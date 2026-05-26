import type { Metadata } from "next";
import { BRANDS, CITIES } from "@/lib/seo-data";
import { BrandCityLandingContent } from "@/components/web/BrandCityLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const brand = BRANDS.find((b) => b.slug === "citroen");
const city = CITIES.find((c) => c.slug === "ostrava");

export const metadata: Metadata =
  brand && city
    ? {
        title: `${brand.displayName} bazar Ostrava | Ojeté ${brand.displayName} v Ostravě`,
        description: `Prověřené ojeté vozy ${brand.displayName} v Ostravě od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další.`,
        openGraph: {
          title: `Ojeté ${brand.displayName} v Ostravě`,
          description: `Prověřené ojeté ${brand.displayName} v Ostravě. Bezpečný nákup od makléřů.`,
        },
        alternates: pageCanonical("/nabidka/citroen/ostrava"),
      }
    : {};

export default function Page() {
  if (!brand || !city) notFound();
  return <BrandCityLandingContent brand={brand} city={city} />;
}
