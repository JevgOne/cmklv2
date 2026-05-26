import type { Metadata } from "next";
import { BRANDS, CITIES } from "@/lib/seo-data";
import { BrandCityLandingContent } from "@/components/web/BrandCityLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const brand = BRANDS.find((b) => b.slug === "mercedes-benz");
const city = CITIES.find((c) => c.slug === "ceske-budejovice");

export const metadata: Metadata =
  brand && city
    ? {
        title: `${brand.displayName} bazar České Budějovice | Ojeté ${brand.displayName} v Českých Budějovicích`,
        description: `Prověřené ojeté vozy ${brand.displayName} v Českých Budějovicích od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další.`,
        openGraph: {
          title: `Ojeté ${brand.displayName} v Českých Budějovicích`,
          description: `Prověřené ojeté ${brand.displayName} v Českých Budějovicích. Bezpečný nákup od makléřů.`,
        },
        alternates: pageCanonical("/nabidka/mercedes-benz/ceske-budejovice"),
      }
    : {};

export default function Page() {
  if (!brand || !city) notFound();
  return <BrandCityLandingContent brand={brand} city={city} />;
}
