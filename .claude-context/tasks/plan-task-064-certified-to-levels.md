# TASK-064 — Nahradit "Certifikovaný makléř" systémem úrovní

**Stav:** PLAN READY (rev-2)
**Datum:** 2026-04-16

---

## 1. Existující systém úrovní

Systém úrovní **již existuje a je funkční**:

- **DB:** `prisma/schema.prisma:34` — `level String @default("JUNIOR")` na User modelu
- **Enum:** `JUNIOR | BROKER | SENIOR | TOP`
- **Gamifikace:** `lib/gamification.ts` — `LEVELS` array s `calculateLevel(totalSales)`
  - JUNIOR: 0-4 prodejů (badge: bronze)
  - BROKER: 5-19 prodejů (badge: silver)
  - SENIOR: 20-49 prodejů (badge: gold)
  - TOP: 50+ prodejů (badge: diamond)
- **Auto level-up:** `lib/badges.ts:127` — `checkAndUpdateLevel()` na základě prodejů + rating
- **Labels:** `lib/role-labels.ts:20-25` — `LEVEL_LABELS` = { JUNIOR: "Nováček", BROKER: "Makléř", SENIOR: "Senior", TOP: "TOP Makléř" }
- **Profil:** `app/(web)/profil/[slug]/ProfileClient.tsx:277-352` — **již zobrazuje level badge** (LEVEL_LABELS), ale pouze pro non-JUNIOR. Nepočítá progress.

**Verdikt: DB migrace NENÍ potřeba.** Level field a logika existují. Stačí nahradit stringy v UI/SEO/email + přidat progress helper.

---

## 2. Audit výskytů — 265 výskytů v 80 souborech

### Kategorie A: Centrální zdroje (změna se propaguje automaticky) — 3 soubory, ~62 výskytů

| # | Soubor:řádek | Aktuální text | Nový text | Poznámka |
|---|-------------|---------------|-----------|----------|
| A1 | `lib/role-labels.ts:9` | `BROKER: "Certifikovaný makléř"` | `BROKER: "Makléř"` | Centrální label role — ROLE_LABELS se čte dynamicky. LEVEL_LABELS (řádek 20-25) již ukazuje skutečnou úroveň. |
| A2 | `lib/seo-data.ts` (54 výskytů) | "certifikovaných makléřů", "certifikovaným makléřem", "certifikovaní makléři" atd. | "ověřených makléřů", "ověřeným makléřem", "naši makléři" | Hromadný find&replace ve 4 tvarech (viz sekce 4) |
| A3 | `lib/landing-copy.ts` (7 výskytů) | "certifikovaného specialistu", "Certifikovaní makléři", "certifikovaných makléřů", "certifikované makléře" | "ověřeného specialistu", "Naši makléři", "ověřených makléřů", "naše makléře" | 7 výskytů v CTA, FAQ, heading generátorech |

### Kategorie B: UI komponenty — 6 souborů, ~12 výskytů

| # | Soubor:řádek | Aktuální text | Nový text | Poznámka |
|---|-------------|---------------|-----------|----------|
| B1 | `components/web/BrokerBox.tsx:45` | `Certifikovaný makléř` | Dynamicky: `LEVEL_LABELS[broker.level] \|\| "Makléř"` | Potřeba předat `level` prop do komponenty |
| B2 | `components/web/ModelLandingContent.tsx:27,70,136` | "certifikovaných makléřů", "Certifikovaný makléř prověří" | "ověřených makléřů", "Makléř prověří" | 3 výskyty (meta desc, OG desc, body text) |
| B3 | `components/web/BrandLandingContent.tsx:27,71,73,128,146` | "certifikovaných makléřů", "certifikovaného makléře", "Certifikovaný makléř" | "ověřených makléřů", "ověřeného makléře", "Makléř" | 5 výskytů |
| B4 | `components/web/PriceCalculator.tsx:11,15` | "certifikovaného makléře", "certifikovaným makléřem" | "ověřeného makléře", "ověřeným makléřem" | FAQ schema data |
| B5 | `components/web/VehicleLandingPage.tsx:177` | "Certifikovaný makléř prodá" | "Ověřený makléř prodá" | CTA sekce |
| B6 | `components/web/listing-form/Step5PriceContact.tsx:184` | "Certifikovaný makléř vám pomůže" | "Ověřený makléř vám pomůže" | Formulář pro inzerát |

### Kategorie C: Stránky (web) — 18+ souborů, ~170 výskytů

#### C1: Hlavní stránky

