import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔧 Seeding parts data...");

  const passwordHash = await bcrypt.hash("Test123!", 12);

  // Upsert suppliers
  const supplier1 = await prisma.user.upsert({
    where: { email: "dodavatel@vrakoviste.cz" },
    update: {},
    create: {
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
    },
  });

  const supplier2 = await prisma.user.upsert({
    where: { email: "dodavatel2@autodily.cz" },
    update: {},
    create: {
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

  const wholesale1 = await prisma.user.upsert({
    where: { email: "velkoobchod@carmakler.cz" },
    update: {},
    create: {
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
    },
  });

  console.log("👤 Suppliers ready");

  const parts = [
    { slug: "dvere-predni-leve-octavia-iii", supplierId: supplier1.id, name: "Dveře přední levé", category: "BODY", description: "Originální přední levé dveře ze Škody Octavia III (5E), rok 2019.", oemNumber: "5E4 831 051", condition: "USED_GOOD", price: 4500, stock: 1, weight: 22, compatibleBrands: '["Škoda"]', compatibleModels: '["Octavia"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 127 },
    { slug: "turbodmychadlo-2-0-tdi", supplierId: supplier1.id, name: "Turbodmychadlo", category: "ENGINE", description: "Turbodmychadlo pro motory 2.0 TDI (DFGA/DTTA). 62 000 km.", oemNumber: "04L 253 010 T", condition: "USED_GOOD", price: 12000, stock: 2, weight: 8.5, compatibleBrands: '["Škoda","Volkswagen","Audi"]', compatibleModels: '["Octavia","Passat","A4"]', compatibleYearFrom: 2015, compatibleYearTo: 2022, status: "ACTIVE", viewCount: 89 },
    { slug: "brzdove-desticky-predni-vw-group", supplierId: supplier2.id, name: "Brzdové destičky přední", category: "BRAKES", description: "Nové aftermarket brzdové destičky pro vozy VW Group.", partNumber: "BD-VW-001", condition: "NEW", price: 890, stock: 15, compatibleBrands: '["Škoda","Volkswagen","Audi"]', compatibleModels: '["Octavia","Golf","A3"]', compatibleYearFrom: 2012, compatibleYearTo: 2024, status: "ACTIVE", viewCount: 234 },
    { slug: "led-svetlomet-bmw-f30", supplierId: supplier1.id, name: "LED světlomet přední pravý", category: "ELECTRICAL", description: "Originální LED světlomet z BMW řady 3 (F30). Kompletní s řídící jednotkou.", oemNumber: "63 11 7 419 630", condition: "USED_GOOD", price: 8500, stock: 1, weight: 4.2, compatibleBrands: '["BMW"]', compatibleModels: '["Řada 3"]', compatibleYearFrom: 2012, compatibleYearTo: 2018, status: "ACTIVE", viewCount: 56 },
    { slug: "sedacka-ridice-octavia-rs", supplierId: supplier1.id, name: "Sedačka řidiče komplet", category: "INTERIOR", description: "Sportovní sedačka řidiče ze Škody Octavia RS. Alcantara/látka.", condition: "USED_FAIR", price: 6200, stock: 1, weight: 18, compatibleBrands: '["Škoda"]', compatibleModels: '["Octavia"]', compatibleYearFrom: 2017, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 42 },
    { slug: "olejovy-filtr-mann-2-0-tdi", supplierId: supplier2.id, name: "Olejový filtr Mann", category: "ENGINE", description: "Nový olejový filtr Mann-Filter pro motory 2.0 TDI.", partNumber: "HU 7020 z", condition: "NEW", price: 189, stock: 30, compatibleBrands: '["Škoda","Volkswagen","Audi"]', compatibleModels: '["Octavia","Passat","Golf","A4"]', compatibleYearFrom: 2012, compatibleYearTo: 2024, status: "ACTIVE", viewCount: 312 },
    { slug: "tlumic-predni-levy-octavia", supplierId: supplier2.id, name: "Tlumič přední levý", category: "SUSPENSION", description: "Nový aftermarket přední tlumič pro Škoda Octavia III.", partNumber: "TL-OCT-FL", condition: "NEW", price: 1890, stock: 8, compatibleBrands: '["Škoda"]', compatibleModels: '["Octavia"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 67 },
    { slug: "motor-2-0-tdi-dfga-komplet", supplierId: supplier1.id, name: "Motor 2.0 TDI DFGA komplet", category: "ENGINE", description: "Kompletní motor 2.0 TDI 110 kW, 94 000 km.", oemNumber: "04L 100 033 T", condition: "USED_GOOD", price: 45000, stock: 1, weight: 145, compatibleBrands: '["Škoda","Volkswagen"]', compatibleModels: '["Octavia","Superb","Passat"]', compatibleYearFrom: 2015, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 178 },
    { slug: "trw-brzdove-desticky-octavia-iii", supplierId: wholesale1.id, name: "Brzdové destičky přední TRW", category: "BRAKES", description: "Aftermarket brzdové destičky TRW. ECE R90.", partNumber: "GDB1955", manufacturer: "TRW", warranty: "24 měsíců", partType: "AFTERMARKET", condition: "NEW", price: 1290, stock: 24, weight: 1.4, compatibleBrands: '["Škoda","Volkswagen"]', compatibleModels: '["Octavia","Golf"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 42 },
    { slug: "bosch-alternator-passat-b8", supplierId: wholesale1.id, name: "Alternátor Bosch 140A", category: "ELECTRICAL", description: "Nový alternátor Bosch 140A pro VW Passat B8.", partNumber: "0125711018", manufacturer: "Bosch", warranty: "zákonná", partType: "NEW", condition: "NEW", price: 8990, stock: 6, weight: 5.8, compatibleBrands: '["Volkswagen","Škoda"]', compatibleModels: '["Passat","Superb"]', compatibleYearFrom: 2014, compatibleYearTo: 2023, status: "ACTIVE", viewCount: 18 },
    { slug: "sachs-tlumic-zadni-octavia", supplierId: wholesale1.id, name: "Tlumič pérování zadní Sachs", category: "SUSPENSION", description: "Plynokapalinový tlumič Sachs pro zadní nápravu.", partNumber: "315 877", manufacturer: "Sachs", warranty: "24 měsíců", partType: "AFTERMARKET", condition: "NEW", price: 1850, stock: 12, weight: 2.1, compatibleBrands: '["Škoda"]', compatibleModels: '["Octavia"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 9 },
    { slug: "prevodovka-dsg-dq200-7st", supplierId: supplier1.id, name: "Převodovka DSG DQ200 7st.", category: "TRANSMISSION", description: "Převodovka DSG DQ200 7stupňová, 72 000 km.", oemNumber: "0AM 300 049 S", condition: "USED_GOOD", price: 28000, stock: 1, weight: 70, compatibleBrands: '["Škoda","Volkswagen"]', compatibleModels: '["Octavia","Golf","Rapid"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 34 },
    { slug: "spojkovy-set-luk-repset", supplierId: supplier2.id, name: "Spojkový set LUK RepSet", category: "TRANSMISSION", description: "Nový kompletní spojkový set LUK RepSet pro DSG DQ200.", partNumber: "602 0002 00", manufacturer: "LUK", warranty: "24 měsíců", partType: "AFTERMARKET", condition: "NEW", price: 4890, stock: 6, compatibleBrands: '["Škoda","Volkswagen","Audi"]', compatibleModels: '["Octavia","Golf","A3"]', compatibleYearFrom: 2012, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 78 },
    { slug: "alu-kolo-r18-skoda-superb", supplierId: supplier1.id, name: "Alu kolo R18 Škoda Superb", category: "WHEELS", description: "Originální alu disk R18 5x112 ET44.", oemNumber: "3V0 601 025 G", condition: "USED_GOOD", price: 3200, stock: 4, weight: 10.5, compatibleBrands: '["Škoda"]', compatibleModels: '["Superb","Octavia"]', compatibleYearFrom: 2015, compatibleYearTo: 2024, status: "ACTIVE", viewCount: 52 },
    { slug: "zimni-sada-r16-vw-golf", supplierId: supplier2.id, name: "Zimní sada R16 VW Golf", category: "WHEELS", description: "4× plech R16 + Continental WinterContact, vzorek 5 mm.", condition: "USED_FAIR", price: 8900, stock: 1, weight: 52, compatibleBrands: '["Volkswagen","Škoda"]', compatibleModels: '["Golf","Octavia"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 23 },
    { slug: "katalyzator-1-6-tdi", supplierId: supplier1.id, name: "Katalyzátor 1.6 TDI", category: "EXHAUST", description: "Originální katalyzátor z Octavia III 1.6 TDI.", oemNumber: "04L 131 765 BJ", condition: "USED_GOOD", price: 5500, stock: 1, weight: 6.5, compatibleBrands: '["Škoda","Volkswagen"]', compatibleModels: '["Octavia","Golf"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 19 },
    { slug: "vyfukove-potrubi-stredni-octavia", supplierId: supplier2.id, name: "Výfukové potrubí střední", category: "EXHAUST", description: "Střední díl výfuku ze Škody Octavia III 2.0 TDI.", condition: "USED_FAIR", price: 1800, stock: 1, weight: 4.2, compatibleBrands: '["Škoda"]', compatibleModels: '["Octavia"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 8 },
    { slug: "chladic-vody-octavia-iii", supplierId: supplier1.id, name: "Chladič vody Octavia III", category: "COOLING", description: "Originální chladič vody, 78 000 km.", oemNumber: "5Q0 121 251 ES", condition: "USED_GOOD", price: 2400, stock: 1, weight: 3.8, compatibleBrands: '["Škoda","Volkswagen"]', compatibleModels: '["Octavia","Golf"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 15 },
    { slug: "vodni-pumpa-2-0-tdi-ina", supplierId: supplier2.id, name: "Vodní pumpa 2.0 TDI INA", category: "COOLING", description: "Nová vodní pumpa INA pro EA288 2.0 TDI.", partNumber: "538 0653 10", manufacturer: "INA", warranty: "24 měsíců", partType: "AFTERMARKET", condition: "NEW", price: 1690, stock: 10, compatibleBrands: '["Škoda","Volkswagen","Audi"]', compatibleModels: '["Octavia","Passat","Golf","A4"]', compatibleYearFrom: 2013, compatibleYearTo: 2024, status: "ACTIVE", viewCount: 45 },
    { slug: "palivove-cerpadlo-2-0-tdi", supplierId: supplier1.id, name: "Palivové čerpadlo 2.0 TDI", category: "FUEL", description: "Vysokotlaké palivové čerpadlo z 2.0 TDI, 88 000 km.", oemNumber: "04L 130 755 D", condition: "USED_GOOD", price: 3800, stock: 1, weight: 2.5, compatibleBrands: '["Škoda","Volkswagen"]', compatibleModels: '["Octavia","Passat"]', compatibleYearFrom: 2015, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 27 },
    { slug: "vstrikovaci-ventil-bosch-tdi", supplierId: supplier2.id, name: "Vstřikovací ventil Bosch", category: "FUEL", description: "Nový vstřikovací ventil Bosch pro EA288 2.0 TDI.", partNumber: "0 445 110 469", manufacturer: "Bosch", warranty: "zákonná", partType: "NEW", condition: "NEW", price: 2290, stock: 8, compatibleBrands: '["Volkswagen","Audi","Škoda"]', compatibleModels: '["Passat","A4","Superb"]', compatibleYearFrom: 2015, compatibleYearTo: 2023, status: "ACTIVE", viewCount: 36 },
    { slug: "autoradio-rcd-330-plus", supplierId: supplier1.id, name: "Autorádio RCD 330 Plus", category: "OTHER", description: "Multimediální jednotka RCD 330 Plus, 6.5\" dotyk, BT, USB, CarPlay.", oemNumber: "5G6 919 605", condition: "USED_GOOD", price: 4500, stock: 1, weight: 1.8, compatibleBrands: '["Volkswagen","Škoda"]', compatibleModels: '["Golf","Octavia","Passat"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 63 },
    { slug: "sada-klicu-s-ridici-jednotkou-octavia", supplierId: supplier2.id, name: "Sada klíčů s řídící jedn.", category: "OTHER", description: "Kompletní sada 2× klíč + řídící jednotka motoru.", condition: "USED_GOOD", price: 6800, stock: 1, weight: 0.8, compatibleBrands: '["Škoda"]', compatibleModels: '["Octavia"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 18 },
    { slug: "kapota-predni-octavia-iii", supplierId: supplier1.id, name: "Kapota přední Octavia III", category: "BODY", description: "Originální přední kapota ze Škody Octavia III facelift.", oemNumber: "5E0 823 031", condition: "USED_GOOD", price: 3800, stock: 1, weight: 12, compatibleBrands: '["Škoda"]', compatibleModels: '["Octavia"]', compatibleYearFrom: 2017, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 31 },
    { slug: "palubni-deska-komplet-golf-vii", supplierId: supplier2.id, name: "Palubní deska komplet Golf VII", category: "INTERIOR", description: "Kompletní palubní deska z VW Golf VII včetně airbagů.", condition: "USED_FAIR", price: 5200, stock: 1, weight: 15, compatibleBrands: '["Volkswagen"]', compatibleModels: '["Golf"]', compatibleYearFrom: 2013, compatibleYearTo: 2020, status: "ACTIVE", viewCount: 14 },
  ];

  let created = 0;
  let skipped = 0;

  for (const part of parts) {
    const existing = await prisma.part.findUnique({ where: { slug: part.slug } });
    if (existing) {
      skipped++;
      console.log(`  ⏭ "${part.name}" already exists`);
      continue;
    }
    await prisma.part.create({ data: part });
    created++;
    console.log(`  ✓ "${part.name}" (${part.category})`);
  }

  console.log(`\n✅ Parts seed complete! Created: ${created}, Skipped: ${skipped}, Total: ${parts.length}`);

  await pool.end();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
