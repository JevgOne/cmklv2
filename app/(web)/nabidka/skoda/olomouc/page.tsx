import type { Metadata } from "next";
import { BRANDS, CITIES } from "@/lib/seo-data";
import { BrandCityLandingContent } from "@/components/web/BrandCityLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const brand = BRANDS.find((b) => b.slug === "skoda");
const city = CITIES.find((c) => c.slug === "olomouc");

export const metadata: Metadata =
  brand && city
    ? {
        title: `${brand.displayName} bazar Olomouc | Ojeté ${brand.displayName} v Olomouci`,
        description: `Prověřené ojeté vozy ${brand.displayName} v Olomouci od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další.`,
        openGraph: {
          title: `Ojeté ${brand.displayName} v Olomouci`,
          description: `Prověřené ojeté ${brand.displayName} v Olomouci. Bezpečný nákup od makléřů.`,
        },
        alternates: pageCanonical("/nabidka/skoda/olomouc"),
      }
    : {};

export default function Page() {
  if (!brand || !city) notFound();
  return <BrandCityLandingContent brand={brand} city={city} />;
}