| # | Soubor:řádek | Aktuální text | Nový text |
|---|-------------|---------------|-----------|
| C1a | `app/layout.tsx:27,47,56,62` (4x) | "Prodej aut přes certifikované makléře" | "Prodej aut přes ověřené makléře" |
| C1b | `app/(web)/page.tsx:12,16,109,183,296` (5x) | "certifikované makléře", "Certifikovaný makléř CarMakléř", "Síť certifikovaných makléřů" | "ověřené makléře", `bio \|\| "Makléř CarMakléř"`, "Síť ověřených makléřů" |
| C1c | `app/(web)/o-nas/page.tsx` (7x: ř.12,16,88,103,143,160,254) | "Certifikovaní makléři", "certifikovaných makléřů", "certifikovaného makléře" | "Ověření makléři", "ověřených makléřů", "ověřeného makléře" |
| C1d | `app/(web)/chci-prodat/page.tsx` (3x: ř.12,16,32) | "certifikovaném makléři", "certifikovaný makléř" | "ověřeném makléři", "ověřený makléř" |
| C1e | `app/(web)/jak-to-funguje/page.tsx` (2x: ř.48,144) | "certifikovaný makléř", "certifikovanému makléři" | "ověřený makléř", "ověřenému makléři" |
| C1f | `app/(web)/jak-prodat-auto/page.tsx` (6x: ř.49,165,173,190,198,240) | "certifikovaného makléře", "certifikovaným makléřem", "Certifikovaný makléř" | "ověřeného makléře", "ověřeným makléřem", "Ověřený makléř" |
| C1g | `app/(web)/kolik-stoji-moje-auto/page.tsx` (2x: ř.87,92) | "certifikovaného makléře", "Certifikovaný makléř" | "ověřeného makléře", "Ověřený makléř" |
| C1h | `app/(web)/recenze/page.tsx` (2x: ř.210,213) | "certifikovaných makléřů", "certifikované makléře" | "ověřených makléřů", "ověřené makléře" |
| C1i | `app/(web)/obchodni-podminky/page.tsx:207` | "certifikovaných makléřů" | "ověřených makléřů" |

#### C2: Makléři sekce

| # | Soubor:řádek | Aktuální text | Nový text |
|---|-------------|---------------|-----------|
| C2a | `app/(web)/makleri/layout.tsx` (3x: ř.4,6,8) | "Certifikovaní makléři", "certifikovaného automakléře", "Certifikovaní makléři \| CarMakléř" | "Naši makléři", "ověřeného automakléře", "Makléři \| CarMakléř" |
| C2b | `app/(web)/makleri/page.tsx` (5x: ř.14,16,89,190,220) | "Certifikovaní automakléři", "certifikované makléře", "certifikovaných makléřů" | "Ověření automakléři", "ověřené makléře", "ověřených makléřů" |
| C2c | `app/(web)/makleri/[slug]/page.tsx` (2x: ř.310,470) | `jobTitle: "Certifikovaný makléř"`, "certifikované makléře" | `jobTitle: "Automakléř"` (JSON-LD), "naše makléře" |
| C2d | `app/(web)/makleri/[slug]/not-found.tsx:13` | "certifikované makléře" | "naše makléře" |

#### C3: Nabídka landing pages — šablonové stránky (každá 2-4 výskyty)

**Města** (8 souborů x 4 výskyty = 32):
`praha`, `brno`, `ostrava`, `plzen`, `liberec`, `olomouc`, `ceske-budejovice`, `hradec-kralove`

**Značky** (16 souborů x 2 výskyty = 32):
`skoda`, `volkswagen`, `bmw`, `audi`, `mercedes-benz`, `ford`, `hyundai`, `kia`, `toyota`, `peugeot`, `renault`, `mazda`, `opel`, `citroen`, `dacia`, `seat`

**Modely** (12 souborů x 2 výskyty = 24):
`skoda/octavia`, `skoda/fabia`, `skoda/superb`, `skoda/kodiaq`, `volkswagen/golf`, `volkswagen/passat`, `bmw/3-series`, `audi/a4`, `ford/focus`, `toyota/yaris`, `hyundai/i30`, `kia/ceed`

**Karoserie** (7 souborů x 3 výskyty = 21):
`suv`, `kombi`, `sedan`, `hatchback`, `kabriolet`, `elektromobily`, `hybrid`

**Ceny** (5 souborů x 4 výskyty = 20):
`do-100000`, `do-200000`, `do-300000`, `do-500000`, `do-1000000`

