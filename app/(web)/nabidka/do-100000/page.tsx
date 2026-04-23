import type { Metadata } from "next";
import { VehicleLandingPage } from "@/components/web/VehicleLandingPage";
import { generateBreadcrumbJsonLd, generateFaqJsonLd, generateWebPageJsonLd } from "@/lib/seo";
import { PRICE_RANGES, BASE_URL, BRANDS, BODY_TYPES } from "@/lib/seo-data";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const priceRange = PRICE_RANGES.find((p) => p.slug === "do-100000");

export const metadata: Metadata = priceRange ? {
  title: `Auta ${priceRange.label} | Ojeté vozy`,
  description: `Prověřené ojeté vozy ${priceRange.label} od ověřených makléřů. Široký výběr značek a modelů za rozumné ceny. Bezpečný nákup.`,
  openGraph: {
    title: `Ojeté vozy ${priceRange.label}`,
    description: `Prověřené ojeté vozy ${priceRange.label}. Bezpečný nákup od makléřů.`,
  },
  alternates: pageCanonical("/nabidka/do-100000"),
} : {};

export default function Page() {
  if (!priceRange) notFound();

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Nabídka", url: `${BASE_URL}/nabidka` },
    { name: `Auta ${priceRange.label}`, url: `${BASE_URL}/nabidka/${priceRange.slug}` },
  ]);
  const faqJsonLd = generateFaqJsonLd(priceRange.faqItems);
  const webPageJsonLd = generateWebPageJsonLd({
    name: `Ojeté vozy ${priceRange.label}`,
    description: priceRange.description,
    url: `${BASE_URL}/nabidka/${priceRange.slug}`,
    about: [{ name: "Ojeté automobily", type: "Thing" }],
    speakableCssSelectors: ["[data-speakable]"],
  });

  const relatedLinks = [
    ...PRICE_RANGES.filter((p) => p.slug !== priceRange.slug).map((p) => ({
      label: `Auta ${p.label}`,
      href: `/nabidka/${p.slug}`,
    })),
    ...BRANDS.slice(0, 6).map((b) => ({
      label: `Ojeté ${b.displayName}`,
      href: `/nabidka/${b.slug}`,
    })),
    ...BODY_TYPES.slice(0, 4).map((bt) => ({
      label: bt.name,
      href: `/nabidka/${bt.slug}`,
    })),
  ];

  return (
    <VehicleLandingPage
      title={`Auta ${priceRange.label} | Ojeté vozy`}
      description={priceRange.description}
      h1={`Ojeté vozy ${priceRange.label}`}
      filterDescription={`Prověřené ojeté vozy v cenové kategorii ${priceRange.label} od ověřených makléřů.`}
      aiSnippet={priceRange.aiSnippet}
      quickFacts={priceRange.quickFacts}
      seoText={
        <div>
          <h2>Ojetá auta {priceRange.label} na CarMakler</h2>
          <p>{priceRange.description}</p>
          <h3>Jak vybrat ojeté auto v tomto rozpočtu?</h3>
          <p>
            Při výběru ojetého auta {priceRange.label} je důležité zvážit stáří vozu, nájezd,
            značku a celkový technický stav. Naši makléři vám pomohou vybrat
            nejlepší vůz v tomto cenovém segmentu. Každý vůz prochází kontrolou historie
            přes CEBIA a fyzickou prohlídkou.
          </p>
          <h3>Bezpečný nákup s CarMakler</h3>
          <p>
            I v nižších cenových kategoriích garantujeme kvalitu a bezpečnost nákupu.
            Ověřený makléř prověří historii vozu, zkontroluje technický stav
            a zajistí kompletní administrativu. Nabízíme také financování a pojištění.
          </p>
        </div>
      }
      faqItems={priceRange.faqItems}
      breadcrumbs={[
        { name: "Domů", href: "/" },
        { name: "Nabídka", href: "/nabidka" },
        { name: `Auta ${priceRange.label}`, href: `/nabidka/${priceRange.slug}` },
      ]}
      jsonLdScripts={[breadcrumbJsonLd, faqJsonLd, webPageJsonLd]}
      relatedLinks={relatedLinks}
      filterHref={`/nabidka?maxPrice=${priceRange.maxPrice}`}
    />
  );
}
