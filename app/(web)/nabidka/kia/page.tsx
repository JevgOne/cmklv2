import type { Metadata } from "next";
import { BRANDS } from "@/lib/seo-data";
import { BrandLandingContent } from "@/components/web/BrandLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const BRAND_SLUG = "kia";

const brand = BRANDS.find((b) => b.slug === BRAND_SLUG);

export const metadata: Metadata = brand
  ? {
      title: `${brand.displayName} bazar | Ojeté vozy ${brand.displayName}`,
      description: `Prověřené ojeté vozy ${brand.displayName} od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další. Bezpečný nákup s garancí.`,
      openGraph: {
        title: `Ojeté vozy ${brand.displayName}`,
        description: `Prověřené ojeté ${brand.displayName} od ověřených makléřů. Bezpečný nákup s garancí.`,
      },
      alternates: pageCanonical("/nabidka/kia"),
    }
  : {};

export default function Page() {
  if (!brand) notFound();
  return <BrandLandingContent brand={brand} />;
}
