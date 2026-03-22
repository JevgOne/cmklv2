#!/usr/bin/env node
/**
 * Skript pro obohacení partners-seed.json
 *
 * 1. GPS souřadnice — Mapy.cz Geocoding API (zdarma, bez klíče)
 * 2. IČO ověření/doplnění — ARES API (zdarma, veřejné)
 * 3. Google hodnocení — Google Places API (vyžaduje API klíč)
 *
 * Použití:
 *   node enrich-partners.mjs                          # vše najednou
 *   node enrich-partners.mjs --geocode                # jen GPS
 *   node enrich-partners.mjs --ares                   # jen ARES
 *   node enrich-partners.mjs --google                 # jen Google Places
 *   node enrich-partners.mjs --google --api-key=XXX   # Google s klíčem
 *
 * Env proměnné:
 *   GOOGLE_PLACES_API_KEY — klíč pro Google Places API
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = join(__dirname, "partners-seed.json");
const OUTPUT = join(__dirname, "partners-seed.json");
const BACKUP = join(__dirname, "partners-seed.backup.json");

// --- Config ---
const DELAY_MS = 350; // pauza mezi requesty (respektuje rate limity)
const args = process.argv.slice(2);
const doAll = args.length === 0;
const doGeocode = doAll || args.includes("--geocode");
const doAres = doAll || args.includes("--ares");
const doGoogle = doAll || args.includes("--google");
const apiKeyArg = args.find((a) => a.startsWith("--api-key="));
const GOOGLE_API_KEY =
  apiKeyArg?.split("=")[1] || process.env.GOOGLE_PLACES_API_KEY || "";

// --- Helpers ---
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Carmakler-Enricher/1.0", ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function progress(current, total, label) {
  const pct = Math.round((current / total) * 100);
  process.stdout.write(`\r  [${pct}%] ${current}/${total} — ${label}`);
  if (current === total) process.stdout.write("\n");
}

// ============================================
// 1. GEOCODING — Mapy.cz Suggest API
// ============================================
async function geocodeAddress(address, city) {
  const query = `${address}, ${city}, Česká republika`;
  const url = `https://api.mapy.cz/v1/suggest?lang=cs&limit=1&type=regional.address&query=${encodeURIComponent(query)}`;

  try {
    const data = await fetchJSON(url, {
      headers: {
        "User-Agent": "Carmakler-Enricher/1.0",
        Accept: "application/json",
      },
    });

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      if (item.position) {
        return { lat: item.position.lat, lng: item.position.lon };
      }
    }
  } catch (e) {
    // Fallback: zkusíme Nominatim (OpenStreetMap)
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cz&q=${encodeURIComponent(query)}`;
      const nomData = await fetchJSON(nomUrl);
      if (nomData.length > 0) {
        return {
          lat: parseFloat(nomData[0].lat),
          lng: parseFloat(nomData[0].lon),
        };
      }
    } catch {
      // oba failnuly
    }
  }
  return null;
}

async function enrichGeocode(partners) {
  const needsGeo = partners.filter((p) => !p.lat || !p.lng);
  console.log(
    `\n📍 Geocoding: ${needsGeo.length} záznamů bez GPS (z ${partners.length} celkem)`
  );

  let success = 0;
  let failed = 0;

  for (let i = 0; i < needsGeo.length; i++) {
    const p = needsGeo[i];
    progress(i + 1, needsGeo.length, p.name.substring(0, 40));

    const result = await geocodeAddress(p.address || "", p.city || "");
    if (result) {
      p.lat = result.lat;
      p.lng = result.lng;
      success++;
    } else {
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`  ✅ Geokódováno: ${success}, ❌ Nenalezeno: ${failed}`);
  return partners;
}

// ============================================
// 2. ARES — ověření a doplnění IČO
// ============================================
async function lookupARES(ico) {
  const url = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;
  try {
    const data = await fetchJSON(url);
    return {
      valid: true,
      name: data.obchodniJmeno || null,
      address:
        data.sidlo
          ? `${data.sidlo.nazevUlice || ""} ${data.sidlo.cisloDomovni || ""}${data.sidlo.cisloOrientacni ? "/" + data.sidlo.cisloOrientacni : ""}, ${data.sidlo.psc || ""} ${data.sidlo.nazevObce || ""}`.trim()
          : null,
      status: data.datumZaniku ? "ZANIKLÝ" : "AKTIVNÍ",
    };
  } catch {
    return { valid: false, name: null, address: null, status: null };
  }
}

async function searchARES(companyName, city) {
  const url = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat`;
  try {
    const data = await fetchJSON(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        obchodniJmeno: companyName,
        sidlo: { nazevObce: city },
        start: 0,
        pocet: 3,
      }),
    });

    if (
      data.pocetCelkem > 0 &&
      data.ekonomickeSubjekty &&
      data.ekonomickeSubjekty.length > 0
    ) {
      const match = data.ekonomickeSubjekty[0];
      return match.ico || null;
    }
  } catch {
    // search failed
  }
  return null;
}

async function enrichARES(partners) {
  // Krok 1: Ověření existujících IČO
  const withIco = partners.filter((p) => p.ico);
  const withoutIco = partners.filter((p) => !p.ico);

  console.log(
    `\n🏢 ARES: Ověření ${withIco.length} IČO + hledání ${withoutIco.length} chybějících`
  );

  // Ověření
  let verified = 0;
  let invalid = 0;
  let defunct = 0;

  for (let i = 0; i < withIco.length; i++) {
    const p = withIco[i];
    progress(i + 1, withIco.length, `Ověřuji IČO ${p.ico}`);

    const result = await lookupARES(p.ico);
    if (result.valid) {
      verified++;
      if (result.status === "ZANIKLÝ") {
        defunct++;
        p._aresStatus = "ZANIKLÝ";
        console.log(`\n  ⚠️  ZANIKLÝ: ${p.name} (IČO: ${p.ico})`);
      } else {
        p._aresStatus = "AKTIVNÍ";
      }
    } else {
      invalid++;
      p._aresStatus = "NENALEZENO";
      console.log(`\n  ❌ IČO nenalezeno v ARES: ${p.name} (IČO: ${p.ico})`);
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `  Ověřeno: ${verified}, Neplatné: ${invalid}, Zaniklé: ${defunct}`
  );

  // Doplnění chybějících
  let found = 0;
  for (let i = 0; i < withoutIco.length; i++) {
    const p = withoutIco[i];
    progress(i + 1, withoutIco.length, `Hledám IČO pro ${p.name.substring(0, 30)}`);

    // Extrahuj čistý název firmy (bez "pobočka X" apod.)
    const cleanName = p.name
      .replace(/\s*-\s*pobočka.*$/i, "")
      .replace(/\s*-\s*(autovrakoviště|lepší autobazar)$/i, "")
      .trim();

    const ico = await searchARES(cleanName, p.city);
    if (ico) {
      p.ico = ico;
      found++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`  Doplněno IČO: ${found} z ${withoutIco.length} chybějících`);
  return partners;
}

// ============================================
// 3. GOOGLE PLACES — hodnocení a recenze
// ============================================
async function searchGooglePlace(name, address, city) {
  if (!GOOGLE_API_KEY) return null;

  const query = `${name}, ${city}, Czech Republic`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,rating,user_ratings_total,geometry&key=${GOOGLE_API_KEY}`;

  try {
    const data = await fetchJSON(url);
    if (data.candidates && data.candidates.length > 0) {
      const place = data.candidates[0];
      return {
        rating: place.rating || null,
        reviewCount: place.user_ratings_total || null,
        lat: place.geometry?.location?.lat || null,
        lng: place.geometry?.location?.lng || null,
      };
    }
  } catch {
    // failed
  }
  return null;
}

async function enrichGoogle(partners) {
  if (!GOOGLE_API_KEY) {
    console.log(
      "\n⭐ Google Places: PŘESKOČENO — chybí API klíč"
    );
    console.log(
      "  Nastav GOOGLE_PLACES_API_KEY env proměnnou nebo použij --api-key=XXX"
    );
    return partners;
  }

  console.log(`\n⭐ Google Places: Doplňuji hodnocení pro ${partners.length} záznamů`);

  let success = 0;
  for (let i = 0; i < partners.length; i++) {
    const p = partners[i];
    progress(i + 1, partners.length, p.name.substring(0, 40));

    const result = await searchGooglePlace(p.name, p.address, p.city);
    if (result) {
      p.googleRating = result.rating;
      p.googleReviewCount = result.reviewCount;
      // Doplnit GPS z Google pokud chybí
      if ((!p.lat || !p.lng) && result.lat && result.lng) {
        p.lat = result.lat;
        p.lng = result.lng;
      }
      success++;
    }

    await sleep(200); // Google Places má jiný rate limit
  }

  console.log(`  Doplněno hodnocení: ${success} z ${partners.length}`);
  return partners;
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Carmakler — Obohacení partners-seed.json");
  console.log("═══════════════════════════════════════════════");

  // Načtení
  let partners = JSON.parse(readFileSync(INPUT, "utf8"));
  console.log(`\nNačteno ${partners.length} záznamů z ${INPUT}`);

  // Záloha
  writeFileSync(BACKUP, JSON.stringify(partners, null, 2), "utf8");
  console.log(`Záloha uložena: ${BACKUP}`);

  // Enrichment
  if (doGeocode) partners = await enrichGeocode(partners);
  if (doAres) partners = await enrichARES(partners);
  if (doGoogle) partners = await enrichGoogle(partners);

  // Vyčistit interní pole
  for (const p of partners) {
    delete p._aresStatus;
  }

  // Uložení
  writeFileSync(OUTPUT, JSON.stringify(partners, null, 2), "utf8");

  // Statistiky
  const withGps = partners.filter((p) => p.lat && p.lng).length;
  const withIco = partners.filter((p) => p.ico).length;
  const withRating = partners.filter((p) => p.googleRating).length;

  console.log("\n═══════════════════════════════════════════════");
  console.log("  VÝSLEDEK");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Celkem záznamů:     ${partners.length}`);
  console.log(`  S GPS souřadnicemi: ${withGps} (${Math.round((withGps / partners.length) * 100)}%)`);
  console.log(`  S IČO:              ${withIco} (${Math.round((withIco / partners.length) * 100)}%)`);
  console.log(`  S Google hodnocením: ${withRating} (${Math.round((withRating / partners.length) * 100)}%)`);
  console.log(`\n  Uloženo: ${OUTPUT}`);
  console.log("═══════════════════════════════════════════════\n");
}

main().catch((e) => {
  console.error("\n❌ Chyba:", e.message);
  process.exit(1);
});
