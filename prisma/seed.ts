import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";

const dbPath = path.resolve(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing existing data...");
  await prisma.favorite.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.watchdog.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.vehicleChangeLog.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.region.deleteMany();

  console.log("Seeding regions...");

  // ============================================
  // 1. REGIONS
  // ============================================

  const regionPraha = await prisma.region.create({
    data: {
      name: "Praha",
      cities: JSON.stringify([
        "Praha 1",
        "Praha 2",
        "Praha 3",
        "Praha 4",
        "Praha 5",
        "Praha 6",
        "Praha 7",
        "Praha 8",
        "Praha 9",
        "Praha 10",
      ]),
    },
  });

  const regionJihomoravsky = await prisma.region.create({
    data: {
      name: "Jihomoravsk\u00FD",
      cities: JSON.stringify(["Brno", "Znojmo", "B\u0159eclav"]),
    },
  });

  const regionMoravskoslezsky = await prisma.region.create({
    data: {
      name: "Moravskoslezsk\u00FD",
      cities: JSON.stringify(["Ostrava", "Opava", "Fr\u00FDdek-M\u00EDstek"]),
    },
  });

  console.log(
    `Created regions: ${regionPraha.name}, ${regionJihomoravsky.name}, ${regionMoravskoslezsky.name}`
  );

  // ============================================
  // 2. USERS
  // ============================================

  console.log("Seeding users...");

  const passwordHash = await bcrypt.hash("heslo123", 12);

  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@carmakler.cz",
      firstName: "Jan",
      lastName: "Carmak",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // 2. BackOffice
  const backoffice = await prisma.user.create({
    data: {
      email: "backoffice@carmakler.cz",
      firstName: "Eva",
      lastName: "Spr\u00E1vov\u00E1",
      passwordHash,
      role: "BACKOFFICE",
      status: "ACTIVE",
    },
  });

  // 3. Regional Director
  const reditel = await prisma.user.create({
    data: {
      email: "reditel@carmakler.cz",
      firstName: "Karel",
      lastName: "\u0158editel",
      passwordHash,
      role: "REGIONAL_DIRECTOR",
      status: "ACTIVE",
      regionId: regionPraha.id,
    },
  });

  // 4. Manager
  const manazer = await prisma.user.create({
    data: {
      email: "manazer@carmakler.cz",
      firstName: "Martin",
      lastName: "Mana\u017Eer",
      passwordHash,
      role: "MANAGER",
      status: "ACTIVE",
      managerId: reditel.id,
    },
  });

  // 5. Broker 1 - Jan Nov\u00E1k
  const janNovak = await prisma.user.create({
    data: {
      email: "jan.novak@carmakler.cz",
      firstName: "Jan",
      lastName: "Nov\u00E1k",
      passwordHash,
      role: "BROKER",
      status: "ACTIVE",
      slug: "jan-novak-praha",
      managerId: manazer.id,
      specializations: JSON.stringify(["osobn\u00ED", "SUV"]),
      cities: JSON.stringify(["Praha"]),
      bio: "Certifikovan\u00FD makl\u00E9\u0159 s 5 lety zku\u0161enost\u00ED v prodeji osobn\u00EDch a SUV voz\u016F. Specializuji se na komplexn\u00ED servis od v\u00FDb\u011Bru po p\u0159epis vozu.",
    },
  });

  // 6. Broker 2 - Petra Mal\u00E1
  const petraMala = await prisma.user.create({
    data: {
      email: "petra.mala@carmakler.cz",
      firstName: "Petra",
      lastName: "Mal\u00E1",
      passwordHash,
      role: "BROKER",
      status: "ACTIVE",
      slug: "petra-mala-brno",
      bio: "Specialistka na pr\u00E9miov\u00E9 vozy a import ze zahrani\u010D\u00ED. Pomohu v\u00E1m naj\u00EDt v\u016Fz sn\u016F za nejlep\u0161\u00ED cenu.",
    },
  });

  // 7. Broker 3 - Karel Dvo\u0159\u00E1k
  const karelDvorak = await prisma.user.create({
    data: {
      email: "karel.dvorak@carmakler.cz",
      firstName: "Karel",
      lastName: "Dvo\u0159\u00E1k",
      passwordHash,
      role: "BROKER",
      status: "ACTIVE",
      slug: "karel-dvorak-ostrava",
    },
  });

  // 8. Pending broker
  const pendingBroker = await prisma.user.create({
    data: {
      email: "novacek@email.cz",
      firstName: "Tom\u00E1\u0161",
      lastName: "Nov\u00E1\u010Dek",
      passwordHash,
      role: "BROKER",
      status: "PENDING",
    },
  });

  console.log(
    `Created ${8} users: ${admin.email}, ${backoffice.email}, ${reditel.email}, ${manazer.email}, ${janNovak.email}, ${petraMala.email}, ${karelDvorak.email}, ${pendingBroker.email}`
  );

  // ============================================
  // 3. VEHICLES
  // ============================================

  console.log("Seeding vehicles...");

  const now = new Date();

  // --- Broker vehicles (8) ---

  // 1. \u0160koda Octavia RS Combi
  const v1 = await prisma.vehicle.create({
    data: {
      vin: "TMBGE61Z9N2012345",
      brand: "\u0160koda",
      model: "Octavia",
      variant: "RS Combi",
      year: 2021,
      mileage: 45000,
      fuelType: "PETROL",
      transmission: "DSG",
      enginePower: 180,
      engineCapacity: 1984,
      bodyType: "COMBI",
      color: "\u010Cerven\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "EXCELLENT",
      serviceBook: true,
      price: 589000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Vyh\u0159\u00EDvan\u00E1 sedadla",
        "LED sv\u011Btlomety",
        "Sportovn\u00ED podvozek",
      ]),
      description:
        "\u0160koda Octavia RS Combi ve v\u00FDborn\u00E9m stavu. Pravideln\u00FD servis u autorizovan\u00E9ho dealera. Sportovn\u00ED paket v\u010Detn\u011B adaptivn\u00EDho podvozku.",
      status: "ACTIVE",
      sellerType: "broker",
      brokerId: janNovak.id,
      city: "Praha",
      trustScore: 96,
      slug: "skoda-octavia-rs-combi",
      publishedAt: now,
    },
  });

  // 2. BMW 330i xDrive
  const v2 = await prisma.vehicle.create({
    data: {
      vin: "WBA5E51040G123456",
      brand: "BMW",
      model: "330i",
      variant: "xDrive",
      year: 2022,
      mileage: 28000,
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      enginePower: 245,
      engineCapacity: 1998,
      bodyType: "SEDAN",
      color: "B\u00EDl\u00E1",
      doorsCount: 4,
      seatsCount: 5,
      condition: "LIKE_NEW",
      serviceBook: true,
      price: 1150000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Ko\u017Een\u00E9 sedadla",
        "Panoramatick\u00E1 st\u0159echa",
        "Harman Kardon audio",
        "Head-up displej",
      ]),
      description:
        "BMW 330i xDrive v luxusn\u00ED v\u00FDbav\u011B M Sport. Jeden majitel, garance stavu. Pravideln\u00FD servis v autorizovan\u00E9m servisu BMW.",
      status: "ACTIVE",
      sellerType: "broker",
      brokerId: petraMala.id,
      city: "Brno",
      trustScore: 98,
      slug: "bmw-330i-xdrive",
      publishedAt: now,
    },
  });

  // 3. VW Golf GTI
  const v3 = await prisma.vehicle.create({
    data: {
      vin: "WVWZZZCDZMW234567",
      brand: "Volkswagen",
      model: "Golf",
      variant: "GTI",
      year: 2020,
      mileage: 52000,
      fuelType: "PETROL",
      transmission: "DSG",
      enginePower: 245,
      engineCapacity: 1984,
      bodyType: "HATCHBACK",
      color: "\u0160ed\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "EXCELLENT",
      serviceBook: true,
      price: 485000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Sportovn\u00ED sedadla",
        "Digit\u00E1ln\u00ED p\u0159\u00EDstrojov\u00FD \u0161t\u00EDt",
      ]),
      description:
        "Volkswagen Golf GTI s dynamick\u00FDm podvozkem DCC. Origin\u00E1ln\u00ED stav, nehavarovan\u00E9.",
      status: "ACTIVE",
      sellerType: "broker",
      brokerId: karelDvorak.id,
      city: "Ostrava",
      trustScore: 92,
      slug: "vw-golf-gti",
      publishedAt: now,
    },
  });

  // 4. Mercedes C300
  const v4 = await prisma.vehicle.create({
    data: {
      vin: "WDD2050431R345678",
      brand: "Mercedes-Benz",
      model: "C300",
      variant: undefined,
      year: 2021,
      mileage: 35000,
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      enginePower: 258,
      engineCapacity: 1991,
      bodyType: "SEDAN",
      color: "\u010Cern\u00E1",
      doorsCount: 4,
      seatsCount: 5,
      condition: "EXCELLENT",
      serviceBook: true,
      price: 980000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Ko\u017Een\u00FD interi\u00E9r",
        "Ambientn\u00ED osv\u011Btlen\u00ED",
        "MBUX multim\u00E9dia",
      ]),
      description:
        "Mercedes-Benz C300 v lince AMG. Elegantn\u00ED sedan s plnou v\u00FDbavou a bezchybn\u00FDm stavem.",
      status: "ACTIVE",
      sellerType: "broker",
      brokerId: janNovak.id,
      city: "Praha",
      trustScore: 94,
      slug: "mercedes-c300",
      publishedAt: now,
    },
  });

  // 5. Audi A4 Avant
  const v5 = await prisma.vehicle.create({
    data: {
      vin: "WAUZZZF43NA456789",
      brand: "Audi",
      model: "A4",
      variant: "Avant",
      year: 2022,
      mileage: 22000,
      fuelType: "DIESEL",
      transmission: "AUTOMATIC",
      enginePower: 163,
      engineCapacity: 1968,
      bodyType: "COMBI",
      color: "Modr\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "LIKE_NEW",
      serviceBook: true,
      price: 890000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Virtu\u00E1ln\u00ED cockpit",
        "Matrix LED sv\u011Btlomety",
      ]),
      description:
        "Audi A4 Avant s n\u00EDzk\u00FDm n\u00E1jezdem. V\u016Fz v z\u00E1ruce, komplettn\u00ED servisn\u00ED historie.",
      status: "PENDING",
      sellerType: "broker",
      brokerId: petraMala.id,
      city: "Plze\u0148",
      trustScore: 95,
      slug: "audi-a4-avant",
    },
  });

  // 6. Hyundai Tucson
  const v6 = await prisma.vehicle.create({
    data: {
      vin: "TMAJ381NDNJ567890",
      brand: "Hyundai",
      model: "Tucson",
      variant: undefined,
      year: 2023,
      mileage: 15000,
      fuelType: "HYBRID",
      transmission: "AUTOMATIC",
      enginePower: 230,
      engineCapacity: 1598,
      bodyType: "SUV",
      color: "Zelen\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "LIKE_NEW",
      serviceBook: true,
      price: 720000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Kamera 360\u00B0",
        "Vyh\u0159\u00EDvan\u00FD volant",
        "Bezdr\u00E1tov\u00E9 nab\u00EDjen\u00ED",
      ]),
      description:
        "Hyundai Tucson hybridn\u00ED verze s nejvy\u0161\u0161\u00ED v\u00FDbavou. Prakticky nov\u00FD v\u016Fz s 5letou z\u00E1rukou.",
      status: "ACTIVE",
      sellerType: "broker",
      brokerId: janNovak.id,
      city: "Liberec",
      trustScore: 90,
      slug: "hyundai-tucson",
      publishedAt: now,
    },
  });

  // 7. Toyota RAV4
  const v7 = await prisma.vehicle.create({
    data: {
      vin: "JTMW43FV20D678901",
      brand: "Toyota",
      model: "RAV4",
      variant: undefined,
      year: 2021,
      mileage: 38000,
      fuelType: "HYBRID",
      transmission: "CVT",
      enginePower: 222,
      engineCapacity: 2487,
      bodyType: "SUV",
      color: "B\u00EDl\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "EXCELLENT",
      serviceBook: true,
      price: 780000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Adaptivn\u00ED tempomat",
        "Vyhř\u00EDvan\u00E1 sedadla",
        "Toyota Safety Sense",
      ]),
      description:
        "Toyota RAV4 Hybrid AWD. Spolehliv\u00E9 SUV s n\u00EDzkou spot\u0159ebou a v\u00FDbornou v\u00FDbavou.",
      status: "ACTIVE",
      sellerType: "broker",
      brokerId: karelDvorak.id,
      city: "Praha",
      trustScore: 93,
      slug: "toyota-rav4",
      publishedAt: now,
    },
  });

  // 8. \u0160koda Superb Combi
  const v8 = await prisma.vehicle.create({
    data: {
      vin: "TMBAJ7NP1M8901234",
      brand: "\u0160koda",
      model: "Superb",
      variant: "Combi",
      year: 2020,
      mileage: 68000,
      fuelType: "DIESEL",
      transmission: "DSG",
      enginePower: 150,
      engineCapacity: 1968,
      bodyType: "COMBI",
      color: "St\u0159\u00EDbrn\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "GOOD",
      serviceBook: true,
      price: 520000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Vyh\u0159\u00EDvan\u00E1 sedadla",
        "Elektrick\u00E1 p\u00E1t\u00E1 dve\u0159e",
        "Ta\u017En\u00E9 za\u0159\u00EDzen\u00ED",
      ]),
      description:
        "\u0160koda Superb Combi s prostorn\u00FDm kufrem a \u00FAspornou dieselovou motorizac\u00ED. Ide\u00E1ln\u00ED rodinn\u00FD v\u016Fz.",
      status: "ACTIVE",
      sellerType: "broker",
      brokerId: petraMala.id,
      city: "Pardubice",
      trustScore: 91,
      slug: "skoda-superb-combi",
      publishedAt: now,
    },
  });

  // --- Private vehicles (4) ---

  // 9. \u0160koda Fabia
  const v9 = await prisma.vehicle.create({
    data: {
      vin: "TMBJJ26J5L1234567",
      brand: "\u0160koda",
      model: "Fabia",
      variant: "TSI",
      year: 2019,
      mileage: 65000,
      fuelType: "PETROL",
      transmission: "MANUAL",
      enginePower: 110,
      engineCapacity: 999,
      bodyType: "HATCHBACK",
      color: "\u010Cerven\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "GOOD",
      serviceBook: true,
      price: 195000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "R\u00E1dio",
        "Centr\u00E1ln\u00ED zamyk\u00E1n\u00ED",
        "Elektrick\u00E1 okna",
      ]),
      description:
        "Prod\u00E1m \u0160kodu Fabii v dobr\u00E9m stavu. Pravideln\u011B servisovan\u00E1, STK do 2025.",
      status: "ACTIVE",
      sellerType: "private",
      contactName: "Pavel Svoboda",
      contactPhone: "+420606123456",
      city: "Praha",
      trustScore: 0,
      slug: "skoda-fabia-tsi-2019",
      publishedAt: now,
    },
  });

  // 10. VW Polo
  const v10 = await prisma.vehicle.create({
    data: {
      vin: "WVWZZZAWZKY234567",
      brand: "Volkswagen",
      model: "Polo",
      variant: "TDI",
      year: 2018,
      mileage: 82000,
      fuelType: "DIESEL",
      transmission: "MANUAL",
      enginePower: 95,
      engineCapacity: 1598,
      bodyType: "HATCHBACK",
      color: "Modr\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "GOOD",
      serviceBook: false,
      price: 165000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
      ]),
      description:
        "VW Polo TDI, \u00FAspornn\u00FD dieselov\u00FD motor. V\u016Fz bez nehod, funk\u010Dn\u00ED klimatizace.",
      status: "ACTIVE",
      sellerType: "private",
      contactName: "Marie Hor\u00E1kov\u00E1",
      city: "Brno",
      trustScore: 0,
      slug: "vw-polo-tdi-2018",
      publishedAt: now,
    },
  });

  // 11. Hyundai i30
  const v11 = await prisma.vehicle.create({
    data: {
      vin: "TMAH381ADLJ345678",
      brand: "Hyundai",
      model: "i30",
      variant: "T-GDi",
      year: 2020,
      mileage: 45000,
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      enginePower: 120,
      engineCapacity: 1353,
      bodyType: "HATCHBACK",
      color: "\u0160ed\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "EXCELLENT",
      serviceBook: true,
      price: 289000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "Zadn\u00ED kamera",
        "Vyh\u0159\u00EDvan\u00FD volant",
      ]),
      description:
        "Hyundai i30 v nejvy\u0161\u0161\u00ED v\u00FDbav\u011B Style. Je\u0161t\u011B v tov\u00E1rn\u00ED z\u00E1ruce.",
      status: "ACTIVE",
      sellerType: "private",
      contactName: "Ji\u0159\u00ED Proch\u00E1zka",
      city: "Ostrava",
      trustScore: 0,
      slug: "hyundai-i30-tgdi-2020",
      publishedAt: now,
    },
  });

  // 12. Opel Astra
  const v12 = await prisma.vehicle.create({
    data: {
      vin: "W0LBD8EL5N1456789",
      brand: "Opel",
      model: "Astra",
      variant: "CDTi",
      year: 2021,
      mileage: 38000,
      fuelType: "DIESEL",
      transmission: "AUTOMATIC",
      enginePower: 130,
      engineCapacity: 1499,
      bodyType: "HATCHBACK",
      color: "\u010Cern\u00E1",
      doorsCount: 5,
      seatsCount: 5,
      condition: "EXCELLENT",
      serviceBook: true,
      price: 320000,
      priceNegotiable: true,
      equipment: JSON.stringify([
        "Klimatizace",
        "Navigace",
        "Parkovac\u00ED senzory",
        "LED sv\u011Btlomety",
        "Digit\u00E1ln\u00ED p\u0159\u00EDstrojov\u00FD \u0161t\u00EDt",
      ]),
      description:
        "Opel Astra nov\u00E9 generace s \u00FAspornou dieselovou motorizac\u00ED a bohatou v\u00FDbavou.",
      status: "ACTIVE",
      sellerType: "private",
      contactName: "Lucie Nov\u00E1",
      city: "Plze\u0148",
      trustScore: 0,
      slug: "opel-astra-cdti-2021",
      publishedAt: now,
    },
  });

  console.log("Created 12 vehicles (8 broker, 4 private)");

  // ============================================
  // 4. VEHICLE IMAGES
  // ============================================

  console.log("Seeding vehicle images...");

  const vehicleImages = [
    // v1 - \u0160koda Octavia RS Combi
    {
      vehicleId: v1.id,
      url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v1.id,
      url: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    {
      vehicleId: v1.id,
      url: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80",
      order: 2,
      isPrimary: false,
    },
    // v2 - BMW 330i xDrive
    {
      vehicleId: v2.id,
      url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v2.id,
      url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    {
      vehicleId: v2.id,
      url: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80",
      order: 2,
      isPrimary: false,
    },
    // v3 - VW Golf GTI
    {
      vehicleId: v3.id,
      url: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v3.id,
      url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    // v4 - Mercedes C300
    {
      vehicleId: v4.id,
      url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v4.id,
      url: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    {
      vehicleId: v4.id,
      url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
      order: 2,
      isPrimary: false,
    },
    // v5 - Audi A4 Avant
    {
      vehicleId: v5.id,
      url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v5.id,
      url: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    // v6 - Hyundai Tucson
    {
      vehicleId: v6.id,
      url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v6.id,
      url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afe?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    {
      vehicleId: v6.id,
      url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80",
      order: 2,
      isPrimary: false,
    },
    // v7 - Toyota RAV4
    {
      vehicleId: v7.id,
      url: "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v7.id,
      url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    // v8 - \u0160koda Superb Combi
    {
      vehicleId: v8.id,
      url: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v8.id,
      url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    {
      vehicleId: v8.id,
      url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80",
      order: 2,
      isPrimary: false,
    },
    // v9 - \u0160koda Fabia (private)
    {
      vehicleId: v9.id,
      url: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v9.id,
      url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afe?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    // v10 - VW Polo (private)
    {
      vehicleId: v10.id,
      url: "https://images.unsplash.com/photo-1471479917193-f00955256257?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v10.id,
      url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    // v11 - Hyundai i30 (private)
    {
      vehicleId: v11.id,
      url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v11.id,
      url: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
    {
      vehicleId: v11.id,
      url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80",
      order: 2,
      isPrimary: false,
    },
    // v12 - Opel Astra (private)
    {
      vehicleId: v12.id,
      url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
      order: 0,
      isPrimary: true,
    },
    {
      vehicleId: v12.id,
      url: "https://images.unsplash.com/photo-2605559424843-9e4c228bf1c2?w=800&q=80",
      order: 1,
      isPrimary: false,
    },
  ];

  await prisma.vehicleImage.createMany({
    data: vehicleImages,
  });

  console.log(`Created ${vehicleImages.length} vehicle images`);

  // ============================================
  // 5. COMMISSIONS
  // ============================================

  console.log("Seeding commissions...");

  await prisma.commission.createMany({
    data: [
      {
        brokerId: janNovak.id,
        vehicleId: v1.id,
        salePrice: 575000,
        commission: 28750,
        rate: 5.0,
        status: "PAID",
        soldAt: new Date("2026-02-15"),
        paidAt: new Date("2026-03-01"),
      },
      {
        brokerId: janNovak.id,
        vehicleId: v4.id,
        salePrice: 960000,
        commission: 48000,
        rate: 5.0,
        status: "APPROVED",
        soldAt: new Date("2026-03-10"),
        paidAt: null,
      },
      {
        brokerId: petraMala.id,
        vehicleId: v2.id,
        salePrice: 1120000,
        commission: 56000,
        rate: 5.0,
        status: "PAID",
        soldAt: new Date("2026-01-20"),
        paidAt: new Date("2026-02-05"),
      },
      {
        brokerId: petraMala.id,
        vehicleId: v8.id,
        salePrice: 505000,
        commission: 25250,
        rate: 5.0,
        status: "PENDING",
        soldAt: new Date("2026-03-18"),
        paidAt: null,
      },
      {
        brokerId: karelDvorak.id,
        vehicleId: v3.id,
        salePrice: 470000,
        commission: 23500,
        rate: 5.0,
        status: "APPROVED",
        soldAt: new Date("2026-03-05"),
        paidAt: null,
      },
    ],
  });

  console.log("Created 5 commissions");

  // ============================================
  // 6. NOTIFICATIONS
  // ============================================

  console.log("Seeding notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: janNovak.id,
        type: "COMMISSION",
        title: "Provize vyplacena",
        body: "Provize 28 750 Kč za prodej Škoda Octavia RS byla vyplacena na váš účet.",
        link: "/makler/commissions",
        read: true,
      },
      {
        userId: janNovak.id,
        type: "COMMISSION",
        title: "Provize schválena",
        body: "Provize 48 000 Kč za prodej Mercedes C300 byla schválena. Vyplacení do 14 dnů.",
        link: "/makler/commissions",
        read: false,
      },
      {
        userId: janNovak.id,
        type: "VEHICLE",
        title: "Nový zájemce",
        body: "O váš inzerát Hyundai Tucson má zájem nový kupující.",
        link: "/makler/vehicles",
        read: false,
      },
      {
        userId: petraMala.id,
        type: "COMMISSION",
        title: "Nová provize k vyřízení",
        body: "Provize 25 250 Kč za Škoda Superb Combi čeká na schválení.",
        link: "/makler/commissions",
        read: false,
      },
      {
        userId: petraMala.id,
        type: "SYSTEM",
        title: "Vítejte v CarMakléř Pro",
        body: "Děkujeme za registraci. Začněte přidáním svého prvního vozu.",
        link: "/makler/vehicles/new",
        read: true,
      },
      {
        userId: karelDvorak.id,
        type: "VEHICLE",
        title: "Inzerát schválen",
        body: "Váš inzerát VW Golf GTI byl schválen a je nyní aktivní.",
        link: "/makler/vehicles",
        read: false,
      },
      {
        userId: admin.id,
        type: "SYSTEM",
        title: "Nový makléř čeká na schválení",
        body: "Tomáš Nováček se zaregistroval a čeká na schválení účtu.",
        link: "/admin/users",
        read: false,
      },
    ],
  });

  console.log("Created 7 notifications");

  // ============================================
  // 7. CONTRACTS
  // ============================================

  console.log("Seeding contracts...");

  await prisma.contract.createMany({
    data: [
      {
        type: "BROKERAGE",
        vehicleId: v1.id,
        brokerId: janNovak.id,
        sellerName: "František Horák",
        sellerPhone: "+420602111222",
        sellerEmail: "horak@email.cz",
        sellerAddress: "Vinohradská 42, Praha 2",
        sellerIdNumber: "8501151234",
        sellerIdCard: "204567890",
        content: JSON.stringify({
          type: "BROKERAGE",
          vehicleName: "Škoda Octavia RS Combi",
          vin: "TMBGE61Z9N2012345",
          price: 589000,
          commission: 29450,
          sections: ["Hlavička", "Strany", "Předmět", "Podmínky", "Podpisy"],
        }),
        price: 589000,
        commission: 29450,
        sellerSignature: null,
        brokerSignature: null,
        signedAt: new Date("2026-03-10T14:30:00"),
        signedLocation: "Praha",
        status: "SIGNED",
      },
      {
        type: "HANDOVER",
        vehicleId: v2.id,
        brokerId: petraMala.id,
        sellerName: "Milan Dvořák",
        sellerPhone: "+420603222333",
        content: JSON.stringify({
          type: "HANDOVER",
          vehicleName: "BMW 330i xDrive",
          vin: "WBA5E51040G123456",
          mileageAtHandover: 28000,
          fuelLevel: "3/4",
          accessories: ["2x klíče", "Servisní knížka", "Povinná výbava"],
          damages: [],
          sections: ["Hlavička", "Strany", "Stav vozidla", "Příslušenství", "Podpisy"],
        }),
        price: 1150000,
        commission: 57500,
        status: "SENT",
      },
      {
        type: "BROKERAGE",
        vehicleId: v3.id,
        brokerId: janNovak.id,
        sellerName: "Jiřina Veselá",
        sellerPhone: "+420604333444",
        sellerEmail: "vesela@email.cz",
        content: JSON.stringify({
          type: "BROKERAGE",
          vehicleName: "Volkswagen Golf GTI",
          vin: "WVWZZZCDZMW234567",
          price: 485000,
          commission: 25000,
          sections: ["Hlavička", "Strany", "Předmět", "Podmínky", "Podpisy"],
        }),
        price: 485000,
        commission: 25000,
        status: "DRAFT",
      },
    ],
  });

  console.log("Created 3 contracts");

  // ============================================
  // 8. ADVERTISER & BUYER USERS
  // ============================================

  console.log("Seeding advertiser and buyer users...");

  const advertiser1 = await prisma.user.create({
    data: {
      email: "prodejce@email.cz",
      firstName: "Tomáš",
      lastName: "Prodejce",
      passwordHash,
      role: "BROKER",
      accountType: "PRIVATE",
      status: "ACTIVE",
    },
  });

  const advertiser2 = await prisma.user.create({
    data: {
      email: "autobazar@email.cz",
      firstName: "Autobazar",
      lastName: "Královo Pole",
      passwordHash,
      role: "BROKER",
      accountType: "DEALER",
      companyName: "Autobazar Královo Pole s.r.o.",
      ico: "12345678",
      icoVerified: true,
      status: "ACTIVE",
    },
  });

  const buyer1 = await prisma.user.create({
    data: {
      email: "kupujici@email.cz",
      firstName: "Petr",
      lastName: "Kupující",
      passwordHash,
      role: "BROKER",
      accountType: "BUYER",
      status: "ACTIVE",
    },
  });

  console.log("Created 3 advertiser/buyer users");

  // ============================================
  // 9. LISTINGS (inzertní platforma)
  // ============================================

  console.log("Seeding listings...");

  const listing1 = await prisma.listing.create({
    data: {
      slug: "renault-megane-gt-2020",
      listingType: "PRIVATE",
      userId: advertiser1.id,
      brand: "Renault",
      model: "Mégane",
      variant: "GT",
      year: 2020,
      mileage: 55000,
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      enginePower: 160,
      engineCapacity: 1332,
      bodyType: "HATCHBACK",
      color: "Černá",
      doorsCount: 5,
      seatsCount: 5,
      condition: "EXCELLENT",
      serviceBook: true,
      stkValidUntil: new Date("2026-08-15"),
      ownerCount: 1,
      originCountry: "CZ",
      price: 385000,
      priceNegotiable: true,
      contactName: "Tomáš Prodejce",
      contactPhone: "+420607111222",
      contactEmail: "prodejce@email.cz",
      city: "Praha",
      district: "Praha 4",
      description: "Prodám Renault Mégane GT v černé metalíze. Vůz je v perfektním stavu, pravidelně servisovaný u autorizovaného dealera. Nekouřeno, bez domácích mazlíčků.",
      equipment: JSON.stringify(["Klimatizace", "Navigace", "Parkovací senzory", "LED světlomety", "Vyhřívaná sedadla", "Kamera"]),
      highlights: JSON.stringify(["1 majitel", "Plný servis", "STK do 08/2026"]),
      status: "ACTIVE",
      publishedAt: now,
      expiresAt: new Date("2026-05-22"),
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      slug: "ford-focus-st-line-2021",
      listingType: "PRIVATE",
      userId: advertiser1.id,
      brand: "Ford",
      model: "Focus",
      variant: "ST-Line",
      year: 2021,
      mileage: 32000,
      fuelType: "DIESEL",
      transmission: "AUTOMATIC",
      enginePower: 150,
      engineCapacity: 1499,
      bodyType: "COMBI",
      color: "Modrá",
      doorsCount: 5,
      seatsCount: 5,
      condition: "LIKE_NEW",
      serviceBook: true,
      stkValidUntil: new Date("2027-03-20"),
      ownerCount: 1,
      originCountry: "CZ",
      price: 450000,
      priceNegotiable: true,
      contactName: "Tomáš Prodejce",
      contactPhone: "+420607111222",
      city: "Praha",
      district: "Praha 9",
      description: "Ford Focus ST-Line Combi s automatickou převodovkou. Úsporný diesel, výborný stav. Head-up display, matrix LED.",
      equipment: JSON.stringify(["Klimatizace", "Navigace", "Head-up displej", "Matrix LED", "Adaptivní tempomat", "Elektrická páta dveře"]),
      highlights: JSON.stringify(["Záruka do 2027", "Matrix LED", "Head-up displej"]),
      status: "ACTIVE",
      publishedAt: now,
      expiresAt: new Date("2026-06-22"),
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      slug: "skoda-octavia-bazaar-2019",
      listingType: "DEALER",
      userId: advertiser2.id,
      brand: "Škoda",
      model: "Octavia",
      variant: "Ambition",
      year: 2019,
      mileage: 78000,
      fuelType: "DIESEL",
      transmission: "DSG",
      enginePower: 150,
      engineCapacity: 1968,
      bodyType: "COMBI",
      color: "Stříbrná",
      doorsCount: 5,
      seatsCount: 5,
      condition: "GOOD",
      serviceBook: true,
      ownerCount: 2,
      originCountry: "CZ",
      price: 395000,
      priceNegotiable: true,
      vatStatus: "NON_DEDUCTIBLE",
      contactName: "Autobazar Královo Pole",
      contactPhone: "+420541234567",
      contactEmail: "autobazar@email.cz",
      city: "Brno",
      district: "Královo Pole",
      description: "Škoda Octavia Combi v lince Ambition. Pravidelný servis, nehavarované. K dispozici ihned.",
      equipment: JSON.stringify(["Klimatizace", "Navigace", "Parkovací senzory", "Vyhřívaná sedadla", "Tempomat"]),
      highlights: JSON.stringify(["Servisovaná", "DSG", "Ihned k odběru"]),
      status: "ACTIVE",
      publishedAt: now,
      expiresAt: new Date("2026-06-01"),
    },
  });

  const listing4 = await prisma.listing.create({
    data: {
      slug: "peugeot-3008-gt-2022",
      listingType: "DEALER",
      userId: advertiser2.id,
      brand: "Peugeot",
      model: "3008",
      variant: "GT",
      year: 2022,
      mileage: 25000,
      fuelType: "PLUGIN_HYBRID",
      transmission: "AUTOMATIC",
      enginePower: 300,
      engineCapacity: 1598,
      bodyType: "SUV",
      color: "Zelená",
      doorsCount: 5,
      seatsCount: 5,
      condition: "LIKE_NEW",
      serviceBook: true,
      stkValidUntil: new Date("2028-01-10"),
      ownerCount: 1,
      originCountry: "FR",
      price: 750000,
      priceNegotiable: false,
      vatStatus: "DEDUCTIBLE",
      contactName: "Autobazar Královo Pole",
      contactPhone: "+420541234567",
      city: "Brno",
      description: "Peugeot 3008 GT Plug-in Hybrid s 300 HP. Maximální výbava, noční vidění, masážní sedadla. Odpočet DPH možný.",
      equipment: JSON.stringify(["Klimatizace", "Navigace", "Noční vidění", "Masážní sedadla", "Focal audio", "Panoramatická střecha", "360° kamera"]),
      highlights: JSON.stringify(["Plug-in Hybrid 300 HP", "Noční vidění", "Odpočet DPH"]),
      status: "ACTIVE",
      isPremium: true,
      premiumUntil: new Date("2026-04-22"),
      publishedAt: now,
      expiresAt: new Date("2026-07-01"),
    },
  });

  const listing5 = await prisma.listing.create({
    data: {
      slug: "mazda-cx5-2021-draft",
      listingType: "PRIVATE",
      userId: advertiser1.id,
      brand: "Mazda",
      model: "CX-5",
      year: 2021,
      mileage: 42000,
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      enginePower: 194,
      engineCapacity: 2488,
      bodyType: "SUV",
      color: "Červená",
      condition: "EXCELLENT",
      price: 620000,
      contactName: "Tomáš Prodejce",
      contactPhone: "+420607111222",
      city: "Praha",
      description: "Mazda CX-5 — rozpracovaný inzerát.",
      status: "DRAFT",
    },
  });

  console.log("Created 5 listings");

  // ============================================
  // 10. LISTING IMAGES
  // ============================================

  console.log("Seeding listing images...");

  await prisma.listingImage.createMany({
    data: [
      { listingId: listing1.id, url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afe?w=800&q=80", order: 0, isPrimary: true },
      { listingId: listing1.id, url: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80", order: 1, isPrimary: false },
      { listingId: listing2.id, url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80", order: 0, isPrimary: true },
      { listingId: listing2.id, url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80", order: 1, isPrimary: false },
      { listingId: listing3.id, url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80", order: 0, isPrimary: true },
      { listingId: listing3.id, url: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80", order: 1, isPrimary: false },
      { listingId: listing4.id, url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80", order: 0, isPrimary: true },
      { listingId: listing4.id, url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80", order: 1, isPrimary: false },
      { listingId: listing4.id, url: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80", order: 2, isPrimary: false },
    ],
  });

  console.log("Created 9 listing images");

  // ============================================
  // 11. INQUIRIES
  // ============================================

  console.log("Seeding inquiries...");

  await prisma.inquiry.createMany({
    data: [
      {
        listingId: listing1.id,
        senderId: buyer1.id,
        name: "Petr Kupující",
        email: "kupujici@email.cz",
        phone: "+420608333444",
        message: "Dobrý den, mám zájem o tento Renault Mégane. Je možné si ho prohlédnout tento víkend?",
        read: false,
      },
      {
        listingId: listing1.id,
        name: "Jana Nováková",
        email: "jana.novakova@email.cz",
        message: "Zdravím, je cena konečná nebo je prostor k jednání? Díky.",
        read: true,
        reply: "Dobrý den, cena je k jednání, ale nečekejte zázraky. Napište mi a domluvíme se.",
        repliedAt: new Date("2026-03-20T15:30:00"),
      },
      {
        listingId: listing3.id,
        senderId: buyer1.id,
        name: "Petr Kupující",
        email: "kupujici@email.cz",
        message: "Dobrý den, je Octavia k dispozici? Mám zájem o zkušební jízdu.",
        read: false,
      },
      {
        listingId: listing4.id,
        name: "Martin Říha",
        email: "riha.m@email.cz",
        phone: "+420609444555",
        message: "Je možný odpočet DPH? Kupuji na firmu.",
        read: true,
        reply: "Ano, odpočet DPH je možný. Vůz je evidovaný na firmu s DPH. Zavolejte nám pro více info.",
        repliedAt: new Date("2026-03-21T09:00:00"),
      },
    ],
  });

  console.log("Created 4 inquiries");

  // ============================================
  // 12. WATCHDOGS
  // ============================================

  console.log("Seeding watchdogs...");

  await prisma.watchdog.createMany({
    data: [
      {
        userId: buyer1.id,
        brand: "Škoda",
        model: "Octavia",
        maxPrice: 500000,
        minYear: 2018,
        fuelType: "DIESEL",
      },
      {
        userId: buyer1.id,
        bodyType: "SUV",
        maxPrice: 800000,
        minYear: 2020,
      },
    ],
  });

  console.log("Created 2 watchdogs");

  // ============================================
  // SUMMARY
  // ============================================

  const regionCount = await prisma.region.count();
  const userCount = await prisma.user.count();
  const vehicleCount = await prisma.vehicle.count();
  const imageCount = await prisma.vehicleImage.count();
  const commissionCount = await prisma.commission.count();
  const notificationCount = await prisma.notification.count();
  const contractCount = await prisma.contract.count();
  const listingCount = await prisma.listing.count();
  const listingImageCount = await prisma.listingImage.count();
  const inquiryCount = await prisma.inquiry.count();
  const watchdogCount = await prisma.watchdog.count();

  console.log("\n--- Seed complete ---");
  console.log(`Regions:        ${regionCount}`);
  console.log(`Users:          ${userCount}`);
  console.log(`Vehicles:       ${vehicleCount}`);
  console.log(`Vehicle Images: ${imageCount}`);
  console.log(`Commissions:    ${commissionCount}`);
  console.log(`Notifications:  ${notificationCount}`);
  console.log(`Contracts:      ${contractCount}`);
  console.log(`Listings:       ${listingCount}`);
  console.log(`Listing Images: ${listingImageCount}`);
  console.log(`Inquiries:      ${inquiryCount}`);
  console.log(`Watchdogs:      ${watchdogCount}`);
  console.log("\nDemo login: admin@carmakler.cz / heslo123");
  console.log("Advertiser login: prodejce@email.cz / heslo123");
  console.log("Buyer login: kupujici@email.cz / heslo123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
