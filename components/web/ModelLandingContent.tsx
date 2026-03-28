import { VehicleLandingPage } from "./VehicleLandingPage";
import {
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateWebPageJsonLd,
  generateAggregateOfferJsonLd,
} from "@/lib/seo";
import type { ModelData } from "@/lib/seo-data";
import { BASE_URL, BRANDS, TOP_MODELS } from "@/lib/seo-data";

interface ModelLandingContentProps {
  model: ModelData;
}

export function ModelLandingContent({ model }: ModelLandingContentProps) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Nabídka", url: `${BASE_URL}/nabidka` },
    { name: model.brandName, url: `${BASE_URL}/nabidka/${model.brandSlug}` },
    { name: model.name, url: `${BASE_URL}/nabidka/${model.brandSlug}/${model.slug}` },
  ]);

  const faqJsonLd = generateFaqJsonLd(model.faqItems);

  const webPageJsonLd = generateWebPageJsonLd({
    name: `Ojeté ${model.fullName}`,
    description: `Prověřené ojeté ${model.fullName} od certifikovaných makléřů. Bezpečný nákup s garancí.`,
    url: `${BASE_URL}/nabidka/${model.brandSlug}/${model.slug}`,
    about: [
      { name: model.brandName, type: "Brand" },
      { name: model.fullName, type: "Product" },
    ],
    mentions: model.competitors.map((c) => ({
      name: c,
      type: "Product",
    })),
    speakableCssSelectors: ["[data-speakable]"],
  });

  const aggregateOfferJsonLd = generateAggregateOfferJsonLd({
    name: `Ojeté ${model.fullName}`,
    brand: model.brandName,
    model: model.name,
    lowPrice: model.priceRange.low,
    highPrice: model.priceRange.high,
    offerCount: 15,
    url: `${BASE_URL}/nabidka/${model.brandSlug}/${model.slug}`,
  });

  const brand = BRANDS.find((b) => b.slug === model.brandSlug);
  const siblingModels = TOP_MODELS.filter(
    (m) => m.brandSlug === model.brandSlug && m.slug !== model.slug
  );

  const relatedLinks = [
    ...(brand ? [{ label: `Všechny ${brand.displayName}`, href: `/nabidka/${brand.slug}` }] : []),
    ...siblingModels.map((m) => ({
      label: `${m.brandName} ${m.name}`,
      href: `/nabidka/${m.brandSlug}/${m.slug}`,
    })),
    ...model.competitors.map((c) => ({
      label: `Ojeté ${c}`,
      href: "/nabidka",
    })),
  ];

  return (
    <VehicleLandingPage
      title={`${model.fullName} bazar | Ojeté ${model.name} — CarMakler`}
      description={`Prověřené ojeté ${model.fullName} od certifikovaných makléřů. Varianty ${model.variants.join(", ")}. Bezpečný nákup s garancí.`}
      h1={`${model.fullName} — ojeté vozy v nabídce`}
      filterDescription={`Prověřené ojeté vozy ${model.fullName} v různých variantách a cenových kategoriích.`}
      aiSnippet={model.aiSnippet}
      quickFacts={model.quickFacts}
      seoText={<ModelSeoText model={model} />}
      faqItems={model.faqItems}
      breadcrumbs={[
        { name: "Domů", href: "/" },
        { name: "Nabídka", href: "/nabidka" },
        { name: model.brandName, href: `/nabidka/${model.brandSlug}` },
        { name: model.name, href: `/nabidka/${model.brandSlug}/${model.slug}` },
      ]}
      jsonLdScripts={[breadcrumbJsonLd, faqJsonLd, webPageJsonLd, aggregateOfferJsonLd]}
      ctaText={`Prodat ${model.fullName}`}
      ctaHeading={`Chcete prodat ${model.fullName}?`}
      relatedLinks={relatedLinks}
      filterHref={`/nabidka?brand=${encodeURIComponent(model.brandName)}&model=${encodeURIComponent(model.name)}`}
    >
      {/* Variants grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Varianty {model.fullName}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {model.variants.map((variant) => (
            <div
              key={variant}
              className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
            >
              {variant}
            </div>
          ))}
        </div>
      </div>
    </VehicleLandingPage>
  );
}

function ModelSeoText({ model }: { model: ModelData }) {
  return (
    <div>
      <h2>Proč koupit ojeté {model.fullName} na CarMakler?</h2>
      <p>{model.description}</p>

      <h3>Dostupné varianty {model.fullName}</h3>
      <p>
        Na CarMakler nabízíme {model.fullName} ve variantách:{" "}
        {model.variants.join(", ")}. Každá varianta má své specifické vlastnosti —
        od základních verzí pro ekonomicky orientované kupce po sportovní
        a luxusní varianty pro náročné zákazníky. Naši makléři vám poradí,
        která varianta nejlépe odpovídá vašim potřebám.
      </p>

      <h3>Srovnání s konkurencí</h3>
      <p>
        {model.fullName} konkuruje modelům {model.competitors.join(", ")}.
        Oproti konkurenci nabízí {model.fullName} specifické výhody —
        naši makléři vám pomohou porovnat jednotlivé modely a vybrat ten pravý.
        Každý vůz na CarMakler prochází důkladnou kontrolou historie a technického stavu,
        takže kupujete s jistotou bez ohledu na zvolenou značku.
      </p>

      <h3>Bezpečný nákup přes CarMakler</h3>
      <p>
        Koupě ojetého {model.fullName} přes CarMakler je bezpečná a transparentní.
        Certifikovaný makléř prověří historii vozu přes CEBIA, zkontroluje technický stav,
        ověří stav tachometru a zajistí kompletní administrativu. Nabízíme také
        financování, pojištění a rozšířenou záruku pro maximální klid při nákupu.
      </p>
    </div>
  );
}
