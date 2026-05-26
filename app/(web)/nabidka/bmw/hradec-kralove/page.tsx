import type { Metadata } from "next";
import { BRANDS, CITIES } from "@/lib/seo-data";
import { BrandCityLandingContent } from "@/components/web/BrandCityLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const brand = BRANDS.find((b) => b.slug === "bmw");
const city = CITIES.find((c) => c.slug === "hradec-kralove");

export const metadata: Metadata =
  brand && city
    ? {
        title: `${brand.displayName} bazar Hradec Králové | Ojeté ${brand.displayName} v Hradci Králové`,
        description: `Prověřené ojeté vozy ${brand.displayName} v Hradci Králové od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další.`,
        openGraph: {
          title: `Ojeté ${brand.displayName} v Hradci Králové`,
          description: `Prověřené ojeté ${brand.displayName} v Hradci Králové. Bezpečný nákup od makléřů.`,
        },
        alternates: pageCanonical("/nabidka/bmw/hradec-kralove"),
      }
    : {};

export default function Page() {
  if (!brand || !city) notFound();
  return <BrandCityLandingContent brand={brand} city={city} />;
}
