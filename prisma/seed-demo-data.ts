/**
 * Seed demo data — vehicles, parts, listings.
 *
 * Depends on seed-demo-users.ts being run first.
 *
 * Run: npx tsx prisma/seed-demo-data.ts
 * Prod: ssh server "cd /var/www/carmakler && node --import tsx/esm prisma/seed-demo-data.ts"
 *
 * Idempotent — upserts by VIN/slug, never deletes existing data.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const NOW = new Date();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ============================================
// VEHICLES (Broker — makler1)
// ============================================

interface VehicleData {
  vin: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  enginePower: number;
  engineCapacity: number;
  bodyType: string;
  color: string;
  doorsCount: number;
  seatsCount: number;
  drivetrain: string;
  condition: string;
  price: number;
  city: string;
  description: string;
  equipment: string;
}

const BROKER_VEHICLES: VehicleData[] = [
  {
    vin: "WDDWF8DB2LA123456",
    brand: "Mercedes-Benz",
    model: "C220d",
    variant: "AMG Line",
    year: 2021,
    mileage: 55000,
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    enginePower: 147,
    engineCapacity: 1950,
    bodyType: "SEDAN",
    color: "Selenitová šedá metalíza",
    doorsCount: 4,
    seatsCount: 5,
    drivetrain: "RWD",
    condition: "EXCELLENT",
    price: 649000,
    city: "Praha",
    description:
      "Mercedes-Benz C220d v provedení AMG Line. Servisní kniha kompletní u autorizovaného servisu. Vůz je v perfektním stavu, nekuřácký, nebourané. Výbava: LED High Performance světlomety, navigace MBUX, kožený interiér, vyhřívání sedadel, parkovací kamera 360°, adaptivní tempomat.",
    equipment: JSON.stringify([
      "LED High Performance",
      "MBUX navigace",
      "Kožený interiér",
      "Vyhřívaná sedadla",
      "Kamera 360°",
      "Adaptivní tempomat",
      "Keyless Go",
      "Ambientní osvětlení",
    ]),
  },
  {
    vin: "U5YPB81ABNL789012",
    brand: "Kia",
    model: "Sportage",
    variant: "1.6 T-GDi HEV",
    year: 2022,
    mileage: 35000,
    fuelType: "HYBRID",
    transmission: "AUTOMATIC",
    enginePower: 169,
    engineCapacity: 1598,
    bodyType: "SUV",
    color: "Červená Infrared",
    doorsCount: 5,
    seatsCount: 5,
    drivetrain: "AWD",
    condition: "EXCELLENT",
    price: 559000,
    city: "Praha",
    description:
      "Kia Sportage nové generace s hybridním pohonem a pohonem všech kol. Bohatá výbava GT-Line, panoramatická střecha, head-up displej, ventilovaná sedadla. Záruka od výrobce do 2029. Jeden majitel, servisní kniha.",
    equipment: JSON.stringify([
      "Panoramatická střecha",
      "Head-up displej",
      "Ventilovaná sedadla",
      "Harman Kardon audio",
      "LED Matrix světla",
      "360° kamera",
      "Bezdrátové nabíjení",
      "Elektricky ovládané víko kufru",
    ]),
  },
];

// ============================================
// DEALER VEHICLES (AutoMax — dealer1)
// ============================================

const DEALER_VEHICLES: VehicleData[] = [
  {
    vin: "TMBAG7NE9N0345678",
    brand: "Škoda",
    model: "Octavia",
    variant: "Combi 2.0 TDI",
    year: 2022,
    mileage: 45000,
    fuelType: "DIESEL",
    transmission: "DSG",
    enginePower: 110,
    engineCapacity: 1968,
    bodyType: "COMBI",
    color: "Bílá Moon",
    doorsCount: 5,
    seatsCount: 5,
    drivetrain: "FWD",
    condition: "EXCELLENT",
    price: 489000,
    city: "Praha",
    description:
      "Škoda Octavia Combi ve výbavě Style Plus. DSG převodovka, LED Matrix světlomety, Canton audio, virtuální kokpit, třízónová klimatizace. Servisní historie kompletní u autorizovaného servisu Škoda.",
    equipment: JSON.stringify([
      "LED Matrix",
      "Canton audio",
      "Virtual Cockpit",
      "Třízónová klimatizace",
      "Vyhřívaná sedadla",
      "Parkovací asistent",
      "Keyless",
    ]),
  },
  {
    vin: "WVWZZZ1KZMW456789",
    brand: "Volkswagen",
    model: "Golf",
    variant: "8 1.5 eTSI",
    year: 2021,
    mileage: 62000,
    fuelType: "PETROL",
    transmission: "DSG",
    enginePower: 110,
    engineCapacity: 1498,
    bodyType: "HATCHBACK",
    color: "Šedá Dolphin metalíza",
    doorsCount: 5,
    seatsCount: 5,
    drivetrain: "FWD",
    condition: "GOOD",
    price: 415000,
    city: "Praha",
    description:
      "VW Golf 8 s mild-hybridním pohonem 1.5 eTSI a DSG. Výbava Style, digitální přístrojový štít, navigace Discover Pro, IQ.Light LED Matrix. Pravidelný servis, nebouráno.",
    equipment: JSON.stringify([
      "IQ.Light LED Matrix",
      "Discover Pro navigace",
      "Digital Cockpit Pro",
      "Adaptivní tempomat ACC",
      "Ambient Lighting",
      "App-Connect",
    ]),
  },
  {
    vin: "WBA8E9C50LB567890",
    brand: "BMW",
    model: "320d",
    variant: "xDrive M Sport",
    year: 2020,
    mileage: 78000,
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    enginePower: 140,
    engineCapacity: 1995,
    bodyType: "SEDAN",
    color: "Černá Sapphire metalíza",
    doorsCount: 4,
    seatsCount: 5,
    drivetrain: "AWD",
    condition: "GOOD",
    price: 595000,
    city: "Praha",
    description:
      "BMW 320d xDrive s paketem M Sport. Pohon všech kol, automatická převodovka Steptronic, sportovní podvozek M. Live Cockpit Professional, head-up displej, Harman Kardon. Jeden majitel, servisní kniha BMW.",
    equipment: JSON.stringify([
      "M Sport paket",
      "Head-up displej",
      "Harman Kardon",
      "Live Cockpit Professional",
      "Parking Assistant Plus",
      "Sportovní sedadla",
      "M sportovní řízení",
    ]),
  },
  {
    vin: "TMAJ381BAPJ678901",
    brand: "Hyundai",
    model: "Tucson",
    variant: "1.6 T-GDi HEV",
    year: 2023,
    mileage: 15000,
    fuelType: "HYBRID",
    transmission: "AUTOMATIC",
    enginePower: 169,
    engineCapacity: 1598,
    bodyType: "SUV",
    color: "Modrá Teal",
    doorsCount: 5,
    seatsCount: 5,
    drivetrain: "AWD",
    condition: "LIKE_NEW",
    price: 699000,
    city: "Praha",
    description:
      "Hyundai Tucson v top výbavě Smart s hybridním pohonem. Prakticky nový vůz, najeto pouze 15 000 km. BOSE audio, panoramatická střecha, elektricky ovládané víko kufru, ventilovaná sedadla. Záruka do 2028.",
    equipment: JSON.stringify([
      "BOSE audio",
      "Panoramatická střecha",
      "Ventilovaná sedadla",
      "Elektrické víko kufru",
      "Blind Spot Monitoring",
      "Highway Driving Assist",
      "Bezdrátové nabíjení",
    ]),
  },
  {
    vin: "WF0XXXGCEXLY789012",
    brand: "Ford",
    model: "Focus",
    variant: "Kombi 1.5 EcoBlue",
    year: 2019,
    mileage: 95000,
    fuelType: "DIESEL",
    transmission: "MANUAL",
    enginePower: 88,
    engineCapacity: 1499,
    bodyType: "COMBI",
    color: "Stříbrná Moondust",
    doorsCount: 5,
    seatsCount: 5,
    drivetrain: "FWD",
    condition: "GOOD",
    price: 289000,
    city: "Praha",
    description:
      "Ford Focus Kombi s úsporným dieselovým motorem 1.5 EcoBlue. Výbava Titanium — SYNC 3 s 8\" dotykovým displejem, LED světlomety, vyhřívaná čelní sklo a sedadla. Spolehlivý rodinný vůz s nízkou spotřebou.",
    equipment: JSON.stringify([
      "SYNC 3 navigace",
      "LED světlomety",
      "Vyhřívané čelní sklo",
      "Vyhřívaná sedadla",
      "Tempomat",
      "Parkovací senzory",
    ]),
  },
  {
    vin: "SB1ZB5HE90E890123",
    brand: "Toyota",
    model: "Yaris",
    variant: "1.5 Hybrid",
    year: 2022,
    mileage: 28000,
    fuelType: "HYBRID",
    transmission: "CVT",
    enginePower: 85,
    engineCapacity: 1490,
    bodyType: "HATCHBACK",
    color: "Červená Emotional",
    doorsCount: 5,
    seatsCount: 5,
    drivetrain: "FWD",
    condition: "EXCELLENT",
    price: 345000,
    city: "Praha",
    description:
      "Toyota Yaris Hybrid ve výbavě Style. Extrémně nízká spotřeba (pod 4l/100km ve městě). Toyota Safety Sense 2.0, head-up displej, parkovací kamera, JBL audio. Záruka Toyota 10 let / 200 000 km.",
    equipment: JSON.stringify([
      "Toyota Safety Sense 2.0",
      "Head-up displej",
      "JBL audio",
      "Parkovací kamera",
      "Automatická klimatizace",
      "Apple CarPlay / Android Auto",
    ]),
  },
];

// ============================================
// PARTS (VrakoParts — dodavatel1)
// ============================================

interface PartData {
  slug: string;
  category: string;
  name: string;
  description: string;
  price: number;
  condition: string;
  compatibleBrands: string[];
  compatibleModels: string[];
  compatibleYearFrom: number;
  compatibleYearTo: number;
  partNumber?: string;
  oemNumber?: string;
}

const DEMO_PARTS: PartData[] = [
  {
    slug: "motor-1-9-tdi-octavia",
    category: "ENGINE",
    name: "Motor 1.9 TDI (ALH) — Škoda Octavia I",
    description:
      "Kompletní motor 1.9 TDI 66kW, kód ALH. Stav: funkční, bez závad. Demontáž z vozu s najeto 180 000 km. Včetně příslušenství (turbo, sací potrubí, vstřikovací čerpadlo).",
    price: 12000,
    condition: "USED_GOOD",
    compatibleBrands: ["Škoda", "VW", "Seat"],
    compatibleModels: ["Octavia", "Golf IV", "Leon"],
    compatibleYearFrom: 1997,
    compatibleYearTo: 2004,
    oemNumber: "038100103",
  },
  {
    slug: "prevodovka-dsg-golf",
    category: "TRANSMISSION",
    name: "Převodovka DSG DQ200 — VW Golf VII",
    description:
      "7stupňová DSG převodovka DQ200. Mechanická část v pořádku, mechatronika testovaná. Z vozu s 95 000 km. Vhodné pro motory 1.2/1.4 TSI.",
    price: 18000,
    condition: "USED_GOOD",
    compatibleBrands: ["VW", "Škoda", "Seat", "Audi"],
    compatibleModels: ["Golf VII", "Octavia III", "Leon III", "A3"],
    compatibleYearFrom: 2013,
    compatibleYearTo: 2020,
    partNumber: "0AM300065S",
  },
  {
    slug: "predni-naraznik-bmw-3",
    category: "BODY",
    name: "Přední nárazník — BMW 3 (F30/F31)",
    description:
      "Přední nárazník BMW 3 F30/F31, barva: černá Sapphire metalíza (475). Bez poškození, bez mlhovek. Lakovaný, připravený k montáži.",
    price: 4500,
    condition: "USED_GOOD",
    compatibleBrands: ["BMW"],
    compatibleModels: ["3 F30", "3 F31"],
    compatibleYearFrom: 2012,
    compatibleYearTo: 2018,
    oemNumber: "51117292959",
  },
  {
    slug: "xenon-svetlomet-audi-a4",
    category: "ELECTRICAL",
    name: "Xenonový světlomet levý — Audi A4 B8",
    description:
      "Bi-xenonový světlomet levý (řidič) s LED denním svícením. Včetně xenonové výbojky a předřadníku. Bez poškození skla, plně funkční.",
    price: 6500,
    condition: "USED_GOOD",
    compatibleBrands: ["Audi"],
    compatibleModels: ["A4 B8", "A4 B8.5"],
    compatibleYearFrom: 2008,
    compatibleYearTo: 2015,
    oemNumber: "8K0941003P",
  },
  {
    slug: "kozeny-interior-superb",
    category: "INTERIOR",
    name: "Kožený interiér komplet — Škoda Superb III",
    description:
      "Kompletní kožený interiér Škoda Superb III (3V) — přední sedadla (vyhřívaná, elektricky stavitelná), zadní lavice, dveřní výplně, loketní opěrka. Barva: béžová (Vienna Leder). Stav: velmi dobrý, bez trhlin.",
    price: 25000,
    condition: "USED_GOOD",
    compatibleBrands: ["Škoda"],
    compatibleModels: ["Superb III"],
    compatibleYearFrom: 2015,
    compatibleYearTo: 2023,
  },
  {
    slug: "turbo-1-4-tsi-vw",
    category: "ENGINE",
    name: "Turbodmychadlo — 1.4 TSI (CZEA/CZDA)",
    description:
      "Turbodmychadlo IHI pro motor 1.4 TSI 110kW. Testováno, bez vůlí na hřídeli, bez poškození lopatek. Z vozu s 60 000 km.",
    price: 8000,
    condition: "USED_GOOD",
    compatibleBrands: ["VW", "Škoda", "Seat", "Audi"],
    compatibleModels: ["Golf VII", "Octavia III", "Leon III", "A3"],
    compatibleYearFrom: 2014,
    compatibleYearTo: 2020,
    oemNumber: "04E145721R",
  },
  {
    slug: "dvere-predni-ford-focus",
    category: "BODY",
    name: "Dveře přední levé — Ford Focus III",
    description:
      "Přední levé dveře Ford Focus III facelift. Barva: stříbrná Moondust (Z2). Bez poškození, kompletní s oknem a zámkem. Bez elektrických dílů (zrcátko, okno ovladač).",
    price: 3500,
    condition: "USED_GOOD",
    compatibleBrands: ["Ford"],
    compatibleModels: ["Focus III"],
    compatibleYearFrom: 2015,
    compatibleYearTo: 2018,
  },
  {
    slug: "naprava-zadni-hyundai-i30",
    category: "SUSPENSION",
    name: "Zadní náprava komplet — Hyundai i30 (PD)",
    description:
      "Kompletní zadní náprava Hyundai i30 PD s multi-link zavěšením. Včetně ramen, stabilizátoru, tlumičů a pružin. Z vozu s 55 000 km. Silentbloky v dobrém stavu.",
    price: 5000,
    condition: "USED_GOOD",
    compatibleBrands: ["Hyundai", "Kia"],
    compatibleModels: ["i30 PD", "Ceed III"],
    compatibleYearFrom: 2017,
    compatibleYearTo: 2023,
  },
  {
    slug: "klimakompresor-toyota",
    category: "COOLING",
    name: "Klimakompresor — Toyota Corolla E210",
    description:
      "Klimakompresor DENSO pro Toyota Corolla E210 (hybrid). Plně funkční, testovaný. Z vozu s 40 000 km. Originální Toyota díl.",
    price: 4000,
    condition: "USED_GOOD",
    compatibleBrands: ["Toyota"],
    compatibleModels: ["Corolla E210", "C-HR"],
    compatibleYearFrom: 2019,
    compatibleYearTo: 2023,
    oemNumber: "8831002B70",
  },
  {
    slug: "ridici-jednotka-fabia",
    category: "ELECTRICAL",
    name: "Řídící jednotka motoru (ECU) — Škoda Fabia III",
    description:
      "Řídící jednotka motoru Bosch MED 17.5.21 pro motor 1.0 TSI (CHZB). Bez immo kódu — nutné spárování. Z vozu s 75 000 km.",
    price: 7500,
    condition: "USED_GOOD",
    compatibleBrands: ["Škoda", "VW", "Seat"],
    compatibleModels: ["Fabia III", "Polo VI", "Ibiza V"],
    compatibleYearFrom: 2015,
    compatibleYearTo: 2021,
    partNumber: "04C906026BN",
    oemNumber: "0261S21546",
  },
];

// ============================================
// LISTINGS (Inzerent — inzerent1)
// ============================================

interface ListingData {
  slug: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  enginePower: number;
  engineCapacity: number;
  bodyType: string;
  color: string;
  condition: string;
  price: number;
  city: string;
  description: string;
  equipment: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
}

const DEMO_LISTINGS: ListingData[] = [
  {
    slug: "renault-clio-2018-inzerat",
    brand: "Renault",
    model: "Clio",
    variant: "1.2 TCe",
    year: 2018,
    mileage: 72000,
    fuelType: "PETROL",
    transmission: "MANUAL",
    enginePower: 87,
    engineCapacity: 1197,
    bodyType: "HATCHBACK",
    color: "Červená Flame",
    condition: "GOOD",
    price: 195000,
    city: "Praha",
    description:
      "Prodám Renault Clio 1.2 TCe v dobrém stavu. Pravidelný servis, STK do 12/2026. Klimatizace, navigace, parkovací senzory. Spotřeba 6l/100km. Nekuřácké, nehavarované.",
    equipment: JSON.stringify([
      "Klimatizace",
      "Navigace",
      "Parkovací senzory",
      "Tempomat",
      "Bluetooth",
    ]),
    contactName: "Filip Inzerent",
    contactPhone: "+420 603 333 001",
    contactEmail: "inzerent1@carmakler.cz",
  },
  {
    slug: "peugeot-308-sw-2020-inzerat",
    brand: "Peugeot",
    model: "308 SW",
    variant: "1.5 BlueHDi",
    year: 2020,
    mileage: 55000,
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    enginePower: 96,
    engineCapacity: 1499,
    bodyType: "COMBI",
    color: "Šedá Artense",
    condition: "EXCELLENT",
    price: 329000,
    city: "Praha",
    description:
      "Peugeot 308 SW s úsporným dieselem 1.5 BlueHDi a automatem EAT8. Výbava Allure — i-Cockpit, digitální přístrojový štít, CarPlay, full LED. Servisní kniha kompletní. Skvělé rodinné kombi.",
    equipment: JSON.stringify([
      "i-Cockpit",
      "Full LED",
      "Apple CarPlay",
      "Automatická klimatizace",
      "Střešní nosiče",
      "Vyhřívaná sedadla",
    ]),
    contactName: "Filip Inzerent",
    contactPhone: "+420 603 333 001",
    contactEmail: "inzerent1@carmakler.cz",
  },
  {
    slug: "dacia-duster-2021-inzerat",
    brand: "Dacia",
    model: "Duster",
    variant: "1.3 TCe 4x4",
    year: 2021,
    mileage: 40000,
    fuelType: "PETROL",
    transmission: "MANUAL",
    enginePower: 110,
    engineCapacity: 1330,
    bodyType: "SUV",
    color: "Zelená Khaki",
    condition: "EXCELLENT",
    price: 385000,
    city: "Praha",
    description:
      "Dacia Duster s pohonem 4x4 a motorem 1.3 TCe. Výbava Prestige — kožená sedadla, multiview kamera, navigace, bezklíčové startování. Ideální do terénu i do města. Nízký nájezd, první majitel.",
    equipment: JSON.stringify([
      "Pohon 4x4",
      "Kožená sedadla",
      "Multiview kamera",
      "Navigace",
      "Bezklíčové startování",
      "17\" kola",
    ]),
    contactName: "Filip Inzerent",
    contactPhone: "+420 603 333 001",
    contactEmail: "inzerent1@carmakler.cz",
  },
];

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("Seeding demo data...\n");

  // 1. Find required users
  const makler1 = await prisma.user.findUnique({ where: { email: "makler1@carmakler.cz" } });
  const dealer1 = await prisma.user.findUnique({ where: { email: "dealer1@carmakler.cz" } });
  const supplier1 = await prisma.user.findUnique({ where: { email: "dodavatel1@carmakler.cz" } });
  const inzerent1 = await prisma.user.findUnique({ where: { email: "inzerent1@carmakler.cz" } });

  if (!makler1 || !dealer1 || !supplier1 || !inzerent1) {
    console.error("Missing demo users! Run seed-demo-users.ts first.");
    console.error({
      makler1: !!makler1,
      dealer1: !!dealer1,
      supplier1: !!supplier1,
      inzerent1: !!inzerent1,
    });
    process.exit(1);
  }

  // 2. Broker vehicles (makler1)
  console.log("--- Broker vehicles (makler1) ---");
  for (const v of BROKER_VEHICLES) {
    const vehicle = await prisma.vehicle.upsert({
      where: { vin: v.vin },
      update: {
        price: v.price,
        mileage: v.mileage,
        description: v.description,
        equipment: v.equipment,
      },
      create: {
        vin: v.vin,
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        year: v.year,
        mileage: v.mileage,
        fuelType: v.fuelType,
        transmission: v.transmission,
        enginePower: v.enginePower,
        engineCapacity: v.engineCapacity,
        bodyType: v.bodyType,
        color: v.color,
        doorsCount: v.doorsCount,
        seatsCount: v.seatsCount,
        drivetrain: v.drivetrain,
        condition: v.condition,
        price: v.price,
        priceNegotiable: true,
        city: v.city,
        description: v.description,
        equipment: v.equipment,
        status: "ACTIVE",
        brokerId: makler1.id,
        sellerType: "broker",
        slug: slugify(`${v.brand}-${v.model}-${v.year}-${v.vin.slice(-4)}`),
        publishedAt: NOW,
        serviceBook: true,
      },
    });
    console.log(`  ${v.brand} ${v.model} ${v.year} → ${vehicle.id}`);
  }

  // 3. Dealer vehicles (dealer1 — "AutoMax Praha s.r.o.")
  console.log("\n--- Dealer vehicles (dealer1) ---");
  for (const v of DEALER_VEHICLES) {
    const vehicle = await prisma.vehicle.upsert({
      where: { vin: v.vin },
      update: {
        price: v.price,
        mileage: v.mileage,
        description: v.description,
        equipment: v.equipment,
      },
      create: {
        vin: v.vin,
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        year: v.year,
        mileage: v.mileage,
        fuelType: v.fuelType,
        transmission: v.transmission,
        enginePower: v.enginePower,
        engineCapacity: v.engineCapacity,
        bodyType: v.bodyType,
        color: v.color,
        doorsCount: v.doorsCount,
        seatsCount: v.seatsCount,
        drivetrain: v.drivetrain,
        condition: v.condition,
        price: v.price,
        priceNegotiable: true,
        city: v.city,
        description: v.description,
        equipment: v.equipment,
        status: "ACTIVE",
        brokerId: dealer1.id,
        sellerType: "broker",
        slug: slugify(`${v.brand}-${v.model}-${v.year}-${v.vin.slice(-4)}`),
        publishedAt: NOW,
        serviceBook: true,
      },
    });
    console.log(`  ${v.brand} ${v.model} ${v.year} → ${vehicle.id}`);
  }

  // 4. Parts (supplier1 — "VrakoParts s.r.o.")
  console.log("\n--- Parts (dodavatel1) ---");
  for (const p of DEMO_PARTS) {
    const part = await prisma.part.upsert({
      where: { slug: p.slug },
      update: {
        price: p.price,
        description: p.description,
        name: p.name,
      },
      create: {
        slug: p.slug,
        supplierId: supplier1.id,
        category: p.category,
        name: p.name,
        description: p.description,
        price: p.price,
        condition: p.condition,
        partType: "USED",
        stock: 1,
        vatIncluded: true,
        status: "ACTIVE",
        compatibleBrands: JSON.stringify(p.compatibleBrands),
        compatibleModels: JSON.stringify(p.compatibleModels),
        compatibleYearFrom: p.compatibleYearFrom,
        compatibleYearTo: p.compatibleYearTo,
        partNumber: p.partNumber ?? null,
        oemNumber: p.oemNumber ?? null,
      },
    });
    console.log(`  ${p.name.substring(0, 50).padEnd(50)} → ${part.id}`);
  }

  // 5. Listings (inzerent1)
  console.log("\n--- Listings (inzerent1) ---");
  for (const l of DEMO_LISTINGS) {
    const listing = await prisma.listing.upsert({
      where: { slug: l.slug },
      update: {
        price: l.price,
        mileage: l.mileage,
        description: l.description,
        equipment: l.equipment,
      },
      create: {
        slug: l.slug,
        listingType: "PRIVATE",
        userId: inzerent1.id,
        brand: l.brand,
        model: l.model,
        variant: l.variant,
        year: l.year,
        mileage: l.mileage,
        fuelType: l.fuelType,
        transmission: l.transmission,
        enginePower: l.enginePower,
        engineCapacity: l.engineCapacity,
        bodyType: l.bodyType,
        color: l.color,
        condition: l.condition,
        price: l.price,
        priceNegotiable: true,
        city: l.city,
        description: l.description,
        equipment: l.equipment,
        contactName: l.contactName,
        contactPhone: l.contactPhone,
        contactEmail: l.contactEmail,
        status: "ACTIVE",
        publishedAt: NOW,
        doorsCount: 5,
        seatsCount: 5,
      },
    });
    console.log(`  ${l.brand} ${l.model} ${l.year} → ${listing.id}`);
  }

  // 6. Partner — AutoMax Praha (propojení s dealer1)
  console.log("\n--- Partner (AutoMax Praha) ---");
  const partner = await prisma.partner.upsert({
    where: { slug: "automax-praha-demo" },
    update: {
      name: "AutoMax Praha s.r.o.",
      contactPerson: "AutoMax s.r.o.",
      phone: "+420 606 666 001",
      email: "dealer1@carmakler.cz",
    },
    create: {
      name: "AutoMax Praha s.r.o.",
      type: "AUTOBAZAR",
      slug: "automax-praha-demo",
      ico: "11223344",
      city: "Praha",
      region: "Praha",
      address: "Průmyslová 42",
      zip: "10800",
      phone: "+420 606 666 001",
      email: "dealer1@carmakler.cz",
      contactPerson: "AutoMax s.r.o.",
      estimatedSize: "MEDIUM",
      status: "PARTNER",
      description:
        "Autorizovaný multibrandový autobazar v Praze. Nabízíme prověřená ojetá vozidla s garancí. Součástí je autoservis a financování na místě.",
    },
  });
  console.log(`  AutoMax Praha → ${partner.id}`);

  console.log("\nDone! Demo data seeded successfully.");
  console.log(`  Vehicles: ${BROKER_VEHICLES.length + DEALER_VEHICLES.length}`);
  console.log(`  Parts: ${DEMO_PARTS.length}`);
  console.log(`  Listings: ${DEMO_LISTINGS.length}`);
  console.log(`  Partners: 1`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
