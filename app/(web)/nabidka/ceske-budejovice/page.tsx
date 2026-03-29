import type { Metadata } from "next";
import { VehicleLandingPage } from "@/components/web/VehicleLandingPage";
import { generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/lib/seo";
import { CITIES, BASE_URL, BRANDS, BODY_TYPES, PRICE_RANGES } from "@/lib/seo-data";
import { notFound } from "next/navigation";

const city = CITIES.find((c) => c.slug === "ceske-budejovice");

export const metadata: Metadata = city ? {
  title: `Autobazar ${city.name} | Ojeté vozy ${city.inLocative} — CarMakler`,
  description: `Prověřené ojeté vozy ${city.inLocative} od certifikovaných makléřů. Osobní prohlídka, prověrka CEBIA, bezpečný nákup.`,
  openGraph: {
    title: `Ojeté vozy ${city.inLocative} | CarMakler`,
    description: `Prověřené ojeté vozy ${city.inLocative}. Bezpečný nákup od makléřů.`,
  },
} : {};

export default function Page() {
  if (!city) notFound();

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Nabídka", url: `${BASE_URL}/nabidka` },
    { name: city.name, url: `${BASE_URL}/nabidka/${city.slug}` },
  ]);
  const faqJsonLd = generateFaqJsonLd(city.faqItems);

  const relatedLinks = [
    ...CITIES.filter((c) => c.slug !== city.slug).map((c) => ({
      label: `Ojeté vozy ${c.inLocative}`,
      href: `/nabidka/${c.slug}`,
    })),
    ...BRANDS.slice(0, 6).map((b) => ({
      label: `Ojeté ${b.displayName}`,
      href: `/nabidka/${b.slug}`,
    })),
    ...BODY_TYPES.slice(0, 3).map((bt) => ({
      label: bt.name,
      href: `/nabidka/${bt.slug}`,
    })),
    ...PRICE_RANGES.slice(0, 3).map((p) => ({
      label: `Auta ${p.label}`,
      href: `/nabidka/${p.slug}`,
    })),
  ];

  return (
    <VehicleLandingPage
      title={`Autobazar ${city.name} | Ojeté vozy ${city.inLocative} — CarMakler`}
      description={city.description}
      h1={`Ojeté vozy ${city.inLocative}`}
      filterDescription={`Prověřené ojeté vozy od certifikovaných makléřů ${city.inLocative} a okolí.`}
      aiSnippet={city.aiSnippet}
      quickFacts={city.quickFacts}
      seoText={
        <div>
          <h2>Ojeté vozy {city.inLocative} na CarMakler</h2>
          <p>{city.description}</p>
          <h3>Proč kupovat přes CarMakler {city.inLocative}?</h3>
          <p>
            CarMakler nabízí síť certifikovaných makléřů přímo {city.inLocative}. Makléř vám osobně
            ukáže vybraný vůz, provede důkladnou prohlídku a prověří historii přes CEBIA. Celý
            proces nákupu probíhá lokálně — od výběru přes prohlídku až po přepis na registru vozidel.
            Nemusíte nikam cestovat, vše vyřídíme {city.inLocative}.
          </p>
          <h3>Makléři {city.inLocative}</h3>
          <p>
            Naši certifikovaní makléři {city.inLocative} znají lokální trh a pomohou vám najít
            ideální vůz. Zajistí kompletní servis — od vyhledání vozu přes prověrku, financování
            až po pojištění a přepis. Služby makléře jsou pro kupujícího zdarma.
          </p>
        </div>
      }
      faqItems={city.faqItems}
      breadcrumbs={[
        { name: "Domů", href: "/" },
        { name: "Nabídka", href: "/nabidka" },
        { name: city.name, href: `/nabidka/${city.slug}` },
      ]}
      jsonLdScripts={[breadcrumbJsonLd, faqJsonLd]}
      ctaHeading={`Chcete prodat auto ${city.inLocative}?`}
      relatedLinks={relatedLinks}
      filterHref={`/nabidka?city=${encodeURIComponent(city.name)}`}
    />
  );
}
