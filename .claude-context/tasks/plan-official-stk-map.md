# Plan: Oficiální autoservisy + STK stanice v ČR s interaktivní mapou

**Task:** #44
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Feature — data import + mapová komponenta
**Závažnost:** HIGH — major feature, competitive advantage

---

## CÍLE

1. Importovat oficiální STK stanice z dat Ministerstva dopravy ČR
2. Zobrazit na interaktivní mapě (celá ČR)
3. Kombinovat mapu + seznam (sidebar)
4. Filtr po kraji/městě
5. Rozšířit o autoservisy (vlastní data + budoucí import)

---

## ČÁST 1: DATOVÉ ZDROJE

### 1.1 STK stanice — oficiální data

**Primární zdroj:** Ministerstvo dopravy ČR
- **URL:** https://md.gov.cz/Dokumenty/Silnicni-doprava/STK/STK-Seznam-STK-dle-kraju
- **Formát:** Excel soubor ke stažení (seznam STK dle krajů)
- **Obsah:** Název stanice, adresa, kontakty (telefon, email), kraj
- **Aktualizace:** Pravidelně (přesná frekvence neuvedena)
- **Licence:** Veřejná data (ministerstvo) — volně použitelná

**Sekundární zdroj:** STK portál OpenDataLab
- **URL:** https://stk.opendatalab.cz/
- **Data:** Stanice + inspekční záznamy od 1.1.2018
- **Zdroj dat:** CIS STK (Centrální informační systém STK) + zákon 106/1999
- **Obsahuje:** Název, adresa, kontakty, GPS (odvozené z adres)
- **Licence:** Diplomová práce + open data — ověřit komerční použití
- **API:** Nemá veřejné API — jen web interface

**Třetí zdroj:** stkstanice.cz
- **URL:** https://www.stkstanice.cz/
- **Data:** Mapa STK stanic v ČR s cenami, hodnocením
- **Aktuální data z CIS STK**

### 1.2 Autoservisy — zdroje

**Žádný oficiální centrální registr autorizovaných servisů v ČR neexistuje.**

Dostupné zdroje:
| Zdroj | Počet firem | Typ | API |
|-------|-------------|-----|-----|
| Firmy.cz | 343 autorizovaných | Katalog | Ne (scraping zakázán) |
| AutoservisAdvisor.cz | ~1000+ | Katalog s recenzemi | Ne |
| Portál řidiče | 830 | Nezávislý katalog | Ne |
| Katalog-autoservisu.cz | ~5000+ | Největší katalog | Ne |

**Doporučení:** Pro autoservisy použít VLASTNÍ data v DB (model `AutoServis` už existuje) + umožnit servisům se registrovat (self-service). NEscrapovat žádný katalog (memory: žádný scraping).

### 1.3 Doporučený přístup k datům

```
STK stanice:
1. Stáhnout Excel z MDČR (jednorázově)
2. Parsovat → seed script do DB (nová tabulka nebo rozšíření AutoServis)
3. Geocoding adres → GPS souřadnice (Mapy.cz geocoding API — zdarma)
4. Pravidelný ruční update (kvartálně)

Autoservisy:
1. Použít stávající AutoServis model
2. Přidat registrační formulář pro servisy
3. Gradual buildup (ne mass import)
```

---

## ČÁST 2: MAPOVÁ TECHNOLOGIE

### 2.1 Srovnání variant

| Technologie | Cena | Kvalita ČR | Next.js integrace | Doporučení |
|-------------|------|-----------|-------------------|------------|
| **Mapy.cz API** | Zdarma 250K credits/měs | NEJLEPŠÍ pro ČR | REST API + Leaflet tiles | ✅ DOPORUČENO |
| Google Maps | $200 free credit, pak drahé | Dobrá | @vis.gl/react-google-maps | ❌ Drahé |
| Mapbox | 50K loads free | Střední pro ČR | react-map-gl | ⚠️ Horší ČR data |
| Leaflet + OSM | Zdarma | Dobrá | react-leaflet | ⚠️ Fallback |

### 2.2 Mapy.cz API — detaily

