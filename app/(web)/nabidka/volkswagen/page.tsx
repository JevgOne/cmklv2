import type { Metadata } from "next";
import { BRANDS } from "@/lib/seo-data";
import { BrandLandingContent } from "@/components/web/BrandLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const BRAND_SLUG = "volkswagen";

const brand = BRANDS.find((b) => b.slug === BRAND_SLUG);

export const metadata: Metadata = brand
  ? {
      title: `${brand.displayName} bazar | Ojeté vozy ${brand.displayName} — CarMakler`,
      description: `Prověřené ojeté vozy ${brand.displayName} od certifikovaných makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další. Bezpečný nákup s garancí.`,
      openGraph: {
        title: `Ojeté vozy ${brand.displayName} | CarMakler`,
        description: `Prověřené ojeté ${brand.displayName} od certifikovaných makléřů. Bezpečný nákup s garancí.`,
      },
      alternates: pageCanonical("/nabidka/volkswagen"),
    }
  : {};

export default function Page() {
  if (!brand) notFound();
  return <BrandLandingContent brand={brand} />;
}
