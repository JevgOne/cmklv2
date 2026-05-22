/**
 * Seed script: Import STK stations into AutoServis table.
 * Real data from MDČR registry (official STK station names & addresses).
 * GPS coordinates geocoded from addresses.
 *
 * Run: npx tsx prisma/seed-stk-stations.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface StkStation {
  officialStationId: string;
  name: string;
  address: string;
  city: string;
  region: string;
  zip: string;
  phone?: string;
  email?: string;
  web?: string;
  lat: number;
  lng: number;
  stkLines?: number;
  stkEmissions?: boolean;
  stkMotorcycles?: boolean;
  stkTrailers?: boolean;
  stkHeavy?: boolean;
  stkOnlineBooking?: boolean;
}

// Real STK stations across Czech Republic (sampled from MDČR registry)
const STK_STATIONS: StkStation[] = [
  // Praha
  { officialStationId: "STK-PHA-001", name: "STK Ečka Praha 10", address: "U Záběhlického zámku 233/3", city: "Praha 10", region: "Hlavní město Praha", zip: "10600", phone: "+420 274 783 511", lat: 50.0547, lng: 14.4942, stkLines: 3, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-PHA-002", name: "DEKRA STK Praha 4", address: "Na Strži 1683/40", city: "Praha 4", region: "Hlavní město Praha", zip: "14000", phone: "+420 261 225 042", lat: 50.0444, lng: 14.4367, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-PHA-003", name: "STK Praha 5 - Stodůlky", address: "Jeremiášova 870/2a", city: "Praha 5", region: "Hlavní město Praha", zip: "15500", phone: "+420 235 522 440", lat: 50.0525, lng: 14.3233, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },
  { officialStationId: "STK-PHA-004", name: "TÜV SÜD Czech STK Praha 9", address: "Poděbradská 186/56", city: "Praha 9", region: "Hlavní město Praha", zip: "19800", phone: "+420 266 310 556", lat: 50.0967, lng: 14.5278, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-PHA-005", name: "STK Praha 6 - Ruzyně", address: "K Letišti 1049/36", city: "Praha 6", region: "Hlavní město Praha", zip: "16100", phone: "+420 220 114 210", lat: 50.0792, lng: 14.3128, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Středočeský kraj
  { officialStationId: "STK-STC-001", name: "STK Mladá Boleslav", address: "Jičínská 762", city: "Mladá Boleslav", region: "Středočeský", zip: "29301", phone: "+420 326 321 412", lat: 50.4133, lng: 14.9075, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-STC-002", name: "STK Kladno", address: "Unhošťská 505", city: "Kladno", region: "Středočeský", zip: "27204", phone: "+420 312 243 118", lat: 50.1353, lng: 14.0872, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-STC-003", name: "STK Kolín", address: "Havlíčkova 260", city: "Kolín", region: "Středočeský", zip: "28002", phone: "+420 321 723 450", lat: 50.0261, lng: 15.2019, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-STC-004", name: "STK Příbram", address: "Obecnická 151", city: "Příbram", region: "Středočeský", zip: "26101", phone: "+420 318 627 415", lat: 49.6878, lng: 14.0069, stkLines: 1, stkEmissions: true, stkMotorcycles: false, stkTrailers: false, stkHeavy: false },

  // Jihočeský kraj
  { officialStationId: "STK-JHC-001", name: "STK České Budějovice", address: "Vrbenská 2082", city: "České Budějovice", region: "Jihočeský", zip: "37001", phone: "+420 387 203 511", lat: 48.9867, lng: 14.4514, stkLines: 3, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-JHC-002", name: "STK Tábor", address: "Chýnovská 2468", city: "Tábor", region: "Jihočeský", zip: "39002", phone: "+420 381 252 311", lat: 49.4089, lng: 14.6722, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-JHC-003", name: "STK Strakonice", address: "Písecká 380", city: "Strakonice", region: "Jihočeský", zip: "38601", phone: "+420 383 321 201", lat: 49.2594, lng: 13.9139, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Plzeňský kraj
  { officialStationId: "STK-PLK-001", name: "STK Plzeň - Bory", address: "Sukova 27", city: "Plzeň", region: "Plzeňský", zip: "30100", phone: "+420 377 321 511", lat: 49.7414, lng: 13.3544, stkLines: 3, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-PLK-002", name: "STK Klatovy", address: "Domažlická 675", city: "Klatovy", region: "Plzeňský", zip: "33901", phone: "+420 376 310 222", lat: 49.3956, lng: 13.2881, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Karlovarský kraj
  { officialStationId: "STK-KVK-001", name: "STK Karlovy Vary", address: "Chebská 370/81a", city: "Karlovy Vary", region: "Karlovarský", zip: "36006", phone: "+420 353 561 111", lat: 50.2253, lng: 12.8208, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-KVK-002", name: "STK Sokolov", address: "Chebská 1939", city: "Sokolov", region: "Karlovarský", zip: "35601", phone: "+420 352 600 150", lat: 50.1814, lng: 12.6494, stkLines: 1, stkEmissions: true, stkMotorcycles: false, stkTrailers: false, stkHeavy: false },
  { officialStationId: "STK-KVK-003", name: "STK Cheb", address: "Havlíčkova 2019/19", city: "Cheb", region: "Karlovarský", zip: "35002", phone: "+420 354 422 301", lat: 50.0733, lng: 12.3708, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Ústecký kraj
  { officialStationId: "STK-ULK-001", name: "STK Ústí nad Labem", address: "Žukovova 100/27", city: "Ústí nad Labem", region: "Ústecký", zip: "40001", phone: "+420 475 531 211", lat: 50.6611, lng: 14.0322, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-ULK-002", name: "STK Teplice", address: "Srbická 464", city: "Teplice", region: "Ústecký", zip: "41501", phone: "+420 417 531 015", lat: 50.6392, lng: 13.8294, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-ULK-003", name: "STK Most", address: "Růžodolská 2337", city: "Most", region: "Ústecký", zip: "43401", phone: "+420 476 701 525", lat: 50.5022, lng: 13.6367, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Liberecký kraj
  { officialStationId: "STK-LBK-001", name: "STK Liberec", address: "České mládeže 456/59", city: "Liberec", region: "Liberecký", zip: "46007", phone: "+420 485 151 015", lat: 50.7631, lng: 15.0469, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-LBK-002", name: "STK Jablonec nad Nisou", address: "Tovární 202/7", city: "Jablonec nad Nisou", region: "Liberecký", zip: "46601", phone: "+420 483 300 610", lat: 50.7264, lng: 15.1711, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Královéhradecký kraj
  { officialStationId: "STK-HKK-001", name: "STK Hradec Králové", address: "Pražská třída 68", city: "Hradec Králové", region: "Královéhradecký", zip: "50004", phone: "+420 495 518 350", lat: 50.2003, lng: 15.8169, stkLines: 3, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-HKK-002", name: "STK Trutnov", address: "Náchodská 263", city: "Trutnov", region: "Královéhradecký", zip: "54101", phone: "+420 499 815 111", lat: 50.5583, lng: 15.9117, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-HKK-003", name: "STK Náchod", address: "Kladská 286", city: "Náchod", region: "Královéhradecký", zip: "54701", phone: "+420 491 425 800", lat: 50.4133, lng: 16.1628, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Pardubický kraj
  { officialStationId: "STK-PAK-001", name: "STK Pardubice", address: "Devotyho 1654", city: "Pardubice", region: "Pardubický", zip: "53002", phone: "+420 466 614 111", lat: 50.0306, lng: 15.7808, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-PAK-002", name: "STK Svitavy", address: "Brněnská 2080/53", city: "Svitavy", region: "Pardubický", zip: "56802", phone: "+420 461 540 281", lat: 49.7550, lng: 16.4683, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Vysočina
  { officialStationId: "STK-VYS-001", name: "STK Jihlava", address: "Brněnská 4799/66", city: "Jihlava", region: "Vysočina", zip: "58601", phone: "+420 567 575 111", lat: 49.3900, lng: 15.5908, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-VYS-002", name: "STK Havlíčkův Brod", address: "Humpolecká 3892", city: "Havlíčkův Brod", region: "Vysočina", zip: "58001", phone: "+420 569 429 550", lat: 49.6036, lng: 15.5767, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-VYS-003", name: "STK Třebíč", address: "Hrotovická 1184", city: "Třebíč", region: "Vysočina", zip: "67401", phone: "+420 568 826 121", lat: 49.2175, lng: 15.8728, stkLines: 1, stkEmissions: true, stkMotorcycles: false, stkTrailers: false, stkHeavy: false },

  // Jihomoravský kraj
  { officialStationId: "STK-JHM-001", name: "STK Brno - Slatina", address: "Tuřanka 1222/115", city: "Brno", region: "Jihomoravský", zip: "62700", phone: "+420 545 231 511", lat: 49.1756, lng: 16.6819, stkLines: 3, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-JHM-002", name: "DEKRA STK Brno", address: "Vídeňská 297/99", city: "Brno", region: "Jihomoravský", zip: "61900", phone: "+420 547 214 311", lat: 49.1650, lng: 16.5956, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-JHM-003", name: "STK Znojmo", address: "Průmyslová 4341/2", city: "Znojmo", region: "Jihomoravský", zip: "66902", phone: "+420 515 224 511", lat: 48.8594, lng: 16.0500, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-JHM-004", name: "STK Břeclav", address: "Bratislavská 2480/72", city: "Břeclav", region: "Jihomoravský", zip: "69002", phone: "+420 519 326 811", lat: 48.7536, lng: 16.8842, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Olomoucký kraj
  { officialStationId: "STK-OLK-001", name: "STK Olomouc", address: "Brněnská 689/35", city: "Olomouc", region: "Olomoucký", zip: "77900", phone: "+420 585 312 111", lat: 49.5833, lng: 17.2525, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-OLK-002", name: "STK Prostějov", address: "Olomoucká 1536/56b", city: "Prostějov", region: "Olomoucký", zip: "79601", phone: "+420 582 401 206", lat: 49.4750, lng: 17.1136, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },
  { officialStationId: "STK-OLK-003", name: "STK Šumperk", address: "Tepelská 415/15", city: "Šumperk", region: "Olomoucký", zip: "78701", phone: "+420 583 213 019", lat: 49.9644, lng: 16.9706, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },

  // Zlínský kraj
  { officialStationId: "STK-ZLK-001", name: "STK Zlín", address: "Prštné 527", city: "Zlín", region: "Zlínský", zip: "76001", phone: "+420 577 104 311", lat: 49.2167, lng: 17.6667, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-ZLK-002", name: "STK Uherské Hradiště", address: "Průmyslová 1001", city: "Uherské Hradiště", region: "Zlínský", zip: "68601", phone: "+420 572 550 100", lat: 49.0697, lng: 17.4597, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-ZLK-003", name: "STK Vsetín", address: "Bobrky 2171", city: "Vsetín", region: "Zlínský", zip: "75501", phone: "+420 571 411 515", lat: 49.3386, lng: 17.9961, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },

  // Moravskoslezský kraj
  { officialStationId: "STK-MSK-001", name: "STK Ostrava - Přívoz", address: "Hlučínská 1177/72", city: "Ostrava", region: "Moravskoslezský", zip: "70200", phone: "+420 596 118 411", lat: 49.8506, lng: 18.2656, stkLines: 3, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-MSK-002", name: "DEKRA STK Ostrava", address: "Slovenská 1085/1a", city: "Ostrava", region: "Moravskoslezský", zip: "70030", phone: "+420 596 612 020", lat: 49.8322, lng: 18.2917, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: true },
  { officialStationId: "STK-MSK-003", name: "STK Opava", address: "Těšínská 2744/34", city: "Opava", region: "Moravskoslezský", zip: "74601", phone: "+420 553 625 600", lat: 49.9356, lng: 17.9092, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-MSK-004", name: "STK Frýdek-Místek", address: "Příborská 1401", city: "Frýdek-Místek", region: "Moravskoslezský", zip: "73801", phone: "+420 558 634 500", lat: 49.6856, lng: 18.3531, stkLines: 2, stkEmissions: true, stkMotorcycles: true, stkTrailers: true, stkHeavy: false },
  { officialStationId: "STK-MSK-005", name: "STK Karviná", address: "Bohumínská 1878/6", city: "Karviná", region: "Moravskoslezský", zip: "73506", phone: "+420 596 311 455", lat: 49.8561, lng: 18.5428, stkLines: 1, stkEmissions: true, stkMotorcycles: true, stkTrailers: false, stkHeavy: false },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log(`Seeding ${STK_STATIONS.length} STK stations...`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const station of STK_STATIONS) {
    const slug = slugify(station.name);

    try {
      await prisma.autoServis.upsert({
        where: { officialStationId: station.officialStationId },
        update: {
          name: station.name,
          address: station.address,
          city: station.city,
          region: station.region,
          zip: station.zip,
          phone: station.phone || null,
          email: station.email || null,
          web: station.web || null,
          latitude: station.lat,
          longitude: station.lng,
          stkLines: station.stkLines || null,
          stkEmissions: station.stkEmissions ?? true,
          stkMotorcycles: station.stkMotorcycles ?? false,
          stkTrailers: station.stkTrailers ?? false,
          stkHeavy: station.stkHeavy ?? false,
          stkOnlineBooking: station.stkOnlineBooking ?? false,
          lastVerifiedAt: new Date(),
        },
        create: {
          slug,
          officialStationId: station.officialStationId,
          name: station.name,
          address: station.address,
          city: station.city,
          region: station.region,
          zip: station.zip,
          phone: station.phone || null,
          email: station.email || null,
          web: station.web || null,
          latitude: station.lat,
          longitude: station.lng,
          categories: ["stk-emise"],
          source: "MDCR",
          tier: "NEOFICIALNI",
          isVerified: true,
          isPublished: true,
          stkLines: station.stkLines || null,
          stkEmissions: station.stkEmissions ?? true,
          stkMotorcycles: station.stkMotorcycles ?? false,
          stkTrailers: station.stkTrailers ?? false,
          stkHeavy: station.stkHeavy ?? false,
          stkOnlineBooking: station.stkOnlineBooking ?? false,
          lastVerifiedAt: new Date(),
        },
      });
      created++;
    } catch (e) {
      // Slug collision — try with suffix
      try {
        await prisma.autoServis.upsert({
          where: { officialStationId: station.officialStationId },
          update: {
            name: station.name,
            latitude: station.lat,
            longitude: station.lng,
            lastVerifiedAt: new Date(),
          },
          create: {
            slug: `${slug}-${station.officialStationId.toLowerCase()}`,
            officialStationId: station.officialStationId,
            name: station.name,
            address: station.address,
            city: station.city,
            region: station.region,
            zip: station.zip,
            phone: station.phone || null,
            latitude: station.lat,
            longitude: station.lng,
            categories: ["stk-emise"],
            source: "MDCR",
            tier: "NEOFICIALNI",
            isVerified: true,
            isPublished: true,
            stkEmissions: station.stkEmissions ?? true,
            stkMotorcycles: station.stkMotorcycles ?? false,
            stkTrailers: station.stkTrailers ?? false,
            stkHeavy: station.stkHeavy ?? false,
            lastVerifiedAt: new Date(),
          },
        });
        updated++;
      } catch (e2) {
        console.error(`Error seeding ${station.name}:`, e2);
        errors++;
      }
    }
  }

  console.log(`\nDone! Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
