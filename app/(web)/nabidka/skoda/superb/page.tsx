import type { Metadata } from "next";
import { TOP_MODELS } from "@/lib/seo-data";
import { ModelLandingContent } from "@/components/web/ModelLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const model = TOP_MODELS.find((m) => m.brandSlug === "skoda" && m.slug === "superb");

export const metadata: Metadata = model ? {
  title: `${model.fullName} bazar | Ojeté ${model.name} — CarMakler`,
  description: `Prověřené ojeté ${model.fullName} od ověřených makléřů. Varianty ${model.variants.join(", ")}. Bezpečný nákup s garancí.`,
  openGraph: { title: `${model.fullName} | CarMakler`, description: `Ojeté ${model.fullName} v nabídce. Prověřené vozy od ověřených makléřů.` },
  alternates: pageCanonical("/nabidka/skoda/superb"),
} : {};

export default function Page() {
  if (!model) notFound();
  return <ModelLandingContent model={model} />;
}