Všechny mají identický pattern:
- `"od certifikovaných makléřů"` -> `"od ověřených makléřů"`
- `"Certifikovaný makléř prověří"` -> `"Makléř prověří"`
- `"Naši certifikovaní makléři"` -> `"Naši makléři"`

### Kategorie D: Email šablony — 1 soubor, 4 výskyty

| # | Soubor:řádek | Aktuální text | Nový text |
|---|-------------|---------------|-----------|
| D1 | `lib/email-templates/presentation.ts:16` | "jsem certifikovaný makléř Carmakler" | "jsem makléř Carmakler" |
| D2 | `lib/email-templates/presentation.ts:29` | "Síť certifikovaných makléřů po celé ČR" | "Síť ověřených makléřů po celé ČR" |
| D3 | `lib/email-templates/presentation.ts:44` | "jsem certifikovaný makléř Carmakler" | "jsem makléř Carmakler" |
| D4 | `lib/email-templates/presentation.ts:56` | "Síť certifikovaných makléřů po celé ČR" | "Síť ověřených makléřů po celé ČR" |

### Kategorie E: Seed data — 1 soubor, 1 výskyt

| # | Soubor:řádek | Aktuální text | Nový text |
|---|-------------|---------------|-----------|
| E1 | `prisma/seed.ts:225` | "Certifikovaný makléř s 5 lety" | "Makléř s 5 lety" |

### Kategorie F: Ostatní kód — 2 soubory, 2 výskyty

| # | Soubor:řádek | Aktuální text | Nový text |
|---|-------------|---------------|-----------|
| F1 | `app/prezentace/page.tsx:68` | "Sit certifikovanych" | "Sit overenych" |
| F2 | `app/api/auth/forgot-password/route.ts:78` | "prodej aut pres certifikovane maklere" | "prodej aut pres overene maklere" |

### Kategorie G: Dokumentace + manifest — 5 souborů, 8 výskytů

| # | Soubor:řádek | Aktuální text | Nový text | Poznámka |
|---|-------------|---------------|-----------|----------|
| G1 | `docs/03-profil-maklere-recenze.md:56` | `// "Certifikovaný odhadce vozidel"` | `// "Odhadce vozidel"` | Komentář u Certificate modelu — zde jde o certifikát (kurz/školení), NE o roli. Odstranit slovo "Certifikovaný" z ukázkového stringu. |
| G2 | `docs/03-profil-maklere-recenze.md:141` | `Certifikovaný automakléř` | `Senior makléř` (nebo dynamicky dle úrovně) | ASCII wireframe profilu |
| G3 | `docs/03-profil-maklere-recenze.md:174` | `✓ Certifikovaný odhadce vozidel (APOV, 2023)` | `✓ Odhadce vozidel (APOV, 2023)` | Ukázkový certifikát v wireframe |
| G4 | `docs/03-profil-maklere-recenze.md:375` | `certifikovaný automakléř v ${broker.city}` | `ověřený automakléř v ${broker.city}` | Meta description ukázka |
| G5 | `docs/08-boom-funkce-2026.md:731` | `Certifikovaný automakléř` | `Senior makléř` (nebo dynamicky dle úrovně) | ASCII wireframe profilu |
| G6 | `docs/knowledge-base/procesy.md:6` | "přes síť certifikovaných makléřů" | "přes síť ověřených makléřů" | Procesní dokumentace |
| G7 | `docs/presentations/obchodni-prezentace.html:340` | `Certifikovani makleri` | `Overeni makleri` | Obchodní prezentace |
| G8 | `public/manifest.json:4` | `"Profesionální aplikace pro certifikované auto makléře"` | `"Profesionální aplikace pro makléře"` | PWA manifest — viditelné v OS |

---

## 3. Pravidla nahrazení

| Tvar | Nahrazení | Kdy |
|------|-----------|-----|
| "Certifikovaný makléř" (role label, obecný) | "Makléř" nebo dynamicky `LEVEL_LABELS[level]` | Kde se ukazuje u konkrétního makléře (profil, BrokerBox, JSON-LD) |
| "certifikovaných/ý/ém makléřů/e/em" (v textech o síti) | "ověřených/ý/ém makléřů/e/em" | Obecné texty o síti (SEO, descriptions, landing pages) |
| "certifikovaní makléři" (plurál v nadpisech) | "ověření makléři" nebo "naši makléři" | Nadpisy, CTA sekce |
| "síť certifikovaných makléřů" | "síť ověřených makléřů" | Kde popisujeme celkovou síť |

