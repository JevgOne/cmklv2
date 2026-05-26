import { VehicleLandingPage } from "./VehicleLandingPage";
import {
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateWebPageJsonLd,
} from "@/lib/seo";
import type { BrandData, CityData } from "@/lib/seo-data";
import { BASE_URL, BRANDS, CITIES } from "@/lib/seo-data";
import { generateBrandCityFaqItems } from "@/lib/seo-data";
import { getVehicleToPartsBridge } from "@/lib/seo-crosslinks";

interface BrandCityLandingContentProps {
  brand: BrandData;
  city: CityData;
}

export function BrandCityLandingContent({ brand, city }: BrandCityLandingContentProps) {
  const faqItems = generateBrandCityFaqItems(brand, city);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Nabídka", url: `${BASE_URL}/nabidka` },
    { name: brand.displayName, url: `${BASE_URL}/nabidka/${brand.slug}` },
    { name: city.name, url: `${BASE_URL}/nabidka/${brand.slug}/${city.slug}` },
  ]);

  const faqJsonLd = generateFaqJsonLd(faqItems);

  const webPageJsonLd = generateWebPageJsonLd({
    name: `Ojeté ${brand.displayName} ${city.inLocative}`,
    description: `Prověřené ojeté vozy ${brand.displayName} ${city.inLocative} od ověřených makléřů.`,
    url: `${BASE_URL}/nabidka/${brand.slug}/${city.slug}`,
    about: [
      { name: brand.displayName, type: "Brand" },
      { name: city.name, type: "City" },
    ],
    mentions: brand.topModels.map((m) => ({
      name: `${brand.displayName} ${m.name}`,
      type: "Product",
      url: `${BASE_URL}/nabidka/${brand.slug}/${m.slug}`,
    })),
  });

  const relatedLinks = [
    ...CITIES.filter((c) => c.slug !== city.slug).map((c) => ({
      label: `${brand.displayName} ${c.inLocative}`,
      href: `/nabidka/${brand.slug}/${c.slug}`,
    })),
    ...brand.topModels.map((m) => ({
      label: `${brand.displayName} ${m.name}`,
      href: `/nabidka/${brand.slug}/${m.slug}`,
    })),
    ...BRANDS.filter((b) => b.slug !== brand.slug)
      .slice(0, 4)
      .map((b) => ({
        label: `${b.displayName} ${city.inLocative}`,
        href: `/nabidka/${b.slug}/${city.slug}`,
      })),
  ];

  const crossLinks = [
    ...getVehicleToPartsBridge({ brandSlug: brand.slug, brandName: brand.displayName }),
    { label: `Autoservisy ${city.inLocative}`, href: `/autoservisy/mesto/${city.slug}` },
    { label: `STK ${city.inLocative}`, href: `/stk/mesto/${city.slug}` },
  ];

  return (
    <VehicleLandingPage
      title={`${brand.displayName} bazar ${city.name} | Ojeté ${brand.displayName} ${city.inLocative}`}
      description={`Prověřené ojeté vozy ${brand.displayName} ${city.inLocative} od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další modely.`}
      h1={`Ojeté ${brand.displayName} ${city.inLocative}`}
      filterDescription={`Prověřené ojeté ${brand.displayName} od makléřů ${city.inLocative} a okolí.`}
      aiSnippet={`${brand.aiSnippet} ${city.inLocative.charAt(0).toUpperCase() + city.inLocative.slice(1)} najdete tyto vozy u ověřených makléřů na CarMakler.`}
      quickFacts={brand.quickFacts}
      seoText={<BrandCitySeoText brand={brand} city={city} />}
      faqItems={faqItems}
      breadcrumbs={[
        { name: "Domů", href: "/" },
        { name: "Nabídka", href: "/nabidka" },
        { name: brand.displayName, href: `/nabidka/${brand.slug}` },
        { name: city.name, href: `/nabidka/${brand.slug}/${city.slug}` },
      ]}
      jsonLdScripts={[breadcrumbJsonLd, faqJsonLd, webPageJsonLd]}
      ctaHeading={`Chcete prodat ${brand.displayName} ${city.inLocative}?`}
      ctaText={`Prodat ${brand.displayName} s makléřem`}
      relatedLinks={relatedLinks}
      crossLinks={crossLinks}
      filterHref={`/nabidka?brand=${encodeURIComponent(brand.name)}&city=${encodeURIComponent(city.name)}`}
    />
  );
}

function BrandCitySeoText({ brand, city }: { brand: BrandData; city: CityData }) {
  return (
    <div>
      <h2>
        Ojeté {brand.displayName} {city.inLocative} na CarMakler
      </h2>
      <p>
        Hledáte ojetou {brand.displayName} {city.inLocative}? Na CarMakler najdete prověřené
        vozy od ověřených makléřů přímo {city.inLocative} a okolí. Naši makléři znají lokální
        trh a pomohou vám vybrat ideální {brand.displayName} podle vašich požadavků a rozpočtu.
      </p>

      <h3>
        Nejpopulárnější modely {brand.displayName} {city.inLocative}
      </h3>
      <p>
        V nabídce makléřů {city.inLocative} najdete všechny populární modely{" "}
        {brand.displayName}: {brand.topModels.map((m) => m.name).join(", ")} a mnoho
        dalších. Každý vůz prochází prověrkou CEBIA a fyzickou prohlídkou makléřem.
      </p>

      <h3>Bezpečný nákup {city.inLocative}</h3>
      <p>
        Celý proces probíhá lokálně {city.inLocative} — od výběru vozu přes prohlídku
        až po přepis na registru vozidel. Nemusíte nikam cestovat, vše vyřídíme na místě.
        Makléř za vás zajistí kompletní administrativu, financování i pojištění.
      </p>
    </div>
  );
}
