import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSautoXml, parseTipCarsXml, parseCsv, normalizeImportData } from "@/lib/listing-import";
import { generateListingSlug } from "@/lib/listings";

const runImportSchema = z.object({
  configId: z.string().min(1, "ID konfigurace je povinne"),
});

/* ------------------------------------------------------------------ */
/*  POST /api/feeds/import/run — Spuštění importu                    */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const body = await request.json();
    const { configId } = runImportSchema.parse(body);

    // Nacist konfiguraci
    const config = await prisma.feedImportConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      return NextResponse.json({ error: "Konfigurace nenalezena" }, { status: 404 });
    }

    // Overit opravneni
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (config.userId !== session.user.id && user?.role !== "ADMIN" && user?.role !== "BACKOFFICE") {
      return NextResponse.json({ error: "Nedostatecna opravneni" }, { status: 403 });
    }

    const startTime = Date.now();
    const errorMessages: string[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Stahnout feed
    let feedContent: string;
    try {
      const response = await fetch(config.url, {
        headers: { "User-Agent": "Carmakler Feed Importer/1.0" },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      feedContent = await response.text();
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : "Neznama chyba";
      // Logovat neuspesny import
      await prisma.feedImportLog.create({
        data: {
          configId,
          status: "FAILED",
          errors: 1,
          errorLog: JSON.stringify([`Chyba pri stahovani feedu: ${errorMsg}`]),
          duration: Date.now() - startTime,
        },
      });

      await prisma.feedImportConfig.update({
        where: { id: configId },
        data: { lastRunAt: new Date(), lastRunStatus: "FAILED", lastRunCount: 0 },
      });

      return NextResponse.json(
        { error: `Chyba pri stahovani feedu: ${errorMsg}` },
        { status: 502 }
      );
    }

    // Parsovat podle formatu
    let parsed;
    try {
      const customMapping = config.mapping ? JSON.parse(config.mapping) : undefined;
      switch (config.format) {
        case "SAUTO_XML":
          parsed = parseSautoXml(feedContent);
          break;
        case "TIPCARS_XML":
          parsed = parseTipCarsXml(feedContent);
          break;
        case "CSV":
          parsed = parseCsv(feedContent, customMapping);
          break;
        default:
          throw new Error(`Neznamy format: ${config.format}`);
      }
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : "Chyba parsovani";
      await prisma.feedImportLog.create({
        data: {
          configId,
          status: "FAILED",
          errors: 1,
          errorLog: JSON.stringify([errorMsg]),
          duration: Date.now() - startTime,
        },
      });

      await prisma.feedImportConfig.update({
        where: { id: configId },
        data: { lastRunAt: new Date(), lastRunStatus: "FAILED", lastRunCount: 0 },
      });

      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Normalizovat a deduplikovat
    const normalized = normalizeImportData(parsed);

    // Importovat do DB
    for (const item of normalized) {
      try {
        // Kontrola existence - VIN nebo brand+model+year+mileage
        let existing = null;
        if (item.vin) {
          existing = await prisma.listing.findFirst({
            where: { vin: item.vin, userId: config.userId },
          });
        }

        if (!existing) {
          existing = await prisma.listing.findFirst({
            where: {
              userId: config.userId,
              brand: item.brand,
              model: item.model,
              year: item.year,
              mileage: item.mileage,
            },
          });
        }

        if (existing) {
          // Update existujiciho
          await prisma.listing.update({
            where: { id: existing.id },
            data: {
              price: item.price,
              mileage: item.mileage,
              description: item.description,
              equipment: item.equipment,
              contactName: item.contactName,
              contactPhone: item.contactPhone,
              contactEmail: item.contactEmail,
              city: item.city,
              district: item.district,
            },
          });
          updated++;
        } else {
          // Vytvorit novy
          const slug = generateListingSlug(item.brand, item.model, item.year);
          const listing = await prisma.listing.create({
            data: {
              slug,
              listingType: "DEALER",
              userId: config.userId,
              vin: item.vin,
              brand: item.brand,
              model: item.model,
              variant: item.variant,
              year: item.year,
              mileage: item.mileage,
              fuelType: item.fuelType,
              transmission: item.transmission,
              enginePower: item.enginePower,
              engineCapacity: item.engineCapacity,
              bodyType: item.bodyType,
              color: item.color,
              doorsCount: item.doorsCount,
              seatsCount: item.seatsCount,
              condition: item.condition,
              price: item.price,
              priceNegotiable: item.priceNegotiable,
              contactName: item.contactName,
              contactPhone: item.contactPhone,
              contactEmail: item.contactEmail,
              city: item.city,
              district: item.district,
              description: item.description,
              equipment: item.equipment,
              highlights: item.highlights,
              status: "ACTIVE",
              publishedAt: new Date(),
            },
          });

          // Importovat obrazky
          if (item.images && item.images.length > 0) {
            await prisma.listingImage.createMany({
              data: item.images.map((img) => ({
                listingId: listing.id,
                url: img.url,
                order: img.order,
                isPrimary: img.isPrimary,
              })),
            });
          }

          created++;
        }
      } catch (itemError) {
        errors++;
        const msg = itemError instanceof Error ? itemError.message : "Neznama chyba";
        errorMessages.push(`${item.brand} ${item.model} (${item.vin || "bez VIN"}): ${msg}`);
      }
    }

    skipped = parsed.length - normalized.length;
    const duration = Date.now() - startTime;
    const status = errors > 0 ? (created + updated > 0 ? "PARTIAL" : "FAILED") : "SUCCESS";

    // Ulozit log
    const log = await prisma.feedImportLog.create({
      data: {
        configId,
        status,
        created,
        updated,
        skipped,
        errors,
        errorLog: errorMessages.length > 0 ? JSON.stringify(errorMessages) : null,
        duration,
      },
    });

    // Aktualizovat konfiguraci
    await prisma.feedImportConfig.update({
      where: { id: configId },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: status,
        lastRunCount: created + updated,
      },
    });

    return NextResponse.json({
      log,
      summary: {
        total: parsed.length,
        created,
        updated,
        skipped,
        errors,
        duration,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatna data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/feeds/import/run error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