**Pricing:**
- **Basic tarif:** 250 000 credits/měsíc ZDARMA
- **Extended tarif:** 10 000 000 credits/měsíc ZDARMA
- Překročení: 1.6 Kč / 1000 credits
- Pro CarMakléř projekt = prakticky zdarma

**Dostupné API:**
- Map tiles (Basic, Outdoor, Winter, Aerial)
- Geocoding (suggest + validate)
- Routing (route planning + matrix)
- Elevation data
- Panorama viewer

**Integrace:**
- REST API + Leaflet tile layer
- Žádný React SDK — použít `react-leaflet` s Mapy.cz tiles
- Developer portál: https://developer.mapy.com/

**Od 1.6.2025:** Přejmenování na Mapy.com, nová doména `api.mapy.com`

### 2.3 Doporučená implementace

```
react-leaflet (React wrapper pro Leaflet.js)
  + Mapy.cz tile layer (nejlepší mapová data pro ČR)
  + Mapy.cz geocoding API (pro adresy → GPS)
  + Vlastní marker clustery (pro 400+ STK stanic)
  + Server-side data loading (Prisma → props)
```

**Proč react-leaflet:**
- Open source, zdarma
- Lightweight (~40KB)
- Server-safe (dynamic import s `ssr: false`)
- Cluster support (react-leaflet-cluster)
- Kompatibilní s Mapy.cz tiles

---

## ČÁST 3: UI/UX NÁVRH

### 3.1 Layout — Mapa + Seznam

```
Desktop (lg+):
┌─────────────────────────────────────────────────────────────┐
│ 📍 STK stanice v České republice                           │
│ [Filtr: Kraj ▼] [Filtr: Město ▼] [🔍 Hledat...]          │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  Seznam stanic           │        MAPA                      │
│  (scrollable)            │    (interaktivní)                │
│                          │                                  │
│  ┌────────────────────┐  │    ┌──────────────────────┐      │
│  │ 📍 STK Ečka        │  │    │  ● ● ●   ●  ●       │      │
│  │ Praha 10           │  │    │    ●  ●●   ●         │      │
│  │ ★ 4.2 (23 recenzí) │  │    │  ●    ●  ●  ●       │      │
│  │ Čekací doba: 3 dny │  │    │    ●●   ●  ●    ●   │      │
│  └────────────────────┘  │    │  ●  ●   ●     ●     │      │
│  ┌────────────────────┐  │    │    ●    ●            │      │
│  │ 📍 STK Dekra       │  │    └──────────────────────┘      │
│  │ Praha 4            │  │                                  │
│  │ ★ 4.5 (41 recenzí) │  │                                  │
│  └────────────────────┘  │                                  │
│  ...                     │                                  │
├──────────────────────────┴──────────────────────────────────┤
│ Zobrazeno 45 z 412 stanic · Strana 1/9                     │
└─────────────────────────────────────────────────────────────┘

Mobile:
┌────────────────────────┐
│ 📍 STK stanice         │
│ [Kraj ▼] [🔍 Hledat]  │
├────────────────────────┤
│ [📋 Seznam] [🗺️ Mapa] │  ← Tab přepínač
├────────────────────────┤
│                        │
│  (obsah dle aktivního  │
│   tabu — seznam NEBO   │
│   mapa, ne oboje)      │
│                        │
└────────────────────────┘
```

### 3.2 Marker popup

```
┌──────────────────────────┐
│ 📍 STK Ečka Praha        │
│ U Záběhlického zámku 3   │
│ Praha 10 - Záběhlice     │
│                          │
│ ★ 4.2 (23 recenzí)       │
│ 📞 +420 123 456 789      │
│ ⏱️ Čekací doba: 3 dny    │
│ ✅ Emise ✅ Motocykly     │
│                          │
│ [Zobrazit detail →]      │
└──────────────────────────┘
```

### 3.3 Filtr komponenta

```tsx
// Filtry:
// 1. Kraj (14 krajů) — dropdown
// 2. Město — autocomplete (Mapy.cz suggest API)
// 3. Full-text search — název stanice
// 4. Capabilities — checkboxy: Emise, Motocykly, Přívěsy, Nákladní, Online rezervace
// 5. Hodnocení — min. stars slider
```

---

