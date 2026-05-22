# Souhrn změn — Session 2026-04-17 / 2026-04-19

**Autor:** Claude (leader) + agent team
**Kontroloval:** Radim (k ověření)

---

## Nasazené commity na produkci (carmakler.cz)

### 1. `ac8a15e` — fix: make drift migration fully idempotent (IF NOT EXISTS)
- **Soubor:** `prisma/migrations/20260416083700_sync_schema_drift/migration.sql`
- **Co:** Migrace 12 nových tabulek + 14 User sloupců selhávala na produkci kvůli částečnému předchozímu pokusu. Všechny DDL příkazy obaleny do idempotentních verzí:
  - `ADD COLUMN` → `ADD COLUMN IF NOT EXISTS`
  - `CREATE TABLE` → `CREATE TABLE IF NOT EXISTS`
  - `CREATE INDEX` → `CREATE INDEX IF NOT EXISTS`
  - `ADD CONSTRAINT` → `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
- **Proč:** Produkční DB měla částečně aplikované změny z neúspěšného prvního pokusu.

---

### 2. `f193b02` — fix: shrink navbar logo, center platform switcher, add weblyx credit
- **Soubory:**
  - `components/main/Navbar.tsx` — logo `h-10 sm:h-12` → `h-6 sm:h-8`
  - `components/common/FooterBase.tsx` — logo `h-12` → `h-8`, přidán text "Web vytvořil weblyx.cz" s odkazem na https://weblyx.cz ve spodní části footeru, wrapper "Platformy CarMakléř" dostal `text-center`
  - `components/ui/PlatformSwitcher.tsx` — footer varianta dostala `justify-center` pro vycentrování badge stripu

---

### 3. `f2b6951` — feat: IG-style BrokerCard redesign + shrink logos
- **Soubor:** `components/web/BrokerCard.tsx` — kompletní redesign na Instagram styl:
  - **Avatar:** centrovaný, kulatý (`rounded-full`) s oranžovým gradient ringem (3px, `from-orange-400 via-orange-500 to-orange-600`) + bílý gap
  - **Jméno + level + město:** centrované, badge + tečka + město
  - **Stats row:** 3 sloupce s dividerem (Prodejů | Vozidel | Specializací), nuly zobrazeny jako "—"
  - **Bio:** centrovaný, `line-clamp-2`
  - **Tagy:** centrované pills
  - **CTA:** full-width stacked tlačítka ("Zobrazit profil" orange + "Kontaktovat" outline)
  - **Karta:** `rounded-2xl`, shadow-only (bez borderu), hover lift (`-translate-y-1`)
  - **StatCell:** lokální helper funkce pro stats

---

### 4. `448c2d3` — feat: reuse BrokerCard on homepage + fix CSP for Unsplash
- **Soubory:**
  - `app/(web)/page.tsx` — Homepage "TOP Makléři" sekce přepsána:
    - Smazáno ~88 řádků inline karet (dark header, square avatar, 4-column stats)
    - Nahrazeno `<BrokerCard>` komponentou (sdílený IG styl)
    - `getFeaturedBrokers()` přepsán na `BrokerCardBroker[]` typ
  - `next.config.ts` — přidáno `images.unsplash.com` do CSP `img-src` direktivy (řešení CSP violations v logách)

---

## QA & Review výsledky

### Evžen (kontrola zadání): 7/7 PASS
- BrokerCard IG styl ✅
- Kulatý avatar + oranžový ring ✅
- Menší logo navbar ✅
- Menší logo footer ✅
- Platformy centered ✅
- weblyx.cz credit ✅
- Homepage používá BrokerCard ✅

### Kontrolor (QA): 4 nálezy
- **BUG-1** (střední): Badge ternary na homepage vehicle cards — pre-existující
- **BUG-2** (nízká): Prázdné hp/city renderuje sirotčí emoji — pre-existující
- **BUG-3** (nízká): Fallback slug duplicate keys — z nového kódu, minor
- **BUG-4** (vysoká): Navbar dropdown accessibility (WCAG) — pre-existující

### Test-chrome: 11/11 PASS na carmakler.cz
- Homepage karty IG-style ✅
- Footer centered + weblyx ✅
- Katalog /nabidka funguje ✅
- Hashtag /makleri/praha BrokerCard ✅
- Profil makléře ✅
- CSP bez violations ✅

---

## Celkový stav projektu: 89%

| Produkt | Stav |
|---------|------|
| Carmakler (makléřská síť) | 92% |
| Eshop autodíly | 90% |
| Inzertní platforma | 88% |
| Marketplace VIP | 85% |

**147k řádků kódu, 244 stránek, 245 API routes, 66 DB modelů**

---

## Rozpracované (v tomto okně, zatím nenasazené)

- **Profil makléře — 6 nových sekcí** (plánovač právě navrhuje):
  1. Kontaktní CTA (Zavolat + Napsat zprávu)
  2. Ověření badges (identita, telefon, e-mail)
  3. Progress bar (% do dalšího levelu)
  4. Sociální sítě (IG, FB, YT ikony)
  5. Timeline/milníky (člen od, 1. prodej, level up)
  6. Badges/odznaky (gamifikace)

---

## Soubory k ověření (pro Radima)

| Soubor | Změna |
|--------|-------|
| `components/web/BrokerCard.tsx` | IG redesign — celý soubor přepsán |
| `app/(web)/page.tsx` | Homepage — getFeaturedBrokers() + BrokerCard místo inline |
| `components/main/Navbar.tsx` | Logo h-6 sm:h-8 |
| `components/common/FooterBase.tsx` | Logo h-8, centered platforms, weblyx credit |
| `components/ui/PlatformSwitcher.tsx` | justify-center ve footer variantě |
| `next.config.ts` | CSP img-src + images.unsplash.com |
| `prisma/migrations/20260416083700_sync_schema_drift/migration.sql` | IF NOT EXISTS všude |
