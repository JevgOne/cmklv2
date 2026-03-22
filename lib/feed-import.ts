/**
 * Feed import worker pro velkoobchodní dodavatele autodílů.
 *
 * Podporuje XML, CSV a JSON feedy. Parsuje data podle fieldMapping
 * konfigurace, počítá prodejní cenu s markup přirážkou a
 * vytváří/aktualizuje Part záznamy v databázi.
 */

import { prisma } from "@/lib/prisma";
import { calculateMarkup } from "@/lib/markup";
import { slugify } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface FeedConfigRow {
  id: string;
  supplierId: string;
  name: string;
  feedUrl: string;
  feedFormat: string;
  fieldMapping: string | null;
  updateFrequency: string;
  markupType: string;
  markupValue: number;
  categoryMarkups: string | null;
  defaultPartType: string;
  isActive: boolean;
}

interface FieldMapping {
  name?: string;
  price?: string;
  oemNumber?: string;
  partNumber?: string;
  category?: string;
  description?: string;
  stock?: string;
  brand?: string;
  model?: string;
  yearFrom?: string;
  yearTo?: string;
  externalId?: string;
  condition?: string;
  image?: string;
}

interface ParsedItem {
  externalId: string;
  name: string;
  price: number;
  oemNumber?: string;
  partNumber?: string;
  category?: string;
  description?: string;
  stock?: number;
  brand?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  condition?: string;
  image?: string;
}

interface ImportResult {
  totalItems: number;
  created: number;
  updated: number;
  deactivated: number;
  errors: number;
  errorDetails: Array<{ line: number; error: string }>;
}

// ============================================
// Parsers
// ============================================

/**
 * Parsuje CSV text na pole objektů.
 * Podporuje dvojité uvozovky a čárky uvnitř uvozovek.
 */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === "," || char === ";") && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? "";
    });
    rows.push(obj);
  }

  return rows;
}

/**
 * Jednoduchý XML parser.
 * Parsuje opakující se elementy (např. <item>...</item>) na pole objektů.
 * Pro produkční nasazení doporučeno nahradit plnohodnotným XML parserem.
 */
function parseXml(text: string): Record<string, string>[] {
  const items: Record<string, string>[] = [];

  // Najdi opakující se elementy — heuristika: hledej <item>, <product>, <part>, <row>
  const tagCandidates = ["item", "product", "part", "row", "dil", "artikel"];
  let itemTag = "";

  for (const tag of tagCandidates) {
    const regex = new RegExp(`<${tag}[\\s>]`, "i");
    if (regex.test(text)) {
      itemTag = tag;
      break;
    }
  }

  if (!itemTag) {
    // Zkus najít nejčastější opakující se element
    const tagMatches = text.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[>\s]/g) ?? [];
    const counts = new Map<string, number>();
    for (const m of tagMatches) {
      const name = m.replace(/[<>\s]/g, "");
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let maxCount = 0;
    for (const [name, count] of counts) {
      if (count > maxCount && count > 2) {
        maxCount = count;
        itemTag = name;
      }
    }
  }

  if (!itemTag) return items;

  // Extrahuj elementy
  const itemRegex = new RegExp(`<${itemTag}[^>]*>([\\s\\S]*?)<\\/${itemTag}>`, "gi");
  let match;

  while ((match = itemRegex.exec(text)) !== null) {
    const content = match[1];
    const obj: Record<string, string> = {};

    // Extrahuj child elementy
    const childRegex = /<([a-zA-Z][a-zA-Z0-9_-]*)(?:\s[^>]*)?>([^<]*)<\/\1>/g;
    let childMatch;
    while ((childMatch = childRegex.exec(content)) !== null) {
      obj[childMatch[1]] = childMatch[2].trim();
    }

    if (Object.keys(obj).length > 0) {
      items.push(obj);
    }
  }

  return items;
}

/**
 * Parsuje JSON feed. Očekává pole objektů nebo objekt s polem.
 */
function parseJson(text: string): Record<string, string>[] {
  const data = JSON.parse(text);

  if (Array.isArray(data)) {
    return data.map((item) => {
      const obj: Record<string, string> = {};
      for (const [key, value] of Object.entries(item)) {
        obj[key] = String(value ?? "");
      }
      return obj;
    });
  }

  // Zkus najít první pole v objektu
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      return (value as Record<string, unknown>[]).map((item) => {
        const obj: Record<string, string> = {};
        for (const [k, v] of Object.entries(item)) {
          obj[k] = String(v ?? "");
        }
        return obj;
      });
    }
  }

  return [];
}

// ============================================
// Core functions
// ============================================

/**
 * Stáhne a naparsuje feed z URL.
 */
