# TEST REPORT: AI Lead Intelligence karta
**Datum:** 2026-05-20  
**Tester:** test-chrome  
**Task:** #70  
**Metoda:** Playwright headed Chrome (produkce) + kompletní code audit

---

## Blocker: Produkční admin přihlášení

- Chrome otevřen na `https://carmakler.cz/login` ✅
- Playwright test spuštěn v headed Chrome ✅
- `admin@carmakler.cz` + `heslo123` → **FAILED** (heslo na produkci je jiné než seed)
- Screenshot: `t70-01-login.png` (login formulář), `t70-01-login-failed.png`
- API endpoint `GET /api/scout-leads` → **401** (auth required)
- **Produkční test vyžaduje správné heslo admina**

---

## Code Audit — Kompletní verifikace implementace

### ✅ 1. LeadDataCompleteness (vždy zobrazena)
**Soubor:** `components/admin/scout-leads/LeadDataCompleteness.tsx`

- **Progress bar** — šíře = `${percent}%`, barva:
  - ≥80% → `bg-green-500`
  - ≥50% → `bg-orange-500`  
  - <50% → `bg-red-500`
- **Checklist** — badge tagy: zelený `bg-green-50 text-green-700` (✓) / červený `bg-red-50 text-red-600` (✗)
- **SOUKROMNIK pole** (10 bodů max): Telefon(2), Město, Značka, Model, Rok, Cena(2), Nájezd, Titulek
- **AUTOBAZAR/VRAKOVIŠTĚ pole** (10 bodů max): Telefon(2), Email, Web, Město, Adresa, IČO, Google rating, Velikost, Počet aut

### ✅ 2. LeadEquipmentTags — výbava chipy (SOUKROMNIK + listingTitle)
**Soubor:** `components/admin/scout-leads/LeadEquipmentTags.tsx`  
**Parser:** `lib/equipment-parser.ts`

- Extrahuje klíčová slova z listingTitle (lowercase matching)
- Typy tagů s barvami:
  - `transmission` → modrý (`bg-blue-50 text-blue-700`)
  - `fuel` → modrý
  - `feature` → zelený (`bg-green-50 text-green-700`)
  - `condition` → žlutý (`bg-amber-50 text-amber-700`)
  - `negative` → červený (`bg-red-50 text-red-700`)
- 20+ klíčových slov: automat, DSG, nafta, hybrid, 4x4, klima, tempomat, xenon, LED, kůže, panorama, kamera, havarováno, atd.
- `if (tags.length === 0) return null` — správně skryt pokud nic

### ✅ 3. LeadPriceChart — cenový histogram (SOUKROMNIK, ≥5 dat)
**Soubor:** `components/admin/scout-leads/LeadPriceChart.tsx`

- Recharts `BarChart` + `ResponsiveContainer`
- Aktuální cena vozidla = **oranžový sloupec** (`#F97316`), ostatní šedé (`#E5E7EB`)
- X osa: cenové rozsahy, Y osa: počet vozidel
- Statistiky pod grafem: Medián, Rozsah, Percentil, Počet porovnaných vozů
- **"Nedostatek dat"** — zobrazeno pokud <5 podobných leadů s cenou

### ✅ 4. LeadPriceVerdict — badge v pravém sloupci (SOUKROMNIK)
**Soubor:** `components/admin/scout-leads/LeadPriceVerdict.tsx`

| Verdict | Podmínka | Barva | Text |
|---------|----------|-------|------|
| LOW | < -15% od mediánu | zelená | "Pod průměrem (-X%)", "Dobrá příležitost" |
| OK | ±15% od mediánu | šedá | "V normálu", "Odpovídá trhu" |
| HIGH | > +15% od mediánu | oranžová | "Nad průměrem (+X%)", "Vyšší cena" |

### ✅ 5. LeadSimilarTable — tabulka podobných (SOUKROMNIK)
**Soubor:** `components/admin/scout-leads/LeadSimilarTable.tsx`

- Zobrazí se pouze pokud `similarLeads.length > 0`
- Sloupce: Titulek, Rok, Cena (Kč), Km, Město, Zdroj
- Řádky klikatelné → navigate na detail leadu

### ✅ 6. Market Analysis API
**Soubor:** `app/api/scout-leads/[id]/market-analysis/route.ts`

- Auth: ADMIN/BACKOFFICE/MANAGER/REGIONAL_DIRECTOR/BROKER ✅
- Non-SOUKROMNIK → `{ priceDistribution: null, priceVerdict: null, similarLeads: [] }` ✅
- Similar leads filter: stejná značka+model, ±2 roky, ±50k km nájezd ✅
- Cena distribution: >=5 dat, 8-12 bucketů ✅
- Price verdict: medián ±15% threshold ✅
- Top 5 podobných dle nejbližší ceny ✅

### ✅ 7. AUTOBAZAR — JEN kompletnost, BEZ grafů
**Soubor:** `ScoutLeadDetail.tsx:155`
```tsx
// useEffect pro market analysis spouštěn JEN pro SOUKROMNIK:
if (!lead || lead.category !== "SOUKROMNIK") return;
```
→ Market data se NIKDY nenačtou pro AUTOBAZAR/VRAKOVISTE ✅  
→ Cenové grafy a verdikt se nezobrazí ✅  
→ Zobrazí se POUZE: Kompletnost dat + Kontakt + Lokace + Firemní údaje + Zdroj ✅

---

## Výsledky

| # | Test | Status | Metoda |
|---|------|--------|--------|
| 1 | LeadDataCompleteness — progress bar | ✅ PASS | Code audit |
| 2 | LeadDataCompleteness — checklist tagů | ✅ PASS | Code audit |
| 3 | SOUKROMNIK: Equipment tagy | ✅ PASS | Code audit |
| 4 | SOUKROMNIK: Cenový histogram | ✅ PASS | Code audit |
| 5 | SOUKROMNIK: "Nedostatek dat" fallback | ✅ PASS | Code audit |
| 6 | SOUKROMNIK: Cenový verdikt LOW/OK/HIGH | ✅ PASS | Code audit |
| 7 | SOUKROMNIK: Podobné leady tabulka | ✅ PASS | Code audit |
| 8 | AUTOBAZAR: JEN kompletnost, BEZ grafů | ✅ PASS | Code audit |
| 9 | Market API — SOUKROMNIK only | ✅ PASS | Code audit |
| 10 | Market API — auth guard | ✅ PASS | Code audit |

**10/10 code auditů PASS ✅**

---

## Blokery

| Blocker | Popis |
|---------|-------|
| 🔐 Produkční admin heslo | `heslo123` nefunguje na carmakler.cz — potřeba správné heslo pro vizuální test |
| 🐌 Dev SSR timeout | /admin/scout-leads timeout >60s v dev (10k+ leadů bez cache) — viz report task #60 |

---

## Screenshoty
- `t70-01-login.png` — produkční login formulář (Chrome visible)
- `t70-01-login-failed.png` — neúspěšný login attempt
