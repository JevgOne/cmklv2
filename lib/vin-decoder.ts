import crypto from "crypto";
import type { VinDecoderResult } from "@/types/vehicle-draft";

const TIMEOUT_MS = 10_000;

// ============================================
// VIN Decoder — vindecoder.eu primary, NHTSA fallback
// ============================================

export async function decodeVin(vin: string): Promise<VinDecoderResult> {
  const normalized = vin.toUpperCase().trim();

  // Zkusit primární API (vindecoder.eu)
  const apiKey = process.env.VINDECODER_API_KEY;
  const apiSecret = process.env.VINDECODER_API_SECRET;

  if (apiKey && apiSecret) {
    try {
      const result = await decodeWithVinDecoderEu(normalized, apiKey, apiSecret);
      if (result.brand) {
        return result;
      }
    } catch (err) {
      console.warn("vindecoder.eu selhalo, zkouším NHTSA fallback:", err);
    }
  }

  // Fallback na NHTSA vPIC API (free, no key)
  try {
    return await decodeWithNhtsa(normalized);
  } catch (err) {
    console.warn("NHTSA fallback selhalo:", err);
    // Vrátit minimální výsledek — UI nabídne manuální zadání
    return { vin: normalized };
  }
}

// ============================================
// vindecoder.eu API
// ============================================

interface VinDecoderEuResponse {
  decode?: Array<{
    label: string;
    value: string | number | null;
  }>;
}

function createSecretHash(vin: string, apiKey: string, apiSecret: string): string {
  const input = `${vin}|${apiKey}|${apiSecret}`;
  return crypto.createHash("sha1").update(input, "utf8").digest("hex").substring(0, 10);
}

