/**
 * Update schemaTypesJson for all SeoPageMeta records.
 * Maps known pages to their JSON-LD schema types from code.
 *
 * Usage: npx tsx scripts/update-seo-schemas.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Schema types per page — extracted from code
const SCHEMA_MAP: Record<string, string[]> = {
  // Static pages
  "/": ["WebSite", "FAQPage", "Organization"],
  "/nabidka": ["CollectionPage", "ItemList", "BreadcrumbList"],
  "/chci-prodat": ["FAQPage", "BreadcrumbList"],
  "/makleri": ["ItemList", "BreadcrumbList"],
  "/blog": ["Blog", "ItemList", "BreadcrumbList"],
  "/stk": ["ItemList", "BreadcrumbList"],
  "/autoservisy": ["ItemList", "BreadcrumbList"],
  "/sluzby": ["Service", "BreadcrumbList"],
  "/sluzby/proverka": ["Service", "BreadcrumbList"],
  "/sluzby/financovani": ["Service", "BreadcrumbList"],
  "/sluzby/pojisteni": ["Service", "BreadcrumbList"],
  "/dily": ["FAQPage", "ItemList", "BreadcrumbList"],
  "/dily/katalog": ["ItemList", "BreadcrumbList"],
  "/shop": ["FAQPage", "ItemList", "BreadcrumbList"],
  "/shop/katalog": ["ItemList", "BreadcrumbList"],
  "/inzerce": ["WebPage", "BreadcrumbList"],
  "/inzerce/katalog": ["ItemList", "BreadcrumbList"],
  "/marketplace": ["FAQPage", "BreadcrumbList"],
  "/marketplace/apply": ["WebPage", "BreadcrumbList"],
  "/kontakt": ["LocalBusiness", "BreadcrumbList"],
  "/o-nas": ["Organization", "BreadcrumbList"],
  "/kariera": ["WebPage", "BreadcrumbList"],
  "/recenze": ["WebPage", "BreadcrumbList"],
  "/cenik": ["WebPage", "BreadcrumbList"],
  "/jak-prodat-auto": ["Article", "HowTo", "FAQPage", "BreadcrumbList"],
  "/kolik-stoji-moje-auto": ["WebApplication", "BreadcrumbList"],
  "/jak-to-funguje": ["FAQPage", "WebPage", "BreadcrumbList"],
  "/pro-maklere": ["WebPage", "BreadcrumbList"],
  "/nabidka/porovnani": ["WebPage", "BreadcrumbList"],
  // Legal
  "/obchodni-podminky": ["WebPage", "BreadcrumbList"],
  "/ochrana-osobnich-udaju": ["WebPage", "BreadcrumbList"],
  "/zasady-cookies": ["WebPage", "BreadcrumbList"],
  "/reklamacni-rad": ["WebPage", "BreadcrumbList"],
  "/shop/vraceni-zbozi": ["WebPage", "BreadcrumbList"],
  "/shop/reklamace": ["WebPage", "BreadcrumbList"],
};

// LP pages all get the same schema types
const LP_SCHEMAS: Record<string, string[]> = {
  "nabidka-brand": ["CollectionPage", "ItemList", "FAQPage", "BreadcrumbList"],
  "nabidka-city": ["CollectionPage", "ItemList", "FAQPage", "BreadcrumbList"],
  "nabidka-body": ["CollectionPage", "ItemList", "FAQPage", "BreadcrumbList"],
  "nabidka-price": ["CollectionPage", "ItemList", "FAQPage", "BreadcrumbList"],
  "dily-category": ["ItemList", "FAQPage", "BreadcrumbList"],
  "dily-brand": ["ItemList", "BreadcrumbList"],
  "dily-brand-model": ["ItemList", "BreadcrumbList"],
};

async function main() {
  const pages = await prisma.seoPageMeta.findMany();
  let updated = 0;

  for (const page of pages) {
    let schemas: string[] | undefined;

    // Check direct map first
    if (SCHEMA_MAP[page.pagePath]) {
      schemas = SCHEMA_MAP[page.pagePath];
    }
    // LP: /nabidka/* (brand, city, body, price)
    else if (page.pagePath.startsWith("/nabidka/") && page.pageType === "LP") {
      schemas = LP_SCHEMAS["nabidka-brand"];
    }
    // LP: /dily/kategorie/*
    else if (page.pagePath.startsWith("/dily/kategorie/")) {
      schemas = LP_SCHEMAS["dily-category"];
    }
    // LP: /dily/znacka/*/*
    else if (page.pagePath.match(/^\/dily\/znacka\/[^/]+\/[^/]+$/)) {
      schemas = LP_SCHEMAS["dily-brand-model"];
    }
    // LP: /dily/znacka/*
    else if (page.pagePath.startsWith("/dily/znacka/")) {
      schemas = LP_SCHEMAS["dily-brand"];
    }

    if (schemas) {
      await prisma.seoPageMeta.update({
        where: { id: page.id },
        data: { schemaTypesJson: JSON.stringify(schemas) },
      });
      updated++;
    }
  }

  console.log(`Updated ${updated}/${pages.length} pages with schema types.`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
