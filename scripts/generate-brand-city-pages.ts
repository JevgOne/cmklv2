/**
 * Generates 128 static brand+city landing pages (16 brands x 8 cities).
 * Run: npx tsx scripts/generate-brand-city-pages.ts
 */
import { BRANDS, CITIES, TOP_MODELS } from "../lib/seo-data";
import * as fs from "fs";
import * as path from "path";

const BASE_DIR = path.join(__dirname, "../app/(web)/nabidka");
const modelSlugs = new Set(TOP_MODELS.map((m) => m.slug));
let created = 0;
let skipped = 0;

for (const brand of BRANDS) {
  for (const city of CITIES) {
    // STOP-1: skip if city slug conflicts with an existing model slug
    if (modelSlugs.has(city.slug)) {
      console.warn(`SKIP: ${brand.slug}/${city.slug} conflicts with model`);
      skipped++;
      continue;
    }

    const dir = path.join(BASE_DIR, brand.slug, city.slug);
    fs.mkdirSync(dir, { recursive: true });

    const content = `import type { Metadata } from "next";
import { BRANDS, CITIES } from "@/lib/seo-data";
import { BrandCityLandingContent } from "@/components/web/BrandCityLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

const brand = BRANDS.find((b) => b.slug === "${brand.slug}");
const city = CITIES.find((c) => c.slug === "${city.slug}");

export const metadata: Metadata =
  brand && city
    ? {
        title: \`\${brand.displayName} bazar ${city.name} | Ojeté \${brand.displayName} ${city.inLocative}\`,
        description: \`Prověřené ojeté vozy \${brand.displayName} ${city.inLocative} od ověřených makléřů. \${brand.topModels.map((m) => m.name).join(", ")} a další.\`,
        openGraph: {
          title: \`Ojeté \${brand.displayName} ${city.inLocative}\`,
          description: \`Prověřené ojeté \${brand.displayName} ${city.inLocative}. Bezpečný nákup od makléřů.\`,
        },
        alternates: pageCanonical("/nabidka/${brand.slug}/${city.slug}"),
      }
    : {};

export default function Page() {
  if (!brand || !city) notFound();
  return <BrandCityLandingContent brand={brand} city={city} />;
}
`;
    fs.writeFileSync(path.join(dir, "page.tsx"), content);
    created++;
  }
}

console.log(
  `Done: ${created} brand+city pages created, ${skipped} skipped (conflicts).`
);