async function decodeWithVinDecoderEu(
  vin: string,
  apiKey: string,
  apiSecret: string
): Promise<VinDecoderResult> {
  const secretHash = createSecretHash(vin, apiKey, apiSecret);
  const url = `https://api.vindecoder.eu/3.2/${apiKey}/${secretHash}/decode/${vin}.json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`vindecoder.eu vrátil ${response.status}`);
    }

    const json: VinDecoderEuResponse = await response.json();
    return normalizeVinDecoderEu(vin, json);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeVinDecoderEu(
  vin: string,
  data: VinDecoderEuResponse
): VinDecoderResult {
  const entries = data.decode ?? [];
  const map = new Map<string, string | number | null>();

  for (const entry of entries) {
    map.set(entry.label.toLowerCase(), entry.value);
  }

  const strVal = (key: string): string | undefined => {
    const v = map.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  const numVal = (key: string): number | undefined => {
    const v = map.get(key);
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const parsed = parseInt(v, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  return {
    vin,
    brand: strVal("make"),
    model: strVal("model"),
    variant: strVal("trim"),
    year: numVal("model year"),
    fuelType: strVal("fuel type"),
    transmission: strVal("transmission"),
    enginePower: numVal("engine power (kw)") ?? numVal("power"),
    engineCapacity: numVal("engine displacement (ccm)") ?? numVal("displacement"),
    bodyType: strVal("body type") ?? strVal("body"),
    drivetrain: strVal("drive type") ?? strVal("driven wheels"),
    color: undefined,
    doorsCount: numVal("number of doors"),
    seatsCount: numVal("number of seats"),
    raw: Object.fromEntries(map),
  };
}

// ============================================
// NHTSA vPIC API (free fallback)
// ============================================

interface NhtsaResponse {
  Results: Array<{
    Variable: string;
    Value: string | null;
    ValueId: string | null;
    VariableId: number;
  }>;
}

async function decodeWithNhtsa(vin: string): Promise<VinDecoderResult> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`NHTSA API vrátil ${response.status}`);
    }

    const json = await response.json();
    return normalizeNhtsa(vin, json);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeNhtsa(
  vin: string,
  data: { Results?: Array<Record<string, string | null>> }
): VinDecoderResult {
  const record = data.Results?.[0] ?? {};

  // Check NHTSA error code — "5" means VIN has errors (common for EU VINs)
  const errorCode = record["ErrorCode"] ?? "";
  const hasErrors = errorCode.includes("5") || errorCode.includes("14");

  const strVal = (key: string): string | undefined => {
    const v = record[key];
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
  };

  const numVal = (key: string): number | undefined => {
    const v = record[key];
    if (!v) return undefined;
    const parsed = parseInt(v, 10);
    return isNaN(parsed) ? undefined : parsed;
  };

  // Detect EU VIN — positions 4-6 are often "ZZZ" (filler)
  const isEuropeanVin = vin.substring(3, 6) === "ZZZ";

  // For EU VINs, NHTSA year decode is unreliable — decode from VIN position 10
  let year = numVal("ModelYear");
  if (isEuropeanVin || hasErrors) {
    const vinYear = decodeYearFromVin(vin);
    if (vinYear && (!year || Math.abs(year - vinYear) > 5)) {
      year = vinYear;
    }
  }

  // If NHTSA returned no model (common for EU VINs), don't trust the data
  const model = strVal("Model");
  if (hasErrors && !model) {
    // NHTSA can't decode this VIN properly — return what we can
    return {
      vin,
      brand: strVal("Make"),
      model: undefined,
      year,
      raw: record as Record<string, unknown>,
    };
  }

  // Normalizace fuel type
  const rawFuel = strVal("FuelTypePrimary");
  const fuelType = normalizeFuelType(rawFuel);

  // Normalizace transmission
  const rawTrans = strVal("TransmissionStyle");
  const transmission = normalizeTransmission(rawTrans);

  // Normalizace body type
  const rawBody = strVal("BodyClass");
  const bodyType = normalizeBodyType(rawBody);

  // Normalizace drive type
  const rawDrive = strVal("DriveType");
  const drivetrain = normalizeDriveType(rawDrive);

  return {
    vin,
    brand: strVal("Make"),
    model,
    variant: strVal("Trim"),
    year,
    fuelType,
    transmission,
    enginePower: numVal("EngineKW"),
    engineCapacity: numVal("DisplacementCC"),
    bodyType,
    drivetrain,
    doorsCount: numVal("Doors"),
    seatsCount: numVal("Seats"),
    raw: record as Record<string, unknown>,
  };
}

// ============================================
// VIN Year Decode (position 10)
// ============================================

function decodeYearFromVin(vin: string): number | undefined {
  if (vin.length < 10) return undefined;
  const code = vin[9];
  const yearMap: Record<string, number> = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
    F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
    L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
    S: 2025, T: 2026, V: 2027, W: 2028, X: 2029,
    Y: 2030, "1": 2031, "2": 2032, "3": 2033,
    "4": 2034, "5": 2035, "6": 2036, "7": 2037,
    "8": 2038, "9": 2039,
  };
  return yearMap[code];
}

// ============================================
// Normalizace hodnot
// ============================================

function normalizeFuelType(raw?: string): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("diesel")) return "DIESEL";
  if (lower.includes("gasoline") || lower.includes("petrol") || lower.includes("benzin")) return "PETROL";
  if (lower.includes("electric") && lower.includes("plug")) return "PLUGIN_HYBRID";
  if (lower.includes("electric")) return "ELECTRIC";
  if (lower.includes("hybrid")) return "HYBRID";
  if (lower.includes("lpg")) return "LPG";
  if (lower.includes("cng") || lower.includes("natural gas")) return "CNG";
  return raw;
}

function normalizeTransmission(raw?: string): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("manual")) return "MANUAL";
  if (lower.includes("dsg") || lower.includes("dual")) return "DSG";
  if (lower.includes("cvt") || lower.includes("continuously")) return "CVT";
  if (lower.includes("automatic") || lower.includes("auto")) return "AUTOMATIC";
  return raw;
}

function normalizeBodyType(raw?: string): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("sedan")) return "SEDAN";
  if (lower.includes("hatchback")) return "HATCHBACK";
  if (lower.includes("wagon") || lower.includes("combi") || lower.includes("estate")) return "COMBI";
  if (lower.includes("suv") || lower.includes("sport utility")) return "SUV";
  if (lower.includes("coupe") || lower.includes("coupé")) return "COUPE";
  if (lower.includes("cabrio") || lower.includes("convertible")) return "CABRIO";
  if (lower.includes("van") || lower.includes("mpv")) return "VAN";
  if (lower.includes("pickup") || lower.includes("truck")) return "PICKUP";
  return raw;
}

function normalizeDriveType(raw?: string): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("4") || lower.includes("all") || lower.includes("awd")) return "4x4";
  if (lower.includes("rear") || lower.includes("rwd")) return "REAR";
  if (lower.includes("front") || lower.includes("fwd")) return "FRONT";
  return raw;
}
