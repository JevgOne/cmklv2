import type {
  DataSource,
  Confidence,
  FieldWithSource,
  SmartLookupResult,
  VinDecoderResult,
} from "@/types/vehicle-draft";
import type { CebiaCheckResult } from "@/lib/cebia";

// ============================================
// VIN Merge — priority: DB > CEBIA > Vincario > NHTSA
// ============================================

/** Confidence per source */
const SOURCE_CONFIDENCE: Record<DataSource, Confidence> = {
  db: "high",
  cebia: "high",
  vincario: "high",
  nhtsa: "medium",
};

/** Priority order (lower index = higher priority) */
const SOURCE_PRIORITY: DataSource[] = ["db", "cebia", "vincario", "nhtsa"];

interface DbVehicleData {
  id: string;
  brand: string;
  model: string;
  variant?: string | null;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  enginePower?: number | null;
  engineCapacity?: number | null;
  bodyType?: string | null;
  color?: string | null;
  doorsCount?: number | null;
  seatsCount?: number | null;
  drivetrain?: string | null;
  condition: string;
  ownerCount?: number | null;
}

function makeField<T>(
  value: T | undefined | null,
  source: DataSource
): FieldWithSource<T> | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return {
    value: value as T,
    source,
    confidence: SOURCE_CONFIDENCE[source],
    editable: SOURCE_CONFIDENCE[source] !== "high",
  };
}

function pickHigherPriority<T>(
  existing: FieldWithSource<T> | undefined,
  candidate: FieldWithSource<T> | undefined
): FieldWithSource<T> | undefined {
  if (!candidate) return existing;
  if (!existing) return candidate;

  const existingIdx = SOURCE_PRIORITY.indexOf(existing.source);
  const candidateIdx = SOURCE_PRIORITY.indexOf(candidate.source);

  // Lower index = higher priority
  return candidateIdx < existingIdx ? candidate : existing;
}

/** Convert DB vehicle record to per-field map */
function dbToFields(
  data: DbVehicleData
): Partial<SmartLookupResult["fields"]> {
  return {
    brand: makeField(data.brand, "db"),
    model: makeField(data.model, "db"),
    variant: makeField(data.variant, "db"),
    year: makeField(data.year, "db"),
    mileage: makeField(data.mileage, "db"),
    fuelType: makeField(data.fuelType, "db"),
    transmission: makeField(data.transmission, "db"),
    enginePower: makeField(data.enginePower, "db"),
    engineCapacity: makeField(data.engineCapacity, "db"),
    bodyType: makeField(data.bodyType, "db"),
    color: makeField(data.color, "db"),
    doorsCount: makeField(data.doorsCount, "db"),
    seatsCount: makeField(data.seatsCount, "db"),
    drivetrain: makeField(data.drivetrain, "db"),
    condition: makeField(data.condition, "db"),
    ownerCount: makeField(data.ownerCount, "db"),
  };
}

/** Convert VinDecoderResult to per-field map */
function decoderToFields(
  data: VinDecoderResult,
  source: DataSource
): Partial<SmartLookupResult["fields"]> {
  return {
    brand: makeField(data.brand, source),
    model: makeField(data.model, source),
    variant: makeField(data.variant, source),
    year: makeField(data.year, source),
    fuelType: makeField(data.fuelType, source),
    transmission: makeField(data.transmission, source),
    enginePower: makeField(data.enginePower, source),
    engineCapacity: makeField(data.engineCapacity, source),
    bodyType: makeField(data.bodyType, source),
    drivetrain: makeField(data.drivetrain, source),
    color: makeField(data.color, source),
    doorsCount: makeField(data.doorsCount, source),
    seatsCount: makeField(data.seatsCount, source),
  };
}

type FieldKey = keyof SmartLookupResult["fields"];

/** Merge two field maps — higher priority wins */
function mergeFieldMaps(
  base: Partial<SmartLookupResult["fields"]>,
  overlay: Partial<SmartLookupResult["fields"]>
): SmartLookupResult["fields"] {
  const allKeys = new Set([
    ...Object.keys(base),
    ...Object.keys(overlay),
  ]) as Set<FieldKey>;

  const result: SmartLookupResult["fields"] = {};

  for (const key of allKeys) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merged = pickHigherPriority(base[key] as any, overlay[key] as any);
    if (merged) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = merged;
    }
  }

  return result;
}

/**
 * Merge all VIN data sources into a single SmartLookupResult.
 * Priority: DB > CEBIA > Vincario > NHTSA
 */
export function mergeVinSources(options: {
  dbData?: DbVehicleData | null;
  cebiaData?: CebiaCheckResult | null;
  vincarioData?: VinDecoderResult | null;
  nhtsaData?: VinDecoderResult | null;
}): SmartLookupResult {
  const { dbData, cebiaData, vincarioData, nhtsaData } = options;

  const sources: DataSource[] = [];

  // Start with lowest priority, merge upward
  let fields: SmartLookupResult["fields"] = {};

  // NHTSA (lowest priority)
  if (nhtsaData?.brand) {
    fields = mergeFieldMaps(fields, decoderToFields(nhtsaData, "nhtsa"));
    sources.push("nhtsa");
  }

  // Vincario
  if (vincarioData?.brand) {
    fields = mergeFieldMaps(fields, decoderToFields(vincarioData, "vincario"));
    sources.push("vincario");
  }

  // CEBIA — only provides history data, not technical specs
  // (mileage could be extracted from CEBIA odometer check)
  if (cebiaData?.data) {
    sources.push("cebia");
  }

  // DB (highest priority)
  if (dbData) {
    fields = mergeFieldMaps(fields, dbToFields(dbData));
    sources.push("db");
  }

  // Build CEBIA report summary
  const cebiaReport = cebiaData
    ? {
        status: cebiaData.status,
        reportUrl: cebiaData.reportUrl,
        stolen: cebiaData.data?.stolen,
        mileageOk: cebiaData.data?.mileageOk,
        damageFree: cebiaData.data?.damageFree,
        financingFree: cebiaData.data?.financingFree,
        registrationHistory: cebiaData.data?.registrationHistory,
      }
    : undefined;

  return {
    fields,
    sources,
    cebiaReport,
    existingVehicleId: dbData?.id ?? null,
  };
}

export type { DbVehicleData };
