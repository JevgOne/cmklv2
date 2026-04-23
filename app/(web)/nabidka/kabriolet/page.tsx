import type { Metadata } from "next";
import { VehicleLandingPage } from "@/components/web/VehicleLandingPage";
import { generateBreadcrumbJsonLd, generateFaqJsonLd, generateWebPageJsonLd } from "@/lib/seo";
import { BODY_TYPES, BASE_URL, BRANDS, PRICE_RANGES } from "@/lib/seo-data";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const bodyType = BODY_TYPES.find((b) => b.slug === "kabriolet");

export const metadata: Metadata = bodyType ? {
  title: `Kabriolet bazar | Ojeté kabriolety`,
  description: `Prověřené ojeté kabriolety od ověřených makléřů. Široký výběr značek a modelů. Bezpečný nákup s garancí.`,
  openGraph: {
    title: `Ojeté kabriolety`,
    description: `Prověřené ojeté kabriolety. Bezpečný nákup od makléřů.`,
  },
  alternates: pageCanonical("/nabidka/kabriolet"),
} : {};

export default function Page() {
  if (!bodyType) notFound();

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Nabídka", url: `${BASE_URL}/nabidka` },
    { name: bodyType.name, url: `${BASE_URL}/nabidka/${bodyType.slug}` },
  ]);
  const faqJsonLd = generateFaqJsonLd(bodyType.faqItems);
  const webPageJsonLd = generateWebPageJsonLd({
    name: `Ojeté kabriolety`,
    description: bodyType.description,
    url: `${BASE_URL}/nabidka/${bodyType.slug}`,
    about: [{ name: bodyType.name, type: "Thing" }, { name: "Ojeté automobily", type: "Thing" }],
    speakableCssSelectors: ["[data-speakable]"],
  });

  const filterParam = bodyType.filterValue
    ? (bodyType.filterValue === "ELECTRIC" || bodyType.filterValue === "HYBRID"
      ? `fuelType=${bodyType.filterValue}`
      : `bodyType=${bodyType.filterValue}`)
    : "";

  const relatedLinks = [
    ...BODY_TYPES.filter((b) => b.slug !== bodyType.slug).map((b) => ({
      label: b.name,
      href: `/nabidka/${b.slug}`,
    })),
    ...BRANDS.slice(0, 6).map((b) => ({
      label: `Ojeté ${b.displayName}`,
      href: `/nabidka/${b.slug}`,
    })),
    ...PRICE_RANGES.slice(0, 3).map((p) => ({
      label: `Auta ${p.label}`,
      href: `/nabidka/${p.slug}`,
    })),
  ];

  return (
    <VehicleLandingPage
      title={`${bodyType.name} bazar | Ojeté ${bodyType.name.toLowerCase()} vozy`}
      description={bodyType.description}
      h1={`Ojeté kabriolety`}
      filterDescription={`Prověřené ojeté kabriolety od ověřených makléřů. Široký výběr značek a modelů.`}
      aiSnippet={bodyType.aiSnippet}
      quickFacts={bodyType.quickFacts}
      seoText={
        <div>
          <h2>Proč koupit ojeté {bodyType.name.toLowerCase()} na CarMakler?</h2>
          <p>{bodyType.description}</p>
          <h3>Bezpečný nákup s garancí</h3>
          <p>
            Každý ojetý vůz na CarMakler prochází důkladnou kontrolou. Ověřujeme historii přes CEBIA,
            kontrolujeme stav tachometru a původ vozu. Ověřený makléř provede fyzickou prohlídku
            a zajistí kompletní administrativu nákupu včetně financování a pojištění.
          </p>
        </div>
      }
      faqItems={bodyType.faqItems}
      breadcrumbs={[
        { name: "Domů", href: "/" },
        { name: "Nabídka", href: "/nabidka" },
        { name: bodyType.name, href: `/nabidka/${bodyType.slug}` },
      ]}
      jsonLdScripts={[breadcrumbJsonLd, faqJsonLd, webPageJsonLd]}
      ctaHeading={`Chcete prodat váš ${bodyType.name.toLowerCase()}?`}
      relatedLinks={relatedLinks}
      filterHref={`/nabidka?${filterParam}`}
    />
  );
}
