import type { Metadata } from "next";
import { TOP_MODELS } from "@/lib/seo-data";
import { ModelLandingContent } from "@/components/web/ModelLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const model = TOP_MODELS.find((m) => m.brandSlug === "bmw" && m.slug === "3-series");

export const metadata: Metadata = model ? {
  title: `${model.fullName} bazar | Ojeté ${model.name} — CarMakler`,
  description: `Prověřené ojeté ${model.fullName} od certifikovaných makléřů. Varianty ${model.variants.join(", ")}. Bezpečný nákup s garancí.`,
  openGraph: { title: `${model.fullName} | CarMakler`, description: `Ojeté ${model.fullName} v nabídce. Prověřené vozy od certifikovaných makléřů.` },
  alternates: pageCanonical("/nabidka/bmw/3-series"),
} : {};

export default function Page() {
  if (!model) notFound();
  return <ModelLandingContent model={model} />;
}
