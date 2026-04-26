// TecDoc service — mock implementace
// Po získání TecDoc API klíčů (task #21) vyměnit mock za reálné API volání

export interface KTypeResult {
  kTypeId: number;
  brand: string;
  model: string;
  year: number | null;
  variant: string | null;
  engine: string | null;
  fuel: string | null;
  transmission: string | null;
}

export interface TecdocProductGroup {
  id: number;
  name: string;
  parentId: number | null;
}

export interface TecdocArticle {
  articleId: number;
  name: string;
  productGroup: string;
  suggestedPrice: { A: number; B: number; C: number };
}

// ── Mock data ────────────────────────────────────────────────

const MOCK_VEHICLES: Record<string, KTypeResult> = {
  TMBAG: {
    kTypeId: 48078,
    brand: "Škoda",
    model: "Octavia III",
    year: 2019,
    variant: "Combi 2.0 TDI 150 PS",
    engine: "DFGA",
    fuel: "Diesel",
    transmission: "DSG7",
  },
  WVWZZ: {
    kTypeId: 45123,
    brand: "Volkswagen",
    model: "Golf VII",
    year: 2018,
    variant: "1.4 TSI 150 PS",
    engine: "CZEA",
    fuel: "Benzín",
    transmission: "DSG7",
  },
  WBAPH: {
    kTypeId: 42567,
    brand: "BMW",
    model: "320d F30",
    year: 2017,
    variant: "2.0d 190 PS",
    engine: "B47D20",
    fuel: "Diesel",
    transmission: "Automat 8st",
  },
  WAUZZ: {
    kTypeId: 50234,
    brand: "Audi",
    model: "A4 B9",
    year: 2020,
    variant: "2.0 TDI 150 PS",
    engine: "DETA",
    fuel: "Diesel",
    transmission: "S-Tronic 7",
  },
  WDD20: {
    kTypeId: 47890,
    brand: "Mercedes-Benz",
    model: "C220d W205",
    year: 2019,
    variant: "2.0d 194 PS",
    engine: "OM654",
    fuel: "Diesel",
    transmission: "9G-Tronic",
  },
};

type PartCategory =
  | "ENGINE_BAY"
  | "FRONT"
  | "REAR"
  | "LEFT"
  | "RIGHT"
  | "ROOF"
  | "UNDERBODY"
  | "INTERIOR";

