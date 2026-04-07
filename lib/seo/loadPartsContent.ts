/**
 * Load SEO content pro /dily/znacka/* stránky.
 *
 * Strategie: DB row → render-time template fallback. DB má přednost (gen
 * script pre-seedoval BRAND + MODEL přes scripts/generate-parts-seo-content.ts),
 * ale když row chybí (zejména MODEL_YEAR), spadne to na deterministický
 * template z generatePartsLanding.ts.
 *
 * Wrapped v `cache()` aby `generateMetadata` + page component sdíleli result
 * v rámci jednoho render cyklu (nebudou se dělat 2× DB query + 2× template gen).
 */

import { cache } from "react";
import { findSeoContent } from "./seoContentRepo";
import {
  generatePartsLandingContent,
  type SeoContentDraft,
} from "./generatePartsLanding";
import {
  getPartsStatsForBrand,
  getPartsStatsForModel,
  getPartsStatsForModelYear,
} from "./pricingAggregate";

export interface PartsLandingContent {
  h1: string;
  metaTitle: string;
  metaDesc: string;
  introHtml: string;
  sections: Array<{ h2: string; html: string }>;
  faq: Array<{ question: string; answer: string }>;
  aiSnippetText: string;
  quickFacts: string[];
  wordCount: number;
}

function draftToContent(draft: SeoContentDraft): PartsLandingContent {
  return {
    h1: draft.h1,
    metaTitle: draft.metaTitle,
    metaDesc: draft.metaDesc,
    introHtml: draft.introHtml,
    sections: JSON.parse(draft.sectionsJson),
    faq: JSON.parse(draft.faqJson),
    aiSnippetText: draft.aiSnippetText,
    quickFacts: JSON.parse(draft.quickFacts),
    wordCount: draft.wordCount,
  };
}

function dbRowToContent(row: {
  h1: string;
  metaTitle: string;
  metaDesc: string;
  introHtml: string;
  sectionsJson: string;
  faqJson: string;
  aiSnippetText: string;
  quickFacts: string;
  wordCount: number;
}): PartsLandingContent {
  return {
    h1: row.h1,
    metaTitle: row.metaTitle,
    metaDesc: row.metaDesc,
    introHtml: row.introHtml,
    sections: JSON.parse(row.sectionsJson),
    faq: JSON.parse(row.faqJson),
    aiSnippetText: row.aiSnippetText,
    quickFacts: JSON.parse(row.quickFacts),
    wordCount: row.wordCount,
  };
}

export const loadPartsBrandContent = cache(
  async (brandSlug: string, brandName: string): Promise<PartsLandingContent> => {
    const row = await findSeoContent({
      pageType: "BRAND",
      brand: brandSlug,
      model: null,
      year: null,
      category: null,
    });
    if (row) return dbRowToContent(row);

    const stats = await getPartsStatsForBrand(brandName);
    const draft = generatePartsLandingContent({
      pageType: "BRAND",
      brandSlug,
      stats,
    });
    return draftToContent(draft);
  }
);

export const loadPartsModelContent = cache(
  async (
    brandSlug: string,
    brandName: string,
    modelSlug: string,
    modelName: string
  ): Promise<PartsLandingContent> => {
    const row = await findSeoContent({
      pageType: "MODEL",
      brand: brandSlug,
      model: modelSlug,
      year: null,
      category: null,
    });
    if (row) return dbRowToContent(row);

    const stats = await getPartsStatsForModel(brandName, modelName);
    const draft = generatePartsLandingContent({
      pageType: "MODEL",
      brandSlug,
      modelSlug,
      stats,
    });
    return draftToContent(draft);
  }
);

export const loadPartsModelYearContent = cache(
  async (
    brandSlug: string,
    brandName: string,
    modelSlug: string,
    modelName: string,
    year: number
  ): Promise<PartsLandingContent> => {
    const row = await findSeoContent({
      pageType: "MODEL_YEAR",
      brand: brandSlug,
      model: modelSlug,
      year,
      category: null,
    });
    if (row) return dbRowToContent(row);

    const stats = await getPartsStatsForModelYear(brandName, modelName, year);
    const draft = generatePartsLandingContent({
      pageType: "MODEL_YEAR",
      brandSlug,
      modelSlug,
      year,
      stats,
    });
    return draftToContent(draft);
  }
);