export async function fetchAndParseFeed(
  config: FeedConfigRow
): Promise<Record<string, string>[]> {
  const response = await fetch(config.feedUrl, {
    headers: { "User-Agent": "Carmakler-FeedImport/1.0" },
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`Feed stažení selhalo: HTTP ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  switch (config.feedFormat.toUpperCase()) {
    case "XML":
      return parseXml(text);
    case "CSV":
      return parseCsv(text);
    case "JSON":
      return parseJson(text);
    default:
      throw new Error(`Nepodporovaný formát feedu: ${config.feedFormat}`);
  }
}

/**
 * Mapuje raw řádek feedu na ParsedItem podle fieldMapping.
 */
function mapItem(
  raw: Record<string, string>,
  mapping: FieldMapping,
  index: number
): ParsedItem {
  const get = (field: string | undefined): string => {
    if (!field) return "";
    return raw[field] ?? "";
  };

  const name = get(mapping.name) || `Díl #${index + 1}`;
  const priceStr = get(mapping.price).replace(/[^\d.,]/g, "").replace(",", ".");
  const price = parseFloat(priceStr) || 0;

  return {
    externalId: get(mapping.externalId) || `feed-${index}`,
    name,
    price,
    oemNumber: get(mapping.oemNumber) || undefined,
    partNumber: get(mapping.partNumber) || undefined,
    category: normalizeCategory(get(mapping.category)),
    description: get(mapping.description) || undefined,
    stock: parseInt(get(mapping.stock)) || undefined,
    brand: get(mapping.brand) || undefined,
    model: get(mapping.model) || undefined,
    yearFrom: parseInt(get(mapping.yearFrom)) || undefined,
    yearTo: parseInt(get(mapping.yearTo)) || undefined,
    condition: get(mapping.condition) || undefined,
    image: get(mapping.image) || undefined,
  };
}

/**
 * Normalizuje kategorii na interní formát.
 */
function normalizeCategory(raw: string): string {
  if (!raw) return "OTHER";

  const map: Record<string, string> = {
    motor: "ENGINE",
    engine: "ENGINE",
    prevodovka: "TRANSMISSION",
    transmission: "TRANSMISSION",
    brzdy: "BRAKES",
    brakes: "BRAKES",
    podvozek: "SUSPENSION",
    suspension: "SUSPENSION",
    karoserie: "BODY",
    body: "BODY",
    elektro: "ELECTRICAL",
    electrical: "ELECTRICAL",
    interior: "INTERIOR",
    interier: "INTERIOR",
    kola: "WHEELS",
    wheels: "WHEELS",
    vyfuk: "EXHAUST",
    exhaust: "EXHAUST",
    chlazeni: "COOLING",
    cooling: "COOLING",
    palivo: "FUEL",
    fuel: "FUEL",
  };

  const lower = raw.toLowerCase().trim();
  return map[lower] ?? "OTHER";
}

/**
 * Hlavní importovací funkce.
 * Stáhne feed, parsuje, vytváří/aktualizuje Part záznamy.
 */
export async function importFeed(configId: string): Promise<ImportResult> {
  const startTime = Date.now();

  const config = await prisma.partsFeedConfig.findUnique({
    where: { id: configId },
  });

  if (!config) {
    throw new Error(`Feed konfigurace ${configId} nenalezena`);
  }

  if (!config.isActive) {
    throw new Error(`Feed ${config.name} není aktivní`);
  }

  const result: ImportResult = {
    totalItems: 0,
    created: 0,
    updated: 0,
    deactivated: 0,
    errors: 0,
    errorDetails: [],
  };

  let rawItems: Record<string, string>[];
  try {
    rawItems = await fetchAndParseFeed(config);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors = 1;
    result.errorDetails.push({ line: 0, error: `Feed stažení/parsování: ${errorMessage}` });

    await saveImportLog(configId, "FAILED", result, Date.now() - startTime);
    return result;
  }

  result.totalItems = rawItems.length;

  const mapping: FieldMapping = config.fieldMapping
    ? JSON.parse(config.fieldMapping)
    : {};

  const markupConfig = {
    markupType: config.markupType,
    markupValue: config.markupValue,
    categoryMarkups: config.categoryMarkups,
  };

  // Sleduj které externalIds jsou ve feedu (pro deaktivaci chybějících)
  const feedExternalIds = new Set<string>();

  // Zpracuj položky
  for (let i = 0; i < rawItems.length; i++) {
    try {
      const item = mapItem(rawItems[i], mapping, i);

      if (!item.name || item.price <= 0) {
        result.errors++;
        result.errorDetails.push({
          line: i + 1,
          error: `Neplatná položka: name="${item.name}", price=${item.price}`,
        });
        continue;
      }

      feedExternalIds.add(item.externalId);

      // Vypočítej prodejní cenu
      const { retailPrice, markupPercent } = calculateMarkup(
        item.price,
        markupConfig,
        item.category
      );

      // Hledej existující díl podle externalId + feedConfigId
      const existing = await prisma.part.findFirst({
        where: {
          feedConfigId: configId,
          externalId: item.externalId,
        },
      });

      if (existing) {
        // Aktualizuj
        await prisma.part.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            wholesalePrice: Math.round(item.price),
            price: retailPrice,
            markupPercent,
            category: item.category ?? existing.category,
            description: item.description ?? existing.description,
            oemNumber: item.oemNumber ?? existing.oemNumber,
            partNumber: item.partNumber ?? existing.partNumber,
            stock: item.stock ?? existing.stock,
            compatibleBrands: item.brand ? JSON.stringify([item.brand]) : existing.compatibleBrands,
            compatibleModels: item.model ? JSON.stringify([item.model]) : existing.compatibleModels,
            compatibleYearFrom: item.yearFrom ?? existing.compatibleYearFrom,
            compatibleYearTo: item.yearTo ?? existing.compatibleYearTo,
            status: (item.stock ?? 1) > 0 ? "ACTIVE" : "INACTIVE",
          },
        });
        result.updated++;
      } else {
        // Vytvoř nový
        const baseSlug = slugify(item.name);
        const slugSuffix = Date.now().toString(36) + i.toString(36);
        const slug = `${baseSlug}-${slugSuffix}`;

        await prisma.part.create({
          data: {
            slug,
            supplierId: config.supplierId,
            feedConfigId: configId,
            externalId: item.externalId,
            name: item.name,
            partType: config.defaultPartType,
            category: item.category ?? "OTHER",
            description: item.description ?? null,
            oemNumber: item.oemNumber ?? null,
            partNumber: item.partNumber ?? null,
            condition: item.condition ?? "NEW",
            wholesalePrice: Math.round(item.price),
            price: retailPrice,
            markupPercent,
            stock: item.stock ?? 1,
            compatibleBrands: item.brand ? JSON.stringify([item.brand]) : null,
            compatibleModels: item.model ? JSON.stringify([item.model]) : null,
            compatibleYearFrom: item.yearFrom ?? null,
            compatibleYearTo: item.yearTo ?? null,
            status: (item.stock ?? 1) > 0 ? "ACTIVE" : "INACTIVE",
            images: item.image
              ? { create: [{ url: item.image, order: 0, isPrimary: true }] }
              : undefined,
          },
        });
        result.created++;
      }
    } catch (error) {
      result.errors++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errorDetails.push({ line: i + 1, error: errorMessage });

      // Limit error log size
      if (result.errorDetails.length > 100) {
        result.errorDetails = result.errorDetails.slice(0, 100);
      }
    }
  }

  // Deaktivuj díly, které už nejsou ve feedu
  if (feedExternalIds.size > 0) {
    const toDeactivate = await prisma.part.findMany({
      where: {
        feedConfigId: configId,
        status: "ACTIVE",
        externalId: { notIn: Array.from(feedExternalIds) },
      },
      select: { id: true },
    });

    if (toDeactivate.length > 0) {
      await prisma.part.updateMany({
        where: { id: { in: toDeactivate.map((p) => p.id) } },
        data: { status: "INACTIVE" },
      });
      result.deactivated = toDeactivate.length;
    }
  }

  const duration = Date.now() - startTime;
  const status = result.errors === 0 ? "SUCCESS" : result.created + result.updated > 0 ? "PARTIAL" : "FAILED";

  await saveImportLog(configId, status, result, duration);

  // Aktualizuj feed config s poslední informací o importu
  await prisma.partsFeedConfig.update({
    where: { id: configId },
    data: {
      lastImportAt: new Date(),
      lastImportCount: result.created + result.updated,
      lastImportErrors: result.errors,
    },
  });

  return result;
}