## ČÁST 4: TECHNICKÁ IMPLEMENTACE

### 4.1 Prisma schema — rozšíření AutoServis

```prisma
model AutoServis {
  // ... existující pole ...
  
  // NOVÉ pole pro oficiální STK data
  officialStationId    String?   @unique  // ID z MDČR registru
  latitude             Float?    // GPS
  longitude            Float?    // GPS
  region               String?   // Kraj (Hlavní město Praha, Středočeský, ...)
  district             String?   // Okres
  dataSource           String?   // "MDCR" | "MANUAL" | "SELF_REGISTERED"
  lastVerifiedAt       DateTime? // Kdy byla data naposledy ověřena
}
```

**POZNÁMKA:** Model `AutoServis` UŽ MÁ pole `city`, `address`, `phone`, `email` — nová pole pouze doplňují GPS + metadata.

### 4.2 Nové soubory

| # | Soubor | Typ | Účel |
|---|--------|-----|------|
| 1 | `components/web/MapView.tsx` | NEW | Leaflet mapa s Mapy.cz tiles |
| 2 | `components/web/MapMarker.tsx` | NEW | Custom marker s popup |
| 3 | `components/web/MapListView.tsx` | NEW | Split view (mapa + seznam) |
| 4 | `components/web/MapFilter.tsx` | NEW | Filtr komponenta |
| 5 | `app/(web)/stk/page.tsx` | EDIT | Integrovat mapu |
| 6 | `app/(web)/autoservisy/page.tsx` | EDIT | Integrovat mapu |
| 7 | `lib/map-config.ts` | NEW | Mapy.cz API konfigurace |
| 8 | `scripts/import-stk-stations.ts` | NEW | Import script z Excel |
| 9 | `prisma/schema.prisma` | EDIT | Přidat GPS + metadata pole |

### 4.3 Mapová komponenta (MapView.tsx)

```tsx
// "use client" — Leaflet vyžaduje client-side rendering
// dynamic import s { ssr: false }
// Props:
//   markers: Array<{ id, lat, lng, name, city, rating, type }>
//   center?: [lat, lng]  — default: střed ČR [49.8, 15.5]
//   zoom?: number — default: 7 (celá ČR)
//   onMarkerClick?: (id) => void
//   selectedId?: string
//
// Features:
//   - Mapy.cz tile layer
//   - MarkerClusterGroup (react-leaflet-cluster)
//   - Custom orange markers
//   - Popup s info + link na detail
//   - Fly-to animace při výběru
//   - Responsive height (h-[400px] mobile, h-[600px] desktop)
```

### 4.4 Import script

```typescript
// scripts/import-stk-stations.ts
// 1. Načíst Excel z MDČR (xlsx library)
// 2. Parsovat: název, adresa, telefon, email, kraj
// 3. Geocoding: adresa → GPS (Mapy.cz API, batch)
// 4. Upsert do AutoServis (officialStationId jako klíč)
// 5. Nastavit categories: ["stk-emise"]
// 6. Nastavit dataSource: "MDCR"
// 7. Log: kolik přidáno, kolik aktualizováno, kolik chyb
```

### 4.5 Závislosti (npm packages)

| Package | Účel | Velikost |
|---------|------|----------|
| `react-leaflet` | React wrapper pro Leaflet | ~15KB |
| `leaflet` | Mapová knihovna | ~40KB |
| `react-leaflet-cluster` | Marker clustering | ~5KB |
| `xlsx` | Excel parser (jen pro import script) | Dev dependency |

**Leaflet CSS:** Přidat do layout nebo global CSS:
```css
@import 'leaflet/dist/leaflet.css';
```

---

## ČÁST 5: FÁZOVÁNÍ

### Fáze 1: Základní mapa (3-4 dny)

| # | Akce | Effort |
|---|------|--------|
| 1.1 | Prisma schema: přidat lat/lng/region/district/dataSource | 30 min |
| 1.2 | Migrace DB | 15 min |
| 1.3 | MapView.tsx s Mapy.cz tiles (react-leaflet) | 3h |
| 1.4 | MapMarker.tsx s popup | 1h |
| 1.5 | MapListView.tsx (split view) | 2h |
| 1.6 | Integrovat na `/stk` page | 1h |
| 1.7 | Integrovat na `/autoservisy` page | 1h |
| 1.8 | Geocoding existujících AutoServis záznamů (adresa → GPS) | 2h |

