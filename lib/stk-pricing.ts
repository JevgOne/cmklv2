export interface StkPriceRow {
  category: string;
  label: string;
  stk: number;
  emise: number | null;
  total: number;
}

export const STK_PRICES: StkPriceRow[] = [
  { category: "L",   label: "Motocykl",                     stk: 400,  emise: 200,  total: 600  },
  { category: "M1",  label: "Osobní automobil (do 3,5 t)",  stk: 800,  emise: 400,  total: 1200 },
  { category: "M1G", label: "Osobní auto — terénní",        stk: 800,  emise: 400,  total: 1200 },
  { category: "M2",  label: "Autobus (do 5 t)",             stk: 1000, emise: 500,  total: 1500 },
  { category: "M3",  label: "Autobus (nad 5 t)",            stk: 1400, emise: 700,  total: 2100 },
  { category: "N1",  label: "Nákladní (do 3,5 t)",          stk: 800,  emise: 400,  total: 1200 },
  { category: "N2",  label: "Nákladní (3,5–12 t)",          stk: 1000, emise: 500,  total: 1500 },
  { category: "N3",  label: "Nákladní (nad 12 t)",          stk: 1400, emise: 700,  total: 2100 },
  { category: "O1",  label: "Přívěs (do 750 kg)",           stk: 400,  emise: null, total: 400  },
  { category: "O2",  label: "Přívěs (750 kg – 3,5 t)",     stk: 500,  emise: null, total: 500  },
  { category: "O3",  label: "Přívěs (3,5–10 t)",           stk: 700,  emise: null, total: 700  },
  { category: "O4",  label: "Přívěs (nad 10 t)",           stk: 900,  emise: null, total: 900  },
  { category: "T",   label: "Traktor",                      stk: 500,  emise: 300,  total: 800  },
];
