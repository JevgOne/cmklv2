export type StkPriceGroup = "personal" | "motorcycle" | "commercial" | "trailer";

export interface StkPriceRow {
  category: string;
  label: string;
  stk: number;
  emise: number | null;
  total: number;
  group: StkPriceGroup;
  highlight?: boolean;
}

export const STK_PRICE_GROUPS: Record<StkPriceGroup, { label: string; icon: string }> = {
  personal: { label: "Osobní automobily", icon: "🚗" },
  motorcycle: { label: "Motocykly", icon: "🏍️" },
  commercial: { label: "Nákladní a autobusy", icon: "🚛" },
  trailer: { label: "Přívěsy a traktory", icon: "🚜" },
};

export const STK_PRICES: StkPriceRow[] = [
  { category: "M1",  label: "Osobní automobil",       stk: 800,  emise: 400,  total: 1200, group: "personal",   highlight: true },
  { category: "M1G", label: "Osobní auto — terénní",  stk: 800,  emise: 400,  total: 1200, group: "personal"   },
  { category: "L",   label: "Motocykl",               stk: 400,  emise: 200,  total: 600,  group: "motorcycle" },
  { category: "N1",  label: "Nákladní do 3,5 t",      stk: 800,  emise: 400,  total: 1200, group: "commercial" },
  { category: "N2",  label: "Nákladní 3,5–12 t",      stk: 1000, emise: 500,  total: 1500, group: "commercial" },
  { category: "N3",  label: "Nákladní nad 12 t",      stk: 1400, emise: 700,  total: 2100, group: "commercial" },
  { category: "M2",  label: "Autobus do 5 t",         stk: 1000, emise: 500,  total: 1500, group: "commercial" },
  { category: "M3",  label: "Autobus nad 5 t",        stk: 1400, emise: 700,  total: 2100, group: "commercial" },
  { category: "O1",  label: "Přívěs do 750 kg",       stk: 400,  emise: null, total: 400,  group: "trailer"    },
  { category: "O2",  label: "Přívěs 750 kg – 3,5 t",  stk: 500,  emise: null, total: 500,  group: "trailer"    },
  { category: "O3",  label: "Přívěs 3,5–10 t",       stk: 700,  emise: null, total: 700,  group: "trailer"    },
  { category: "O4",  label: "Přívěs nad 10 t",        stk: 900,  emise: null, total: 900,  group: "trailer"    },
  { category: "T",   label: "Traktor",                stk: 500,  emise: 300,  total: 800,  group: "trailer"    },
];
