/**
 * Migrace: stahnout fotky z Cloudinary, zpracovat pres Sharp, ulozit na disk.
 * Spustit na produkcnim serveru: npx tsx scripts/migrate-cloudinary.ts
 *
 * Postup:
 * 1. Nacist vsechny URL z DB (VehicleImage, ListingImage, Part.images, User.avatar, ...)
 * 2. Pro kazdou Cloudinary URL:
 *    a. Stahnout original
 *    b. Sharp: resize + watermark (pro produktove fotky) + WebP
 *    c. Ulozit na disk
 *    d. Aktualizovat URL v DB
 * 3. Logovat vysledky
 *
 * POZNAMKA: Skeleton — doplnit detaily az po stabilizaci self-hosted uploadu.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/uploads";
const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL || "https://files.carmakler.cz";

interface MigrationTarget {
  name: string;
  query: () => Promise<Array<Record<string, unknown>>>;
  update: (id: string, url: string) => Promise<unknown>;
  urlField: string;
  folder: string;
  watermark: boolean;
}

const MIGRATIONS: MigrationTarget[] = [
  {
    name: "VehicleImage",
    query: () =>
      prisma.vehicleImage.findMany({
        where: { url: { contains: "res.cloudinary.com" } },
      }) as Promise<Array<Record<string, unknown>>>,
    update: (id: string, url: string) =>
      prisma.vehicleImage.update({ where: { id }, data: { url } }),
    urlField: "url",
    folder: "carmakler/vehicles",
    watermark: true,
  },
  {
    name: "ListingImage",
    query: () =>
      prisma.listingImage.findMany({
        where: { url: { contains: "res.cloudinary.com" } },
      }) as Promise<Array<Record<string, unknown>>>,
    update: (id: string, url: string) =>
      prisma.listingImage.update({ where: { id }, data: { url } }),
    urlField: "url",
    folder: "carmakler/listings",
    watermark: true,
  },
  // TODO: Part.images (JSON parse), User.avatar, User.documents, Contract.pdfUrl
];

async function migrateUrl(
  _cloudinaryUrl: string,
  _folder: string,
  _watermark: boolean
): Promise<string> {
  // TODO: Implementovat:
  // 1. Fetch original z Cloudinary
  // 2. Sharp processing (resize + watermark + WebP)
  // 3. Zapsat na disk do UPLOAD_DIR/folder/
  // 4. Vratit novou URL
  void UPLOAD_DIR;
  void UPLOAD_BASE_URL;
  throw new Error("Not implemented — doplnit pred spustenim migrace");
}

async function main() {
  console.log("Cloudinary → self-hosted migration");
  console.log(`Target: ${UPLOAD_DIR}`);
  console.log(`Base URL: ${UPLOAD_BASE_URL}\n`);

  for (const migration of MIGRATIONS) {
    console.log(`\nMigrating ${migration.name}...`);
    const items = await migration.query();
    let ok = 0;
    let fail = 0;

    for (const item of items) {
      try {
        const newUrl = await migrateUrl(
          item[migration.urlField] as string,
          migration.folder,
          migration.watermark
        );
        await migration.update(item.id as string, newUrl);
        ok++;
      } catch (err) {
        console.error(`  FAIL ${item.id}:`, err);
        fail++;
      }
    }

    console.log(
      `  ${migration.name}: ${ok} OK, ${fail} FAIL (z ${items.length})`
    );
  }
}

main().finally(() => prisma.$disconnect());