const GENERIC_PARTS: TecdocArticle[] = [
  // ENGINE_BAY
  { articleId: 1001, name: "Motor komplet", productGroup: "ENGINE_BAY", suggestedPrice: { A: 45000, B: 35000, C: 22000 } },
  { articleId: 1002, name: "Turbodmychadlo", productGroup: "ENGINE_BAY", suggestedPrice: { A: 12000, B: 8500, C: 5000 } },
  { articleId: 1003, name: "Alternátor", productGroup: "ENGINE_BAY", suggestedPrice: { A: 3500, B: 2500, C: 1500 } },
  { articleId: 1004, name: "Startér", productGroup: "ENGINE_BAY", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },
  { articleId: 1005, name: "AC kompresor", productGroup: "ENGINE_BAY", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
  { articleId: 1006, name: "Posilovač řízení", productGroup: "ENGINE_BAY", suggestedPrice: { A: 4000, B: 2800, C: 1800 } },
  { articleId: 1007, name: "Převodovka", productGroup: "ENGINE_BAY", suggestedPrice: { A: 35000, B: 25000, C: 15000 } },
  { articleId: 1008, name: "Rozvodová sada", productGroup: "ENGINE_BAY", suggestedPrice: { A: 3000, B: 2000, C: 1000 } },
  { articleId: 1009, name: "Vstřikovače (sada)", productGroup: "ENGINE_BAY", suggestedPrice: { A: 8000, B: 5500, C: 3500 } },
  { articleId: 1010, name: "EGR ventil", productGroup: "ENGINE_BAY", suggestedPrice: { A: 4000, B: 2800, C: 1500 } },

  // FRONT
  { articleId: 1020, name: "Přední nárazník", productGroup: "FRONT", suggestedPrice: { A: 4500, B: 3000, C: 1500 } },
  { articleId: 1021, name: "Levý přední světlomet", productGroup: "FRONT", suggestedPrice: { A: 8000, B: 5500, C: 3000 } },
  { articleId: 1022, name: "Pravý přední světlomet", productGroup: "FRONT", suggestedPrice: { A: 8000, B: 5500, C: 3000 } },
  { articleId: 1023, name: "Kapota", productGroup: "FRONT", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
  { articleId: 1024, name: "Přední maska / gril", productGroup: "FRONT", suggestedPrice: { A: 2500, B: 1800, C: 1000 } },
  { articleId: 1025, name: "Chladič", productGroup: "FRONT", suggestedPrice: { A: 3500, B: 2500, C: 1500 } },
  { articleId: 1026, name: "Levý přední blatník", productGroup: "FRONT", suggestedPrice: { A: 3000, B: 2000, C: 1000 } },
  { articleId: 1027, name: "Pravý přední blatník", productGroup: "FRONT", suggestedPrice: { A: 3000, B: 2000, C: 1000 } },
  { articleId: 1028, name: "Levá mlhovka", productGroup: "FRONT", suggestedPrice: { A: 1500, B: 1000, C: 500 } },
  { articleId: 1029, name: "Pravá mlhovka", productGroup: "FRONT", suggestedPrice: { A: 1500, B: 1000, C: 500 } },

  // REAR
  { articleId: 1030, name: "Zadní nárazník", productGroup: "REAR", suggestedPrice: { A: 3500, B: 2500, C: 1200 } },
  { articleId: 1031, name: "Levé zadní světlo", productGroup: "REAR", suggestedPrice: { A: 4000, B: 2800, C: 1500 } },
  { articleId: 1032, name: "Pravé zadní světlo", productGroup: "REAR", suggestedPrice: { A: 4000, B: 2800, C: 1500 } },
  { articleId: 1033, name: "Víko kufru / páté dveře", productGroup: "REAR", suggestedPrice: { A: 6000, B: 4000, C: 2500 } },
  { articleId: 1034, name: "Zadní výztuha", productGroup: "REAR", suggestedPrice: { A: 2500, B: 1800, C: 1000 } },
  { articleId: 1035, name: "Levý zadní blatník", productGroup: "REAR", suggestedPrice: { A: 3500, B: 2500, C: 1500 } },
  { articleId: 1036, name: "Pravý zadní blatník", productGroup: "REAR", suggestedPrice: { A: 3500, B: 2500, C: 1500 } },

  // LEFT
  { articleId: 1040, name: "Levé přední dveře", productGroup: "LEFT", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
  { articleId: 1041, name: "Levé zadní dveře", productGroup: "LEFT", suggestedPrice: { A: 4500, B: 3000, C: 1800 } },
  { articleId: 1042, name: "Levý práh", productGroup: "LEFT", suggestedPrice: { A: 2000, B: 1500, C: 800 } },
  { articleId: 1043, name: "Levé zpětné zrcátko", productGroup: "LEFT", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },

  // RIGHT
  { articleId: 1050, name: "Pravé přední dveře", productGroup: "RIGHT", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
  { articleId: 1051, name: "Pravé zadní dveře", productGroup: "RIGHT", suggestedPrice: { A: 4500, B: 3000, C: 1800 } },
  { articleId: 1052, name: "Pravý práh", productGroup: "RIGHT", suggestedPrice: { A: 2000, B: 1500, C: 800 } },
  { articleId: 1053, name: "Pravé zpětné zrcátko", productGroup: "RIGHT", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },

  // ROOF
  { articleId: 1060, name: "Střecha", productGroup: "ROOF", suggestedPrice: { A: 8000, B: 5500, C: 3000 } },
  { articleId: 1061, name: "Sloupek A (levý)", productGroup: "ROOF", suggestedPrice: { A: 2000, B: 1500, C: 800 } },
  { articleId: 1062, name: "Sloupek A (pravý)", productGroup: "ROOF", suggestedPrice: { A: 2000, B: 1500, C: 800 } },
  { articleId: 1063, name: "Sloupek B (levý)", productGroup: "ROOF", suggestedPrice: { A: 2500, B: 1800, C: 1000 } },
  { articleId: 1064, name: "Sloupek B (pravý)", productGroup: "ROOF", suggestedPrice: { A: 2500, B: 1800, C: 1000 } },
  { articleId: 1065, name: "Panoramatické okno", productGroup: "ROOF", suggestedPrice: { A: 12000, B: 8000, C: 5000 } },

  // UNDERBODY
  { articleId: 1070, name: "Přední náprava komplet", productGroup: "UNDERBODY", suggestedPrice: { A: 8000, B: 5500, C: 3500 } },
  { articleId: 1071, name: "Zadní náprava komplet", productGroup: "UNDERBODY", suggestedPrice: { A: 6000, B: 4000, C: 2500 } },
  { articleId: 1072, name: "Poloos levá", productGroup: "UNDERBODY", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },
  { articleId: 1073, name: "Poloos pravá", productGroup: "UNDERBODY", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },
  { articleId: 1074, name: "Výfukový systém", productGroup: "UNDERBODY", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
  { articleId: 1075, name: "Katalyzátor / DPF", productGroup: "UNDERBODY", suggestedPrice: { A: 8000, B: 5500, C: 3000 } },
  { articleId: 1076, name: "Přední ramena (sada)", productGroup: "UNDERBODY", suggestedPrice: { A: 4000, B: 2800, C: 1500 } },
  { articleId: 1077, name: "Zadní ramena (sada)", productGroup: "UNDERBODY", suggestedPrice: { A: 3500, B: 2500, C: 1200 } },
  { articleId: 1078, name: "Tlumiče přední (pár)", productGroup: "UNDERBODY", suggestedPrice: { A: 4000, B: 2800, C: 1500 } },
  { articleId: 1079, name: "Tlumiče zadní (pár)", productGroup: "UNDERBODY", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },

  // INTERIOR
  { articleId: 1080, name: "Přední sedačky (pár)", productGroup: "INTERIOR", suggestedPrice: { A: 8000, B: 5000, C: 3000 } },
  { articleId: 1081, name: "Zadní sedačky", productGroup: "INTERIOR", suggestedPrice: { A: 4000, B: 2800, C: 1500 } },
  { articleId: 1082, name: "Palubovka komplet", productGroup: "INTERIOR", suggestedPrice: { A: 6000, B: 4000, C: 2500 } },
  { articleId: 1083, name: "Volant (multifunkční)", productGroup: "INTERIOR", suggestedPrice: { A: 4000, B: 2800, C: 1500 } },
  { articleId: 1084, name: "Airbag řidiče", productGroup: "INTERIOR", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
  { articleId: 1085, name: "Airbag spolujezdce", productGroup: "INTERIOR", suggestedPrice: { A: 4000, B: 2800, C: 1500 } },
  { articleId: 1086, name: "Řídící jednotka motoru", productGroup: "INTERIOR", suggestedPrice: { A: 6000, B: 4000, C: 2500 } },
  { articleId: 1087, name: "Navigace / infotainment", productGroup: "INTERIOR", suggestedPrice: { A: 8000, B: 5500, C: 3500 } },
  { articleId: 1088, name: "Klimatizace panel", productGroup: "INTERIOR", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },
  { articleId: 1089, name: "Kabelový svazek", productGroup: "INTERIOR", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
];

const PRODUCT_GROUPS: TecdocProductGroup[] = [
  { id: 1, name: "Motorový prostor", parentId: null },
  { id: 2, name: "Přední karoserie", parentId: null },
  { id: 3, name: "Zadní karoserie", parentId: null },
  { id: 4, name: "Levý bok", parentId: null },
  { id: 5, name: "Pravý bok", parentId: null },
  { id: 6, name: "Střecha", parentId: null },
  { id: 7, name: "Podvozek", parentId: null },
  { id: 8, name: "Interiér", parentId: null },
];

const GROUP_MAP: Record<string, string> = {
  ENGINE_BAY: "Motorový prostor",
  FRONT: "Přední karoserie",
  REAR: "Zadní karoserie",
  LEFT: "Levý bok",
  RIGHT: "Pravý bok",
  ROOF: "Střecha",
  UNDERBODY: "Podvozek",
  INTERIOR: "Interiér",
};

// ── Public API ───────────────────────────────────────────────

export async function vinToKType(vin: string): Promise<KTypeResult | null> {
  // Mock: match by VIN prefix (first 5 chars)
  const prefix = vin.substring(0, 5).toUpperCase();
  return MOCK_VEHICLES[prefix] ?? null;
}

export async function getProductGroupsForKType(
  _kTypeId: number
): Promise<TecdocProductGroup[]> {
  return PRODUCT_GROUPS;
}

export async function getPartsForKType(
  _kTypeId: number
): Promise<TecdocArticle[]> {
  return GENERIC_PARTS;
}

export function getGroupName(productGroup: string): string {
  return GROUP_MAP[productGroup] ?? productGroup;
}

export function getGroupsForParts(
  parts: TecdocArticle[]
): { group: string; groupName: string; parts: TecdocArticle[] }[] {
  const grouped = new Map<string, TecdocArticle[]>();
  for (const part of parts) {
    const list = grouped.get(part.productGroup) ?? [];
    list.push(part);
    grouped.set(part.productGroup, list);
  }
  return Array.from(grouped.entries()).map(([group, groupParts]) => ({
    group,
    groupName: GROUP_MAP[group] ?? group,
    parts: groupParts,
  }));
}
