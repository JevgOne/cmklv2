// ============================================
// Vehicle Draft Types - "Nabrat auto" flow
// ============================================

/** Step 1: Kontaktní údaje prodejce */
export interface ContactData {
  leadSource: LeadSource;
  leadUrl?: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string;

  // Předběžné info o autě
  prelimBrand?: string;
  prelimModel?: string;
  prelimYear?: number;
  prelimMileage?: number;
  prelimPrice?: number;

  // Adresa / lokace
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;

  // Poznámky a schůzka
  notes?: string;
  appointmentDate?: string; // ISO date
  appointmentTime?: string; // HH:mm
}

export type LeadSource =
  | "BAZOS"
  | "SAUTO"
  | "FACEBOOK"
  | "REFERRAL"
  | "COLD_CALL"
  | "OTHER";

/** Step 2: Data z prohlídky */
export interface InspectionData {
  // Dokumenty
  documents: {
    technickyPrukaz: boolean;
    osiVelkyTP: boolean;
    servisniKnizka: boolean;
    dokladSTK: boolean;
    dokladEmise: boolean;
    nabijeciKabel: boolean;
    druhaKlice: boolean;
  };

  // Exteriér
  exterior: {
    condition: BodyCondition;
    paintDefects: boolean;
    rustSpots: boolean;
    dentsScratches: boolean;
    windshieldDamage: boolean;
    lightsDamage: boolean;
    tiresCondition: boolean;
  };

  // Interiér
  interior: {
    condition: BodyCondition;
    seatsWorn: boolean;
    dashboardDamage: boolean;
    steeringWheelWorn: boolean;
    acWorking: boolean;
    electronicsWorking: boolean;
    smellIssues: boolean;
  };

  // Motor
  engine: {
    startsWell: boolean;
    noLeaks: boolean;
    noStrangeNoises: boolean;
    exhaustOk: boolean;
    turboOk: boolean;
    timingBeltReplaced: boolean;
  };

  // Testovací jízda
  testDrive: {
    completed: boolean;
    gearboxSmooth: boolean;
    brakesOk: boolean;
    suspensionOk: boolean;
    steeringOk: boolean;
    clutchOk: boolean;
    noVibrations: boolean;
  };

  // Závady
  defects: DefectRecord[];

  // Celkový dojem
  overallRating: number; // 1-5
  notes?: string;
}

export type BodyCondition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export interface DefectRecord {
  id: string;
  imageId?: string;
  description: string;
  severity: DefectSeverity;
}

export type DefectSeverity = "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL";

/** Step 3: VIN a dekódovaná data */
export interface VinData {
  vin: string;
  vinVerified: boolean;
  decodedData?: {
    brand?: string;
    model?: string;
    variant?: string;
    year?: number;
    fuelType?: string;
    transmission?: string;
    enginePower?: number;
    engineCapacity?: number;
    bodyType?: string;
    drivetrain?: string;
    color?: string;
    doorsCount?: number;
    seatsCount?: number;
  };
}

/** Step 4: Fotodokumentace */
export interface PhotoData {
  /** ID obrázků uložených v IndexedDB images store */
  photos: PhotoRecord[];
}

export interface PhotoRecord {
  id: string;
  category: PhotoCategory;
  order: number;
  isPrimary: boolean;
}

export type PhotoCategory =
  | "EXTERIOR_FRONT"
  | "EXTERIOR_REAR"
  | "EXTERIOR_LEFT"
  | "EXTERIOR_RIGHT"
  | "INTERIOR_FRONT"
  | "INTERIOR_REAR"
  | "DASHBOARD"
  | "TRUNK"
  | "ENGINE"
  | "WHEELS"
  | "DETAIL"
  | "DEFECT"
  | "DOCUMENT";

/** Step 5: Detailní údaje */
export interface DetailsData {
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
  drivetrain?: string;

  condition: string;
  stkValidUntil?: string; // ISO date
  serviceBook: boolean;
  serviceBookStatus?: string;
  odometerStatus?: string;
  ownerCount?: number;
  originCountry?: string;
  vehicleSource?: string;

  equipment: string[];
  highlights: string[];
  description?: string;
}

/** Step 6: Cena a provize */
export interface PricingData {
  price: number;
  priceNegotiable: boolean;
  vatStatus?: string;
  commission?: number;

  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// Hlavní VehicleDraft typ
// ============================================

export type DraftStatus =
  | "draft"
  | "in_progress"
  | "rejected_by_broker"
  | "pending_sync"
  | "submitted";

export interface VehicleDraft {
  id: string;
  brokerId?: string;
  status: DraftStatus;
  currentStep: number; // 1-7
  createdAt: number;   // timestamp
  updatedAt: number;   // timestamp

