# EVŽEN — Kontrola P0-2, P0-4, P0-5, P0-6 proti zadání TASK-020

**Datum:** 2026-04-13
**Kontrolor:** Evžen THE KING

---

## P0-2: Cron Feed Sync (commit f0c4215)

### Zadání (TASK-QUEUE.md, řádky 1884–1953)
> "Frekvence aktualizace: denně/týdně/ručně" (FeedFrequency: DAILY, WEEKLY, MANUAL)
> "POST /api/cron/feed-import — automatický import (cron)"
> "Konfigurace feedu: URL, formát, mapování, frekvence, markup"

### Co bylo implementováno
- `vercel.json`: 2 nové cron joby
  - DAILY: `0 3 * * *` (každý den 03:00 UTC) → `/api/cron/feed-import?frequency=DAILY`
  - WEEKLY: `0 4 * * 1` (pondělí 04:00 UTC) → `/api/cron/feed-import?frequency=WEEKLY`
- `app/api/cron/feed-import/route.ts`: endpoint s CRON_SECRET ochranou
- `lib/feed-import.ts`: `importDueFeeds(frequency?)` filtruje `isActive: true` + `updateFrequency`

### Kontrola bod po bodu

| # | Zadání | Status | Poznámka |
|---|--------|--------|----------|
| 1 | "Frekvence: DAILY" | ✅ | Cron `0 3 * * *` → importDueFeeds("DAILY") |
| 2 | "Frekvence: WEEKLY" | ✅ | Cron `0 4 * * 1` (pondělí) → importDueFeeds("WEEKLY") |
| 3 | "Frekvence: MANUAL" | ✅ OK | MANUAL feedy se nevolají z cronu (záměr — jen ručně přes admin UI) |
| 4 | "POST /api/cron/feed-import" | ⚠️ | Implementováno jako GET (ne POST). Vercel Cron vyžaduje GET — přijatelná odchylka |
| 5 | CRON_SECRET ochrana | ✅ | `authorization: Bearer ${CRON_SECRET}` |
| 6 | Filtruje jen aktivní feedy | ✅ | `where: { isActive: true }` |
| 7 | Admin UI "Importovat nyní" | ✅ DŘÍVĚJŠÍ | Existovalo před tímto commitem (`/admin/feeds`) |

### VERDIKT P0-2: ✅ SCHVÁLENO

Minimální commit (1 soubor, 3 řádky) — přesně to co bylo potřeba. Cron endpoint i import funkce existovaly dříve, tento commit jen propojil s Vercel Cron schedulerem. Žádné gapy.

---

## P0-4: VIN → Parts Kompatibilita (commit 0cc7b21)

### Zadání (TASK-QUEUE.md, řádky 2097–2108 + doplněk)
> "VIN nebo výběr značka/model/rok → filtruje kompatibilní díly"
> "GET /api/parts/compatible?vin=XXX — díly kompatibilní s VIN"

### Co bylo implementováno
- `app/api/parts/compatible/route.ts`: rozšíření existujícího endpointu
  - Přijímá `?vin=XXX` nebo `?brand=X&model=Y&year=Z`
  - VIN → `decodeVin()` → brand/model/year → filtr na compatibleBrands/Models/YearFrom/YearTo
  - In-memory cache (1h TTL) pro decoded VINy
  - Fallback na `universalFit` pokud VIN decode selže
  - Diacritics removal pro české značky/modely
  - Paginace (page/limit)

### Kontrola bod po bodu

| # | Zadání | Status | Poznámka |
|---|--------|--------|----------|
| 1 | "VIN → filtruje kompatibilní díly" | ✅ | VIN → decodeVin() → brand/model/year → prisma filtr |
| 2 | "Výběr značka/model/rok" | ✅ | Přímé `?brand=X&model=Y&year=Z` parametry |
| 3 | Fallback při selhání VIN | ✅ | universalFit = true |
| 4 | Cache VIN decodingu | ✅ | In-memory Map, 1h TTL |
| 5 | Year range filtr | ✅ | `compatibleYearFrom <= year <= compatibleYearTo` (nullable) |
| 6 | Diakritika | ✅ | `removeDiacritics()` pro české názvy (Škoda→Skoda) |
| 7 | Paginace | ✅ | page/limit s max 50 |

### VERDIKT P0-4: ✅ SCHVÁLENO

Implementace přesně odpovídá zadání. VIN decode propojení s parts kompatibilitou funguje, cache optimalizuje opakované dotazy, fallback na universalFit je rozumný.

---

## P0-5: Admin Přehled Dodavatelů (commit 41d63c3)

### Zadání (TASK-QUEUE.md)
Explicitní admin stránka pro dodavatele NENÍ v zadání. Ale zadání říká:
> "BackOffice schvaluje nové dodavatele" (řádek ~1783 implicitně)
> "Admin panel — správa dodavatelů feedů" (řádek 1884 — ale to je feeds, ne dodavatelé)

### Co bylo implementováno
- `app/(admin)/admin/suppliers/page.tsx` — přehled dodavatelů
- `app/api/admin/suppliers/route.ts` — API endpoint
- Sidebar link "Dodavatelé" pod ESHOP

### Kontrola