/**
 * Uloží log importu do databáze.
 */
async function saveImportLog(
  feedConfigId: string,
  status: string,
  result: ImportResult,
  duration: number
): Promise<void> {
  await prisma.partsFeedImportLog.create({
    data: {
      feedConfigId,
      status,
      totalItems: result.totalItems,
      created: result.created,
      updated: result.updated,
      deactivated: result.deactivated,
      errors: result.errors,
      errorDetails: result.errorDetails.length > 0 ? JSON.stringify(result.errorDetails) : null,
      duration,
    },
  });
}

/**
 * Importuje všechny aktivní feedy podle frekvence.
 * Volá se z cron jobu.
 */
export async function importDueFeeds(frequency?: string): Promise<{
  imported: number;
  failed: number;
  results: Array<{ configId: string; name: string; status: string }>;
}> {
  const where: Record<string, unknown> = { isActive: true };
  if (frequency) {
    where.updateFrequency = frequency;
  }

  const configs = await prisma.partsFeedConfig.findMany({ where });

  const results: Array<{ configId: string; name: string; status: string }> = [];
  let imported = 0;
  let failed = 0;

  for (const config of configs) {
    try {
      const result = await importFeed(config.id);
      const status = result.errors === 0 ? "SUCCESS" : "PARTIAL";
      results.push({ configId: config.id, name: config.name, status });
      imported++;
    } catch {
      results.push({ configId: config.id, name: config.name, status: "FAILED" });
      failed++;
    }
  }

  return { imported, failed, results };
}
