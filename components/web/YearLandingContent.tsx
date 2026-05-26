import { VehicleLandingPage } from "./VehicleLandingPage";
import {
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateWebPageJsonLd,
} from "@/lib/seo";
import type { YearData } from "@/lib/seo-data";
import {
  BASE_URL,
  YEAR_RANGES,
  BRANDS,
  PRICE_RANGES,
  BODY_TYPES,
} from "@/lib/seo-data";

interface YearLandingContentProps {
  yearData: YearData;
}

export function YearLandingContent({ yearData }: YearLandingContentProps) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Nabídka", url: `${BASE_URL}/nabidka` },
    {
      name: `Ročník ${yearData.year}`,
      url: `${BASE_URL}/nabidka/rok/${yearData.slug}`,
    },
  ]);

  const faqJsonLd = generateFaqJsonLd(yearData.faqItems);

  const webPageJsonLd = generateWebPageJsonLd({
    name: `Ojetá auta ročník ${yearData.year}`,
    description: yearData.description,
    url: `${BASE_URL}/nabidka/rok/${yearData.slug}`,
    about: [
      { name: `Ojetá auta ${yearData.year}`, type: "Thing" },
      { name: "Ojeté automobily", type: "Thing" },
    ],
  });

  const relatedLinks = [
    ...YEAR_RANGES.filter((y) => y.year !== yearData.year)
      .slice(0, 5)
      .map((y) => ({
        label: `Ojetá auta ${y.year}`,
        href: `/nabidka/rok/${y.slug}`,
      })),
    ...BRANDS.slice(0, 6).map((b) => ({
      label: `Ojeté ${b.displayName}`,
      href: `/nabidka/${b.slug}`,
    })),
    ...PRICE_RANGES.slice(0, 3).map((pr) => ({
      label: `Auta ${pr.label}`,
      href: `/nabidka/${pr.slug}`,
    })),
    ...BODY_TYPES.slice(0, 3).map((bt) => ({
      label: bt.name,
      href: `/nabidka/${bt.slug}`,
    })),
  ];

  return (
    <VehicleLandingPage
      title={`Ojetá auta ${yearData.year} | Ročník ${yearData.year} bazar`}
      description={`Prověřené ojeté vozy ročník ${yearData.year}. Široký výběr značek a modelů od ověřených makléřů na CarMakler.`}
      h1={`Ojetá auta ročník ${yearData.year}`}
      filterDescription={`Prověřené ojeté vozy z roku ${yearData.year} od ověřených makléřů.`}
      aiSnippet={yearData.aiSnippet}
      quickFacts={yearData.quickFacts}
      seoText={<YearSeoText yearData={yearData} />}
      faqItems={yearData.faqItems}
      breadcrumbs={[
        { name: "Domů", href: "/" },
        { name: "Nabídka", href: "/nabidka" },
        {
          name: `Ročník ${yearData.year}`,
          href: `/nabidka/rok/${yearData.slug}`,
        },
      ]}
      jsonLdScripts={[breadcrumbJsonLd, faqJsonLd, webPageJsonLd]}
      ctaHeading={`Chcete prodat auto z roku ${yearData.year}?`}
      relatedLinks={relatedLinks}
      filterHref={`/nabidka?yearFrom=${yearData.year}&yearTo=${yearData.year}`}
    />
  );
}

function YearSeoText({ yearData }: { yearData: YearData }) {
  return (
    <div>
      <h2>Ojetá auta ročník {yearData.year}</h2>
      <p>{yearData.description}</p>

      <h3>Proč koupit ojeté auto z roku {yearData.year}?</h3>
      <p>
        Ojetá auta z roku {yearData.year} nabízí ověřenou spolehlivost a výraznou úsporu
        oproti novým vozům. Na CarMakler najdete prověřené vozy od ověřených makléřů, kteří
        za vás prověří historii přes CEBIA, zkontrolují technický stav a zajistí bezpečný nákup.
      </p>

      <h3>Jak vybrat ojeté auto z roku {yearData.year}?</h3>
      <p>
        Při výběru ojetého auta z roku {yearData.year} je důležité prověřit kompletní servisní
        historii, zkontrolovat stav podvozku a opotřebení klíčových komponent. Naši makléři toto
        vše zajistí za vás — kontaktujte nás a poradíme s výběrem ideálního vozu.
      </p>
    </div>
  );
}
