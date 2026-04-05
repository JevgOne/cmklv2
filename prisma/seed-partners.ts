import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface SeedPartner {
  name: string;
  ico?: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email?: string;
  website?: string;
  type: string;
  size?: string;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  source?: string;
  lat?: number | null;
  lng?: number | null;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapSource(source?: string): string | null {
  if (!source) return null;
  const s = source.toLowerCase();
  if (s.includes("firmy")) return "FIRMY_CZ";
  if (s.includes("google")) return "GOOGLE";
  if (s.includes("sauto")) return "SAUTO";
  if (s.includes("tipcars")) return "TIPCARS";
  if (s.includes("bazos")) return "BAZOS";
  return "MANUAL";
}

function calculateScore(partner: SeedPartner, existingRegions: Set<string>): number {
  let score = 0;

  // Size scoring
  if (partner.size === "LARGE") score += 30;
  else if (partner.size === "MEDIUM") score += 20;
  else score += 5;

  // Google rating
  if (partner.googleRating && partner.googleRating > 4.0) score += 15;
  if (partner.googleRating && partner.googleRating < 3.0) score -= 10;

  // Has web
  if (partner.website) score += 10;

  // Has email
  if (partner.email) score += 5;

  // Region bonus
  if (partner.region && !existingRegions.has(partner.region)) {
    score += 10;
  }

  return Math.max(0, score);
}

async function main() {
  console.log("Loading partner seed data...");

  const raw = readFileSync(
    join(__dirname, "data", "partners-seed.json"),
    "utf-8"
  );
  const partners: SeedPartner[] = JSON.parse(raw);

  console.log(`Found ${partners.length} partners to seed.`);

  const existingRegions = new Set<string>();
  let created = 0;
  let skipped = 0;

  for (const p of partners) {
    const slug = slugify(p.name);
    const partnerType = p.type === "vrakoviste" ? "VRAKOVISTE" : "AUTOBAZAR";
    const mappedSource = mapSource(p.source);
    const score = calculateScore(p, existingRegions);

    // Track regions
    if (p.region) existingRegions.add(p.region);

    // Upsert by ICO if available, otherwise by slug
    const existing = p.ico
      ? await prisma.partner.findUnique({ where: { ico: p.ico } })
      : await prisma.partner.findUnique({ where: { slug } });

    if (existing) {
      skipped++;
      continue;
    }

    // Ensure unique slug
    let uniqueSlug = slug;
    const slugExists = await prisma.partner.findUnique({
      where: { slug: uniqueSlug },
    });
    if (slugExists) {
      uniqueSlug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    try {
      await prisma.partner.create({
        data: {
          name: p.name,
          type: partnerType,
          ico: p.ico || null,
          address: p.address || null,
          city: p.city || null,
          region: p.region || null,
          phone: p.phone || null,
          email: p.email || null,
          web: p.website || null,
          estimatedSize: p.size || null,
          googleRating: p.googleRating || null,
          googleReviewCount: p.googleReviewCount || null,
          source: mappedSource,
          latitude: p.lat || null,
          longitude: p.lng || null,
          slug: uniqueSlug,
          status: "NEOSLOVENY",
          score,
        },
      });
      created++;
    } catch (err) {
      console.error(`Error creating partner "${p.name}":`, err);
      skipped++;
    }
  }

  console.log(`Seed complete: ${created} created, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
