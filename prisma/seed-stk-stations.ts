/**
 * Seed script: Import ~383 STK stations into AutoServis table.
 * Official data from MDČR registry + verified research from multiple sources.
 * GPS coordinates geocoded via Nominatim/OpenStreetMap API at runtime.
 *
 * Run: npx tsx prisma/seed-stk-stations.ts
 *
 * First run geocodes all addresses (~7 min with 1 req/sec rate limit).
 * Results are cached in .stk-geocode-cache.json for instant re-runs.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Geocoding via Nominatim/OpenStreetMap ────────────────────────────
const GEOCODE_CACHE_PATH = path.join(__dirname, ".stk-geocode-cache.json");
let geocodeCache: Record<string, { lat: number; lng: number }> = {};

try {
  geocodeCache = JSON.parse(fs.readFileSync(GEOCODE_CACHE_PATH, "utf-8"));
} catch {
  /* no cache yet */
}

function saveCache() {
  fs.writeFileSync(GEOCODE_CACHE_PATH, JSON.stringify(geocodeCache, null, 2));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocode(
  address: string,
  city: string,
): Promise<{ lat: number; lng: number }> {
  const cacheKey = `${address}|${city}`;
  if (geocodeCache[cacheKey]) return geocodeCache[cacheKey];

  const queries = address
    ? [`${address}, ${city}, Czech Republic`, `${city}, Czech Republic`]
    : [`${city}, Czech Republic`];

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=cz`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Carmakler-STK-Seed/1.0" },
      });
      const data = (await res.json()) as { lat: string; lon: string }[];
      if (data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        geocodeCache[cacheKey] = result;
        saveCache();
        await sleep(1100);
        return result;
      }
    } catch {
      /* try next query */
    }
    await sleep(1100);
  }

  // Fallback: Czech Republic center
  const fallback = { lat: 49.8, lng: 15.5 };
  geocodeCache[cacheKey] = fallback;
  saveCache();
  return fallback;
}

// ─── Station data ─────────────────────────────────────────────────────
// [officialStationId, name, address, city, zip, phone]
type R = [string, string, string, string, string, string];

const DATA: Record<string, R[]> = {
  // ═══════════════════════════════════════════════════════════════════
  // HLAVNÍ MĚSTO PRAHA (30 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Hlavní město Praha": [
    ["31.00", "DEKRA CZ a.s.", "Türkova 1001/9", "Praha 4", "14900", "267 913 838"],
    ["31.02", "DEKRA CZ a.s.", "Spojovací 41", "Praha 9", "19000", "284 829 315"],
    ["31.03", "Dopravní podnik hl.m. Prahy", "U vozovny 6", "Praha 10", "10856", "272 704 945"],
    ["31.04", "STK Motol s.r.o.", "Plzeňská 290/215b", "Praha 5", "15000", "257 210 963"],
    ["31.05", "STK Praha s.r.o.", "Průběžná 2397/76", "Praha 10", "10031", "274 774 867"],
    ["31.06", "DISKARD - STK s.r.o.", "Jeremiášova 870", "Praha 5", "15300", "723 904 805"],
    ["31.07", "STK Kunratice spol.s.r.o.", "Dobronická 635", "Praha 4", "14800", "261 112 399"],
    ["31.08", "Břevnovská STK s.r.o.", "Radimova 39", "Praha 6", "16900", "220 513 268"],
    ["31.09", "STK Černý Most", "Chlumecká 765/6", "Praha 9", "18100", "720 696 972"],
    ["31.10", "STK Jarov (DEKRA)", "Osiková 2688/2", "Praha 3", "13000", "251 002 130"],
    ["31.12", "Auto Veselý s.r.o.", "K Měcholupům 3", "Praha 15", "10900", "274 877 292"],
    ["31.13", "Pronto STK s.r.o.", "Podnikatelská I 652", "Praha 9 - Běchovice", "19011", "222 564 115"],
    ["31.14", "STK Bohdalec s.r.o.", "Nad Vršovskou horou 88/4", "Praha 10", "10100", "267 107 485"],
    ["31.15", "DEKRA CZ a.s.", "Na Výběžku 688/11", "Praha 9", "19000", "284 818 928"],
    ["31.16", "MYNOS STK s.r.o.", "Bešťákova 567/3", "Praha 8", "18200", "286 580 824"],
    ["31.17", "DEKRA CZ a.s.", "Prosecká 817", "Praha 9", "19000", "283 881 307"],
    ["31.18", "Zařízení služeb pro MV", "Přípotoční 300", "Praha 10", "10101", "974 844 447"],
    ["31.19", "AUTO FEMAT s.r.o.", "Výpadová 1559", "Praha 5 - Radotín", "15300", "242 410 660"],
    ["31.20", "TÜV NORD Czech s.r.o.", "Skorkovská 1537", "Praha 14", "19800", "281 915 951"],
    ["31.21", "STK Holešovice s.r.o.", "Za elektrárnou 781/19", "Praha 7", "17000", "777 208 680"],
    ["31.22", "NH group s.r.o. (STK Řepy)", "Karlovarská 814/115", "Praha 6", "16100", "725 392 611"],
    ["31.23", "DEKRA CZ a.s.", "Dobronická 1216", "Praha 4", "14825", "242 456 194"],
    ["31.25", "STK Uhříněves", "Podleská 1545/1", "Praha 10", "10400", "267 315 085"],
    ["31.26", "Pronto STK s.r.o.", "Ohradní 56/1575", "Praha 4", "14300", "222 564 115"],
    ["31.28", "STK Modřany (ESPM s.r.o.)", "Mezi vodami 1097/25", "Praha 4", "14300", "725 888 170"],
    ["31.30", "STK Jarov 2", "Osiková 2", "Praha 3", "13000", "605 339 922"],
    ["31.31", "STK Letňany", "Pozemek 756/49", "Praha 9", "19900", "733 601 010"],
    ["31.32", "STK Strašnice", "Brigádníků 3067/6", "Praha 10", "10101", "721 316 915"],
    ["31.33", "STK Ládví", "K Ládví 925", "Praha 8", "18400", "604 288 244"],
    ["31.34", "STK Dopraváků", "Dopraváků 723/1", "Praha 8", "18400", "283 085 164"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // STŘEDOČESKÝ KRAJ (51 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Středočeský": [
    ["32.01", "BOVAS s.r.o.", "K Podlesí 539", "Příbram", "26101", "318 628 552"],
    ["32.02", "DSME s.r.o.", "Mladoboleslavská 2801", "Mělník", "27601", "315 623 328"],
    ["32.03", "Terri s.r.o.", "Netovická 350", "Slaný", "27401", "312 527 670"],
    ["32.04", "STK Janovice s.r.o.", "Kolínská 670", "Uhlířské Janovice", "28504", "327 542 266"],
    ["32.05", "STK Divišov s.r.o.", "Na Pile 300", "Divišov", "25726", "317 855 330"],
    ["32.06", "STK Dobrovice v.o.s.", "Kosořická 580", "Dobrovice", "29441", "326 398 112"],
    ["32.07", "AUTOŠTOL-STK s.r.o.", "Vašíčkova 71", "Kladno", "27204", "312 267 113"],
    ["32.08", "ASOCOM s.r.o.", "Obecnická 323", "Příbram", "26101", "318 635 564"],
    ["32.09", "ŠPÁRA s.r.o.", "Koněvova 660/44", "Nymburk", "28802", "325 513 653"],
    ["32.10", "STK KOLÍN s.r.o.", "Ovčárecká 509", "Kolín", "28002", "321 724 966"],
    ["32.11", "INTERAUTO s.r.o.", "Nádražní 439", "Mníšek pod Brdy", "25210", "318 592 640"],
    ["32.12", "AUTOFIJA v.o.s.", "Luženská 1992", "Rakovník", "26901", "313 512 332"],
    ["32.13", "STK Brandýs", "Zápská 2257", "Brandýs nad Labem", "25001", "326 370 055"],
    ["32.14", "TESTCAR s.r.o.", "Železničářů 885", "Kladno", "27280", "312 680 016"],
    ["32.15", "STK Kralupy s.r.o.", "Přemyslova 431", "Kralupy nad Vltavou", "27801", "315 727 897"],
    ["32.16", "UNIKOM-STK s.r.o.", "Hrnčířská 207", "Kutná Hora", "28445", "327 514 515"],
    ["32.17", "STK Hořovice s.r.o.", "Masarykova 1432", "Hořovice", "26801", "311 516 727"],
    ["32.18", "Bělohradský s.r.o.", "Boleslavská 1042", "Kosmonosy", "29306", "326 327 567"],
    ["32.19", "ČSAD POLKOST s.r.o.", "nám. Smiřických 16", "Kostelec nad Černými lesy", "28163", "321 679 289"],
    ["32.20", "STK Mlýn DRAHO s.r.o.", "Draho u Budiměřic 14", "Nymburk", "28802", "325 546 074"],
    ["32.21", "AUTO PETRA s.r.o.", "Drásov 121", "Příbram", "26101", "318 690 266"],
    ["32.22", "AUTO PAŘÍZEK s.r.o.", "Hlavní 9", "Březová-Oleško", "25245", "257 760 944"],
    ["32.23", "REVIT s.r.o.", "Dlouhé Pole 31", "Benešov", "25601", "317 726 351"],
    ["32.24", "JIKE s.r.o.", "Masarykova 392", "Hořovice", "26801", "311 513 777"],
    ["32.25", "STK Horoměřice", "Suchdolská 682", "Horoměřice", "25262", "220 970 079"],
    ["32.26", "Bělohradský s.r.o.", "Vltavská 7", "Libčice nad Vltavou", "25266", "735 732 177"],
    ["32.27", "Bělohradský s.r.o.", "Kolovratská 2020", "Říčany", "25101", "323 605 363"],
    ["32.28", "A-Z BEROUN s.r.o.", "Pod Hájem 372", "Králův Dvůr", "26701", "311 637 777"],
    ["32.29", "BUILDING SP s.r.o.", "Dopravní 2098", "Nymburk", "28802", "724 750 750"],
    ["32.30", "ABERA s.r.o.", "Vrchovská 1760", "Čáslav", "28601", "327 315 555"],
    ["32.31", "AUTO Holý s.r.o.", "Přílepská 1909", "Roztoky", "25263", "233 910 035"],
    ["32.32", "TRILOBIT REAL s.r.o.", "Hlavní 182", "Tuklaty", "25082", "321 622 290"],
    ["32.33", "PRP s.r.o.", "Loket 52", "Čechtice", "25765", "317 866 060"],
    ["32.34", "Miroslav Pecha", "Havlíčkova 1432/II", "Mladá Boleslav", "29301", "326 737 780"],
    ["32.35", "KASOKO s.r.o.", "Strojírenská 741", "Sedlčany", "26401", "318 820 810"],
    ["32.36", "STK Dymokury", "Nouzov 82", "Dymokury", "28901", "325 512 484"],
    ["32.37", "STK Divišov s.r.o.", "Průmyslová 1851", "Vlašim", "25801", "317 855 313"],
    ["32.38", "STK Velim a.s.", "Palackého 94", "Velim", "28101", "321 762 066"],
    ["32.39", "STK Nové Strašecí", "Průmyslová 1208", "Nové Strašecí", "27101", "724 330 990"],
    ["32.40", "STK Lysá nad Labem", "K Milovicům 1921", "Lysá nad Labem", "28922", "607 206 206"],
    ["32.41", "STK Příbram V", "Zdaboř 633", "Příbram", "26101", "728 358 993"],
    ["32.42", "STK Kladno-Dubí", "Kročehlavská 1025", "Kladno", "27203", "312 538 260"],
    ["32.43", "STK Dolní Břežany", "Pražská 830", "Dolní Břežany", "25241", "722 004 004"],
    ["32.46", "Měření 3D s.r.o.", "28. října 1503", "Kladno", "27309", "603 203 106"],
    ["32.47", "STK CENTRUM s.r.o.", "Karla Lípy 1678", "Brandýs nad Labem", "25001", "733 110 430"],
    ["32.48", "STK CENTRUM s.r.o. (2)", "Karla Lípy 1678", "Brandýs nad Labem", "25001", "313 033 174"],
    ["32.49", "STK Zásmuky", "Pozemek 245/1", "Zásmuky", "28144", "601 207 503"],
    ["32.50", "STK Líbeznice", "Mělnická 1060", "Líbeznice", "25065", "735 758 085"],
    ["32.51", "METALTECH s.r.o.", "Na Malém Spořilově 4151", "Mělník", "27601", "312 310 720"],
    ["32.52", "STK Mladá Boleslav 2", "Jičínská 414", "Mladá Boleslav", "29301", "315 624 925"],
    ["32.53", "STK Hořovice 3", "Tyršova parc. 1918/2", "Hořovice", "26801", "734 638 148"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // JIHOČESKÝ KRAJ (34 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Jihočeský": [
    // Existing seed matches (official codes not in research NEW table)
    ["33.03", "STK Strakonice", "Písecká 380", "Strakonice", "38601", "383 321 201"],
    ["33.05", "STK Tábor", "Chýnovská 2468", "Tábor", "39002", "381 252 311"],
    ["33.07", "STK České Budějovice", "Vrbenská 2082", "České Budějovice", "37001", "387 203 511"],
    // New from research
    ["33.01", "STK Blatná s.r.o.", "Vrbenská 1526", "Blatná", "38801", "383 422 706"],
    ["33.02", "KOMAT-STK s.r.o.", "Dolní Třebonín 195", "Český Krumlov", "38201", "380 743 853"],
    ["33.04", "STK Sezimovo Ústí s.r.o.", "Pod Kovosvitem 1135", "Sezimovo Ústí", "39102", "381 291 277"],
    ["33.06", "VOŠ, SPŠ automobilní", "Rudolfovská 17", "České Budějovice", "37001", "386 356 589"],
    ["33.08", "AR PARTNER s.r.o.", "Jarošovská 869/II", "Jindřichův Hradec", "37702", "384 321 006"],
    ["33.09", "STK ZÁRUBA M&K s.r.o.", "Stožická 840", "Vodňany", "38901", "383 382 522"],
    ["33.10", "JIKONA STK s.r.o.", "Hradišťská 2439/14", "Písek", "39701", "382 219 089"],
    ["33.11", "STK PELHŘIMOV s.r.o.", "Skrýšovská 1968", "Pelhřimov", "39301", "565 323 110"],
    ["33.12", "BONUS Prachatice s.r.o.", "Jitka-Otín 3", "Jindřichův Hradec", "37701", "384 326 717"],
    ["33.13", "STK Týn nad Vltavou s.r.o.", "Táborská 568", "Týn nad Vltavou", "37501", "385 732 608"],
    ["33.14", "AUTA TEST s.r.o.", "Pelhřimovská 2940", "Tábor", "39002", "381 253 175"],
    ["33.15", "Alena Ládová - DOZER", "Žižkova 117", "Vlachovo Březí", "38422", "388 320 153"],
    ["33.17", "Alena Ládová - DOZER", "Chlumany 100", "Vlachovo Březí", "38422", "388 320 000"],
    ["33.18", "STK ATOS s.r.o.", "U Hřebčince 2534", "Písek", "39701", "382 212 564"],
    ["33.19", "Tollinger v.o.s.", "Hrejkovice 110", "Milevsko", "39901", "382 211 089"],
    ["33.20", "Alena Ládová - DOZER", "Jindřícha Plachty 56/2606", "České Budějovice", "37001", "387 314 265"],
    ["33.21", "JIKONA STK s.r.o.", "Sažinova 1438", "Milevsko", "39901", "382 521 013"],
    ["33.22", "Jaroslav Kalivoda", "Jiráskova 1202", "Třeboň", "37901", "384 721 865"],
    ["33.23", "PETA SERVIS s.r.o.", "Nová 514/II", "Soběslav", "39201", "381 521 431"],
    ["33.24", "STK Týn nad Vltavou s.r.o.", "Nová 515", "Soběslav", "39201", "381 521 530"],
    ["33.25", "Alena Ládová - DOZER", "Vodňanská 964", "Prachatice", "38301", "388 310 656"],
    ["33.26", "Václav Krejčí", "Družstevní 335", "Mirotice", "39801", "382 229 094"],
    ["33.27", "TECHPRO s.r.o.", "Křenov u Kájova", "Kájov", "38221", "380 750 995"],
    ["33.28", "Měření 3D s.r.o.", "Učňovská ulice 177", "Dačice", "38001", "770 669 540"],
    ["33.29", "STK Vodňany 2", "Číčenická 1192", "Vodňany", "38901", "383 382 522"],
    ["63.02", "SJP Stojslavice s.r.o.", "Stojslavice 4", "Smilovy Hory", "39143", "724 008 995"],
    ["63.04", "REDD s.r.o.", "Přesecká 164", "Třeboň", "38232", "603 714 694"],
    ["63.05", "STK-SME traktory s.r.o.", "Homole 198", "České Budějovice", "37001", "387 203 193"],
    ["63.09", "AGILA s.r.o.", "parcela č. 530/6", "Dačice", "38001", "384 420 012"],
    ["GEN-JHC-001", "JIHOPLAST s.r.o.", "Pracejovice-areál DMP", "Strakonice", "38601", "383 321 193"],
    ["GEN-JHC-002", "STK Sušice", "Žichovice 112", "Sušice", "34201", "376 323 953"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // PLZEŇSKÝ KRAJ (25 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Plzeňský": [
    // Existing seed unmatched
    ["GEN-PLK-001", "STK Plzeň - Bory", "Sukova 27", "Plzeň", "30100", "377 321 511"],
    // New from research
    ["34.01", "AUTOKOMPLET-servis Plzeň s.r.o.", "Domažlická 126", "Plzeň", "31803", "377 386 776"],
    ["34.03", "Čimická STK s.r.o.", "Čimice 77", "Sušice", "34201", "376 596 542"],
    ["34.04", "STK Mýto s.r.o.", "Plzeňská 569", "Mýto", "33805", "371 750 316"],
    ["34.06", "STK INVEST TEL s.r.o.", "Domažlické předměstí 610", "Klatovy", "33901", "376 313 938"],
    ["34.07", "AutoKontrol-STK Tachov s.r.o.", "Oldřichovská 1511", "Tachov", "34701", "374 722 753"],
    ["34.08", "AUTO V-S s.r.o.", "Nádražní 70", "Horšovský Týn", "34601", "379 422 728"],
    ["34.11", "STK Nepomucká s.r.o.", "Nepomucká 119", "Plzeň", "32600", "377 248 811"],
    ["34.12", "KLATOVSKÁ STK s.r.o.", "Dr. Sedláka 778", "Klatovy", "33901", "376 322 332"],
    ["34.13", "PLZEŇSKÁ STK s.r.o.", "Koterovská 156a", "Plzeň", "32600", "377 241 224"],
    ["34.14", "STK-stanice technické kontroly s.r.o.", "Fügnerova 404", "Blovice", "33601", "371 522 754"],
    ["34.15", "MARPA s.r.o. (STK Rybnice)", "Rybnice 155", "Kaznějov", "33151", "373 300 539"],
    ["34.18", "LINKA-STK MÝTO s.r.o.", "Plzeňská 23", "Mýto", "33805", "371 750 598"],
    ["34.19", "KRČMA AUTO s.r.o.", "Chrastavice 111", "Domažlice", "34401", "379 768 242"],
    ["34.22", "AUTO LEPIČ s.r.o.", "Sokolská 705", "Vejprnice", "33027", "377 826 767"],
    ["34.23", "MS STK Rokycany s.r.o.", "Pivovarská 146", "Rokycany", "33701", "371 729 715"],
    ["34.24", "Eduard Vrána - EDDY", "Tyršova 356", "Horažďovice", "34101", "721 735 704"],
    ["34.25", "M-MEK s.r.o.", "Kožlany 349", "Kožlany", "33144", "373 396 681"],
    ["34.27", "STK Přeštice s.r.o.", "Třída 1. máje 700", "Přeštice", "33401", "377 982 326"],
    ["34.30", "RAMALE s.r.o.", "K Letišti 670", "Klatovy", "33901", "376 313 906"],
    ["34.31", "Miroslav Mansfeld", "Plzeňská 667", "Bor", "34802", "374 625 727"],
    ["34.32", "STK Sušice", "Nádražní ulice 1302", "Sušice", "34201", "376 323 953"],
    ["34.33", "STK Stříbro", "Třída 5. května 1579", "Stříbro", "34901", "374 627 999"],
    ["64.01", "STK AGRO s.r.o.", "Dr. Sedláka 779/III", "Klatovy", "33901", "376 310 627"],
    ["64.09", "DEKRA CZ a.s.", "Jarov č.p. 162", "Blovice", "33601", "371 522 754"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // KARLOVARSKÝ KRAJ (12 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Karlovarský": [
    ["34.02", "TYLINGER s.r.o.", "Citická 2069", "Sokolov", "35601", "352 600 063"],
    ["34.09", "TÜV NORD Czech s.r.o.", "Lesov č. 8", "Sadov", "36261", "353 590 219"],
    ["34.10", "AUTO - O.K. s.r.o.", "Vrázova 2626/16", "Cheb", "35002", "354 439 847"],
    ["34.16", "SOKOLOVSKÁ STK s.r.o.", "Chebská 2239", "Sokolov", "35601", "352 467 444"],
    ["34.17", "AUTORENT SALON s.r.o.", "Tepelská 551", "Mariánské Lázně", "35301", "354 623 084"],
    ["34.20", "TÜV NORD Czech s.r.o.", "Hroznětínská 402/4", "Karlovy Vary", "36004", "353 449 475"],
    ["34.21", "F+T AUTO-TECHNIK s.r.o.", "Plzeňská 575", "Toužim", "36401", "353 311 542"],
    ["34.28", "BYTEX - auto s.r.o.", "Vintířovská 1119", "Chodov", "35735", "728 188 531"],
    ["34.29", "AUTO - O.K. s.r.o.", "Anglická 2863", "Aš", "35201", "354 595 268"],
    ["34.34", "STK Jenišov", "Daimlerova 271", "Jenišov", "36211", "353 542 121"],
    ["GEN-KVK-001", "TEKOSO-STK s.r.o.", "Lipová 2049", "Sokolov", "35601", "352 605 513"],
    ["GEN-KVK-002", "AUTORENT SALON s.r.o.", "Lipová 335", "Černošín", "34901", "354 623 084"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ÚSTECKÝ KRAJ (31 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Ústecký": [
    ["35.01", "CSPSD Praha", "Alšova 1075/7", "Krásná Lípa", "40746", "412 383 361"],
    ["35.02", "STK Děčín 35.02 a.s.", "Předmostí 1839/2", "Děčín", "40502", "412 588 133"],
    ["35.03", "STK-Podbořany s.r.o.", "Hlubanská 741", "Podbořany", "44101", "415 214 362"],
    ["35.05", "S.T.K. Litoměřice s.r.o.", "U terezínské křižovatky 176", "Litoměřice", "41201", "416 739 016"],
    ["35.06", "AUTOPLUS II. CONTROL s.r.o.", "Budovatelů 624", "Most", "43401", "476 100 461"],
    ["35.07", "R+B Auto control s.r.o.", "Pražská 375", "Lubenec", "43983", "415 212 296"],
    ["35.08", "STK-O.K. CAR s.r.o.", "Rybalkova 2765", "Louny", "44001", "415 653 467"],
    ["35.09", "ALFA-TECHNIC s.r.o.", "Průmyslová zóna VERNE 12", "Klášterec nad Ohří", "43151", "474 331 421"],
    ["35.10", "ALFA-TECHNIC s.r.o.", "Otvice obchodní zóna 252", "Chomutov", "43111", "474 653 414"],
    ["35.11", "CARTEST s.r.o. (IVESUR)", "K Emance 291", "Dubí-Mstišov", "41703", "417 571 435"],
    ["35.13", "STK ROUDNICE s.r.o.", "Žižkova 2493", "Roudnice nad Labem", "41301", "416 831 853"],
    ["35.14", "DEKRA CZ a.s.", "U Oharky 3093", "Žatec", "43801", "415 711 258"],
    ["35.15", "STK České Zlatníky", "České Zlatníky 87", "Obrnice", "43401", "777 490 855"],
    ["35.16", "Terri s.r.o.", "Hrbovická 2", "Ústí nad Labem", "40002", "475 601 147"],
    ["35.20", "STK Zeman-Šebek s.r.o.", "Podkrušnohorská 8", "Janov", "43542", "476 741 649"],
    ["35.21", "HELVE MOST s.r.o.", "Spořice 480", "Spořice", "43101", "474 623 548"],
    ["35.23", "B.K. syn CENTRUM s.r.o.", "Havířská 360/29", "Ústí nad Labem", "40000", "475 504 414"],
    ["35.24", "STK Děčín 35.02 a.s.", "Podhoří 361/2", "Ústí nad Labem", "40001", "475 316 934"],
    ["35.27", "DC STK s.r.o.", "Oblouková 1416/9", "Děčín", "40502", "412 589 926"],
    ["35.31", "STK Teplice", "V Lipách 3275", "Teplice", "41501", "417 535 386"],
    ["35.32", "IVESUR a.s.", "U Trati 2213", "Litoměřice", "41781", "416 535 500"],
    ["35.33", "STK Varnsdorf", "Strakonická 3242", "Varnsdorf", "40747", "412 358 844"],
    ["35.34", "STK Děčín 3", "Folknářská", "Děčín", "40538", "739 157 405"],
    ["35.35", "Terri s.r.o.", "č.p. 283/2", "České Zlatníky", "43401", "601 245 475"],
    ["35.36", "Terri s.r.o.", "Droužkovická 476", "Údlice", "43141", "736 200 200"],
    ["35.37", "Vladimír Fořt", "Žatecká ul.", "Most", "43401", "603 973 687"],
    ["35.38", "STK Lovosice", "Terezínská 1306", "Lovosice", "41002", "734 541 248"],
    ["65.11", "STK Dobrná", "Dobrná 130", "Děčín", "40741", "606 962 014"],
    ["65.12", "STK Zimoř", "Zimoř 8", "Liběšice", "41145", "606 962 014"],
    ["65.15", "STK Krásný Dvůr", "Krásný Dvůr 9", "Krásný Dvůr", "43972", "775 236 915"],
    ["65.16", "STK Raná", "Raná 145", "Raná", "43924", "602 548 765"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // LIBERECKÝ KRAJ (15 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Liberecký": [
    ["35.04", "TKV Liberec s.r.o.", "Tanvaldská 1106", "Liberec", "46311", "482 737 888"],
    ["35.12", "KLIMEX s.r.o.", "Liberecká 558", "Nový Bor", "47301", "487 754 637"],
    ["35.17", "eSTéKá s.r.o.", "Želivského 1", "Jablonec nad Nisou", "46605", "483 312 131"],
    ["35.18", "Jablonecká STK s.r.o.", "Belgická 5061", "Jablonec nad Nisou", "46605", "483 704 215"],
    ["35.19", "STEKO LB s.r.o.", "Mrštíkova 2", "Liberec", "46001", "485 104 111"],
    ["35.22", "KLIMEX s.r.o.", "Žitavská 3112", "Česká Lípa", "47006", "487 874 683"],
    ["35.25", "AUTORENOVA Plus s.r.o.", "Mánesova 1477", "Česká Lípa", "47001", "487 868 924"],
    ["35.26", "FOLDA s.r.o.", "Frýdlantská 772", "Raspenava", "46401", "482 319 126"],
    ["35.28", "Bělohradský s.r.o.", "Kovářova 3189", "Česká Lípa", "47001", "487 831 081"],
    ["35.29", "KLIMEX s.r.o.", "Londýnská 590/85", "Liberec", "46001", "601 159 857"],
    ["35.30", "STK Český Dub", "Sobotice 15", "Český Dub", "46343", "485 147 104"],
    ["36.17", "STK Turnov s.r.o.", "Nudvojovická 1681", "Turnov", "51101", "481 325 637"],
    ["36.21", "ISŠ Vysoké nad Jizerou", "Dr. Farského 300", "Vysoké nad Jizerou", "51211", "481 593 907"],
    ["36.37", "Jiří Machek - HYDROMA", "K Javorku 982", "Jilemnice", "51401", "481 545 300"],
    ["65.14", "ZOD Brniště a.s.", "Brniště", "Brniště", "47129", "606 962 014"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // KRÁLOVÉHRADECKÝ KRAJ (28 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Královéhradecký": [
    ["36.01", "CSPSD Praha", "Mladobucká 483", "Trutnov", "54102", "499 732 913"],
    ["36.06", "AGRO Slatiny a.s.", "Hradecká 1122", "Jičín", "50601", "493 555 055"],
    ["36.07", "STK Solnice s.r.o.", "Soukenická 242", "Rychnov nad Kněžnou", "51601", "494 596 255"],
    ["36.08", "DETECHA", "Krátká 419", "Nové Město nad Metují", "54901", "491 470 314"],
    ["36.09", "AutoPrim-STK s.r.o.", "Na Rybárně 203", "Hradec Králové", "50002", "495 537 011"],
    ["36.11", "FAMA-STK s.r.o.", "Ekologická 348", "Rychnov nad Kněžnou", "51601", "494 533 867"],
    ["36.14", "FARMET STK s.r.o.", "Jiřinková 276", "Česká Skalice", "55203", "491 452 624"],
    ["36.15", "AGRO Slatiny a.s.", "Hradecká 816", "Jičín", "50601", "493 522 434"],
    ["36.18", "MEDIS HOLDING a.s.", "Bratří Štefanů 492", "Hradec Králové", "50003", "495 714 158"],
    ["36.23", "AUTOTEST-TKMV s.r.o.", "Dobenínská 2014", "Náchod", "54701", "491 421 859"],
    ["36.24", "TMW a.s. (DEKRA CZ)", "Nedbalova 573", "Dvůr Králové nad Labem", "54401", "499 622 506"],
    ["36.27", "Kutík STK s.r.o.", "Seligerova 147", "Smiřice", "50303", "495 421 828"],
    ["36.30", "STK Sovětice CZ s.r.o.", "Sovětice 19", "Nechanice", "50315", "495 446 127"],
    ["36.31", "STK-FLÍDROVÁ s.r.o. (DEKRA)", "Ještětice 110", "Solnice", "51601", "494 596 441"],
    ["36.35", "AVM PLUS Vrchlabí s.r.o.", "Na Bělidle 1652", "Vrchlabí", "54301", "499 692 899"],
    ["36.36", "STK David Jirsák", "Pražská 782/IV", "Chlumec nad Cidlinou", "50351", "731 657 827"],
    ["36.38", "AGRO SLATINY a.s.", "Jungmanova 1736", "Nový Bydžov", "50351", "495 490 198"],
    ["36.39", "amcontrol s.r.o.", "Pardubická 1338", "Třebechovice pod Orebem", "50346", "495 591 283"],
    ["36.40", "STK Trutnov s.r.o.", "Horská 932", "Trutnov", "54101", "499 309 199"],
    ["36.41", "KUTÍK STK s.r.o.", "Meziměstí 3", "Jetřichov", "54983", "491 582 041"],
    ["36.45", "STK-FLÍDROVÁ s.r.o. (DEKRA)", "Pod Budínem 1699", "Rychnov nad Kněžnou", "51601", "494 620 226"],
    ["36.48", "STK Nová Paka", "Kumburský Újezd 90", "Nová Paka", "50901", "725 699 599"],
    ["36.51", "STK Plotiště", "Plotiště nad Labem", "Hradec Králové", "50002", "777 926 951"],
    ["66.03", "SOÚ I Hlušice", "Hlušice 1", "Hlušice", "50356", "495 483 421"],
    ["66.17", "STK Roudnice", "Roudnice p.č. 161/18", "Lhota pod Libčany", "50327", "777 926 951"],
    ["GEN-HKK-001", "HJH v.o.s.", "Domašín 8", "Černíkovice", "51701", "494 384 131"],
    ["GEN-HKK-002", "FERAL TK s.r.o.", "Libčany 93", "Libčany", "50322", "495 585 415"],
    ["GEN-HKK-003", "STK Jičín s.r.o.", "Úlibice 64", "Úlibice", "50601", "493 597 454"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // PARDUBICKÝ KRAJ (19 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Pardubický": [
    ["36.04", "CT CAR Martin Janák (DEKRA)", "Podbranská 2047", "Česká Třebová", "56002", "465 531 007"],
    ["36.05", "Z-MOTOR s.r.o.", "Vlčnov 30", "Chrudim", "53701", "722 110 011"],
    ["36.10", "AUTOKONTROL PARDUBICE s.r.o.", "Hradišťská 551", "Pardubice", "53353", "466 415 536"],
    ["36.12", "STK SVITAVY s.r.o.", "Petrusova 2", "Svitavy", "56802", "461 534 195"],
    ["36.13", "SOŠ automobilní", "Třebovská 348", "Ústí nad Orlicí", "56203", "468 002 669"],
    ["36.16", "Autokontrol Pardubice s.r.o.", "V Zahrádkách 2366/23", "Svitavy", "56802", "461 532 664"],
    ["36.19", "STK ZADINA s.r.o. (DEKRA)", "Průmyslová 381", "Pardubice", "53301", "466 670 165"],
    ["36.20", "KVATRO CHRUDIM s.r.o.", "Dašická 248", "Chrudim", "53701", "469 626 117"],
    ["36.22", "FONTES STK s.r.o.", "Semtín 100", "Pardubice", "53354", "466 415 861"],
    ["36.25", "AUTOTEST-STK Vysoké Mýto s.r.o.", "Vraclavská 523", "Vysoké Mýto", "56601", "465 420 738"],
    ["36.28", "Ivana Macháčková - STK (DEKRA)", "U Koupaliště 180", "Jablonné nad Orlicí", "56164", "465 642 945"],
    ["36.32", "NEOR veletrhy s.r.o. (DEKRA)", "Poličská 1365", "Hlinsko", "53901", "469 312 003"],
    ["36.43", "Autocheck s.r.o.", "Fáblovka 404", "Pardubice", "53352", "466 887 311"],
    ["GEN-PAK-001", "ČEMOS", "Trnavská 50", "Chornice", "56801", "461 322 068"],
    ["GEN-PAK-002", "SKH Sebranice s.r.o.", "Sebranice 69", "Sebranice", "56901", "461 745 287"],
    ["GEN-PAK-003", "Jiří Vincenci", "Vilibalda Svobody 948", "Skuteč", "53801", "469 351 210"],
    ["GEN-PAK-004", "STK Ústí s.r.o.", "Letohradská 100", "Ústí nad Orlicí", "56203", "465 520 174"],
    ["GEN-PAK-005", "Roman Jetmar", "Vračovice 1", "Vračovice-Orlov", "53501", "465 320 634"],
    ["GEN-PAK-006", "Ing. Glena Rauerová", "Dimitrovova 2", "Svitavy", "56802", "461 619 920"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // VYSOČINA (21 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Vysočina": [
    ["GEN-VYS-001", "AUTOCONTROL s.r.o.", "Dlouhá Brtnice 156", "Dlouhá Brtnice", "58834", "567 210 627"],
    ["GEN-VYS-002", "Z.T.K. - AGRO s.r.o.", "Dolní Cerekev 276", "Dolní Cerekev", "58845", "603 848 589"],
    ["GEN-VYS-003", "STK Havlíčkův Brod s.r.o.", "Lidická 1057", "Havlíčkův Brod", "58001", "569 429 900"],
    ["GEN-VYS-004", "STK NOVÁK HB s.r.o.", "Baštinov 126", "Havlíčkův Brod", "58001", "569 438 200"],
    ["GEN-VYS-005", "STK Humpolec s.r.o.", "Pelhřimovská 738", "Humpolec", "39601", "565 533 491"],
    ["GEN-VYS-006", "STK Chotěboř s.r.o.", "Havlíčkova 1724", "Chotěboř", "58301", "569 621 286"],
    ["GEN-VYS-007", "DPMJ a.s.", "Brtnická 23", "Jihlava", "58601", "567 301 325"],
    ["GEN-VYS-008", "STK JIHLAVA a.s.", "Znojemská 82", "Jihlava", "58601", "567 309 544"],
    ["GEN-VYS-009", "Pavel Dvořák", "Nad Kralickým kopcem 307", "Kralice nad Oslavou", "67573", "568 620 279"],
    ["GEN-VYS-010", "STK Dolní Vilémovice s.r.o.", "Dolní Vilémovice 148", "Lipník", "67552", "568 862 060"],
    ["GEN-VYS-011", "Smetana a Smetana s.r.o.", "Lažínky 71", "Moravské Budějovice", "67602", "568 420 332"],
    ["GEN-VYS-012", "STK NOVÉ VESELÍ s.r.o.", "Ždárská 311", "Nové Veselí", "59214", "566 667 075"],
    ["GEN-VYS-013", "STK PELHŘIMOV s.r.o.", "Skrýšovská 1968", "Pelhřimov", "39301", "565 323 110"],
    ["GEN-VYS-014", "Opravny Telč a.s.", "Radkovská 230", "Telč", "58856", "567 213 005"],
    ["GEN-VYS-015", "KTS-Třebíč s.r.o.", "Brněnská 123", "Třebíč", "67401", "568 821 571"],
    ["GEN-VYS-016", "STAVIZ - STK TŘEBÍČ s.r.o.", "Na Nivkách 305", "Třebíč", "67401", "568 821 680"],
    ["GEN-VYS-017", "Střední škola řemesel Třebíč", "Demlova 890", "Třebíč", "67401", "568 840 237"],
    ["GEN-VYS-018", "TRADO-STK s.r.o.", "Průmyslová čtvrť 154", "Třebíč", "67401", "568 833 379"],
    ["GEN-VYS-019", "AUTOKLUB VELKÉ MEZIŘÍČÍ s.r.o.", "Jestřábec 2044", "Velké Meziříčí", "59401", "566 521 170"],
    ["GEN-VYS-020", "AGROVYSOČINA a.s.", "Mělkovice 2185", "Žďár nad Sázavou", "59101", "566 615 356"],
    ["GEN-VYS-021", "František Chroust - STK", "Jihlavská 759/4", "Žďár nad Sázavou", "59101", "566 629 708"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // JIHOMORAVSKÝ KRAJ (40 stations — 37.44, 37.67 under Zlínský)
  // ═══════════════════════════════════════════════════════════════════
  "Jihomoravský": [
    ["37.10", "AZ SERVIS STK s.r.o.", "Kulkova 30", "Brno", "61100", "541 213 822"],
    ["37.15", "STK Královo Pole s.r.o.", "Sladkovského 7", "Brno", "61300", "541 212 116"],
    ["37.16", "ČSAD Brno-Černovice a.s.", "Hájecká 14", "Brno", "61800", "548 122 402"],
    ["37.17", "STK-SME Hrušovany s.r.o.", "Nádražní ulice č. 389", "Hrušovany nad Jevišovkou", "67167", ""],
    ["37.20", "ESTEKO a.s.", "Měšťanská 4339/146a", "Hodonín", "69501", "518 351 102"],
    ["37.21", "INTERTEC s.r.o.", "Hybešova 62/14", "Hustopeče", "69301", "519 402 840"],
    ["37.22", "Česká pošta s.p. (DEKRA)", "Opavská 26/8", "Brno", "62500", "543 217 079"],
    ["37.23", "STK nákladních vozidel Olomouc", "Za Olomouckou 4230", "Prostějov", "79601", "582 365 959"],
    ["37.25", "STK Slavkov s.r.o. (DEKRA)", "Čs. Armády 217", "Slavkov u Brna", "68401", "544 227 620"],
    ["37.31", "KORAL s.r.o.", "Za Mlýnem 5", "Tišnov", "66601", "549 411 700"],
    ["37.37", "STK Kyjov s.r.o.", "Boršovská 2622/91", "Kyjov", "69701", "518 615 140"],
    ["37.40", "ESTEKO a.s.", "Masarykova 1663", "Veselí nad Moravou", "69826", "518 324 460"],
    ["37.51", "STK 4 you s.r.o.", "Dobšická 3697/6", "Znojmo", "66902", ""],
    ["37.54", "STK BRNO s.r.o.", "Vídeňská 267/106d", "Brno", "61900", "547 212 875"],
    ["37.56", "Copy Servis Dočkal a.s.", "Řípská 11e", "Brno", "62700", "533 440 180"],
    ["37.57", "Copy Servis Dočkal a.s. (traktory)", "Řípská 11e", "Brno", "62700", "606 424 960"],
    ["37.61", "STK Heršpice", "K terminálu 700/1", "Brno", "61900", "543 213 549"],
    ["37.62", "STK MODŘICE", "Brněnská 404", "Modřice", "66442", "547 212 847"],
    ["37.66", "STK Znojmo s.r.o.", "Družstevní 28", "Znojmo", "66902", ""],
    ["37.73", "STK-SME Břeclav s.r.o.", "Lidická 3", "Břeclav", "69002", ""],
    ["GEN-JHM-001", "Bělohradský s.r.o.", "Jihlavská 29", "Brno", "63900", "547 211 202"],
    ["GEN-JHM-002", "Ing. Miroslav Novotný", "Vídeňská 127", "Brno", "61900", "723 584 312"],
    ["GEN-JHM-003", "POWER CARS s.r.o.", "Rohlenka 250", "Jiříkovice", "66434", "544 212 101"],
    ["GEN-JHM-004", "STK OA s.r.o.", "Palackého 154", "Kunštát", "67976", "516 462 184"],
    ["GEN-JHM-005", "STK AUTO LEDNICE s.r.o.", "Nejdecká 608", "Lednice", "69144", "519 340 646"],
    ["GEN-JHM-006", "Janda Jaroslav", "Okružní 399", "Moravský Krumlov", "67201", "515 321 305"],
    ["GEN-JHM-007", "Ing. Pavel Kurimai", "Brněnská 1019", "Pohořelice", "69123", "519 424 710"],
    ["GEN-JHM-008", "STK Kontrol s.r.o.", "Brněnská 392", "Rosice", "66501", "546 410 260"],
    ["GEN-JHM-009", "AGROAKCIA s.r.o.", "AGROPODNIK a.s.", "Skalice nad Svitavou", "67901", "723 570 215"],
    ["GEN-JHM-010", "DAJAN s.r.o.", "Palackého 379", "Tetčice", "66417", "546 213 856"],
    ["GEN-JHM-011", "AGROGEN s.r.o.", "Zahradní 1a", "Troubsko", "66441", "547 242 487"],
    ["GEN-JHM-012", "Hájek a Peš s.r.o.", "Přímětice 604", "Znojmo", "66902", "603 879 847"],
    ["GEN-JHM-013", "STEINDORFER s.r.o.", "Hatě 188", "Znojmo", "66902", "515 208 236"],
    ["GEN-JHM-014", "T.C.A. v.o.s.", "Dobšická 2", "Znojmo", "66902", "515 224 244"],
    ["GEN-JHM-015", "SETRA STK s.r.o.", "hosp. stř. Luleč-Rostěnice", "Vyškov", "68301", "517 354 654"],
    ["GEN-JHM-016", "Stavební konstrukce Vyškov a.s.", "Průmyslová 591/1", "Vyškov", "68201", "517 341 956"],
    ["GEN-JHM-017", "TOP 1 s.r.o.", "Poříčí 17", "Blansko", "67801", "516 410 510"],
    ["GEN-JHM-018", "AUTO STK s.r.o.", "Dřevařská 2250", "Boskovice", "68001", "516 453 191"],
    ["GEN-JHM-019", "Stanislav Pelant", "Zbraslav 448", "Zbraslav", "66484", "546 213 323"],
    ["GEN-JHM-020", "TRAKTEC s.r.o.", "Areál ZD Žatčany 28", "Žatčany", "66453", "601 528 535"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // OLOMOUCKÝ KRAJ (25 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Olomoucký": [
    ["38.04", "STK-AUTOL Olomouc s.r.o.", "Lazecká 70a", "Olomouc", "77900", "585 222 484"],
    ["38.07", "TESTCAR s.r.o.", "Žerotínova 63", "Šumperk", "78701", "583 212 821"],
    ["38.12", "TESTCAR s.r.o.", "Lověšice 258", "Přerov", "75013", "581 209 536"],
    ["38.18", "STK nákladních vozidel Olomouc s.r.o.", "Hamerská 708/58", "Olomouc", "77900", "585 311 627"],
    ["38.36", "STK centrum Olomouc s.r.o.", "Smetanova 192", "Olomouc", "77200", "585 226 100"],
    ["GEN-OLK-001", "K-TRAKTOR s.r.o.", "Družstevní 5", "Dubicko", "78972", "583 449 011"],
    ["GEN-OLK-002", "ELEKTRO-LUMEN s.r.o.", "Hranická 505", "Hranice", "75301", "581 699 426"],
    ["GEN-OLK-003", "PEMI CAR TEST s.r.o.", "U Bělidla 3/926", "Jeseník", "79001", "584 411 104"],
    ["GEN-OLK-004", "SLUŽBY BPK s.r.o.", "Slunná 98", "Jeseník", "79001", "584 401 332"],
    ["GEN-OLK-005", "STATEKON s.r.o.", "Vrchlického 349", "Konice", "79852", "582 396 048"],
    ["GEN-OLK-006", "Kovet s.r.o.", "Na Zelince 1537", "Lipník nad Bečvou", "75131", "581 701 731"],
    ["GEN-OLK-007", "MOBIL expert s.r.o.", "Na Zelince 1293", "Lipník nad Bečvou", "75131", "602 735 415"],
    ["GEN-OLK-008", "Vladimír Jašek", "Příčná", "Litovel", "78401", "585 341 253"],
    ["GEN-OLK-009", "Piňosová Martina", "Slavonínská 5", "Olomouc", "78301", "585 414 608"],
    ["GEN-OLK-010", "STK PROSTĚJOV s.r.o.", "Letecká 2", "Prostějov", "79601", "582 343 614"],
    ["GEN-OLK-011", "ESTEKO PŘEROV v.o.s.", "9. května-areál STS", "Přerov", "75002", "581 204 898"],
    ["GEN-OLK-012", "KOVET s.r.o.", "Teličkova 35", "Přerov", "75002", "581 211 845"],
    ["GEN-OLK-013", "Staněk a syn s.r.o.", "Olšovec 59", "Olšovec", "75361", "581 625 426"],
    ["GEN-OLK-014", "ECCO-TRAC s.r.o.", "Horní 11", "Štěpánov", "78313", "585 386 558"],
    ["GEN-OLK-015", "ŠTERNBERSKÁ STK s.r.o.", "Masarykova 17", "Šternberk", "78501", "585 012 674"],
    ["GEN-OLK-016", "Expres Commercio s.r.o.", "Jesenická 3071", "Šumperk", "78701", "583 216 304"],
    ["GEN-OLK-017", "REFINAL s.r.o.", "Zábřežská 73", "Šumperk", "78701", "583 213 800"],
    ["GEN-OLK-018", "Autocentrum Zábřeh s.r.o.", "Lesnická 2179/2a", "Zábřeh", "78901", "583 499 499"],
    ["GEN-OLK-019", "František Nosálek - Franotrans", "Na Křtaltě 37", "Zábřeh", "78901", "583 411 238"],
    ["GEN-OLK-020", "STK nákladních vozidel Olomouc s.r.o.", "Pode Mlýnem 763/11", "Olomouc", "77900", "731 140 142"],
    ["GEN-OLK-021", "STK Olomouc (Týnecká)", "Týnecká 833/39", "Olomouc", "78301", "585 155 472"],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ZLÍNSKÝ KRAJ (21 stations — includes 37.44, 37.67 geographically)
  // ═══════════════════════════════════════════════════════════════════
  "Zlínský": [
    ["37.03", "AUTOTEST-TOUR s.r.o. (DEKRA)", "Březolupy 475", "Březolupy", "68713", "572 580 118"],
    ["37.13", "DEKRA CZ a.s.", "tř. 3. května 1147", "Zlín", "76302", "577 105 353"],
    ["37.19", "HESPO s.r.o. (DEKRA)", "Luční čtvrť 1824", "Staré Město", "68603", "572 541 573"],
    ["37.44", "DEKRA CZ a.s.", "Nám. Svobody 578", "Kunovice", "68604", ""],
    ["37.67", "DEKRA CZ a.s.", "Letiště 1894", "Otrokovice", "76502", ""],
    ["38.17", "TESTCAR s.r.o.", "Palackého 220", "Valašské Meziříčí", "75701", "571 621 251"],
    ["38.45", "AMG CENTRUM s.r.o.", "Poličná 508", "Poličná", "75701", "571 611 122"],
    ["GEN-ZLK-001", "TEST-CAR Holešov s.r.o.", "Palackého 464", "Holešov", "76901", "573 394 642"],
    ["GEN-ZLK-002", "CSAO s.r.o.", "Bílanská 2595", "Kroměříž", "76701", "573 340 824"],
    ["GEN-ZLK-003", "Dapas a.s.", "Hulínská 3221", "Kroměříž", "76701", "573 345 055"],
    ["GEN-ZLK-004", "KM AUTEXIM s.r.o.", "Hulínská 2383", "Kroměříž", "76701", "573 326 280"],
    ["GEN-ZLK-005", "STK PRO G&K s.r.o.", "Lidická 578", "Kunovice", "68604", "572 548 548"],
    ["GEN-ZLK-006", "PODHORAN STK s.r.o.", "Pod Kaštany 499", "Lukov", "76311", "577 116 130"],
    ["GEN-ZLK-007", "STK Rožnov s.r.o.", "Tvarůžkova 2994", "Rožnov pod Radhoštěm", "75661", "775 613 421"],
    ["GEN-ZLK-008", "ATOS - TK s.r.o.", "Brumovská 279", "Valašské Klobouky", "76601", "577 320 330"],
    ["GEN-ZLK-009", "SOÚ Valašské Klobouky", "Brumovská 456", "Valašské Klobouky", "76601", "577 320 186"],
    ["GEN-ZLK-010", "STK Vlčnov s.r.o.", "Jana Plesla 556", "Vlčnov", "68761", "572 675 180"],
    ["GEN-ZLK-011", "CAR OK STK s.r.o.", "Bobrky 495", "Vsetín", "75501", "571 411 024"],
    ["GEN-ZLK-012", "STK CENTRUM VIZOVICE", "Zlínská ulice 1160", "Vizovice", "76312", "577 018 639"],
    ["GEN-ZLK-013", "STK Uherské Hradiště s.r.o.", "Sokolovská 1792", "Uherské Hradiště", "68601", ""],
    ["GEN-ZLK-014", "STK Uherský Brod", "U Korečnice 2834", "Uherský Brod", "68801", ""],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // MORAVSKOSLEZSKÝ KRAJ (31 stations)
  // ═══════════════════════════════════════════════════════════════════
  "Moravskoslezský": [
    // Existing seed unmatched
    ["GEN-MSK-001", "DEKRA STK Ostrava", "Slovenská 1085/1a", "Ostrava", "70030", "596 612 020"],
    // New from research
    ["38.05", "Autodružstvo STK F-M", "Beskydská 2299", "Frýdek-Místek", "73802", "558 439 355"],
    ["38.10", "DM BETA s.r.o.", "Slavkovská 39", "Opava", "74707", "553 625 056"],
    ["38.14", "STK-Tajga s.r.o.", "U řeky 660", "Ostrava", "72000", "596 734 052"],
    ["38.16", "TESTCAR s.r.o.", "Dělnická 821", "Kopřivnice", "74221", "556 802 608"],
    ["38.21", "TEAM-MAAT s.r.o.", "Bohumínská ul. 1806", "Rychvald", "73532", "596 572 214"],
    ["38.22", "TESTCAR s.r.o.", "Ostravská 264", "Sviadnov", "73925", "558 436 315"],
    ["38.23", "TESTCAR s.r.o.", "Vítkovická 9", "Ostrava", "70200", "596 635 264"],
    ["38.25", "STK-Ostrava s.r.o.", "Markvartovická 7", "Hlučín", "74801", "595 042 786"],
    ["38.27", "OP KONTROL s.r.o.", "Těšínská 2868/37A", "Opava", "74600", "553 609 254"],
    ["38.28", "STK FREN s.r.o.", "Martinská čtvrť 1705", "Frenštát pod Radhoštěm", "74401", "556 836 941"],
    ["38.29", "STK-Ostrava s.r.o.", "Servisní 1", "Ostrava", "72200", "596 966 300"],
    ["38.34", "STK-Ostrava s.r.o.", "Krmelínská 827/13", "Ostrava", "72000", "596 728 500"],
    ["38.42", "TEAM-MAAT s.r.o.", "Oběžná 2086/13", "Ostrava", "70300", "596 118 487"],
    ["38.48", "STK KOPR s.r.o.", "Nádražní 1599/4", "Kopřivnice", "74221", "556 821 690"],
    ["38.49", "MPS KONTROL s.r.o.", "17. listopadu 2269", "Frýdek-Místek", "73801", "558 874 909"],
    ["GEN-MSK-002", "ELEMENT STK s.r.o.", "Krnovská 16", "Bruntál", "79201", "554 717 100"],
    ["GEN-MSK-003", "JV FOODS s.r.o.", "Zahradní 44", "Bruntál", "79201", "554 713 008"],
    ["GEN-MSK-004", "AUTO KLUB STONAVA v AČR", "ul. 9. května 66", "Horní Suchá", "73535", "596 422 561"],
    ["GEN-MSK-005", "TKLAS Karviná s.r.o.", "Bohumínská 1876", "Karviná", "73506", "596 382 202"],
    ["GEN-MSK-006", "TKLAS Karviná s.r.o.", "Za Splavem 884", "Karviná", "73506", "596 318 844"],
    ["GEN-MSK-007", "VESTAP s.r.o.", "Ve Vrbině 4", "Krnov", "79401", "554 611 413"],
    ["GEN-MSK-008", "S.B.J. Motocentrum s.r.o.", "Návsí 976", "Návsí", "73992", "558 340 985"],
    ["GEN-MSK-009", "STK SAGITA s.r.o.", "Špálova 11", "Ostrava", "70200", "596 136 727"],
    ["GEN-MSK-010", "Jaroslav Janči", "Ostravská 1833", "Petřvald", "73541", "596 530 300"],
    ["GEN-MSK-011", "Radomír Skopek", "Těšínská 1618", "Šenov", "73934", "596 891 192"],
    ["GEN-MSK-012", "STK RITZ s.r.o.", "Malostranská 579", "Šenov u Nového Jičína", "74242", "556 701 228"],
    ["GEN-MSK-013", "HARASIM s.r.o.", "Slezská 643/3", "Štěpánkovice", "74728", "553 675 228"],
    ["GEN-MSK-014", "STK Třinec s.r.o.", "Frýdecká 272", "Třinec", "73961", "558 330 999"],
    ["GEN-MSK-015", "STK Bílovec", "Ostravská 309", "Velké Albrechtice", "74291", "556 403 408"],
    ["GEN-MSK-016", "STK Linkova", "Linkova 1407/12", "Ostrava", "70200", "777 337 444"],
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Main seed function ───────────────────────────────────────────────

async function main() {
  // Build flat station list
  const allStations = Object.entries(DATA).flatMap(([region, rows]) =>
    rows.map(([id, name, address, city, zip, phone]) => ({
      officialStationId: id,
      name,
      address,
      city,
      region,
      zip,
      phone: phone
        ? phone.startsWith("+")
          ? phone
          : `+420 ${phone}`
        : null,
    })),
  );

  console.log(`Seeding ${allStations.length} STK stations...`);

  // Clean up old stations with legacy STK-* IDs (replaced by official codes)
  const deleted = await prisma.autoServis.deleteMany({
    where: { officialStationId: { startsWith: "STK-" }, source: "MDCR" },
  });
  if (deleted.count > 0) {
    console.log(`Cleaned up ${deleted.count} old stations with STK-* IDs`);
  }

  let created = 0;
  let updated = 0;
  let errors = 0;
  let geocoded = 0;

  for (const station of allStations) {
    // Geocode address
    const { lat, lng } = await geocode(station.address, station.city);
    geocoded++;

    if (geocoded % 25 === 0) {
      console.log(
        `Geocoded ${geocoded}/${allStations.length} (${Math.round((geocoded / allStations.length) * 100)}%)`,
      );
    }

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
          phone: station.phone,
          latitude: lat,
          longitude: lng,
          stkEmissions: true,
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
          phone: station.phone,
          latitude: lat,
          longitude: lng,
          categories: ["stk-emise"],
          source: "MDCR",
          tier: "NEOFICIALNI",
          isVerified: true,
          isPublished: true,
          stkEmissions: true,
          stkMotorcycles: false,
          stkTrailers: false,
          stkHeavy: false,
          stkOnlineBooking: false,
          lastVerifiedAt: new Date(),
        },
      });
      created++;
    } catch {
      // Slug collision — retry with officialStationId suffix
      try {
        await prisma.autoServis.upsert({
          where: { officialStationId: station.officialStationId },
          update: {
            name: station.name,
            latitude: lat,
            longitude: lng,
            lastVerifiedAt: new Date(),
          },
          create: {
            slug: `${slug}-${station.officialStationId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            officialStationId: station.officialStationId,
            name: station.name,
            address: station.address,
            city: station.city,
            region: station.region,
            zip: station.zip,
            phone: station.phone,
            latitude: lat,
            longitude: lng,
            categories: ["stk-emise"],
            source: "MDCR",
            tier: "NEOFICIALNI",
            isVerified: true,
            isPublished: true,
            stkEmissions: true,
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

  console.log(
    `\nDone! Created/updated: ${created + updated}, Errors: ${errors}`,
  );
  console.log(`Total stations in database: ${created + updated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