**Klíčový princip:**
- U **konkrétního makléře** (BrokerBox, JSON-LD, profil) -> zobrazit **skutečnou úroveň** z DB (LEVEL_LABELS)
- V **obecných textech o síti** -> nahradit "certifikovaných" za "ověřených" (ověření identity/firmy SE dělá)
- **Nikdy** nepoužívat "certifikovaný" (neexistuje certifikace)

---

## 4. Nový helper: `calculateLevelProgress()`

### 4.1 Specifikace

Nový export v `lib/gamification.ts`:

```ts
export interface LevelProgress {
  currentLevel: typeof LEVELS[number];
  nextLevel: typeof LEVELS[number] | null;  // null pro TOP
  percentage: number;                        // 0-100
  currentSales: number;
  salesNeeded: number;                       // kolik zbývá do dalšího levelu (0 pro TOP)
}

export function calculateLevelProgress(totalSales: number): LevelProgress {
  const currentLevel = calculateLevel(totalSales);
  const currentIdx = LEVELS.findIndex(l => l.key === currentLevel.key);
  const nextLevel = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;

  if (!nextLevel) {
    // TOP level = 100%
    return { currentLevel, nextLevel: null, percentage: 100, currentSales: totalSales, salesNeeded: 0 };
  }

  const rangeSize = nextLevel.minSales - currentLevel.minSales;
  const progress = totalSales - currentLevel.minSales;
  const percentage = Math.min(100, Math.round((progress / rangeSize) * 100));
  const salesNeeded = nextLevel.minSales - totalSales;

  return { currentLevel, nextLevel, percentage, currentSales: totalSales, salesNeeded };
}
```

### 4.2 Kde renderovat progress bar

**A) `components/web/BrokerBox.tsx`** — pod level label:
```
[Senior makléř] ████████░░ 60% do TOP Makléř
```
- Tenký progress bar (h-1.5), orange gradient
- Text: `{percentage}% do {nextLevel.name}` nebo `TOP Makléř` bez baru pro TOP

**B) `app/(web)/profil/[slug]/ProfileClient.tsx`** — hero card (ř.349-353), pod level badge:
```
[Badge: Senior]
████████████░░░░ 60% — 30 prodejů do TOP Makléř
```
- Širší bar (h-2), s textem počtu prodejů
- Data: `user.totalSales` a `user.level` jsou JIŽ v `ProfileUser` interfacu (ř.36-37)
- Import `calculateLevelProgress` z `lib/gamification.ts`

### 4.3 Formát progress baru (sdílená UI komponenta)

Vytvořit `components/ui/LevelProgressBar.tsx`:
```tsx
interface LevelProgressBarProps {
  level: string;
  totalSales: number;
  size?: "sm" | "md";  // sm = BrokerBox, md = ProfileClient
}
```
- `sm`: h-1.5, jen procento + název dalšího levelu
- `md`: h-2, procento + "X prodejů do {NextLevel}"
- Pro TOP: zobrazit "TOP Makléř" badge, žádný bar

---

## 5. Dynamický level label (BrokerBox + JSON-LD)

Tam, kde se zobrazuje label u **konkrétního makléře**, místo hardcoded stringu zobrazit skutečnou úroveň:

```tsx
// BrokerBox.tsx — místo "Certifikovaný makléř":
import { LEVEL_LABELS } from "@/lib/role-labels";
// ...
<p className="text-sm text-orange-700 font-semibold">
  {LEVEL_LABELS[broker.level] || "Makléř"}
</p>
<LevelProgressBar level={broker.level} totalSales={broker.totalSales} size="sm" />

// makleri/[slug]/page.tsx — JSON-LD:
jobTitle: LEVEL_LABELS[broker.level] || "Makléř",
```

**Potřeba:** BrokerBox musí dostat `level` + `totalSales` props (string, number). Zkontrolovat, že query, která plní data, vrací oba fieldy.

---

## 6. Postup implementace

### Vlna 1: Centrální soubory (3 soubory, propagace do ~60% výskytů)
1. `lib/role-labels.ts` — 1 řádek
2. `lib/seo-data.ts` — hromadný replace 4 tvarů (54 výskytů)
3. `lib/landing-copy.ts` — 7 výskytů

### Vlna 2: Level progress helper + UI komponenta (2 soubory, nový kód)
4. `lib/gamification.ts` — nový export `calculateLevelProgress()`
5. `components/ui/LevelProgressBar.tsx` — **nový soubor** — sdílená komponenta progress baru