  // Sekce - všechny partial, vyplňují se postupně
  contact?: Partial<ContactData>;
  inspection?: Partial<InspectionData>;
  vin?: Partial<VinData>;
  photos?: Partial<PhotoData>;
  details?: Partial<DetailsData>;
  pricing?: Partial<PricingData>;

  // ServerId po synchronizaci
  serverId?: string;
}

// ============================================
// VIN Decoder result (normalizovaný z vindecoder.eu / NHTSA)
// ============================================

export interface VinDecoderResult {
  vin: string;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  fuelType?: string;
  transmission?: string;
  enginePower?: number;
  engineCapacity?: number;
  bodyType?: string;
  drivetrain?: string;
  color?: string;
  doorsCount?: number;
  seatsCount?: number;
  equipment?: string[];
  raw?: Record<string, unknown>;
}

// ============================================
// Equipment catalog types
// ============================================

export interface EquipmentCategory {
  id: string;
  label: string;
  items: string[];
}

export const DEFAULT_EQUIPMENT_CATALOG: EquipmentCategory[] = [
  {
    id: "comfort",
    label: "Komfort",
    items: [
      "Klimatizace", "Automatická klimatizace", "Dvouzónová klimatizace",
      "Vyhřívaná sedadla", "Vyhřívaný volant", "Elektrická okna",
      "Elektrické zrcátka", "Tempomat", "Adaptivní tempomat",
      "Keyless entry", "Keyless go", "Parkovací senzory přední",
      "Parkovací senzory zadní", "Kamera pro couvání", "360° kamera",
      "Elektrické sedadlo řidiče", "Elektrické sedadlo spolujezdce",
      "Paměť sedadel", "Masážní sedadla",
    ],
  },
  {
    id: "safety",
    label: "Bezpečnost",
    items: [
      "ABS", "ESP", "ASR", "Airbag řidiče", "Airbag spolujezdce",
      "Boční airbagy", "Hlavové airbagy", "Kolenní airbag",
      "ISOFIX", "Centrální zamykání", "Imobilizér", "Alarm",
      "Blokování diferenciálu", "Brzdový asistent",
    ],
  },
  {
    id: "infotainment",
    label: "Infotainment",
    items: [
      "Rádio", "CD přehrávač", "Navigace", "Dotykový displej",
      "Apple CarPlay", "Android Auto", "Bluetooth", "USB", "AUX",
      "Bezdrátové nabíjení", "Head-up displej", "Digitální kokpit",
      "Prémiový audio systém", "DAB rádio", "Wi-Fi hotspot",
    ],
  },
  {
    id: "exterior",
    label: "Exteriér",
    items: [
      "Litá kola", "Střešní okno", "Panoramatická střecha",
      "Střešní nosič", "Tažné zařízení", "Zadní spoiler",
      "Tónovaná skla", "LED světlomety", "Xenon světlomety",
      "Laser světlomety", "Denní svítilny LED",
      "Automatické stěrače", "Elektrické tažné zařízení",
    ],
  },
  {
    id: "interior",
    label: "Interiér",
    items: [
      "Kožená sedadla", "Alcantara", "Sportovní sedadla",
      "Loketní opěrka", "Třetí řada sedadel", "Sklopná zadní sedadla",
      "Multifunkční volant", "Kožený volant", "Vyhřívaná zadní sedadla",
      "Ambientní osvětlení",
    ],
  },
  {
    id: "assistance",
    label: "Asistence",
    items: [
      "Asistent jízdy v pruhu", "Asistent mrtvého úhlu",
      "Automatické parkování", "Rozpoznávání dopravních značek",
      "Automatické dálkové světla", "Noční vidění",
      "Asistent pro příčný provoz", "Adaptivní podvozek",
      "Start-stop systém", "Rekuperace energie",
    ],
  },
  {
    id: "lights",
    label: "Světla",
    items: [
      "LED přední", "LED zadní", "Xenon", "Bi-xenon",
      "Laser", "Adaptivní světlomety", "Mlhové světlomety",
      "Dynamické blinkry", "Automatické přepínání dálkových světel",
    ],
  },
  {
    id: "other",
    label: "Další",
    items: [
      "Náhradní kolo", "Sada na opravu pneumatik",
      "Druhá sada pneumatik", "Sezónní pneumatiky",
      "Dálniční známka",
    ],
  },
];

/** Název sekce pro updateSection */
export type DraftSection = keyof Pick<
  VehicleDraft,
  "contact" | "inspection" | "vin" | "photos" | "details" | "pricing"
>;

/** Helper typ pro data jednotlivých sekcí */
export type DraftSectionData = {
  contact: Partial<ContactData>;
  inspection: Partial<InspectionData>;
  vin: Partial<VinData>;
  photos: Partial<PhotoData>;
  details: Partial<DetailsData>;
  pricing: Partial<PricingData>;
};
