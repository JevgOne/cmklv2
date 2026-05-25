/**
 * Seed script: Register all known pages in SeoPageMeta.
 *
 * Usage: npx tsx scripts/seed-seo-pages.ts
 *
 * Uses upsert with empty update — STOP-1: never overwrites existing overrides.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  BRANDS,
  BODY_TYPES,
  PRICE_RANGES,
  CITIES,
  PARTS_CATEGORIES,
  PARTS_BRANDS,
  PARTS_MODELS_BY_BRAND,
} from "../lib/seo-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface PageDef {
  pagePath: string;
  pageType: string;
  section: string;
}

const PAGES: PageDef[] = [
  // ── Home ──
  { pagePath: "/", pageType: "STATIC", section: "home" },

  // ── Vehicles ──
  { pagePath: "/nabidka", pageType: "DYNAMIC_LIST", section: "vehicles" },
  { pagePath: "/chci-prodat", pageType: "STATIC", section: "vehicles" },
  { pagePath: "/nabidka/porovnani", pageType: "STATIC", section: "vehicles" },

  // ── Brokers ──
  { pagePath: "/makleri", pageType: "DYNAMIC_LIST", section: "brokers" },
  { pagePath: "/pro-maklere", pageType: "STATIC", section: "brokers" },

  // ── Blog ──
  { pagePath: "/blog", pageType: "DYNAMIC_LIST", section: "blog" },

  // ── STK ──
  { pagePath: "/stk", pageType: "DYNAMIC_LIST", section: "stk" },

  // ── Services ──
  { pagePath: "/autoservisy", pageType: "DYNAMIC_LIST", section: "services" },
  { pagePath: "/sluzby", pageType: "STATIC", section: "services" },
  { pagePath: "/sluzby/proverka", pageType: "STATIC", section: "services" },
  { pagePath: "/sluzby/financovani", pageType: "STATIC", section: "services" },
  { pagePath: "/sluzby/pojisteni", pageType: "STATIC", section: "services" },

  // ── Parts ──
  { pagePath: "/dily", pageType: "DYNAMIC_LIST", section: "parts" },
  { pagePath: "/dily/katalog", pageType: "DYNAMIC_LIST", section: "parts" },
  { pagePath: "/shop", pageType: "DYNAMIC_LIST", section: "parts" },
  { pagePath: "/shop/katalog", pageType: "DYNAMIC_LIST", section: "parts" },

  // ── Listings ──
  { pagePath: "/inzerce", pageType: "STATIC", section: "listings" },
  { pagePath: "/inzerce/katalog", pageType: "DYNAMIC_LIST", section: "listings" },

  // ── Marketplace ──
  { pagePath: "/marketplace", pageType: "STATIC", section: "marketplace" },
  { pagePath: "/marketplace/apply", pageType: "STATIC", section: "marketplace" },

  // ── Info ──
  { pagePath: "/kontakt", pageType: "STATIC", section: "info" },
  { pagePath: "/o-nas", pageType: "STATIC", section: "info" },
  { pagePath: "/kariera", pageType: "STATIC", section: "info" },
  { pagePath: "/recenze", pageType: "STATIC", section: "info" },
  { pagePath: "/cenik", pageType: "STATIC", section: "info" },
  { pagePath: "/jak-prodat-auto", pageType: "STATIC", section: "info" },
  { pagePath: "/kolik-stoji-moje-auto", pageType: "STATIC", section: "info" },
  { pagePath: "/jak-to-funguje", pageType: "STATIC", section: "info" },

  // ── Legal ──
  { pagePath: "/obchodni-podminky", pageType: "STATIC", section: "legal" },
  { pagePath: "/ochrana-osobnich-udaju", pageType: "STATIC", section: "legal" },
  { pagePath: "/zasady-cookies", pageType: "STATIC", section: "legal" },
  { pagePath: "/reklamacni-rad", pageType: "STATIC", section: "legal" },
  { pagePath: "/shop/vraceni-zbozi", pageType: "STATIC", section: "legal" },
  { pagePath: "/shop/reklamace", pageType: "STATIC", section: "legal" },

  // ── LP: Brand pages ──
  ...BRANDS.map((b) => ({
    pagePath: `/nabidka/${b.slug}`,
    pageType: "LP",
    section: "vehicles",
  })),

  // ── LP: City pages ──
  ...CITIES.map((c) => ({
    pagePath: `/nabidka/${c.slug}`,
    pageType: "LP",
    section: "vehicles",
  })),

  // ── LP: Body types ──
  ...BODY_TYPES.map((bt) => ({
    pagePath: `/nabidka/${bt.slug}`,
    pageType: "LP",
    section: "vehicles",
  })),

  // ── LP: Price ranges ──
  ...PRICE_RANGES.map((pr) => ({
    pagePath: `/nabidka/${pr.slug}`,
    pageType: "LP",
    section: "vehicles",
  })),

  // ── LP: Parts categories ──
  ...PARTS_CATEGORIES.map((cat) => ({
    pagePath: `/dily/kategorie/${cat.slug}`,
    pageType: "LP",
    section: "parts",
  })),

  // ── LP: Parts brands ──
  ...PARTS_BRANDS.map((brand) => ({
    pagePath: `/dily/znacka/${brand.slug}`,
    pageType: "LP",
    section: "parts",
  })),

  // ── LP: Parts brand+model ──
  ...PARTS_BRANDS.flatMap((brand) =>
    (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({
      pagePath: `/dily/znacka/${brand.slug}/${model.slug}`,
      pageType: "LP",
      section: "parts",
    })),
  ),
];

async function main() {
  console.log(`Seeding ${PAGES.length} SeoPageMeta records...`);

  let created = 0;
  let skipped = 0;

  for (const page of PAGES) {
    const result = await prisma.seoPageMeta.upsert({
      where: { pagePath: page.pagePath },
      create: page,
      update: {}, // STOP-1: never overwrite existing overrides
    });

    // Check if it was just created (no updatedAt change on existing)
    const isNew =
      result.createdAt.getTime() === result.updatedAt.getTime() &&
      Date.now() - result.createdAt.getTime() < 5000;
    if (isNew) created++;
    else skipped++;
  }

  console.log(`Done: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
