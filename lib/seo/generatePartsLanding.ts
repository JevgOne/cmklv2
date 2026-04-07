/**
 * Template-driven SEO content factory pro /dily/znacka/* landing pages.
 *
 * Generuje plně-strukturovaný `SeoContentDraft` (h1, meta, intro, sekce, FAQ,
 * AI snippet, quick facts) ze static brand/model data + DB pricing stats.
 *
 * Žádný LLM call → $0 cost, deterministický output. Claude API enhancement
 * (varied wording, generation-specific copy) je deferred do #87c-v2 po
 * měření jak template content performuje v Search Console.
 *
 * Použití:
 * 1. `scripts/generate-parts-seo-content.ts` — pre-seed BRAND + MODEL rows do
 *    SeoContent tabulky (idempotent gen, --force overwrite).
 * 2. `app/(web)/dily/znacka/.../page.tsx` — render-time fallback pokud
 *    SeoContent row v DB neexistuje (zejména MODEL_YEAR, který nepre-seedujeme).
 */

import {
  PARTS_BRANDS,
  PARTS_MODELS_BY_BRAND,
  type PartsModelData,
} from "@/lib/seo-data";
import type { FaqItem } from "@/lib/seo";
import type { PartsStats } from "./pricingAggregate";

export interface SeoContentDraft {
  pageType: "BRAND" | "MODEL" | "MODEL_YEAR";
  brand: string;
  model?: string;
  year?: number;
  h1: string;
  metaTitle: string;
  metaDesc: string;
  introHtml: string;
  sectionsJson: string; // JSON.stringify({h2, html}[])
  faqJson: string; // JSON.stringify(FaqItem[])
  aiSnippetText: string;
  quickFacts: string; // JSON.stringify(string[])
  wordCount: number;
  generatedBy: "template";
}

const UNIVERSAL_FAQS: FaqItem[] = [
  {
    question: "Jaká je záruka na použité díly?",
    answer:
      "Na použité originální díly poskytujeme záruku 3 měsíce. Repasované díly mají záruku 12 měsíců.",
  },
  {
    question: "Jak rychle doručíte díl?",
    answer:
      "Standardní doručení do 2-5 pracovních dnů po celé ČR. U rozměrnějších dílů zajistíme přepravní službu.",
  },
  {
    question: "Mohu díl vrátit, pokud nesedí?",
    answer:
      "Ano, máte 14 dnů na vrácení. Doporučujeme vždy ověřit kompatibilitu přes VIN před objednáním.",
  },
];

interface BrandLite {
  slug: string;
  name: string;
}

function fmtPrice(value: number): string {
  return value.toLocaleString("cs-CZ");
}

