#!/usr/bin/env tsx
/**
 * Generate SEO long-form content pro /dily/znacka/* landing pages.
 *
 * Idempotent — re-run skipne existující rows pokud není --force.
 * MVP scope: BRAND (8) + MODEL (24) = 32 entries. MODEL_YEAR je render-time
 * template fallback v page.tsx, ne pre-seed (per plán-139 §2 Cesta C).
 *
 * Usage:
 *   npm run seed:seo                              # generate vše (BRAND + MODEL)
 *   npm run seed:seo -- --dry-run                 # bez DB writes, jen log
 *   npm run seed:seo -- --force                   # přepiš existující rows
 *   npm run seed:seo -- --level=BRAND             # jen brand-level
 *   npm run seed:seo -- --level=MODEL             # jen model-level
 *   npm run seed:seo -- --brand=skoda             # jen Škoda + její modely
 *   npm run seed:seo -- --validate-only           # validuj output bez DB writes
 *
 * Per plán-139 §8a (lead requirement Q5): output HTML projde Zod whitelist
 * validací (allowed tags: <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>, <a>)
 * — gen script exit non-zero pokud HTML obsahuje cizí/zlomyslné tagy.
 */

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PARTS_BRANDS, PARTS_MODELS_BY_BRAND } from "@/lib/seo-data";
import {
  generatePartsLandingContent,
  type SeoContentDraft,
} from "@/lib/seo/generatePartsLanding";
import {
  getPartsStatsForBrand,
  getPartsStatsForModel,
} from "@/lib/seo/pricingAggregate";
import {
  findSeoContent,
  upsertSeoContentByKey,
  type SeoContentKey,
} from "@/lib/seo/seoContentRepo";

interface CliArgs {
  dryRun: boolean;
  force: boolean;
  level?: "BRAND" | "MODEL" | "MODEL_YEAR";
  brand?: string;
  validateOnly: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const level = args
    .find((a) => a.startsWith("--level="))
    ?.split("=")[1] as CliArgs["level"];
  const brand = args.find((a) => a.startsWith("--brand="))?.split("=")[1];
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    level,
    brand,
    validateOnly: args.includes("--validate-only"),
  };
}

// ─── Zod HTML whitelist validation (lead Q5 requirement) ─────────────────────

const ALLOWED_TAGS = ["p", "h2", "h3", "ul", "li", "strong", "em", "a"] as const;
const TAG_REGEX = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

function htmlAllowedTagsOnly(html: string): boolean {
  const matches = html.matchAll(TAG_REGEX);
  for (const m of matches) {
    const tag = m[1].toLowerCase();
    if (!ALLOWED_TAGS.includes(tag as (typeof ALLOWED_TAGS)[number])) {
      return false;
    }
  }
  return true;
}

const SafeHtml = z
  .string()
  .refine(htmlAllowedTagsOnly, {
    message: `HTML obsahuje tagy mimo whitelist (${ALLOWED_TAGS.join(", ")})`,
  });

const SectionSchema = z.object({
  h2: z.string().min(1),
  html: SafeHtml,
});

const FaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const SeoContentDraftSchema = z.object({
  pageType: z.enum(["BRAND", "MODEL", "MODEL_YEAR"]),
  brand: z.string().min(1),
  model: z.string().optional(),
  year: z.number().int().optional(),
  h1: z.string().min(1),
  metaTitle: z.string().min(1).max(70),
  metaDesc: z.string().min(1).max(200),
  introHtml: SafeHtml,
  sectionsJson: z.string().refine((s) => {
    try {
      return SectionSchema.array().safeParse(JSON.parse(s)).success;
    } catch {
      return false;
    }
  }, "sectionsJson není validní JSON.stringify({h2,html}[]) nebo HTML obsahuje zakázané tagy"),
  faqJson: z.string().refine((s) => {
    try {
      return FaqSchema.array().safeParse(JSON.parse(s)).success;
    } catch {
      return false;
    }
  }, "faqJson není validní JSON.stringify({question,answer}[])"),
  aiSnippetText: z.string().min(1),
  quickFacts: z.string().refine((s) => {
    try {
      return z.string().array().safeParse(JSON.parse(s)).success;
    } catch {
      return false;
    }
  }, "quickFacts není validní JSON.stringify(string[])"),
  wordCount: z.number().int().nonnegative(),
  generatedBy: z.literal("template"),
});

