import type { Metadata } from "next";
import { BRANDS, CITIES } from "@/lib/seo-data";
import { BrandCityLandingContent } from "@/components/web/BrandCityLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const brand = BRANDS.find((b) => b.slug === "renault");
const city = CITIES.find((c) => c.slug === "brno");

export const metadata: Metadata =
  brand && city
    ? {
        title: `${brand.displayName} bazar Brno | Ojeté ${brand.displayName} v Brně`,
        description: `Prověřené ojeté vozy ${brand.displayName} v Brně od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další.`,
        openGraph: {
          title: `Ojeté ${brand.displayName} v Brně`,
          description: `Prověřené ojeté ${brand.displayName} v Brně. Bezpečný nákup od makléřů.`,
        },
        alternates: pageCanonical("/nabidka/renault/brno"),
      }
    : {};

export default function Page() {
  if (!brand || !city) notFound();
  return <BrandCityLandingContent brand={brand} city={city} />;
}