function countWords(text: string): number {
  return text
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Generate template-driven SEO content for parts landing page.
 * No LLM dependency — pure template + DB stats interpolation.
 */
export function generatePartsLandingContent(input: {
  pageType: "BRAND" | "MODEL" | "MODEL_YEAR";
  brandSlug: string;
  modelSlug?: string;
  year?: number;
  stats: PartsStats;
}): SeoContentDraft {
  const brandData = PARTS_BRANDS.find((b) => b.slug === input.brandSlug);
  if (!brandData) {
    throw new Error(`Brand "${input.brandSlug}" not found in PARTS_BRANDS`);
  }

  const modelData = input.modelSlug
    ? (PARTS_MODELS_BY_BRAND[input.brandSlug] || []).find(
        (m) => m.slug === input.modelSlug
      )
    : undefined;

  switch (input.pageType) {
    case "BRAND":
      return generateBrandContent(brandData, input.stats);
    case "MODEL":
      if (!modelData) {
        throw new Error(
          `Model "${input.modelSlug}" not found for brand "${input.brandSlug}"`
        );
      }
      return generateModelContent(brandData, modelData, input.stats);
    case "MODEL_YEAR":
      if (!modelData || input.year === undefined) {
        throw new Error("MODEL_YEAR mode requires modelSlug + year");
      }
      return generateModelYearContent(
        brandData,
        modelData,
        input.year,
        input.stats
      );
  }
}

// ─── BRAND MODE ──────────────────────────────────────────────────────────────

function generateBrandContent(
  brand: BrandLite,
  stats: PartsStats
): SeoContentDraft {
  const h1 = `Náhradní díly ${brand.name}`;

  const intro =
    stats.partCount > 0
      ? `Hledáte náhradní díly pro ${brand.name}? Na CarMakler najdete ${stats.partCount} dílů od ${stats.supplierCount} ověřených vrakovišť za ceny od ${fmtPrice(stats.minPrice)} Kč. Originální použité díly z dárcovských vozů i nové aftermarket alternativy. Všechny díly jsou katalogizovány podle VIN kódu pro maximální kompatibilitu s vaším vozem ${brand.name}.`
      : `Hledáte náhradní díly pro ${brand.name}? Na CarMakler nabízíme originální použité díly z ověřených vrakovišť i nové aftermarket alternativy. Všechny díly jsou katalogizovány podle VIN kódu pro maximální kompatibilitu s vaším vozem ${brand.name}.`;

  const sections = [
    {
      h2: `Proč nakupovat díly ${brand.name} na CarMakler?`,
      html: `<p>Všichni naši dodavatelé dílů procházejí verifikací — pracujeme jen s ověřenými vrakovišti a profesionálními rozprodejci. Díly jsou detailně popsány a vyfoceny, abyste věděli, co kupujete. Na použité originální díly poskytujeme záruku funkčnosti 3 měsíce, na repasované 12 měsíců. Objednávky doručujeme po celé ČR do 2-5 pracovních dní.</p>`,
    },
    {
      h2: `Cenové rozpětí dílů ${brand.name}`,
      html:
        stats.partCount > 0
          ? `<p>Aktuální cenové rozpětí dílů ${brand.name} na CarMakler: od <strong>${fmtPrice(stats.minPrice)} Kč</strong> do <strong>${fmtPrice(stats.maxPrice)} Kč</strong>. Průměrná cena dílu: <strong>${fmtPrice(stats.avgPrice)} Kč</strong>. Konkrétní cena závisí na typu dílu, generaci modelu a stavu — používané díly z vrakovišť bývají o 50-80 % levnější než nové originály.</p>`
          : `<p>Cenové rozpětí dílů ${brand.name} se průběžně aktualizuje podle dostupnosti na vrakovištích. Zadejte poptávku přes VIN a dodavatelé vám zašlou aktuální nabídky.</p>`,
    },
  ];

  const faq: FaqItem[] = [
    ...UNIVERSAL_FAQS,
    {
      question: `Jsou náhradní díly ${brand.name} kompatibilní s mým vozem?`,
      answer: `Ano, všechny díly jsou katalogizovány podle VIN kódu, generace modelu a roku výroby. Před objednáním vždy ověřte kompatibilitu zadáním VIN nebo specifikací vozu. V případě nejistoty kontaktujte našeho operátora.`,
    },
    {
      question: `Jaké modely ${brand.name} podporujete?`,
      answer: `Na CarMakler najdete díly pro všechny aktuální i starší modely ${brand.name}. Nabídka se denně aktualizuje podle dostupnosti na vrakovištích. Pokud daný díl nevidíte v katalogu, můžete zadat poptávku a dodavatelé vám pošlou nabídky.`,
    },
  ];

  const aiSnippet =
    stats.partCount > 0
      ? `Náhradní díly ${brand.name} na CarMakler — ${stats.partCount} dílů od ${stats.supplierCount} vrakovišť, ceny od ${fmtPrice(stats.minPrice)} Kč. Použité originální i nové aftermarket. Doručení do 5 dnů, záruka 3 měsíce.`
      : `Náhradní díly ${brand.name} na CarMakler — použité originální i nové aftermarket díly od ověřených vrakovišť. Doručení do 5 dnů, záruka 3 měsíce.`;

  const quickFacts =
    stats.partCount > 0
      ? [
          `${stats.partCount} dílů ${brand.name} na skladě`,
          `${stats.supplierCount} ověřených dodavatelů`,
          `Cenové rozpětí: ${fmtPrice(stats.minPrice)} – ${fmtPrice(stats.maxPrice)} Kč`,
          `Průměrná cena: ${fmtPrice(stats.avgPrice)} Kč`,
          `Záruka 3 měsíce na použité, 12 měsíců na repasované`,
          `Doručení do 2-5 pracovních dnů`,
        ]
      : [
          `Náhradní díly ${brand.name} z ověřených vrakovišť`,
          `Záruka 3 měsíce na použité, 12 měsíců na repasované`,
          `Doručení do 2-5 pracovních dnů po celé ČR`,
          `14 dnů na vrácení bez udání důvodu`,
        ];

  const introHtml = `<p>${intro}</p>`;
  const wordCount = countWords(
    introHtml + sections.map((s) => s.html).join(" ") + faq.map((f) => f.answer).join(" ")
  );

  return {
    pageType: "BRAND",
    brand: brand.slug,
    h1,
    metaTitle: `Náhradní díly ${brand.name} | Carmakler`,
    metaDesc: truncateMeta(intro),
    introHtml,
    sectionsJson: JSON.stringify(sections),
    faqJson: JSON.stringify(faq),
    aiSnippetText: aiSnippet,
    quickFacts: JSON.stringify(quickFacts),
    wordCount,
    generatedBy: "template",
  };
}

// ─── MODEL MODE ──────────────────────────────────────────────────────────────

function generateModelContent(
  brand: BrandLite,
  model: PartsModelData,
  stats: PartsStats
): SeoContentDraft {
  const h1 = `Náhradní díly ${brand.name} ${model.name}`;
  const generationsText = model.generations
    .map((g) => `${g.name} (${g.yearFrom}–${g.yearTo})`)
    .join(", ");

  const intro =
    stats.partCount > 0
      ? `Hledáte náhradní díly pro ${brand.name} ${model.name}? Na CarMakler najdete ${stats.partCount} dílů od ${stats.supplierCount} ověřených vrakovišť. Ceny od ${fmtPrice(stats.minPrice)} Kč. Pokrýváme všechny generace modelu — ${generationsText}. Originální použité díly z dárcovských vozů i nové aftermarket alternativy, vše katalogizováno podle VIN.`
      : `Hledáte náhradní díly pro ${brand.name} ${model.name}? Na CarMakler nabízíme originální použité díly i aftermarket alternativy pro všechny generace modelu — ${generationsText}. Všechny díly jsou katalogizovány podle VIN pro maximální kompatibilitu.`;

  const sections = [
    {
      h2: `Generace ${brand.name} ${model.name}`,
      html: `<p>Model ${brand.name} ${model.name} prošel během let několika generacemi. Při výběru dílů je klíčové znát přesnou generaci vozidla — díly mezi generacemi jsou jen výjimečně zaměnitelné. Aktuálně podporované generace na CarMakler:</p><ul>${model.generations.map((g) => `<li><strong>${g.name}</strong> — ročníky ${g.yearFrom}–${g.yearTo}</li>`).join("")}</ul>`,
    },
    {
      h2: `Nejčastější díly ${brand.name} ${model.name}`,
      html: `<p>Nejvíce poptávané kategorie pro ${model.name} jsou motorové díly (alternátory, turba, vstřikovače), brzdové komponenty (kotouče, destičky, třmeny), podvozek (tlumiče, ramena, spojovací tyče) a karoserie (světla, nárazníky, kapoty). Na CarMakler najdete použité originály i aftermarket varianty pro každou kategorii.</p>`,
    },
    {
      h2: `Cenové rozpětí dílů ${brand.name} ${model.name}`,
      html:
        stats.partCount > 0
          ? `<p>Aktuální cenové rozpětí dílů ${brand.name} ${model.name} na CarMakler: od <strong>${fmtPrice(stats.minPrice)} Kč</strong> do <strong>${fmtPrice(stats.maxPrice)} Kč</strong>. Průměrná cena: <strong>${fmtPrice(stats.avgPrice)} Kč</strong>. Použité díly z vrakovišť bývají o 50-80 % levnější než nové originály z autorizovaných servisů.</p>`
          : `<p>Cenové rozpětí dílů ${brand.name} ${model.name} se průběžně aktualizuje podle dostupnosti na vrakovištích. Zadejte poptávku přes VIN a dodavatelé vám zašlou aktuální nabídky.</p>`,
    },
  ];

  const faq: FaqItem[] = [
    ...UNIVERSAL_FAQS,
    {
      question: `Jak poznám, do které generace patří moje ${brand.name} ${model.name}?`,
      answer: `Generaci poznáte podle roku výroby (v technickém průkazu) nebo podle VIN kódu. Při zadávání poptávky stačí uvést rok výroby — náš katalog automaticky filtruje díly podle správné generace. V případě hraničních ročníků doporučujeme ověřit přes VIN.`,
    },
    {
      question: `Jsou díly ${brand.name} ${model.name} kompatibilní napříč generacemi?`,
      answer: `Jen výjimečně. Většina dílů (motor, převodovka, podvozek, karoserie) je specifická pro každou generaci. Před objednáním vždy ověřte kompatibilitu — náš katalog tuto kontrolu dělá automaticky podle zadaného roku/VIN.`,
    },
    {
      question: `Nabízíte i nové aftermarket díly pro ${model.name}?`,
      answer: `Ano. Pro nejčastější díly (filtry, brzdy, tlumiče, oleje) máme aftermarket alternativy od renomovaných výrobců (Bosch, Bilstein, Sachs, Mann, Mahle). Aftermarket díly jsou cenově výhodnější a kvalitativně srovnatelné s originály.`,
    },
  ];

  const aiSnippet =
    stats.partCount > 0
      ? `Náhradní díly ${brand.name} ${model.name} na CarMakler — ${stats.partCount} dílů od ${stats.supplierCount} vrakovišť, ceny od ${fmtPrice(stats.minPrice)} Kč. Pokrýváme všechny generace (${model.generations.length}). Doručení do 5 dnů, záruka 3 měsíce.`
      : `Náhradní díly ${brand.name} ${model.name} na CarMakler — použité originály i aftermarket pro ${model.generations.length} generací. Doručení do 5 dnů, záruka 3 měsíce.`;

  const generationCount = model.generations.length;
  const yearRange = `${model.generations[0]?.yearFrom ?? "–"}–${model.generations[generationCount - 1]?.yearTo ?? "–"}`;

  const quickFacts =
    stats.partCount > 0
      ? [
          `${stats.partCount} dílů ${brand.name} ${model.name} na skladě`,
          `${stats.supplierCount} ověřených dodavatelů`,
          `${generationCount} podporovaných generací (${yearRange})`,
          `Cenové rozpětí: ${fmtPrice(stats.minPrice)} – ${fmtPrice(stats.maxPrice)} Kč`,
          `Průměrná cena: ${fmtPrice(stats.avgPrice)} Kč`,
          `Záruka 3 měsíce na použité díly`,
        ]
      : [
          `Náhradní díly ${brand.name} ${model.name} z ověřených vrakovišť`,
          `${generationCount} podporovaných generací (${yearRange})`,
          `Záruka 3 měsíce na použité, 12 měsíců na repasované`,
          `Doručení do 2-5 pracovních dnů`,
        ];

  const introHtml = `<p>${intro}</p>`;
  const wordCount = countWords(
    introHtml + sections.map((s) => s.html).join(" ") + faq.map((f) => f.answer).join(" ")
  );

  return {
    pageType: "MODEL",
    brand: brand.slug,
    model: model.slug,
    h1,
    metaTitle: `Náhradní díly ${brand.name} ${model.name} | Carmakler`,
    metaDesc: truncateMeta(intro),
    introHtml,
    sectionsJson: JSON.stringify(sections),
    faqJson: JSON.stringify(faq),
    aiSnippetText: aiSnippet,
    quickFacts: JSON.stringify(quickFacts),
    wordCount,
    generatedBy: "template",
  };
}

// ─── MODEL_YEAR MODE ─────────────────────────────────────────────────────────

function generateModelYearContent(
  brand: BrandLite,
  model: PartsModelData,
  year: number,
  stats: PartsStats
): SeoContentDraft {
  const h1 = `Náhradní díly ${brand.name} ${model.name} ${year}`;
  const matchingGen = model.generations.find(
    (g) => year >= g.yearFrom && year <= g.yearTo
  );
  const genLabel = matchingGen
    ? `${matchingGen.name} (${matchingGen.yearFrom}–${matchingGen.yearTo})`
    : "této generace";

  const intro =
    stats.partCount > 0
      ? `Hledáte konkrétní díly pro ${brand.name} ${model.name} ročník ${year}? Na CarMakler najdete ${stats.partCount} dílů od ${stats.supplierCount} dodavatelů kompatibilních s generací ${genLabel}. Ceny od ${fmtPrice(stats.minPrice)} Kč. Originální použité díly z dárcovských vozů stejného ročníku i kompatibilní aftermarket alternativy.`
      : `Hledáte konkrétní díly pro ${brand.name} ${model.name} ročník ${year}? Na CarMakler nabízíme originální použité díly z vrakovišť i nové aftermarket alternativy kompatibilní s generací ${genLabel}. Všechny díly jsou katalogizovány podle VIN pro maximální přesnost.`;

  const sections = [
    {
      h2: `${brand.name} ${model.name} ${year} — generace ${matchingGen?.name ?? ""}`,
      html: matchingGen
        ? `<p>Vůz ${brand.name} ${model.name} ročníku ${year} patří do generace <strong>${matchingGen.name}</strong>, která byla vyráběna v letech <strong>${matchingGen.yearFrom}–${matchingGen.yearTo}</strong>. Při výběru dílů je klíčové znát přesnou generaci — díly mezi generacemi jsou jen výjimečně zaměnitelné. Pro maximální kompatibilitu doporučujeme zadat VIN kód při objednávce.</p>`
        : `<p>Vůz ${brand.name} ${model.name} ročník ${year}. Pro maximální kompatibilitu doporučujeme zadat VIN kód při objednávce — náš katalog automaticky filtruje díly podle správné generace.</p>`,
    },
    {
      h2: `Cenové rozpětí dílů ${brand.name} ${model.name} ${year}`,
      html:
        stats.partCount > 0
          ? `<p>Aktuální cenové rozpětí na CarMakler: od <strong>${fmtPrice(stats.minPrice)} Kč</strong> do <strong>${fmtPrice(stats.maxPrice)} Kč</strong>. Průměrná cena: <strong>${fmtPrice(stats.avgPrice)} Kč</strong>. Použité originální díly z vrakovišť stejného ročníku jsou nejlepší volba pro dlouhou životnost a jistou kompatibilitu.</p>`
          : `<p>Cenové rozpětí dílů ${brand.name} ${model.name} ${year} se průběžně aktualizuje podle dostupnosti na vrakovištích. Zadejte poptávku s VIN a dodavatelé vám zašlou aktuální nabídky.</p>`,
    },
  ];

  const faq: FaqItem[] = [
    ...UNIVERSAL_FAQS,
    {
      question: `Jsou díly z ${year} kompatibilní i s jinými ročníky?`,
      answer: `Většinou ano v rámci stejné generace${matchingGen ? ` (${matchingGen.yearFrom}–${matchingGen.yearTo})` : ""}. Mezi generacemi jen výjimečně. Náš katalog automaticky filtruje kompatibilní díly podle zadaného roku — pokud máte pochybnosti, ověřte přes VIN.`,
    },
  ];

  const aiSnippet =
    stats.partCount > 0
      ? `Náhradní díly ${brand.name} ${model.name} ${year} na CarMakler — ${stats.partCount} dílů od ${stats.supplierCount} vrakovišť, ceny od ${fmtPrice(stats.minPrice)} Kč. Generace ${matchingGen?.name ?? ""}. Doručení do 5 dnů.`
      : `Náhradní díly ${brand.name} ${model.name} ${year} na CarMakler — použité originály i aftermarket pro generaci ${matchingGen?.name ?? "tohoto ročníku"}. Doručení do 5 dnů.`;

  const quickFacts =
    stats.partCount > 0
      ? [
          `${stats.partCount} dílů ${brand.name} ${model.name} ${year} na skladě`,
          `${stats.supplierCount} ověřených dodavatelů`,
          matchingGen
            ? `Generace: ${matchingGen.name} (${matchingGen.yearFrom}–${matchingGen.yearTo})`
            : `Ročník ${year}`,
          `Cenové rozpětí: ${fmtPrice(stats.minPrice)} – ${fmtPrice(stats.maxPrice)} Kč`,
          `Záruka 3 měsíce na použité díly`,
        ]
      : [
          `Náhradní díly ${brand.name} ${model.name} ${year} z vrakovišť`,
          matchingGen
            ? `Generace: ${matchingGen.name} (${matchingGen.yearFrom}–${matchingGen.yearTo})`
            : `Ročník ${year}`,
          `Záruka 3 měsíce na použité díly`,
          `Doručení do 2-5 pracovních dnů`,
        ];

  const introHtml = `<p>${intro}</p>`;
  const wordCount = countWords(
    introHtml + sections.map((s) => s.html).join(" ") + faq.map((f) => f.answer).join(" ")
  );

  return {
    pageType: "MODEL_YEAR",
    brand: brand.slug,
    model: model.slug,
    year,
    h1,
    metaTitle: `Náhradní díly ${brand.name} ${model.name} ${year} | Carmakler`,
    metaDesc: truncateMeta(intro),
    introHtml,
    sectionsJson: JSON.stringify(sections),
    faqJson: JSON.stringify(faq),
    aiSnippetText: aiSnippet,
    quickFacts: JSON.stringify(quickFacts),
    wordCount,
    generatedBy: "template",
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Truncates text na ~155 znaků pro <meta description>. Useful, protože raw
 * intro se dělá pro hero (delší text), meta description má jiný target.
 */
function truncateMeta(text: string): string {
  if (text.length <= 160) return text;
  const sliced = text.slice(0, 157);
  const lastSpace = sliced.lastIndexOf(" ");
  return sliced.slice(0, lastSpace > 100 ? lastSpace : 157) + "…";
}
