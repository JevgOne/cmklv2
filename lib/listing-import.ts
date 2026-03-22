// ============================================
// Feed Import — parsery pro Sauto XML, TipCars XML, CSV
// ============================================

export interface ImportedListing {
  vin?: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  enginePower?: number;
  engineCapacity?: number;
  bodyType?: string;
  color?: string;
  doorsCount?: number;
  seatsCount?: number;
  condition: string;
  serviceBook?: boolean;
  stkValidUntil?: string;
  odometerStatus?: string;
  ownerCount?: number;
  originCountry?: string;
  price: number;
  priceNegotiable?: boolean;
  vatStatus?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  city: string;
  district?: string;
  description?: string;
  equipment?: string[];
  highlights?: string[];
  images?: { url: string; order: number; isPrimary: boolean }[];
}

// ============================================
// Pomocné XML parsovací funkce (bez externí knihovny)
// ============================================

function getTagContent(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function getAllTagContents(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

function getTagAttribute(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

// ============================================
// Normalizace hodnot
// ============================================

const FUEL_MAP: Record<string, string> = {
  benzin: "PETROL",
  benzín: "PETROL",
  petrol: "PETROL",
  gasoline: "PETROL",
  nafta: "DIESEL",
  diesel: "DIESEL",
  elektro: "ELECTRIC",
  electric: "ELECTRIC",
  ev: "ELECTRIC",
  hybrid: "HYBRID",
  "plug-in hybrid": "PLUGIN_HYBRID",
  "plug-in": "PLUGIN_HYBRID",
  phev: "PLUGIN_HYBRID",
  lpg: "LPG",
  cng: "CNG",
};

const TRANSMISSION_MAP: Record<string, string> = {
  manuální: "MANUAL",
  manual: "MANUAL",
  manuál: "MANUAL",
  automat: "AUTOMATIC",
  automatic: "AUTOMATIC",
  automatická: "AUTOMATIC",
  dsg: "DSG",
  cvt: "CVT",
};

const BODY_MAP: Record<string, string> = {
  sedan: "SEDAN",
  hatchback: "HATCHBACK",
  hatch: "HATCHBACK",
  combi: "COMBI",
  kombi: "COMBI",
  estate: "COMBI",
  suv: "SUV",
  coupé: "COUPE",
  coupe: "COUPE",
  kupé: "COUPE",
  kabriolet: "CABRIO",
  cabrio: "CABRIO",
  cabriolet: "CABRIO",
  convertible: "CABRIO",
  van: "VAN",
  mpv: "VAN",
  minivan: "VAN",
  pickup: "PICKUP",
  "pick-up": "PICKUP",
};

const CONDITION_MAP: Record<string, string> = {
  nové: "NEW",
  new: "NEW",
  "jako nové": "LIKE_NEW",
  "like new": "LIKE_NEW",
  výborný: "EXCELLENT",
  excellent: "EXCELLENT",
  dobrý: "GOOD",
  good: "GOOD",
  uspokojivý: "FAIR",
  fair: "FAIR",
  poškozené: "DAMAGED",
  damaged: "DAMAGED",
};

function normalizeFuel(raw: string): string {
  return FUEL_MAP[raw.toLowerCase().trim()] || "PETROL";
}

function normalizeTransmission(raw: string): string {
  return TRANSMISSION_MAP[raw.toLowerCase().trim()] || "MANUAL";
}

function normalizeBody(raw: string): string | undefined {
  return BODY_MAP[raw.toLowerCase().trim()];
}

function normalizeCondition(raw: string): string {
  return CONDITION_MAP[raw.toLowerCase().trim()] || "GOOD";
}

// ============================================
// Sauto XML Parser
// ============================================

export function parseSautoXml(xml: string): ImportedListing[] {
  const ads = getAllTagContents(xml, "ad");
  if (ads.length === 0) {
    // Zkusit alternativní tag
    const items = getAllTagContents(xml, "item");
    if (items.length === 0) return [];
    return items.map(parseSautoItem).filter(Boolean) as ImportedListing[];
  }
  return ads.map(parseSautoItem).filter(Boolean) as ImportedListing[];
}

function parseSautoItem(itemXml: string): ImportedListing | null {
  const brand = getTagContent(itemXml, "manufacturer") || getTagContent(itemXml, "brand");
  const model = getTagContent(itemXml, "model");
  const yearStr = getTagContent(itemXml, "year") || getTagContent(itemXml, "manufacturing_year");
  const priceStr = getTagContent(itemXml, "price");

  if (!brand || !model || !yearStr || !priceStr) return null;

  const images: ImportedListing["images"] = [];
  const imageUrls = getAllTagContents(itemXml, "image_url");
  const photoUrls = getAllTagContents(itemXml, "photo");
  const allUrls = [...imageUrls, ...photoUrls];
  allUrls.forEach((url, i) => {
    if (url) images.push({ url, order: i, isPrimary: i === 0 });
  });

  const equipmentStr = getTagContent(itemXml, "equipment");
  const equipment = equipmentStr
    ? equipmentStr.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  return {
    vin: getTagContent(itemXml, "vin") || undefined,
    brand,
    model,
    variant: getTagContent(itemXml, "variant") || undefined,
    year: parseInt(yearStr, 10),
    mileage: parseInt(getTagContent(itemXml, "mileage") || getTagContent(itemXml, "tachometer") || "0", 10),
    fuelType: normalizeFuel(getTagContent(itemXml, "fuel") || getTagContent(itemXml, "fuel_type") || ""),
    transmission: normalizeTransmission(getTagContent(itemXml, "gearbox") || getTagContent(itemXml, "transmission") || ""),
    enginePower: parseInt(getTagContent(itemXml, "power") || "0", 10) || undefined,
    engineCapacity: parseInt(getTagContent(itemXml, "engine_capacity") || getTagContent(itemXml, "displacement") || "0", 10) || undefined,
    bodyType: normalizeBody(getTagContent(itemXml, "body_type") || getTagContent(itemXml, "category") || ""),
    color: getTagContent(itemXml, "color") || undefined,
    doorsCount: parseInt(getTagContent(itemXml, "doors") || "0", 10) || undefined,
    seatsCount: parseInt(getTagContent(itemXml, "seats") || "0", 10) || undefined,
    condition: normalizeCondition(getTagContent(itemXml, "condition") || getTagContent(itemXml, "vehicle_condition") || "good"),
    price: parseInt(priceStr.replace(/\s/g, ""), 10),
    priceNegotiable: getTagContent(itemXml, "price_negotiable") === "true" || getTagContent(itemXml, "price_negotiable") === "1",
    contactName: getTagContent(itemXml, "contact_name") || getTagContent(itemXml, "seller_name") || "Inzerent",
    contactPhone: getTagContent(itemXml, "contact_phone") || getTagContent(itemXml, "phone") || "",
    contactEmail: getTagContent(itemXml, "contact_email") || getTagContent(itemXml, "email") || undefined,
    city: getTagContent(itemXml, "city") || getTagContent(itemXml, "location") || "",
    district: getTagContent(itemXml, "district") || undefined,
    description: getTagContent(itemXml, "description") || getTagContent(itemXml, "text") || undefined,
    equipment,
    images: images.length > 0 ? images : undefined,
  };
}

// ============================================
// TipCars XML Parser
// ============================================

export function parseTipCarsXml(xml: string): ImportedListing[] {
  const vehicles = getAllTagContents(xml, "vehicle");
  if (vehicles.length === 0) {
    const cars = getAllTagContents(xml, "car");
    if (cars.length === 0) return [];
    return cars.map(parseTipCarsItem).filter(Boolean) as ImportedListing[];
  }
  return vehicles.map(parseTipCarsItem).filter(Boolean) as ImportedListing[];
}

function parseTipCarsItem(itemXml: string): ImportedListing | null {
  const brand = getTagContent(itemXml, "make") || getTagContent(itemXml, "brand");
  const model = getTagContent(itemXml, "model");
  const yearStr = getTagContent(itemXml, "year") || getTagContent(itemXml, "first_registration_year");
  const priceStr = getTagContent(itemXml, "price") || getTagContent(itemXml, "selling_price");

  if (!brand || !model || !yearStr || !priceStr) return null;

  const images: ImportedListing["images"] = [];
  const photos = getAllTagContents(itemXml, "photo_url");
  const imgs = getAllTagContents(itemXml, "img");
  [...photos, ...imgs].forEach((url, i) => {
    if (url) images.push({ url, order: i, isPrimary: i === 0 });
  });

  const equipRaw = getTagContent(itemXml, "equipment_list") || getTagContent(itemXml, "features");
  const equipment = equipRaw
    ? equipRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    : undefined;

  return {
    vin: getTagContent(itemXml, "vin") || undefined,
    brand,
    model,
    variant: getTagContent(itemXml, "version") || getTagContent(itemXml, "variant") || undefined,
    year: parseInt(yearStr, 10),
    mileage: parseInt(getTagContent(itemXml, "km") || getTagContent(itemXml, "mileage") || "0", 10),
    fuelType: normalizeFuel(getTagContent(itemXml, "fuel") || getTagContent(itemXml, "fuel_type") || ""),
    transmission: normalizeTransmission(getTagContent(itemXml, "transmission") || getTagContent(itemXml, "gearbox") || ""),
    enginePower: parseInt(getTagContent(itemXml, "power_kw") || getTagContent(itemXml, "power") || "0", 10) || undefined,
    engineCapacity: parseInt(getTagContent(itemXml, "engine_volume") || getTagContent(itemXml, "ccm") || "0", 10) || undefined,
    bodyType: normalizeBody(getTagContent(itemXml, "body") || getTagContent(itemXml, "body_type") || ""),
    color: getTagContent(itemXml, "color") || getTagContent(itemXml, "colour") || undefined,
    doorsCount: parseInt(getTagContent(itemXml, "doors") || "0", 10) || undefined,
    seatsCount: parseInt(getTagContent(itemXml, "seats") || "0", 10) || undefined,
    condition: normalizeCondition(getTagContent(itemXml, "condition") || "good"),
    ownerCount: parseInt(getTagContent(itemXml, "owners") || "0", 10) || undefined,
    price: parseInt(priceStr.replace(/\s/g, ""), 10),
    priceNegotiable: getTagContent(itemXml, "negotiable") === "true" || getTagContent(itemXml, "negotiable") === "1",
    contactName: getTagContent(itemXml, "dealer_name") || getTagContent(itemXml, "contact") || "Inzerent",
    contactPhone: getTagContent(itemXml, "dealer_phone") || getTagContent(itemXml, "phone") || "",
    contactEmail: getTagContent(itemXml, "dealer_email") || getTagContent(itemXml, "email") || undefined,
    city: getTagContent(itemXml, "city") || getTagContent(itemXml, "location") || "",
    district: getTagContent(itemXml, "region") || undefined,
    description: getTagContent(itemXml, "description") || getTagContent(itemXml, "note") || undefined,
    equipment,
    images: images.length > 0 ? images : undefined,
  };
}

// ============================================
// CSV Parser
// ============================================

export function parseCsv(csv: string, customMapping?: Record<string, string>): ImportedListing[] {
  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const results: ImportedListing[] = [];

  // Výchozí mapování sloupců
  const defaultMapping: Record<string, string> = {
    vin: "vin",
    brand: "brand",
    značka: "brand",
    manufacturer: "brand",
    model: "model",
    variant: "variant",
    year: "year",
    rok: "year",
    mileage: "mileage",
    km: "mileage",
    najeto: "mileage",
    fuel: "fuelType",
    palivo: "fuelType",
    fuel_type: "fuelType",
    transmission: "transmission",
    převodovka: "transmission",
    gearbox: "transmission",
    power: "enginePower",
    výkon: "enginePower",
    engine_power: "enginePower",
    displacement: "engineCapacity",
    objem: "engineCapacity",
    engine_capacity: "engineCapacity",
    body_type: "bodyType",
    karoserie: "bodyType",
    color: "color",
    barva: "color",
    doors: "doorsCount",
    dveře: "doorsCount",
    seats: "seatsCount",
    místa: "seatsCount",
    condition: "condition",
    stav: "condition",
    price: "price",
    cena: "price",
    contact_name: "contactName",
    jméno: "contactName",
    seller_name: "contactName",
    contact_phone: "contactPhone",
    telefon: "contactPhone",
    phone: "contactPhone",
    contact_email: "contactEmail",
    email: "contactEmail",
    city: "city",
    město: "city",
    district: "district",
    okres: "district",
    description: "description",
    popis: "description",
  };

  const mapping = customMapping
    ? { ...defaultMapping, ...Object.fromEntries(Object.entries(customMapping).map(([k, v]) => [k.toLowerCase(), v])) }
    : defaultMapping;

  // Mapování header indexů na pole
  const fieldIndices: Record<string, number> = {};
  headers.forEach((h, i) => {
    const mapped = mapping[h];
    if (mapped) fieldIndices[mapped] = i;
  });

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 3) continue;

    const get = (field: string): string => {
      const idx = fieldIndices[field];
      return idx !== undefined ? (values[idx] || "").trim() : "";
    };

    const brand = get("brand");
    const model = get("model");
    const year = parseInt(get("year"), 10);
    const price = parseInt(get("price").replace(/\s/g, ""), 10);

    if (!brand || !model || isNaN(year) || isNaN(price)) continue;

    results.push({
      vin: get("vin") || undefined,
      brand,
      model,
      variant: get("variant") || undefined,
      year,
      mileage: parseInt(get("mileage").replace(/\s/g, ""), 10) || 0,
      fuelType: normalizeFuel(get("fuelType")),
      transmission: normalizeTransmission(get("transmission")),
      enginePower: parseInt(get("enginePower"), 10) || undefined,
      engineCapacity: parseInt(get("engineCapacity"), 10) || undefined,
      bodyType: normalizeBody(get("bodyType")),
      color: get("color") || undefined,
      doorsCount: parseInt(get("doorsCount"), 10) || undefined,
      seatsCount: parseInt(get("seatsCount"), 10) || undefined,
      condition: normalizeCondition(get("condition") || "good"),
      price,
      contactName: get("contactName") || "Inzerent",
      contactPhone: get("contactPhone") || "",
      contactEmail: get("contactEmail") || undefined,
      city: get("city") || "",
      district: get("district") || undefined,
      description: get("description") || undefined,
    });
  }

  return results;
}

function parseCsvLine(line: string): string[] {
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
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ============================================
// Normalize + deduplikace
// ============================================

export interface NormalizedListingInput {
  slug: string;
  vin: string | null;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  enginePower: number | null;
  engineCapacity: number | null;
  bodyType: string | null;
  color: string | null;
  doorsCount: number | null;
  seatsCount: number | null;
  condition: string;
  price: number;
  priceNegotiable: boolean;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  city: string;
  district: string | null;
  description: string | null;
  equipment: string | null;
  highlights: string | null;
  images?: { url: string; order: number; isPrimary: boolean }[];
}

function generateSlug(brand: string, model: string, year: number): string {
  const base = `${brand}-${model}-${year}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

export function normalizeImportData(items: ImportedListing[]): NormalizedListingInput[] {
  const seen = new Set<string>();
  const results: NormalizedListingInput[] = [];

  for (const item of items) {
    // Deduplikace na VIN
    const dedupeKey = item.vin
      ? `vin:${item.vin.toUpperCase()}`
      : `slug:${item.brand}-${item.model}-${item.year}-${item.mileage}-${item.price}`;

    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    results.push({
      slug: generateSlug(item.brand, item.model, item.year),
      vin: item.vin?.toUpperCase() || null,
      brand: item.brand,
      model: item.model,
      variant: item.variant || null,
      year: item.year,
      mileage: item.mileage,
      fuelType: item.fuelType,
      transmission: item.transmission,
      enginePower: item.enginePower || null,
      engineCapacity: item.engineCapacity || null,
      bodyType: item.bodyType || null,
      color: item.color || null,
      doorsCount: item.doorsCount || null,
      seatsCount: item.seatsCount || null,
      condition: item.condition,
      price: item.price,
      priceNegotiable: item.priceNegotiable ?? true,
      contactName: item.contactName,
      contactPhone: item.contactPhone,
      contactEmail: item.contactEmail || null,
      city: item.city,
      district: item.district || null,
      description: item.description || null,
      equipment: item.equipment ? JSON.stringify(item.equipment) : null,
      highlights: item.highlights ? JSON.stringify(item.highlights) : null,
      images: item.images,
    });
  }

  return results;
}