### Vlna 3: Komponenty s dynamickým levelem (6 souborů, ~12 výskytů + progress bar)
6. `components/web/BrokerBox.tsx` — dynamický level label + `<LevelProgressBar size="sm" />`
7. `app/(web)/profil/[slug]/ProfileClient.tsx` — `<LevelProgressBar size="md" />` pod level badge (ř.349-353)
8. `components/web/ModelLandingContent.tsx`
9. `components/web/BrandLandingContent.tsx`
10. `components/web/PriceCalculator.tsx`
11. `components/web/VehicleLandingPage.tsx`
12. `components/web/listing-form/Step5PriceContact.tsx`

### Vlna 4: Stránky — hlavní (9 souborů, ~35 výskytů)
13. `app/layout.tsx`
14. `app/(web)/page.tsx`
15. `app/(web)/o-nas/page.tsx`
16. `app/(web)/chci-prodat/page.tsx`
17. `app/(web)/jak-to-funguje/page.tsx`
18. `app/(web)/jak-prodat-auto/page.tsx`
19. `app/(web)/kolik-stoji-moje-auto/page.tsx`
20. `app/(web)/recenze/page.tsx`
21. `app/(web)/obchodni-podminky/page.tsx`

### Vlna 5: Stránky — makléři (4 soubory, ~11 výskytů)
22. `app/(web)/makleri/layout.tsx`
23. `app/(web)/makleri/page.tsx`
24. `app/(web)/makleri/[slug]/page.tsx` — JSON-LD jobTitle dynamicky
25. `app/(web)/makleri/[slug]/not-found.tsx`

### Vlna 6: Nabídka landing pages (48 souborů, ~129 výskytů)
26. Města: 8 souborů — identický pattern
27. Značky: 16 souborů — identický pattern
28. Modely: 12 souborů — identický pattern
29. Karoserie: 7 souborů — identický pattern
30. Ceny: 5 souborů — identický pattern

### Vlna 7: Email + seed + ostatní kód (4 soubory, 7 výskytů)
31. `lib/email-templates/presentation.ts`
32. `prisma/seed.ts`
33. `app/prezentace/page.tsx`
34. `app/api/auth/forgot-password/route.ts`

### Vlna 8: Dokumentace + manifest (5 souborů, 8 výskytů)
35. `docs/03-profil-maklere-recenze.md` — 4 výskyty (G1-G4)
36. `docs/08-boom-funkce-2026.md` — 1 výskyt (G5)
37. `docs/knowledge-base/procesy.md` — 1 výskyt (G6)
38. `docs/presentations/obchodni-prezentace.html` — 1 výskyt (G7)
39. `public/manifest.json` — 1 výskyt (G8)

---

## 7. Akceptační kritéria

1. **Zero "certifikovan"** — `grep -rni "certifikovan" app/ components/ lib/ prisma/ docs/ public/manifest.json --include="*.tsx" --include="*.ts" --include="*.prisma" --include="*.md" --include="*.html" --include="*.json"` vrátí 0 výsledků
2. **BrokerBox zobrazuje skutečnou úroveň** — Nováček / Makléř / Senior / TOP Makléř podle DB
3. **Progress bar na BrokerBox + ProfileClient** — zobrazuje procento a počet prodejů do dalšího levelu; pro TOP = 100% bez baru
4. **JSON-LD jobTitle** na profilu makléře je dynamický (ne hardcoded)
5. **Build OK** — `npm run build` projde bez chyb
6. **Vizuální kontrola** — homepage, /makleri, /makleri/[slug], /profil/[slug], /nabidka, /o-nas — žádný "certifikovaný", progress bar viditelný
7. **PWA manifest** — `public/manifest.json` description neobsahuje "certifikované"

---

## 8. STOP podmínky

- **STOP-1:** Pokud by BrokerBox query nevracela `level` nebo `totalSales` field -> nutná úprava query (NE migrace)
- **STOP-2:** Pokud by existoval jiný soubor s "certifikovan" mimo auditované adresáře -> eskalovat
- **Žádná DB migrace není potřeba** — level field existuje od začátku

---

## 9. Odhad práce

- **80 souborů, 265 výskytů** — většina je mechanický text replace
- **2 logické změny** — (1) BrokerBox + JSON-LD dynamický level, (2) calculateLevelProgress + LevelProgressBar
- **1 nový soubor** — `components/ui/LevelProgressBar.tsx`
- **Čistě UI/text refaktoring + 1 helper** — žádný dopad na business logiku, žádná DB migrace
- Odhadovaný čas: 60-90 min pro implementátora
