import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing existing data...");
  // Partner subsystem
  await prisma.partnerActivity.deleteMany();
  await prisma.partnerLead.deleteMany();
  await prisma.partner.deleteMany();
  // Tokens
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  // Orders & returns
  await prisma.returnRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  // Parts
  await prisma.partImage.deleteMany();
  await prisma.part.deleteMany();
  await prisma.partsFeedConfig.deleteMany();
  // Vehicles & related
  await prisma.sellerCommunication.deleteMany();
  await prisma.sellerContact.deleteMany();
  await prisma.sellerPayout.deleteMany();
  await prisma.brokerPayout.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.cebiaReport.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.priceReduction.deleteMany();
  await prisma.damageReport.deleteMany();
  await prisma.vehicleInquiry.deleteMany();
  await prisma.lead.deleteMany();
  // Marketplace
  await prisma.investment.deleteMany();
  await prisma.flipOpportunity.deleteMany();
  // Listings
  await prisma.favorite.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.watchdog.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  // User-related
  await prisma.invitation.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.smsLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.commission.deleteMany();
  // Vehicles
  await prisma.vehicleChangeLog.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  // Core
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

  // ============================================
  // REAL ACCOUNTS (production-ready)
  // ============================================
  const jevgenijHash = await bcrypt.hash("Xk9$mPw2vR4nQz", 12);
  const radimHash = await bcrypt.hash("Ht7#jLs5bN8wYx", 12);
  const katerinaHash = await bcrypt.hash("Rf3&kWp6dM2cJv", 12);

  await prisma.user.create({
    data: {
      email: "jevgenij@carmakler.cz",
      firstName: "Jevgenij",
      lastName: "Onegin",
      passwordHash: jevgenijHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      email: "radim@carmakler.cz",
      firstName: "Radim",
      lastName: "Carmakler",
      passwordHash: radimHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      email: "katerina@carmakler.cz",
      firstName: "Kateřina",
      lastName: "Carmakler",
      passwordHash: katerinaHash,
      role: "MANAGER",
      status: "ACTIVE",
    },
  });

  // ============================================
  // DEMO ACCOUNTS (development only)
  // ============================================

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

  // 9. Onboarding broker — makléř v procesu onboardingu
  const onboardingBroker = await prisma.user.create({
    data: {
      email: "onboarding@carmakler.cz",
      firstName: "Lukáš",
      lastName: "Onboardingový",
      passwordHash,
      role: "BROKER",
      status: "ONBOARDING",
      managerId: manazer.id,
      regionId: regionPraha.id,
      onboardingStep: 2,
      onboardingCompleted: false,
      ico: "87654321",
    },
  });

  console.log(
    `Created ${9} users: ${admin.email}, ${backoffice.email}, ${reditel.email}, ${manazer.email}, ${janNovak.email}, ${petraMala.email}, ${karelDvorak.email}, ${pendingBroker.email}, ${onboardingBroker.email}`
  );

  // ============================================
  // 2b. INVITATIONS
  // ============================================

  console.log("Seeding invitations...");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);

  // Pozvánka 1: PENDING (platná)
  await prisma.invitation.create({
    data: {
      email: "novy.makler@email.cz",
      name: "Jakub Nový",
      token: "inv-token-pending-001",
      managerId: manazer.id,
      regionId: regionPraha.id,
      status: "PENDING",
      expiresAt,
    },
  });

  // Pozvánka 2: USED (použitá — onboardingBroker)
  await prisma.invitation.create({
    data: {
      email: "onboarding@carmakler.cz",
      name: "Lukáš Onboardingový",
      token: "inv-token-used-002",
      managerId: manazer.id,
      regionId: regionPraha.id,
      status: "USED",
      expiresAt,
    },
  });

  // Pozvánka 3: EXPIRED
  await prisma.invitation.create({
    data: {
      email: "expired@email.cz",
      name: "Starý Zájemce",
      token: "inv-token-expired-003",
      managerId: manazer.id,
      regionId: regionJihomoravsky.id,
      status: "EXPIRED",
      expiresAt: pastDate,
    },
  });

  const invitationCount = await prisma.invitation.count();
  console.log(`Created ${invitationCount} invitations`);

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
      role: "BUYER",
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

  // ============================================
  // ESHOP AUTODÍLY — Dodavatel + díly + objednávky
  // ============================================

  console.log("Seeding parts supplier...");

  const supplier1 = await prisma.user.create({
    data: {
      email: "dodavatel@vrakoviste.cz",
      passwordHash,
      firstName: "Karel",
      lastName: "Vrátný",
      phone: "+420777888999",
      role: "PARTS_SUPPLIER",
      status: "ACTIVE",
      companyName: "Vrakoviště Praha s.r.o.",
      ico: "12345678",
      icoVerified: true,
      cities: JSON.stringify(["Praha 9"]),
      bio: "Vrakoviště s 15letou tradicí. Specializujeme se na díly z vozů Škoda, VW a BMW.",
    },
  });

  const supplier2 = await prisma.user.create({
    data: {
      email: "dodavatel2@autodily.cz",
      passwordHash,
      firstName: "Martin",
      lastName: "Šroubek",
      phone: "+420666777888",
      role: "PARTS_SUPPLIER",
      status: "ACTIVE",
      companyName: "AutoDíly Brno",
      ico: "87654321",
      icoVerified: true,
      cities: JSON.stringify(["Brno"]),
    },
  });

  console.log("Seeding parts...");

  const part1 = await prisma.part.create({
    data: {
      slug: "dvere-predni-leve-octavia-iii",
      supplierId: supplier1.id,
      name: "Dveře přední levé",
      category: "BODY",
      description: "Originální přední levé dveře ze Škody Octavia III (5E), rok 2019. Díl z vozu s 85 000 km, bez koroze, plně funkční mechanismus.",
      oemNumber: "5E4 831 051",
      condition: "USED_GOOD",
      price: 4500,
      stock: 1,
      weight: 22,
      compatibleBrands: JSON.stringify(["Škoda"]),
      compatibleModels: JSON.stringify(["Octavia"]),
      compatibleYearFrom: 2013,
      compatibleYearTo: 2020,
      status: "ACTIVE",
      viewCount: 127,
    },
  });

  const part2 = await prisma.part.create({
    data: {
      slug: "turbodmychadlo-2-0-tdi",
      supplierId: supplier1.id,
      name: "Turbodmychadlo",
      category: "ENGINE",
      description: "Turbodmychadlo pro motory 2.0 TDI (DFGA/DTTA). Demontováno z vozu s 62 000 km. Plně funkční, bez axiální vůle.",
      oemNumber: "04L 253 010 T",
      condition: "USED_GOOD",
      price: 12000,
      stock: 2,
      weight: 8.5,
      compatibleBrands: JSON.stringify(["Škoda", "Volkswagen", "Audi"]),
      compatibleModels: JSON.stringify(["Octavia", "Passat", "A4"]),
      compatibleYearFrom: 2015,
      compatibleYearTo: 2022,
      status: "ACTIVE",
      viewCount: 89,
    },
  });

  const part3 = await prisma.part.create({
    data: {
      slug: "brzdove-desticky-predni-vw-group",
      supplierId: supplier2.id,
      name: "Brzdové destičky přední",
      category: "BRAKES",
      description: "Nové aftermarket brzdové destičky pro vozy VW Group. Odpovídají OE kvalitě.",
      partNumber: "BD-VW-001",
      condition: "NEW",
      price: 890,
      stock: 15,
      compatibleBrands: JSON.stringify(["Škoda", "Volkswagen", "Audi"]),
      compatibleModels: JSON.stringify(["Octavia", "Golf", "A3"]),
      compatibleYearFrom: 2012,
      compatibleYearTo: 2024,
      status: "ACTIVE",
      viewCount: 234,
    },
  });

  const part4 = await prisma.part.create({
    data: {
      slug: "led-svetlomet-bmw-f30",
      supplierId: supplier1.id,
      name: "LED světlomet přední pravý",
      category: "ELECTRICAL",
      description: "Originální LED světlomet z BMW řady 3 (F30). Kompletní s řídící jednotkou.",
      oemNumber: "63 11 7 419 630",
      condition: "USED_GOOD",
      price: 8500,
      stock: 1,
      weight: 4.2,
      compatibleBrands: JSON.stringify(["BMW"]),
      compatibleModels: JSON.stringify(["Řada 3"]),
      compatibleYearFrom: 2012,
      compatibleYearTo: 2018,
      status: "ACTIVE",
      viewCount: 56,
    },
  });

  const part5 = await prisma.part.create({
    data: {
      slug: "sedacka-ridice-octavia-rs",
      supplierId: supplier1.id,
      name: "Sedačka řidiče komplet",
      category: "INTERIOR",
      description: "Sportovní sedačka řidiče ze Škody Octavia RS. Alcantara/látka, elektrické ovládání, vyhřívání.",
      condition: "USED_FAIR",
      price: 6200,
      stock: 1,
      weight: 18,
      compatibleBrands: JSON.stringify(["Škoda"]),
      compatibleModels: JSON.stringify(["Octavia"]),
      compatibleYearFrom: 2017,
      compatibleYearTo: 2020,
      status: "ACTIVE",
      viewCount: 42,
    },
  });

  const part6 = await prisma.part.create({
    data: {
      slug: "olejovy-filtr-mann-2-0-tdi",
      supplierId: supplier2.id,
      name: "Olejový filtr Mann",
      category: "ENGINE",
      description: "Nový olejový filtr Mann-Filter pro motory 2.0 TDI.",
      partNumber: "HU 7020 z",
      condition: "NEW",
      price: 189,
      stock: 30,
      compatibleBrands: JSON.stringify(["Škoda", "Volkswagen", "Audi"]),
      compatibleModels: JSON.stringify(["Octavia", "Passat", "Golf", "A4"]),
      compatibleYearFrom: 2012,
      compatibleYearTo: 2024,
      universalFit: false,
      status: "ACTIVE",
      viewCount: 312,
    },
  });

  const part7 = await prisma.part.create({
    data: {
      slug: "tlumic-predni-levy-octavia",
      supplierId: supplier2.id,
      name: "Tlumič přední levý",
      category: "SUSPENSION",
      description: "Nový aftermarket přední tlumič pro Škoda Octavia III. Odpovídá OE specifikaci.",
      partNumber: "TL-OCT-FL",
      condition: "NEW",
      price: 1890,
      stock: 8,
      compatibleBrands: JSON.stringify(["Škoda"]),
      compatibleModels: JSON.stringify(["Octavia"]),
      compatibleYearFrom: 2013,
      compatibleYearTo: 2020,
      status: "ACTIVE",
      viewCount: 67,
    },
  });

  const part8 = await prisma.part.create({
    data: {
      slug: "motor-2-0-tdi-dfga-komplet",
      supplierId: supplier1.id,
      name: "Motor 2.0 TDI DFGA komplet",
      category: "ENGINE",
      description: "Kompletní motor 2.0 TDI 110 kW z vozu s nájezdem 94 000 km. Plně funkční, bez závad.",
      oemNumber: "04L 100 033 T",
      condition: "USED_GOOD",
      price: 45000,
      stock: 1,
      weight: 145,
      compatibleBrands: JSON.stringify(["Škoda", "Volkswagen"]),
      compatibleModels: JSON.stringify(["Octavia", "Superb", "Passat"]),
      compatibleYearFrom: 2015,
      compatibleYearTo: 2020,
      status: "ACTIVE",
      viewCount: 178,
    },
  });

  console.log("Seeding wholesale supplier...");

  const wholesale1 = await prisma.user.create({
    data: {
      email: "velkoobchod@carmakler.cz",
      passwordHash,
      firstName: "Tomáš",
      lastName: "Kelly",
      phone: "+420555666777",
      role: "WHOLESALE_SUPPLIER",
      status: "ACTIVE",
      companyName: "Auto Kelly Test s.r.o.",
      ico: "11223344",
      icoVerified: true,
      cities: JSON.stringify(["Praha 4"]),
      bio: "Velkoobchod s aftermarket a OEM díly. Skladem TRW, Bosch, LUK, Sachs a další top značky.",
    },
  });

  await prisma.part.create({
    data: {
      slug: "trw-brzdove-desticky-octavia-iii",
      supplierId: wholesale1.id,
      name: "Brzdové destičky přední TRW",
      category: "BRAKES",
      description: "Originální aftermarket brzdové destičky TRW pro Škoda Octavia III a Volkswagen Golf VII. Vysoká kvalita, certifikace ECE R90.",
      partNumber: "GDB1955",
      manufacturer: "TRW",
      warranty: "24 měsíců",
      partType: "AFTERMARKET",
      condition: "NEW",
      price: 1290,
      stock: 24,
      weight: 1.4,
      compatibleBrands: JSON.stringify(["Škoda", "Volkswagen"]),
      compatibleModels: JSON.stringify(["Octavia", "Golf"]),
      compatibleYearFrom: 2013,
      compatibleYearTo: 2020,
      status: "ACTIVE",
      viewCount: 42,
    },
  });

  await prisma.part.create({
    data: {
      slug: "bosch-alternator-passat-b8",
      supplierId: wholesale1.id,
      name: "Alternátor Bosch 140A",
      category: "ELECTRICAL",
      description: "Nový alternátor Bosch 140A pro Volkswagen Passat B8 a Škoda Superb III s motory 2.0 TDI. OE kvalita.",
      partNumber: "0125711018",
      manufacturer: "Bosch",
      warranty: "zákonná",
      partType: "NEW",
      condition: "NEW",
      price: 8990,
      stock: 6,
      weight: 5.8,
      compatibleBrands: JSON.stringify(["Volkswagen", "Škoda"]),
      compatibleModels: JSON.stringify(["Passat", "Superb"]),
      compatibleYearFrom: 2014,
      compatibleYearTo: 2023,
      status: "ACTIVE",
      viewCount: 18,
    },
  });

  await prisma.part.create({
    data: {
      slug: "sachs-tlumic-zadni-octavia",
      supplierId: wholesale1.id,
      name: "Tlumič pérování zadní Sachs",
      category: "SUSPENSION",
      description: "Plynokapalinový tlumič Sachs pro zadní nápravu Škoda Octavia III combi. Originální OE díl pro výrobce.",
      partNumber: "315 877",
      manufacturer: "Sachs",
      warranty: "24 měsíců",
      partType: "AFTERMARKET",
      condition: "NEW",
      price: 1850,
      stock: 12,
      weight: 2.1,
      compatibleBrands: JSON.stringify(["Škoda"]),
      compatibleModels: JSON.stringify(["Octavia"]),
      compatibleYearFrom: 2013,
      compatibleYearTo: 2020,
      status: "ACTIVE",
      viewCount: 9,
    },
  });

  console.log("Seeding orders...");

  const order1 = await prisma.order.create({
    data: {
      orderNumber: "OBJ-260315-A1B2C",
      buyerId: buyer1.id,
      status: "DELIVERED",
      deliveryName: "Petr Kupující",
      deliveryPhone: "+420111222333",
      deliveryEmail: "kupujici@email.cz",
      deliveryAddress: "Vinohradská 42",
      deliveryCity: "Praha 2",
      deliveryZip: "12000",
      deliveryMethod: "ZASILKOVNA",
      zasilkovnaPointId: "12345",
      zasilkovnaPointName: "Zásilkovna — Praha 2, Vinohradská",
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PAID",
      totalPrice: 969,
      shippingPrice: 79,
      shippedAt: new Date("2026-03-16"),
      deliveredAt: new Date("2026-03-18"),
      items: {
        create: {
          partId: part3.id,
          supplierId: supplier2.id,
          quantity: 1,
          unitPrice: 890,
          totalPrice: 890,
          status: "SHIPPED",
        },
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: "OBJ-260320-X9Y8Z",
      buyerId: buyer1.id,
      status: "CONFIRMED",
      deliveryName: "Petr Kupující",
      deliveryPhone: "+420111222333",
      deliveryEmail: "kupujici@email.cz",
      deliveryAddress: "Vinohradská 42",
      deliveryCity: "Praha 2",
      deliveryZip: "12000",
      deliveryMethod: "PPL",
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      totalPrice: 16668,
      shippingPrice: 168,
      items: {
        create: [
          {
            partId: part2.id,
            supplierId: supplier1.id,
            quantity: 1,
            unitPrice: 12000,
            totalPrice: 12000,
            status: "CONFIRMED",
          },
          {
            partId: part1.id,
            supplierId: supplier1.id,
            quantity: 1,
            unitPrice: 4500,
            totalPrice: 4500,
            status: "PENDING",
          },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: "OBJ-260321-P5Q6R",
      status: "PENDING",
      deliveryName: "Petr Host",
      deliveryPhone: "+420999888777",
      deliveryEmail: "host@email.cz",
      deliveryAddress: "Náměstí Svobody 12",
      deliveryCity: "Brno",
      deliveryZip: "60200",
      deliveryMethod: "CESKA_POSTA",
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PENDING",
      totalPrice: 477,
      shippingPrice: 99,
      items: {
        create: {
          partId: part6.id,
          supplierId: supplier2.id,
          quantity: 2,
          unitPrice: 189,
          totalPrice: 378,
          status: "PENDING",
        },
      },
    },
  });

  // ============================================
  // MARKETPLACE — INVESTIČNÍ PLATFORMA
  // ============================================

  console.log("Seeding marketplace...");

  const hashedPassword = await bcrypt.hash("heslo123", 10);

  // 2 dealeři
  const dealer1 = await prisma.user.create({
    data: {
      email: "dealer1@carmakler.cz",
      phone: "+420777111222",
      passwordHash: hashedPassword,
      firstName: "Martin",
      lastName: "Novotný",
      role: "VERIFIED_DEALER",
      status: "ACTIVE",
      accountType: "DEALER",
      companyName: "AutoFlip Praha s.r.o.",
      ico: "12345678",
      icoVerified: true,
    },
  });

  const dealer2 = await prisma.user.create({
    data: {
      email: "dealer2@carmakler.cz",
      phone: "+420777333444",
      passwordHash: hashedPassword,
      firstName: "Tomáš",
      lastName: "Procházka",
      role: "VERIFIED_DEALER",
      status: "ACTIVE",
      accountType: "DEALER",
      companyName: "Car Investment Brno s.r.o.",
      ico: "87654321",
      icoVerified: true,
    },
  });

  // 3 investoři
  const investor1 = await prisma.user.create({
    data: {
      email: "investor1@carmakler.cz",
      phone: "+420777555666",
      passwordHash: hashedPassword,
      firstName: "Petr",
      lastName: "Svoboda",
      role: "INVESTOR",
      status: "ACTIVE",
    },
  });

  const investor2 = await prisma.user.create({
    data: {
      email: "investor2@carmakler.cz",
      phone: "+420777777888",
      passwordHash: hashedPassword,
      firstName: "Jana",
      lastName: "Králová",
      role: "INVESTOR",
      status: "ACTIVE",
    },
  });

  const investor3 = await prisma.user.create({
    data: {
      email: "investor3@carmakler.cz",
      phone: "+420777999000",
      passwordHash: hashedPassword,
      firstName: "Lukáš",
      lastName: "Dvořák",
      role: "INVESTOR",
      status: "ACTIVE",
    },
  });

  // Příležitost 1: FUNDING — sbírá investice
  const flip1 = await prisma.flipOpportunity.create({
    data: {
      dealerId: dealer1.id,
      brand: "Škoda",
      model: "Octavia",
      year: 2018,
      mileage: 85000,
      vin: "TMBAH7NP5J0123456",
      condition: "GOOD",
      photos: JSON.stringify([
        "https://placehold.co/800x600/f97316/white?text=Octavia+1",
        "https://placehold.co/800x600/f97316/white?text=Octavia+2",
      ]),
      purchasePrice: 250000,
      repairCost: 45000,
      estimatedSalePrice: 380000,
      repairDescription: "Výměna rozvodů, nové brzdy, lakování předního nárazníku",
      status: "FUNDING",
      fundedAmount: 150000,
    },
  });

  // Příležitost 2: COMPLETED — dokončený deal
  const flip2 = await prisma.flipOpportunity.create({
    data: {
      dealerId: dealer1.id,
      brand: "Volkswagen",
      model: "Passat",
      year: 2017,
      mileage: 120000,
      condition: "FAIR",
      photos: JSON.stringify([
        "https://placehold.co/800x600/f97316/white?text=Passat+1",
      ]),
      purchasePrice: 180000,
      repairCost: 60000,
      estimatedSalePrice: 310000,
      repairDescription: "Oprava turbodmychadla, nové pneumatiky, čištění interiéru",
      actualSalePrice: 320000,
      soldAt: new Date("2026-02-15"),
      status: "COMPLETED",
      fundedAmount: 240000,
    },
  });

  // Příležitost 3: PENDING_APPROVAL — čeká na schválení
  await prisma.flipOpportunity.create({
    data: {
      dealerId: dealer2.id,
      brand: "BMW",
      model: "320d",
      year: 2016,
      mileage: 145000,
      condition: "FAIR",
      photos: JSON.stringify([
        "https://placehold.co/800x600/f97316/white?text=BMW+320d",
      ]),
      purchasePrice: 320000,
      repairCost: 80000,
      estimatedSalePrice: 520000,
      repairDescription: "Výměna řetězu, nové tlumiče, oprava klimatizace, detailing",
      status: "PENDING_APPROVAL",
    },
  });

  // Příležitost 4: IN_REPAIR — probíhá oprava
  const flip4 = await prisma.flipOpportunity.create({
    data: {
      dealerId: dealer2.id,
      brand: "Audi",
      model: "A4 Avant",
      year: 2019,
      mileage: 72000,
      condition: "GOOD",
      photos: JSON.stringify([
        "https://placehold.co/800x600/f97316/white?text=Audi+A4",
      ]),
      purchasePrice: 420000,
      repairCost: 35000,
      estimatedSalePrice: 560000,
      repairDescription: "Výměna oleje, nové brzdové kotouče, leštění laku",
      status: "IN_REPAIR",
      fundedAmount: 455000,
    },
  });

  // Investice pro flip1 (FUNDING)
  await prisma.investment.create({
    data: {
      investorId: investor1.id,
      opportunityId: flip1.id,
      amount: 100000,
      paymentStatus: "CONFIRMED",
      paymentReference: "VS2026001",
    },
  });

  await prisma.investment.create({
    data: {
      investorId: investor2.id,
      opportunityId: flip1.id,
      amount: 50000,
      paymentStatus: "CONFIRMED",
      paymentReference: "VS2026002",
    },
  });

  await prisma.investment.create({
    data: {
      investorId: investor3.id,
      opportunityId: flip1.id,
      amount: 80000,
      paymentStatus: "PENDING",
    },
  });

  // Investice pro flip2 (COMPLETED) — vyplacené
  await prisma.investment.create({
    data: {
      investorId: investor1.id,
      opportunityId: flip2.id,
      amount: 150000,
      paymentStatus: "CONFIRMED",
      paymentReference: "VS2025010",
      returnAmount: 170000, // vklad 150k + podíl na zisku 20k
      paidOutAt: new Date("2026-02-20"),
    },
  });

  await prisma.investment.create({
    data: {
      investorId: investor2.id,
      opportunityId: flip2.id,
      amount: 90000,
      paymentStatus: "CONFIRMED",
      paymentReference: "VS2025011",
      returnAmount: 102000, // vklad 90k + podíl na zisku 12k
      paidOutAt: new Date("2026-02-20"),
    },
  });

  // Investice pro flip4 (IN_REPAIR)
  await prisma.investment.create({
    data: {
      investorId: investor1.id,
      opportunityId: flip4.id,
      amount: 250000,
      paymentStatus: "CONFIRMED",
      paymentReference: "VS2026005",
    },
  });

  const flipCount = await prisma.flipOpportunity.count();
  const investmentCount = await prisma.investment.count();
  console.log(`Flip Opportunities: ${flipCount}`);
  console.log(`Investments:        ${investmentCount}`);

  // ============================================
  // LEADS
  // ============================================

  console.log("Seeding leads...");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Lead 1: NEW — z webového formuláře, čeká na přiřazení
  await prisma.lead.create({
    data: {
      name: "Tomáš Horák",
      phone: "+420602111222",
      email: "horak.tomas@email.cz",
      brand: "Škoda",
      model: "Octavia",
      year: 2019,
      mileage: 85000,
      expectedPrice: 350000,
      description: "Chci prodat svou Octavii, servisní kniha kompletní.",
      city: "Praha",
      regionId: regionPraha.id,
      source: "WEB_FORM",
      status: "NEW",
    },
  });

  // Lead 2: ASSIGNED — přiřazený makléři
  await prisma.lead.create({
    data: {
      name: "Marie Nováková",
      phone: "+420603222333",
      email: "novakova.m@email.cz",
      brand: "Volkswagen",
      model: "Golf",
      year: 2020,
      mileage: 45000,
      expectedPrice: 420000,
      city: "Brno",
      regionId: regionJihomoravsky.id,
      source: "EXTERNAL_APP",
      externalId: "ext-lead-001",
      sourceDetail: "partnersky-portal.cz",
      status: "ASSIGNED",
      assignedToId: petraMala.id,
      assignedById: manazer.id,
      assignedAt: new Date(),
    },
  });

  // Lead 3: CONTACTED — makléř kontaktoval prodejce
  await prisma.lead.create({
    data: {
      name: "Petr Svoboda",
      phone: "+420604333444",
      brand: "BMW",
      model: "320d",
      year: 2018,
      mileage: 120000,
      expectedPrice: 480000,
      description: "Auto po prvním majiteli, nebourané.",
      city: "Praha",
      regionId: regionPraha.id,
      source: "MANUAL",
      status: "CONTACTED",
      assignedToId: janNovak.id,
      assignedById: manazer.id,
      assignedAt: thirtyDaysAgo,
    },
  });

  // Lead 4: VEHICLE_ADDED — úspěšně nabráno vozidlo
  await prisma.lead.create({
    data: {
      name: "Jana Králová",
      phone: "+420605444555",
      email: "kralova@email.cz",
      brand: "Toyota",
      model: "RAV4",
      year: 2021,
      mileage: 30000,
      expectedPrice: 650000,
      city: "Praha",
      regionId: regionPraha.id,
      source: "REFERRAL",
      sourceDetail: "Doporučení od Tomáše Horáka",
      status: "VEHICLE_ADDED",
      assignedToId: janNovak.id,
      assignedById: manazer.id,
      assignedAt: thirtyDaysAgo,
      vehicleId: v7.id,
    },
  });

  // Lead 5: REJECTED — odmítnutý lead
  await prisma.lead.create({
    data: {
      name: "Pavel Černý",
      phone: "+420606555666",
      brand: "Dacia",
      model: "Duster",
      year: 2015,
      mileage: 200000,
      expectedPrice: 120000,
      description: "Prodej po havárii.",
      city: "Ostrava",
      regionId: regionMoravskoslezsky.id,
      source: "WEB_FORM",
      status: "REJECTED",
      rejectionReason: "Vozidlo po havárii — nesplňuje podmínky pro zprostředkování.",
      assignedToId: karelDvorak.id,
      assignedById: manazer.id,
      assignedAt: thirtyDaysAgo,
    },
  });

  // Lead 6: MEETING_SCHEDULED — domluvená schůzka
  await prisma.lead.create({
    data: {
      name: "Lucie Veselá",
      phone: "+420607666777",
      email: "vesela.lucie@email.cz",
      brand: "Hyundai",
      model: "Tucson",
      year: 2022,
      mileage: 18000,
      expectedPrice: 560000,
      city: "Brno",
      regionId: regionJihomoravsky.id,
      source: "EXTERNAL_APP",
      externalId: "ext-lead-002",
      status: "MEETING_SCHEDULED",
      assignedToId: petraMala.id,
      assignedById: manazer.id,
      assignedAt: new Date(),
      meetingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // za 3 dny
    },
  });

  const leadCount = await prisma.lead.count();
  console.log(`Leads: ${leadCount}`);

  // ============================================
  // PRODEJNÍ FLOW — VehicleInquiry + DamageReport
  // ============================================
  console.log("Seeding vehicle inquiries and damage reports...");

  await prisma.vehicleInquiry.create({
    data: {
      vehicleId: v1.id,
      brokerId: janNovak.id,
      buyerName: "Martin Horák",
      buyerPhone: "+420777111222",
      buyerEmail: "martin.horak@email.cz",
      message: "Dobrý den, mám zájem o toto vozidlo. Lze domluvit prohlídku?",
      status: "VIEWING_SCHEDULED",
      reply: "Dobrý den, samozřejmě. Navrhuji příští středu v 14:00.",
      repliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      viewingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.vehicleInquiry.create({
    data: {
      vehicleId: v1.id,
      brokerId: janNovak.id,
      buyerName: "Eva Nováková",
      buyerPhone: "+420608333444",
      message: "Je možné domluvit test drive?",
      status: "NEW",
    },
  });

  await prisma.vehicleInquiry.create({
    data: {
      vehicleId: v2.id,
      brokerId: petraMala.id,
      buyerName: "Tomáš Krejčí",
      buyerPhone: "+420602555666",
      buyerEmail: "tomas.krejci@seznam.cz",
      message: "Jaká je finální cena? Mohu nabídnout 480 000 Kč.",
      status: "NEGOTIATING",
      reply: "Děkuji za nabídku. Pojďme se setkat a domluvit se.",
      repliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      offeredPrice: 480000,
    },
  });

  await prisma.vehicleInquiry.create({
    data: {
      vehicleId: v3.id,
      brokerId: karelDvorak.id,
      buyerName: "Lucie Procházková",
      buyerPhone: "+420773777888",
      message: "Uvažuji o koupi, je vůz stále k dispozici?",
      status: "NO_INTEREST",
      reply: "Ano, vůz je stále k dispozici.",
      repliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      viewingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      viewingResult: "NO_INTEREST",
    },
  });

  const vehicleInquiryCount = await prisma.vehicleInquiry.count();
  console.log(`Vehicle Inquiries: ${vehicleInquiryCount}`);

  await prisma.damageReport.create({
    data: {
      vehicleId: v4.id,
      reportedById: janNovak.id,
      description: "Drobný škrábanec na předním nárazníku vlevo",
      severity: "COSMETIC",
      images: JSON.stringify(["https://placehold.co/800x600/orange/white?text=Skrabanec"]),
      repaired: true,
      repairedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      repairNote: "Opraveno leštěním",
    },
  });

  await prisma.damageReport.create({
    data: {
      vehicleId: v5.id,
      reportedById: petraMala.id,
      description: "Nefunkční klimatizace — nechladí",
      severity: "FUNCTIONAL",
    },
  });

  const damageReportCount = await prisma.damageReport.count();
  console.log(`Damage Reports: ${damageReportCount}`);

  // ============================================
  // PAYMENTS & PAYOUTS
  // ============================================

  console.log("Seeding payments...");

  // Platba kartou — zaplacená
  const payment1 = await prisma.payment.create({
    data: {
      vehicleId: v1.id,
      buyerName: "Martin Kupující",
      buyerEmail: "martin.kupujici@email.cz",
      buyerPhone: "+420 777 111 222",
      amount: 575000,
      method: "CARD",
      status: "PAID",
      stripeSessionId: "cs_test_demo_001",
      stripePaymentIntent: "pi_test_demo_001",
      confirmedAt: new Date("2026-02-15"),
    },
  });

  // Platba převodem — čeká potvrzení
  await prisma.payment.create({
    data: {
      vehicleId: v4.id,
      buyerName: "Eva Novotná",
      buyerEmail: "eva.novotna@email.cz",
      buyerPhone: "+420 605 333 444",
      amount: 960000,
      method: "BANK_TRANSFER",
      status: "PENDING",
      variableSymbol: "00123456",
    },
  });

  // Platba kartou — selhala
  await prisma.payment.create({
    data: {
      vehicleId: v3.id,
      buyerName: "Tomáš Neplatič",
      buyerEmail: "tomas@email.cz",
      amount: 470000,
      method: "CARD",
      status: "FAILED",
      stripeSessionId: "cs_test_demo_003",
    },
  });

  // SellerPayout pro v1
  await prisma.sellerPayout.create({
    data: {
      vehicleId: v1.id,
      paymentId: payment1.id,
      sellerName: "Jiří Prodejce",
      sellerBankAccount: "CZ6508000000001234567890",
      amount: 546250, // 575000 - 28750
      commissionAmount: 28750,
      status: "PAID",
      paidAt: new Date("2026-02-20"),
      bankReference: "REF-2026-001",
    },
  });

  console.log("Created 3 payments, 1 seller payout");

  // ============================================
  // CRM — SELLER CONTACTS
  // ============================================

  console.log("Seeding seller contacts...");

  const contact1 = await prisma.sellerContact.create({
    data: {
      brokerId: janNovak.id,
      name: "Jiří Prodejce",
      phone: "+420 602 111 222",
      email: "jiri.prodejce@email.cz",
      address: "Vinohradská 42",
      city: "Praha",
      note: "Pravidelný prodejce, má garáž se 3 vozy",
      totalVehicles: 3,
      totalSold: 2,
      lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      nextFollowUp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // vcera — due!
      followUpNote: "Nabidnout prodej dalsiho vozu",
    },
  });

  const contact2 = await prisma.sellerContact.create({
    data: {
      brokerId: janNovak.id,
      name: "Marie Svobodová",
      phone: "+420 603 333 444",
      city: "Praha",
      totalVehicles: 1,
      totalSold: 1,
      lastContactAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.sellerContact.create({
    data: {
      brokerId: janNovak.id,
      name: "Tomáš Veselý",
      phone: "+420 777 555 666",
      email: "tomas.vesely@email.cz",
      city: "Kladno",
      note: "Zájem o prodej starší Fabie",
      totalVehicles: 0,
      nextFollowUp: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      followUpNote: "Zavolat ohledně focení vozu",
    },
  });

  await prisma.sellerContact.create({
    data: {
      brokerId: petraMala.id,
      name: "Pavel Novotný",
      phone: "+420 608 999 888",
      city: "Brno",
      totalVehicles: 2,
      totalSold: 1,
      lastContactAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Komunikace pro contact1
  await prisma.sellerCommunication.create({
    data: {
      contactId: contact1.id,
      brokerId: janNovak.id,
      type: "CALL",
      direction: "OUTGOING",
      summary: "Domluvena schůzka na čtvrtek. Prodejce má zájem prodat Superb.",
      duration: 180,
      result: "INTERESTED",
    },
  });

  await prisma.sellerCommunication.create({
    data: {
      contactId: contact1.id,
      brokerId: janNovak.id,
      type: "MEETING",
      summary: "Prohlídka Superbu — auto v dobrém stavu, nafoceno, podepsána smlouva.",
      result: "FOLLOW_UP",
    },
  });

  await prisma.sellerCommunication.create({
    data: {
      contactId: contact1.id,
      brokerId: janNovak.id,
      type: "SMS",
      direction: "OUTGOING",
      summary: "Odeslán link na inzerát, ať si zkontroluje fotky.",
    },
  });

  await prisma.sellerCommunication.create({
    data: {
      contactId: contact2.id,
      brokerId: janNovak.id,
      type: "CALL",
      direction: "INCOMING",
      summary: "Paní volala s dotazem na stav prodeje jejího Golfu.",
      duration: 120,
      result: "NOT_NOW",
    },
  });

  await prisma.sellerCommunication.create({
    data: {
      contactId: contact2.id,
      brokerId: janNovak.id,
      type: "NOTE",
      summary: "Golf prodán, paní spokojená. Doporučí nás známým.",
      result: "INTERESTED",
    },
  });

  console.log(`Seller Contacts: ${await prisma.sellerContact.count()}`);
  console.log(`Communications:  ${await prisma.sellerCommunication.count()}`);

  // ============================================
  // GAMIFIKACE — UserAchievement
  // ============================================

  console.log("Seeding achievements...");

  await prisma.userAchievement.createMany({
    data: [
      { userId: janNovak.id, achievementKey: "FIRST_VEHICLE" },
      { userId: janNovak.id, achievementKey: "FIRST_SALE" },
      { userId: janNovak.id, achievementKey: "FIVE_SALES" },
      { userId: petraMala.id, achievementKey: "FIRST_VEHICLE" },
      { userId: petraMala.id, achievementKey: "FIRST_SALE" },
      { userId: karelDvorak.id, achievementKey: "FIRST_VEHICLE" },
    ],
  });

  console.log(`Achievements: ${await prisma.userAchievement.count()}`);

  // ============================================
  // PRICE REDUCTIONS
  // ============================================

  console.log("Seeding price reductions...");

  await prisma.priceReduction.createMany({
    data: [
      {
        vehicleId: v5.id,
        currentPrice: 890000,
        suggestedPrice: 839000,
        reason: "Vůz na inzerci 30+ dní bez poptávky",
        status: "PENDING",
      },
      {
        vehicleId: v8.id,
        currentPrice: 520000,
        suggestedPrice: 489000,
        reason: "Podobné vozy v okolí levnější o 5-10%",
        status: "ACCEPTED",
        acceptedPrice: 499000,
        respondedAt: new Date("2026-03-18"),
      },
    ],
  });

  console.log(`Price Reductions: ${await prisma.priceReduction.count()}`);

  // ============================================
  // ESCALATIONS
  // ============================================

  console.log("Seeding escalations...");

  await prisma.escalation.createMany({
    data: [
      {
        brokerId: janNovak.id,
        managerId: manazer.id,
        vehicleId: v4.id,
        type: "SELLER_ISSUE",
        urgency: "NORMAL",
        description: "Prodejce nereaguje na telefonáty ani SMS déle než 7 dní.",
        status: "OPEN",
      },
      {
        brokerId: petraMala.id,
        managerId: manazer.id,
        type: "TECHNICAL",
        urgency: "URGENT",
        description: "Nelze nahrát fotky vozidla — chyba při uploadu na Cloudinary.",
        status: "RESOLVED",
        resolution: "Bug opraven v poslední verzi aplikace.",
        resolvedAt: new Date("2026-03-15"),
      },
    ],
  });

  console.log(`Escalations: ${await prisma.escalation.count()}`);

  // ============================================
  // EMAIL LOG
  // ============================================

  console.log("Seeding email logs...");

  await prisma.emailLog.createMany({
    data: [
      {
        senderId: janNovak.id,
        vehicleId: v1.id,
        recipientEmail: "horak@email.cz",
        recipientName: "František Horák",
        subject: "Prezentace vozu Škoda Octavia RS Combi",
        templateType: "PRESENTATION",
        status: "DELIVERED",
      },
      {
        senderId: petraMala.id,
        vehicleId: v2.id,
        recipientEmail: "dvorak@email.cz",
        recipientName: "Milan Dvořák",
        subject: "Předávací protokol BMW 330i xDrive",
        templateType: "CONTRACT_OFFER",
        status: "OPENED",
      },
      {
        recipientEmail: "jan.novak@carmakler.cz",
        recipientName: "Jan Novák",
        subject: "Vítejte v CarMakléř",
        templateType: "WELCOME",
        status: "DELIVERED",
      },
    ],
  });

  console.log(`Email Logs: ${await prisma.emailLog.count()}`);

  // ============================================
  // NOTIFICATION PREFERENCES
  // ============================================

  console.log("Seeding notification preferences...");

  await prisma.notificationPreference.createMany({
    data: [
      { userId: janNovak.id, eventType: "NEW_LEAD", pushEnabled: true, emailEnabled: true, smsEnabled: false },
      { userId: janNovak.id, eventType: "NEW_INQUIRY", pushEnabled: true, emailEnabled: true, smsEnabled: true },
      { userId: janNovak.id, eventType: "VEHICLE_APPROVED", pushEnabled: true, emailEnabled: false, smsEnabled: false },
      { userId: janNovak.id, eventType: "DAILY_SUMMARY", pushEnabled: false, emailEnabled: true, smsEnabled: false },
      { userId: petraMala.id, eventType: "NEW_LEAD", pushEnabled: true, emailEnabled: true, smsEnabled: false },
      { userId: petraMala.id, eventType: "NEW_INQUIRY", pushEnabled: true, emailEnabled: false, smsEnabled: false },
    ],
  });

  console.log(`Notif. Preferences: ${await prisma.notificationPreference.count()}`);

  // ============================================
  // SMS LOG
  // ============================================

  console.log("Seeding SMS logs...");

  await prisma.smsLog.createMany({
    data: [
      {
        recipientPhone: "+420602111222",
        message: "Dobrý den, máme zájem o Vaše auto. Zavoláme Vám dnes.",
        vehicleId: v1.id,
        status: "DELIVERED",
        cost: 0.45,
      },
      {
        recipientPhone: "+420603222333",
        message: "Připomínka: zítra schůzka ohledně prodeje vozu.",
        status: "SENT",
        cost: 0.45,
      },
    ],
  });

  console.log(`SMS Logs: ${await prisma.smsLog.count()}`);

  // ============================================
  // AI CONVERSATIONS
  // ============================================

  console.log("Seeding AI conversations...");

  await prisma.aiConversation.create({
    data: {
      userId: janNovak.id,
      messages: JSON.stringify([
        { role: "user", content: "Pomoz mi napsat popis vozu Škoda Octavia RS", timestamp: "2026-03-20T10:00:00Z" },
        { role: "assistant", content: "Škoda Octavia RS Combi ve výborném stavu...", timestamp: "2026-03-20T10:00:05Z" },
      ]),
      context: JSON.stringify({ step: "description", vehicleId: v1.id }),
    },
  });

  console.log(`AI Conversations: ${await prisma.aiConversation.count()}`);

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

  const partCount = await prisma.part.count();
  const orderCount = await prisma.order.count();
  const orderItemCount = await prisma.orderItem.count();

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
  console.log(`Parts:          ${partCount}`);
  console.log(`Orders:         ${orderCount}`);
  console.log(`Order Items:    ${orderItemCount}`);
  console.log(`Invitations:    ${await prisma.invitation.count()}`);
  console.log(`Leads:          ${await prisma.lead.count()}`);
  console.log(`Veh. Inquiries: ${await prisma.vehicleInquiry.count()}`);
  console.log(`Damage Reports: ${await prisma.damageReport.count()}`);
  console.log(`Payments:       ${await prisma.payment.count()}`);
  console.log(`Seller Payouts: ${await prisma.sellerPayout.count()}`);
  console.log(`Broker Payouts: ${await prisma.brokerPayout.count()}`);
  console.log(`Seller Contacts: ${await prisma.sellerContact.count()}`);
  console.log(`Communications:  ${await prisma.sellerCommunication.count()}`);
  console.log(`Achievements:    ${await prisma.userAchievement.count()}`);
  console.log(`Price Reductions:${await prisma.priceReduction.count()}`);
  console.log(`Escalations:     ${await prisma.escalation.count()}`);
  console.log(`Email Logs:      ${await prisma.emailLog.count()}`);
  console.log(`Notif. Prefs:    ${await prisma.notificationPreference.count()}`);
  console.log(`SMS Logs:        ${await prisma.smsLog.count()}`);
  console.log(`AI Conversations:${await prisma.aiConversation.count()}`);
  console.log("\n--- REAL ACCOUNTS ---");
  console.log("Admin: jevgenij@carmakler.cz (ADMIN)");
  console.log("Admin: radim@carmakler.cz (ADMIN)");
  console.log("Manager: katerina@carmakler.cz (MANAGER)");
  console.log("\n--- DEMO ACCOUNTS ---");
  console.log("Demo login: admin@carmakler.cz / heslo123");
  console.log("Advertiser login: prodejce@email.cz / heslo123");
  console.log("Buyer login: kupujici@email.cz / heslo123");
  console.log("Supplier login: dodavatel@vrakoviste.cz / heslo123");
  console.log("Wholesale login: velkoobchod@carmakler.cz / heslo123");
  console.log("Dealer login: dealer1@carmakler.cz / heslo123");
  console.log("Investor login: investor1@carmakler.cz / heslo123");
  console.log("Onboarding broker: onboarding@carmakler.cz / heslo123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