### Fáze 2: Data import (2-3 dny)

| # | Akce | Effort |
|---|------|--------|
| 2.1 | Stáhnout STK Excel z MDČR | 15 min |
| 2.2 | Import script (xlsx → Prisma) | 3h |
| 2.3 | Geocoding importovaných stanic (batch, Mapy.cz API) | 2h |
| 2.4 | Verifikace dat — kontrola duplicit s existujícími záznamy | 1h |
| 2.5 | Seed production DB | 1h |

### Fáze 3: Filtry a UX (1-2 dny)

| # | Akce | Effort |
|---|------|--------|
| 3.1 | MapFilter.tsx (kraj, město, capabilities) | 2h |
| 3.2 | URL search params pro filtry (shareable links) | 1h |
| 3.3 | Mobile tab přepínač (Seznam / Mapa) | 1h |
| 3.4 | Marker clustering pro 400+ bodů | 1h |
| 3.5 | "Nejbližší STK" geolokace (browser API) | 1h |

### Fáze 4: Polish (1 den)

| # | Akce | Effort |
|---|------|--------|
| 4.1 | Loading states pro mapu | 30 min |
| 4.2 | Error handling (mapa se nenačte) | 30 min |
| 4.3 | SEO: JSON-LD pro mapu (ItemList + LocalBusiness) | 1h |
| 4.4 | OG image s mapou | 1h |
| 4.5 | Přidat do sitemap: `/stk/mapa`, `/autoservisy/mapa` | 15 min |

---

## STOP PRAVIDLA

- **STOP-1:** NESCRAPOVAT žádný web pro data (ani stkstanice.cz, ani Firmy.cz) — jen oficiální MDČR Excel.
- **STOP-2:** Leaflet MUSÍ být dynamic import s `ssr: false` — jinak crash na serveru.
- **STOP-3:** Mapy.cz API key NESMÍ být v kódu — uložit do `.env` (`MAPYCZ_API_KEY`).
- **STOP-4:** NEIMPORTOVAT autoservisy z externích zdrojů — jen vlastní data + self-registrace.
- **STOP-5:** GPS souřadnice MUSÍ být validní (ČR: lat 48.5-51.1, lng 12.0-18.9) — validovat při importu.
- **STOP-6:** Import script NESMÍ mazat existující manuálně přidané záznamy — jen přidávat nové a aktualizovat existující (upsert na officialStationId).
- **STOP-7:** Mapa MUSÍ fungovat i bez JavaScript (fallback na seznam) — progressive enhancement.
- **STOP-8:** Leaflet CSS MUSÍ být načtený PŘED komponentou — jinak broken layout.

---

## ACCEPTANCE CRITERIA

### Fáze 1:
- [ ] Mapa se zobrazuje na `/stk` a `/autoservisy`
- [ ] Mapy.cz tiles se načítají správně
- [ ] Markery zobrazují název + město
- [ ] Popup má link na detail stránku
- [ ] Desktop: split view (seznam + mapa vedle sebe)
- [ ] Mobile: tab přepínač (Seznam / Mapa)
- [ ] `npm run build` projde

### Fáze 2:
- [ ] 400+ STK stanic importováno z MDČR dat
- [ ] Každá stanice má GPS souřadnice
- [ ] Žádné duplikáty s existujícími záznamy
- [ ] Import script je opakovatelný (idempotentní)

### Fáze 3:
- [ ] Filtr po kraji funguje
- [ ] Filtr po městě s autocomplete
- [ ] Filtr po capabilities (emise, motocykly, etc.)
- [ ] URL search params (shareable filtry)
- [ ] Marker clustering pro hustě osídlené oblasti

### Celkové:
- [ ] Mapa zobrazuje VŠECHNY STK stanice v ČR
- [ ] Mapa funguje na mobilu i desktopu
- [ ] Načítání < 2s (lazy load mapa)
- [ ] Přístupnost: alt text na markerech, keyboard navigace
