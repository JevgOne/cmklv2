import Link from "next/link";
import { VehicleLandingPage } from "./VehicleLandingPage";
import {
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateWebPageJsonLd,
  generateBrandItemListJsonLd,
} from "@/lib/seo";
import type { BrandData } from "@/lib/seo-data";
import { BASE_URL, BRANDS, BODY_TYPES, PRICE_RANGES, TOP_MODELS } from "@/lib/seo-data";
import { getVehicleToPartsBridge } from "@/lib/seo-crosslinks";

interface BrandLandingContentProps {
  brand: BrandData;
}

export function BrandLandingContent({ brand }: BrandLandingContentProps) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Nabídka", url: `${BASE_URL}/nabidka` },
    { name: brand.displayName, url: `${BASE_URL}/nabidka/${brand.slug}` },
  ]);

  const faqJsonLd = generateFaqJsonLd(brand.faqItems);

  const webPageJsonLd = generateWebPageJsonLd({
    name: `Ojeté vozy ${brand.displayName}`,
    description: `Prověřené ojeté vozy ${brand.displayName} od ověřených makléřů. Bezpečný nákup s garancí.`,
    url: `${BASE_URL}/nabidka/${brand.slug}`,
    about: [
      { name: brand.displayName, type: "Brand" },
      { name: "Ojeté automobily", type: "Thing" },
    ],
    mentions: brand.topModels.map((m) => ({
      name: `${brand.displayName} ${m.name}`,
      type: "Product",
      url: `${BASE_URL}/nabidka/${brand.slug}/${m.slug}`,
    })),
    speakableCssSelectors: ["[data-speakable]"],
  });

  const brandItemListJsonLd = generateBrandItemListJsonLd({
    name: brand.displayName,
    url: `${BASE_URL}/nabidka/${brand.slug}`,
    models: brand.topModels.map((m) => ({
      name: m.name,
      url: `${BASE_URL}/nabidka/${brand.slug}/${m.slug}`,
    })),
  });

  const brandModels = TOP_MODELS.filter((m) => m.brandSlug === brand.slug);
  const otherBrands = BRANDS.filter((b) => b.slug !== brand.slug).slice(0, 8);

  const relatedLinks = [
    ...otherBrands.map((b) => ({
      label: `Ojeté ${b.displayName}`,
      href: `/nabidka/${b.slug}`,
    })),
    ...BODY_TYPES.slice(0, 4).map((bt) => ({
      label: bt.name,
      href: `/nabidka/${bt.slug}`,
    })),
    ...PRICE_RANGES.slice(0, 3).map((pr) => ({
      label: `Auta ${pr.label}`,
      href: `/nabidka/${pr.slug}`,
    })),
  ];

  const crossLinks = getVehicleToPartsBridge({
    brandSlug: brand.slug,
    brandName: brand.displayName,
  });

  return (
    <VehicleLandingPage
      title={`${brand.displayName} bazar | Ojeté vozy ${brand.displayName} — CarMakler`}
      description={`Prověřené ojeté vozy ${brand.displayName} od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další. Bezpečný nákup s garancí.`}
      h1={`Ojeté vozy ${brand.displayName}`}
      filterDescription={`Prověřené vozy ${brand.displayName} od ověřených makléřů. ${brand.topModels.map((m) => m.name).join(", ")} a další modely v nabídce.`}
      aiSnippet={brand.aiSnippet}
      quickFacts={brand.quickFacts}
      seoText={<BrandSeoText brand={brand} />}
      faqItems={brand.faqItems}
      breadcrumbs={[
        { name: "Domů", href: "/" },
        { name: "Nabídka", href: "/nabidka" },
        { name: brand.displayName, href: `/nabidka/${brand.slug}` },
      ]}
      jsonLdScripts={[breadcrumbJsonLd, faqJsonLd, webPageJsonLd, brandItemListJsonLd]}
      ctaText={`Prodat ${brand.displayName} s makléřem`}
      ctaHeading={`Chcete prodat ${brand.displayName}?`}
      relatedLinks={relatedLinks}
      crossLinks={crossLinks}
      filterHref={`/nabidka?brand=${encodeURIComponent(brand.name)}`}
    >
      {/* Top models grid */}
      {brandModels.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Nejoblíbenější modely {brand.displayName}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {brand.topModels.map((model) => (
              <Link
                key={model.slug}
                href={`/nabidka/${brand.slug}/${model.slug}`}
                className="group flex flex-col items-center p-5 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all no-underline"
              >
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                  <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors text-center">
                  {brand.displayName} {model.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </VehicleLandingPage>
  );
}

function BrandSeoText({ brand }: { brand: BrandData }) {
  return (
    <div>
      <h2>Proč koupit ojeté {brand.displayName} na CarMakler?</h2>
      <p>{brand.description}</p>

      <h3>Jak funguje nákup ojetého {brand.displayName} přes CarMakler?</h3>
      <p>
        Proces je jednoduchý a bezpečný. Vyberte si vůz {brand.displayName} z naší nabídky,
        kontaktujte ověřeného makléře a domluvte si prohlídku. Makléř za vás prověří
        historii vozu přes CEBIA, zkontroluje technický stav a ověří původ. Pokud je vše v pořádku,
        makléř zajistí kompletní administrativu — kupní smlouvu, přepis na registru vozidel
        a předání vozidla. Celý proces trvá obvykle 3-7 dní.
      </p>

      <h3>Nejpopulárnější modely {brand.displayName}</h3>
      <p>
        V nabídce CarMakler najdete všechny populární modely {brand.displayName}:{" "}
        {brand.topModels.map((m) => m.name).join(", ")} a mnoho dalších. Každý model
        má své specifické vlastnosti a naši makléři vám rádi poradí, který model
        nejlépe vyhovuje vašim potřebám a rozpočtu.
      </p>

      <h3>Garance kvality a bezpečnosti</h3>
      <p>
        Každý ojetý vůz {brand.displayName} na CarMakler prochází důkladnou kontrolou.
        Ověřujeme historii havárií, stav tachometru, zástavy a exekuce přes systém CEBIA.
        Ověřený makléř provede fyzickou prohlídku vozu a zkontroluje technický stav.
        Díky tomu kupujete s jistotou a bez rizika. Navíc vám makléř pomůže
        s financováním, pojištěním a kompletní administrativou.
      </p>
    </div>
  );
}
