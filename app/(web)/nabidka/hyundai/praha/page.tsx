import type { Metadata } from "next";
import { BRANDS, CITIES } from "@/lib/seo-data";
import { BrandCityLandingContent } from "@/components/web/BrandCityLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const brand = BRANDS.find((b) => b.slug === "hyundai");
const city = CITIES.find((c) => c.slug === "praha");

export const metadata: Metadata =
  brand && city
    ? {
        title: `${brand.displayName} bazar Praha | Ojeté ${brand.displayName} v Praze`,
        description: `Prověřené ojeté vozy ${brand.displayName} v Praze od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další.`,
        openGraph: {
          title: `Ojeté ${brand.displayName} v Praze`,
          description: `Prověřené ojeté ${brand.displayName} v Praze. Bezpečný nákup od makléřů.`,
        },
        alternates: pageCanonical("/nabidka/hyundai/praha"),
      }
    : {};

export default function Page() {
  if (!brand || !city) notFound();
  return <BrandCityLandingContent brand={brand} city={city} />;
}
