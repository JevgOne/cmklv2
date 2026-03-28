import type { Metadata } from "next";
import { TOP_MODELS } from "@/lib/seo-data";
import { ModelLandingContent } from "@/components/web/ModelLandingContent";
import { notFound } from "next/navigation";

const model = TOP_MODELS.find((m) => m.brandSlug === "ford" && m.slug === "focus");

export const metadata: Metadata = model ? {
  title: `${model.fullName} bazar | Ojeté ${model.name} — CarMakler`,
  description: `Prověřené ojeté ${model.fullName} od certifikovaných makléřů. Varianty ${model.variants.join(", ")}. Bezpečný nákup s garancí.`,
  openGraph: { title: `${model.fullName} | CarMakler`, description: `Ojeté ${model.fullName} v nabídce. Prověřené vozy od certifikovaných makléřů.` },
} : {};

export default function Page() {
  if (!model) notFound();
  return <ModelLandingContent model={model} />;
}