| Prvek | Status | Poznámka |
|-------|--------|----------|
| Stat karty (celkem/aktivní dodavatelé, celkem/aktivní díly) | ✅ | 4 stat cards |
| Tabulka (dodavatel, role, status, díly, objednávky, obrat, registrace) | ✅ | Kompletní |
| Role filtr (Dodavatel dílů / Velkoobchod / Vrakoviště) | ✅ | 3 supplier roles |
| Status filtr (Aktivní / Čekající / Onboarding / Pozastavený / Neaktivní) | ✅ | 5 stavů |
| Fulltext search (jméno, firma, email) | ✅ | |
| Paginace | ✅ | |
| Obrat per dodavatel (payout aggregation) | ✅ | `orderItem.groupBy` → supplierPayout sum |
| Detail dodavatele | ⚠️ | Odkaz "Detail →" vede na `/admin/users` (list), NE na detail konkrétního uživatele |
| Schvalování dodavatelů (status change) | ❌ CHYBÍ | Jen READ-ONLY přehled — admin nemůže změnit status dodavatele z této stránky |
| Loading skeleton | ✅ | |
| Error boundary | ✅ | |

### Nalezené nedostatky

| # | Gap | Závažnost |
|---|-----|-----------|
| S1 | **Detail odkaz** vede na `/admin/users` (list), ne na specifického uživatele | NÍZKÁ |
| S2 | **Schvalování/pozastavení dodavatele** není možné z této stránky | STŘEDNÍ — admin musí jít do `/admin/users` pro status change |
| S3 | **Filtr podle dodavatele** (pro specifického supplierId) chybí v UI — ale existuje v API | NÍZKÁ |

### VERDIKT P0-5: ⚠️ SCHVÁLENO S VÝHRADOU

Přehled je funkční a informativní (stat karty, tabulka, filtry, payout). Ale **chybí akce** — admin vidí data, ale nemůže z této stránky schválit/pozastavit dodavatele (S2). Odkaz na detail vede na generický `/admin/users` list (S1).

---

## P0-6: Admin Správa Dílů + Bulk Operace (commit 2e16e7d)

### Zadání (TASK-QUEUE.md)
Explicitní admin stránka pro díly NENÍ v zadání, ale je logicky potřebná pro správu eshopu.

### Co bylo implementováno
- `app/(admin)/admin/parts/page.tsx` — správa dílů s bulk operacemi
- `app/api/admin/parts/route.ts` — GET (list) + PATCH (bulk update)
- Sidebar link "Díly" pod ESHOP

### Kontrola

| Prvek | Status | Poznámka |
|-------|--------|----------|
| Tabulka (foto, název, kategorie, typ, stav, cena, sklad, dodavatel, datum) | ✅ | Kompletní |
| Filtr: kategorie (12 kategorií) | ✅ | ENGINE → OTHER |
| Filtr: typ (Použitý / Nový / Aftermarket) | ✅ | |
| Filtr: status (Koncept / Aktivní / Prodáno / Neaktivní) | ✅ | |
| Filtr: fulltext search (název, OEM, part number, výrobce) | ✅ | 4 pole |
| Filtr: supplierId (API podporuje, UI NE) | ⚠️ | API má `supplierId` param, ale UI filtr chybí |
| Paginace | ✅ | |
| Checkbox selection | ✅ | Individuální + select all |
| Bulk akce: Aktivovat | ✅ | Hromadná změna statusu na ACTIVE |
| Bulk akce: Deaktivovat | ✅ | Hromadná změna statusu na INACTIVE |
| Limit max 100 dílů v jednom batch | ✅ | Zod validace `z.array().max(100)` |
| Role check: bulk edit jen ADMIN/BACKOFFICE | ✅ | UI i API |
| Confirm dialog před bulk akcí | ✅ | `confirm()` s počtem dílů |
| Thumbnail (první foto) | ✅ | |
| Stock warning (0 = červené) | ✅ | |
| OEM/part number display | ✅ | Pod názvem dílu |
| Loading skeleton | ✅ | |
| Error boundary | ✅ | |

### Nalezené nedostatky

| # | Gap | Závažnost |
|---|-----|-----------|
| P1 | **Bulk delete** chybí — admin může jen aktivovat/deaktivovat, ne smazat | NÍZKÁ — deaktivace je bezpečnější |
| P2 | **Detail dílu** — žádný odkaz na detail/editaci konkrétního dílu | STŘEDNÍ — admin vidí přehled ale nemůže editovat jednotlivý díl |
| P3 | **Filtr podle dodavatele** v UI chybí (API podporuje supplierId) | NÍZKÁ |
| P4 | **Export** (CSV/Excel) chybí | NÍZKÁ — nice-to-have |

### VERDIKT P0-6: ✅ SCHVÁLENO S DROBNOSTMI

Bulk operace (hlavní scope P0-6) fungují správně. Tabulka je kompletní, filtry pokrývají všechny relevantní dimenze. Zod validace + role checks + confirm dialog. Hlavní gap je chybějící detail/editace dílu (P2), ale to je mimo scope "hromadné operace".

---

## SOUHRNNÝ VERDIKT

| Blok | Commit | Verdikt | Gapy |
|------|--------|---------|------|
| **P0-2** Cron Feed Sync | f0c4215 | ✅ SCHVÁLENO | Žádné |
| **P0-4** VIN→Parts | 0cc7b21 | ✅ SCHVÁLENO | Žádné |
| **P0-5** Admin Dodavatelé | 41d63c3 | ⚠️ S VÝHRADOU | S2: chybí schvalování dodavatele |
| **P0-6** Admin Díly | 2e16e7d | ✅ S DROBNOSTMI | P2: chybí detail/editace dílu |

### Follow-up tasky (doporučení):
1. **P0-5 S2**: Přidat akci schválení/pozastavení dodavatele přímo ze stránky dodavatelů (nebo odkaz na detail)
2. **P0-6 P2**: Přidat odkaz na detail dílu (nebo inline editaci)
3. **S1+P3**: Opravit "Detail →" linky na konkrétní entity místo generic listů

---

*Kontroloval: Evžen THE KING | 2026-04-13*