function validateDraftOrThrow(draft: SeoContentDraft, label: string): void {
  const result = SeoContentDraftSchema.safeParse(draft);
  if (!result.success) {
    console.error(`✗ Validation failed for ${label}:`);
    for (const issue of result.error.issues) {
      console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error(`Zod validation failed: ${label}`);
  }
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

function draftToDbInput(draft: SeoContentDraft) {
  return {
    pageType: draft.pageType,
    brand: draft.brand,
    model: draft.model ?? null,
    year: draft.year ?? null,
    category: null,
    h1: draft.h1,
    metaTitle: draft.metaTitle,
    metaDesc: draft.metaDesc,
    introHtml: draft.introHtml,
    sectionsJson: draft.sectionsJson,
    faqJson: draft.faqJson,
    aiSnippetText: draft.aiSnippetText,
    quickFacts: draft.quickFacts,
    wordCount: draft.wordCount,
    generatedBy: draft.generatedBy,
  };
}

// ─── Generators per level ────────────────────────────────────────────────────

interface LevelResult {
  generated: number;
  skipped: number;
  validated: number;
}

async function generateBrandLevel(args: CliArgs): Promise<LevelResult> {
  const result: LevelResult = { generated: 0, skipped: 0, validated: 0 };
  const brands = args.brand
    ? PARTS_BRANDS.filter((b) => b.slug === args.brand)
    : PARTS_BRANDS;

  for (const brand of brands) {
    const label = `BRAND ${brand.slug}`;
    const key: SeoContentKey = {
      pageType: "BRAND",
      brand: brand.slug,
      model: null,
      year: null,
      category: null,
    };

    if (!args.dryRun && !args.validateOnly) {
      const existing = await findSeoContent(key);
      if (existing && !args.force) {
        console.log(`SKIP ${label} (exists)`);
        result.skipped++;
        continue;
      }
    }

    const stats = await getPartsStatsForBrand(brand.name);
    const draft = generatePartsLandingContent({
      pageType: "BRAND",
      brandSlug: brand.slug,
      stats,
    });

    validateDraftOrThrow(draft, label);
    result.validated++;

    if (args.validateOnly) {
      console.log(`✓ VALIDATE ${label} (${draft.wordCount} words)`);
      result.generated++;
      continue;
    }

    if (args.dryRun) {
      console.log(`DRY-RUN ${label} (${draft.wordCount} words)`);
      result.generated++;
      continue;
    }

    await upsertSeoContentByKey(key, draftToDbInput(draft));
    console.log(`✓ ${label} (${draft.wordCount} words)`);
    result.generated++;
  }

  return result;
}

async function generateModelLevel(args: CliArgs): Promise<LevelResult> {
  const result: LevelResult = { generated: 0, skipped: 0, validated: 0 };
  const brands = args.brand
    ? PARTS_BRANDS.filter((b) => b.slug === args.brand)
    : PARTS_BRANDS;

  for (const brand of brands) {
    const models = PARTS_MODELS_BY_BRAND[brand.slug] || [];

    for (const model of models) {
      const label = `MODEL ${brand.slug}/${model.slug}`;
      const key: SeoContentKey = {
        pageType: "MODEL",
        brand: brand.slug,
        model: model.slug,
        year: null,
        category: null,
      };

      if (!args.dryRun && !args.validateOnly) {
        const existing = await findSeoContent(key);
        if (existing && !args.force) {
          console.log(`SKIP ${label} (exists)`);
          result.skipped++;
          continue;
        }
      }

      const stats = await getPartsStatsForModel(brand.name, model.name);
      const draft = generatePartsLandingContent({
        pageType: "MODEL",
        brandSlug: brand.slug,
        modelSlug: model.slug,
        stats,
      });

      validateDraftOrThrow(draft, label);
      result.validated++;

      if (args.validateOnly) {
        console.log(`✓ VALIDATE ${label} (${draft.wordCount} words)`);
        result.generated++;
        continue;
      }

      if (args.dryRun) {
        console.log(`DRY-RUN ${label} (${draft.wordCount} words)`);
        result.generated++;
        continue;
      }

      await upsertSeoContentByKey(key, draftToDbInput(draft));
      console.log(`✓ ${label} (${draft.wordCount} words)`);
      result.generated++;
    }
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  console.log(
    `generate-parts-seo-content.ts (dry-run=${args.dryRun}, force=${args.force}, validate-only=${args.validateOnly}, level=${args.level || "ALL"}, brand=${args.brand || "ALL"})`
  );
  console.log("");

  const total: LevelResult = { generated: 0, skipped: 0, validated: 0 };

  try {
    if (!args.level || args.level === "BRAND") {
      const r = await generateBrandLevel(args);
      total.generated += r.generated;
      total.skipped += r.skipped;
      total.validated += r.validated;
    }

    if (!args.level || args.level === "MODEL") {
      const r = await generateModelLevel(args);
      total.generated += r.generated;
      total.skipped += r.skipped;
      total.validated += r.validated;
    }

    // MODEL_YEAR pre-seed je out-of-scope (#87c-v2). Render-time template
    // fallback v page.tsx pokrývá ~500 year combinations.

    console.log("");
    console.log(
      `Done: generated=${total.generated}, skipped=${total.skipped}, validated=${total.validated}`
    );
  } catch (err) {
    console.error("");
    console.error("Generation failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
