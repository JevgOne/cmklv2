// ============================================
// Feed Export — XML generátory pro Sauto, TipCars, Bazoš
// ============================================

export interface ExportableListing {
  id: string;
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
  vatStatus: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  city: string;
  district: string | null;
  description: string | null;
  equipment: string | null;
  images: { url: string; order: number; isPrimary: boolean }[];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `    <${name}>${escapeXml(String(value))}</${name}>`;
}

// ============================================
// Sauto XML Feed
// ============================================

export function generateSautoFeed(listings: ExportableListing[]): string {
  const items = listings.map((l) => {
    const imagesTags = l.images
      .sort((a, b) => a.order - b.order)
      .map((img) => `      <image_url>${escapeXml(img.url)}</image_url>`)
      .join("\n");

    const equipmentItems = parseEquipment(l.equipment);
    const equipmentTag = equipmentItems.length > 0
      ? `    <equipment>${escapeXml(equipmentItems.join(", "))}</equipment>`
      : "";

    return `  <ad>
${tag("id", l.id)}
${tag("manufacturer", l.brand)}
${tag("model", l.model)}
${tag("variant", l.variant)}
${tag("year", l.year)}
${tag("mileage", l.mileage)}
${tag("fuel_type", mapFuelToSauto(l.fuelType))}
${tag("gearbox", mapTransmissionToSauto(l.transmission))}
${tag("power", l.enginePower)}
${tag("engine_capacity", l.engineCapacity)}
${tag("body_type", mapBodyToSauto(l.bodyType))}
${tag("color", l.color)}
${tag("doors", l.doorsCount)}
${tag("seats", l.seatsCount)}
${tag("condition", mapConditionToSauto(l.condition))}
${tag("price", l.price)}
${tag("price_negotiable", l.priceNegotiable)}
${tag("vat_status", l.vatStatus)}
${tag("vin", l.vin)}
${tag("contact_name", l.contactName)}
${tag("contact_phone", l.contactPhone)}
${tag("contact_email", l.contactEmail)}
${tag("city", l.city)}
${tag("district", l.district)}
${tag("description", l.description)}
${equipmentTag}
${tag("url", `https://carmakler.cz/inzerat/${l.slug}`)}
    <images>
${imagesTags}
    </images>
  </ad>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sauto_export generated="${new Date().toISOString()}" count="${listings.length}">
${items}
</sauto_export>`;
}

// ============================================
// TipCars XML Feed
// ============================================

export function generateTipCarsFeed(listings: ExportableListing[]): string {
  const items = listings.map((l) => {
    const photosTags = l.images
      .sort((a, b) => a.order - b.order)
      .map((img) => `      <photo_url>${escapeXml(img.url)}</photo_url>`)
      .join("\n");

    const equipmentItems = parseEquipment(l.equipment);
    const equipmentTag = equipmentItems.length > 0
      ? `    <equipment_list>${escapeXml(equipmentItems.join("; "))}</equipment_list>`
      : "";

    return `  <vehicle>
${tag("id", l.id)}
${tag("make", l.brand)}
${tag("model", l.model)}
${tag("version", l.variant)}
${tag("year", l.year)}
${tag("km", l.mileage)}
${tag("fuel", mapFuelToTipCars(l.fuelType))}
${tag("transmission", mapTransmissionToTipCars(l.transmission))}
${tag("power_kw", l.enginePower)}
${tag("engine_volume", l.engineCapacity)}
${tag("body", mapBodyToTipCars(l.bodyType))}
${tag("color", l.color)}
${tag("doors", l.doorsCount)}
${tag("seats", l.seatsCount)}
${tag("condition", l.condition)}
${tag("price", l.price)}
${tag("negotiable", l.priceNegotiable)}
${tag("vin", l.vin)}
${tag("dealer_name", l.contactName)}
${tag("dealer_phone", l.contactPhone)}
${tag("dealer_email", l.contactEmail)}
${tag("city", l.city)}
${tag("region", l.district)}
${tag("description", l.description)}
${equipmentTag}
${tag("url", `https://carmakler.cz/inzerat/${l.slug}`)}
    <photos>
${photosTags}
    </photos>
  </vehicle>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<tipcars_export generated="${new Date().toISOString()}" count="${listings.length}">
${items}
</tipcars_export>`;
}

// ============================================
// Bazoš XML Feed
// ============================================

export function generateBazosFeed(listings: ExportableListing[]): string {
  const items = listings.map((l) => {
    const primaryImage = l.images.find((i) => i.isPrimary) || l.images[0];
    const additionalImages = l.images
      .filter((i) => !i.isPrimary)
      .sort((a, b) => a.order - b.order)
      .map((img) => `      <photo>${escapeXml(img.url)}</photo>`)
      .join("\n");

    return `  <inzerat>
${tag("id", l.id)}
${tag("nadpis", `${l.brand} ${l.model}${l.variant ? ` ${l.variant}` : ""}, ${l.year}, ${formatMileage(l.mileage)}`)}
${tag("popis", l.description || `${l.brand} ${l.model}, rok ${l.year}, najeto ${formatMileage(l.mileage)}, ${mapFuelToCz(l.fuelType)}, ${mapTransmissionToCz(l.transmission)}`)}
${tag("cena", l.price)}
${tag("lokalita", l.city)}
${tag("jmeno", l.contactName)}
${tag("telefon", l.contactPhone)}
${tag("email", l.contactEmail)}
${primaryImage ? tag("hlavni_foto", primaryImage.url) : ""}
${tag("url", `https://carmakler.cz/inzerat/${l.slug}`)}
    <dalsi_fotky>
${additionalImages}
    </dalsi_fotky>
  </inzerat>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<bazos_export generated="${new Date().toISOString()}" count="${listings.length}">
${items}
</bazos_export>`;
}

// ============================================
// Mapovací funkce pro jednotlivé portály
// ============================================

function parseEquipment(equipment: string | null): string[] {
  if (!equipment) return [];
  try {
    return JSON.parse(equipment);
  } catch {
    return [];
  }
}

function formatMileage(km: number): string {
  return `${new Intl.NumberFormat("cs-CZ").format(km)} km`;
}

const FUEL_CZ: Record<string, string> = {
  PETROL: "Benzín",
  DIESEL: "Nafta",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

const TRANSMISSION_CZ: Record<string, string> = {
  MANUAL: "Manuální",
  AUTOMATIC: "Automatická",
  DSG: "DSG",
  CVT: "CVT",
};

function mapFuelToCz(fuel: string): string {
  return FUEL_CZ[fuel] || fuel;
}

function mapTransmissionToCz(trans: string): string {
  return TRANSMISSION_CZ[trans] || trans;
}

function mapFuelToSauto(fuel: string): string {
  const map: Record<string, string> = {
    PETROL: "benzin",
    DIESEL: "nafta",
    ELECTRIC: "elektro",
    HYBRID: "hybrid",
    PLUGIN_HYBRID: "plug-in-hybrid",
    LPG: "lpg",
    CNG: "cng",
  };
  return map[fuel] || fuel.toLowerCase();
}

function mapTransmissionToSauto(trans: string): string {
  const map: Record<string, string> = {
    MANUAL: "manual",
    AUTOMATIC: "automat",
    DSG: "dsg",
    CVT: "cvt",
  };
  return map[trans] || trans.toLowerCase();
}

function mapBodyToSauto(body: string | null): string | null {
  if (!body) return null;
  const map: Record<string, string> = {
    SEDAN: "sedan",
    HATCHBACK: "hatchback",
    COMBI: "combi",
    SUV: "suv",
    COUPE: "coupe",
    CABRIO: "kabriolet",
    VAN: "mpv",
    PICKUP: "pickup",
  };
  return map[body] || body.toLowerCase();
}

function mapConditionToSauto(cond: string): string {
  const map: Record<string, string> = {
    NEW: "nove",
    LIKE_NEW: "jako-nove",
    EXCELLENT: "vyborny",
    GOOD: "dobry",
    FAIR: "uspokjivy",
    DAMAGED: "poskozene",
  };
  return map[cond] || cond.toLowerCase();
}

function mapFuelToTipCars(fuel: string): string {
  const map: Record<string, string> = {
    PETROL: "Benzín",
    DIESEL: "Nafta",
    ELECTRIC: "Elektro",
    HYBRID: "Hybrid",
    PLUGIN_HYBRID: "Plug-in hybrid",
    LPG: "LPG",
    CNG: "CNG",
  };
  return map[fuel] || fuel;
}

function mapTransmissionToTipCars(trans: string): string {
  const map: Record<string, string> = {
    MANUAL: "Manuální",
    AUTOMATIC: "Automatická",
    DSG: "DSG",
    CVT: "CVT",
  };
  return map[trans] || trans;
}

function mapBodyToTipCars(body: string | null): string | null {
  if (!body) return null;
  const map: Record<string, string> = {
    SEDAN: "Sedan",
    HATCHBACK: "Hatchback",
    COMBI: "Kombi",
    SUV: "SUV",
    COUPE: "Kupé",
    CABRIO: "Kabriolet",
    VAN: "MPV/Van",
    PICKUP: "Pick-up",
  };
  return map[body] || body;
}
