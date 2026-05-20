/**
 * Brand/Model slug mapping for market data fetchers.
 * AS24 uses lowercase slugs, Mobile.de uses UPPERCASE.
 */

// Models that need special slug mapping on AutoScout24
const AS24_MODEL_OVERRIDES: Record<string, Record<string, string>> = {
  bmw: {
    "3": "3er-(alle)",
    "5": "5er-(alle)",
    "1": "1er-(alle)",
    "7": "7er-(alle)",
    X3: "x3",
    X5: "x5",
    X1: "x1",
  },
  "mercedes-benz": {
    C: "c-klasse",
    E: "e-klasse",
    A: "a-klasse",
    S: "s-klasse",
    GLC: "glc",
    GLE: "gle",
  },
  volkswagen: {
    "Golf": "golf",
    "Passat": "passat",
    "Tiguan": "tiguan",
    "Polo": "polo",
    "T-Roc": "t-roc",
  },
};

/** "Skoda" -> "skoda", "Mercedes-Benz" -> "mercedes-benz" */
export function brandToAS24Slug(brand: string): string {
  return brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

/** Model to AS24 slug with override support */
export function modelToAS24Slug(brand: string, model: string): string {
  const brandSlug = brandToAS24Slug(brand);
  const override = AS24_MODEL_OVERRIDES[brandSlug]?.[model];
  if (override) return override;
  return model
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

/** "Skoda" -> "SKODA", "Mercedes-Benz" -> "MERCEDES_BENZ" */
export function brandToMobileDe(brand: string): string {
  return brand
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

/** Model to Mobile.de format (UPPERCASE) */
export function modelToMobileDe(model: string): string {
  return model
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}
