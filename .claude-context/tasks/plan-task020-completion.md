# Plán dokončení TASK-020 — Eshop autodíly

**Datum:** 2026-04-13
**Autor:** Plánovač
**Zdroj:** audit-task020-current-state.md + deep dive do kódu

---

## Prioritizace

| Priorita | Kritérium | Počet bloků |
|----------|-----------|-------------|
| **P0** | Přímo ovlivňuje revenue/objednávky, infrastruktura hotová, jen chybí UI nebo propojení | 6 bloků |
| **P1** | Zlepšuje UX/admin workflow, střední effort | 5 bloků |
| **P2** | Nice-to-have, fáze 2, vysoký effort nebo nízký business impact | 5 bloků |

---

## P0 — KRITICKÉ (nutné pro provoz)

### Blok P0-1: Admin UI pro reklamace/vrácení
**Effort:** ~1.5h | **Závislosti:** žádné (API + model existuje)

**Kontext:** API endpoint `/api/admin/returns/[id]` (GET/PUT) již existuje. Model `ReturnRequest` kompletní. Chybí POUZE admin stránka.

**Soubory k vytvoření:**
- `app/(admin)/admin/returns/page.tsx` — Seznam reklamací
- `app/(admin)/admin/returns/[id]/page.tsx` — Detail reklamace
- `app/(admin)/admin/returns/loading.tsx`
- `app/(admin)/admin/returns/error.tsx`

**Implementace:**
1. `page.tsx` — tabulka s filtry (status, typ WITHDRAWAL/WARRANTY, datum)
   - Sloupce: ID, objednávka (orderNumber), typ, status (badge), požadovaná částka, datum, akce
   - Fetch: `GET /api/admin/returns?status=X&type=X&page=X`
   - Poznámka: admin returns list API endpoint NEEXISTUJE → musí se vytvořit
2. `[id]/page.tsx` — detail s akcemi
   - Zobrazit: order info, items, fotky defektu, kontakt, bankovní účet
   - Akce: změna statusu (dropdown), approvedAmount input, adminNotes textarea, rejectionReason
   - Fetch: `GET /api/admin/returns/[id]` (existuje), `PUT /api/admin/returns/[id]` (existuje)
3. Navigace — přidat odkaz do admin sidebar (hledat existující sidebar komponentu)

**API k doplnění:**
- `app/api/admin/returns/route.ts` — GET seznam reklamací (s filtrováním, paginací)
  - Filtr: status, type, dateFrom, dateTo, orderId
  - Include: order (orderNumber, buyerName), items count
  - Řazení: createdAt DESC

**Vzor:** Kopírovat pattern z `app/(admin)/admin/orders/page.tsx` (tabulka + filtry + status badges)

---

### Blok P0-2: Cron automatický feed sync
**Effort:** ~1h | **Závislosti:** žádné (parser + cron endpoint existuje)

**Kontext:** 
- `lib/feed-import.ts` má parser (CSV/XML/JSON) + markup kalkulaci
- `app/api/cron/feed-import/route.ts` existuje, volá `importDueFeeds(frequency)`
- `PartsFeedConfig` model má `updateFrequency` (DAILY/WEEKLY/MANUAL)
- Chybí: funkce `importDueFeeds()` v lib/feed-import.ts a Vercel Cron config

**Soubory k úpravě:**
- `lib/feed-import.ts` — doplnit `importDueFeeds(frequency)` funkci
- `vercel.json` — přidat cron schedule (nebo ověřit existující)

**Implementace:**
1. `importDueFeeds(frequency: 'DAILY' | 'WEEKLY')`:
   - Query: `PartsFeedConfig.findMany({ where: { isActive: true, updateFrequency: frequency } })`
   - Pro každý feed: fetch URL → parse → upsert Parts (match on externalId + feedConfigId)
   - Create/Update/Deactivate logic:
     - Existující s externalId → update (cena, stock, popis)
     - Nové externalId → create Part
     - Chybějící externalId (byly v minulém importu, teď ne) → status: INACTIVE
   - Log do `PartsFeedImportLog` (totalItems, created, updated, deactivated, errors)
2. Vercel Cron config:
   ```json
   { "crons": [
     { "path": "/api/cron/feed-import?frequency=DAILY", "schedule": "0 3 * * *" },
     { "path": "/api/cron/feed-import?frequency=WEEKLY", "schedule": "0 4 * * 1" }
   ]}
   ```
3. Environment: ověřit `CRON_SECRET` je nastavený

**Ověření:** Ruční POST na `/api/cron/feed-import?frequency=DAILY` s CRON_SECRET header

---

### Blok P0-3: Shipping carrier API — Zásilkovna (real implementace)
**Effort:** ~1.5h | **Závislosti:** žádné

**Kontext:**
- `lib/shipping/carriers/zasilkovna.ts` existuje jako skeleton
- `lib/shipping/dispatcher.ts` volá carrier.createShipment()
- Zásilkovna widget na frontendu funguje (zasilkovnaPointId/Name se ukládá)
- Dry-run mode funguje (fake tracking numbers)
- Env: `ZASILKOVNA_API_PASSWORD`, `ZASILKOVNA_SENDER_LABEL`

**Soubory k úpravě:**
- `lib/shipping/carriers/zasilkovna.ts` — implementovat reálné API volání

**Implementace:**
1. `createShipment()`:
   - API: `POST https://www.zasilkovna.cz/api/rest` (v5, XML nebo REST JSON)
   - Payload: recipient, zasilkovnaPointId, weight, COD amount, sender label
   - Response: tracking number (packet ID)
2. `getLabelUrl()`:
   - API: label PDF endpoint
   - Return: URL na PDF štítek
3. `trackShipment()`:
   - API: tracking endpoint
   - Map statusy na interní: PENDING, IN_TRANSIT, DELIVERED, RETURNED

**Poznámka:** Zásilkovna API docs: https://docs.packetery.com/

---

### Blok P0-4: VIN → Parts kompatibilita (propojení)
**Effort:** ~1h | **Závislosti:** žádné

**Kontext:**
- `lib/vin-decoder.ts` plně funkční (vindecoder.eu + NHTSA fallback)
- `app/api/parts/compatible/route.ts` existuje, ale VIN cestu nepoužívá decoder
- Komentář v kódu: "V reálné aplikaci bychom VIN dekódovali na brand/model/year"
- Brand/model/year filtrování funguje

**Soubory k úpravě:**
- `app/api/parts/compatible/route.ts` — propojit VIN decode → brand/model/year filter

**Implementace:**
1. Pokud `vin` param:
   - Zavolat `decodeVin(vin)` z `lib/vin-decoder.ts`
   - Extrahovat `brand`, `model`, `year`
   - Použít stejný brand/model/year filtr jako stávající kód
   - Fallback na universalFit pokud decode selže
2. Cache: uložit decoded VIN do paměti (Map) pro opakované dotazy v session

**Ověření:** `GET /api/parts/compatible?vin=WVWZZZ3CZWE123456` vrátí díly pro VW

---

### Blok P0-5: Admin přehled dodavatelů/vrakovišť
**Effort:** ~1.5h | **Závislosti:** žádné

**Kontext:**
- `app/(admin)/admin/partners/` existuje (partner detail page)
- Dodavatelé (PARTS_SUPPLIER, WHOLESALE_SUPPLIER, PARTNER_VRAKOVISTE) jsou v DB
- Chybí: přehledová stránka se seznamem všech dodavatelů + statistiky

**Soubory k vytvoření/úpravě:**
- `app/(admin)/admin/suppliers/page.tsx` — přehled dodavatelů
- `app/(admin)/admin/suppliers/loading.tsx`
- `app/api/admin/suppliers/route.ts` — API endpoint

**Implementace:**
1. `page.tsx` — tabulka dodavatelů
   - Sloupce: jméno/firma, typ (vrakoviště/wholesale/supplier), počet dílů, počet objednávek, celkový obrat, status, registrace
   - Filtr: typ dodavatele, status (aktivní/neaktivní)
   - Link na existující `/admin/partners/[id]`
2. API endpoint:
   - Query users WHERE role IN (PARTS_SUPPLIER, WHOLESALE_SUPPLIER, PARTNER_VRAKOVISTE)
   - Agregace: _count parts, _count orderItems, _sum supplierPayout
3. Navigace: přidat do admin sidebar

**Vzor:** Kopírovat pattern z `/admin/brokers/page.tsx`

---

### Blok P0-6: Admin správa dílů (hromadné operace)
**Effort:** ~1.5h | **Závislosti:** P0-5 (dodavatelé)

**Kontext:**
- Díly se spravují jen přes supplier PWA
- Admin nemá přehled všech dílů v systému
- Potřeba: hromadné schválení, deaktivace, cenové úpravy

**Soubory k vytvoření:**
- `app/(admin)/admin/parts/page.tsx` — seznam všech dílů
- `app/(admin)/admin/parts/loading.tsx`
- `app/api/admin/parts/route.ts` — API s filtrováním + bulk operace

**Implementace:**
1. `page.tsx` — tabulka dílů
   - Sloupce: název, kategorie, dodavatel, cena, stock, status, typ, vytvořeno
   - Filtry: kategorie, dodavatel, status (DRAFT/ACTIVE/SOLD/INACTIVE), typ (USED/NEW/AFTERMARKET)
   - Hromadné akce: checkbox select → "Deaktivovat vybrané", "Schválit vybrané"
   - Search: fulltext (název, partNumber, oemNumber)
2. API:
   - GET: paginovaný seznam s filtry
   - PATCH: bulk status update `{ ids: [...], status: 'ACTIVE' }`
3. Navigace: admin sidebar

---

## P1 — DŮLEŽITÉ (zlepšení UX/workflow)

### Blok P1-1: Shipping carrier API — DPD (real implementace)
**Effort:** ~1.5h | **Závislosti:** P0-3 (Zásilkovna jako vzor)

**Soubory k úpravě:**
- `lib/shipping/carriers/dpd.ts`

**Implementace:**
- Stejný pattern jako Zásilkovna
- DPD API: `https://api.dpd.cz/shipmentservice/rest/v1/`
- Env: `DPD_API_USERNAME`, `DPD_API_PASSWORD`, `DPD_CUSTOMER_NUMBER`
- createShipment → getLabelUrl → trackShipment

---

### Blok P1-2: Shipping carrier API — PPL + GLS + Česká Pošta
**Effort:** ~2h | **Závislosti:** P0-3, P1-1 (pattern established)

**Soubory k úpravě:**
- `lib/shipping/carriers/ppl.ts`
- `lib/shipping/carriers/gls.ts`
- `lib/shipping/carriers/ceska-posta.ts`

**Implementace:**
- Stejný pattern pro všechny 3
- PPL (DHL API), GLS (MyGLS API), Česká Pošta (B2B API)
- Každý ~40min

---

### Blok P1-3: Inventory management — stock alerts
**Effort:** ~1h | **Závislosti:** žádné

**Soubory k vytvoření/úpravě:**
- `app/api/cron/stock-alerts/route.ts` — cron pro nízký stock
- `lib/notifications.ts` (existuje?) — nebo nový soubor
- Supplier PWA dashboard — přidat alert sekci

**Implementace:**
1. Cron endpoint: query Parts WHERE stock < threshold (default 3) AND status = ACTIVE
2. Notifikace: Pusher event pro dodavatele (real-time) nebo email přes Resend
3. Dashboard widget v `components/pwa-parts/dashboard/` — "Nízký sklad" karta
4. Threshold konfigurovatelná per-supplier (budoucí) nebo globální (teď)

---

### Blok P1-4: OEM křížové reference
**Effort:** ~1.5h | **Závislosti:** žádné

**Kontext:**
- Part model má `oemNumber` field
- Žádná lookup funkce
- Potřeba: "zadej OEM číslo → najdi kompatibilní díly"

**Soubory k vytvoření:**
- `app/api/parts/oem-lookup/route.ts` — API endpoint
- `components/web/OemSearch.tsx` — frontend komponenta

**Implementace:**
1. API endpoint:
   - `GET /api/parts/oem-lookup?oem=XXXXX`
   - Query: `Part.findMany({ where: { oemNumber: { contains: oem } } })`
   - Rozšíření: hledat i v partNumber (cross-reference)
   - Normalizace: odstranit pomlčky, mezery, převést na uppercase
2. Frontend: input na OEM číslo → suggestions → výsledky
3. Integrace do SmartSearchBar (přidat OEM tab/mode)

---

### Blok P1-5: Cart DB persistence (volitelné)
**Effort:** ~1.5h | **Závislosti:** žádné

**Kontext:**
- Současný localStorage cart funguje dobře
- DB persistence = košík přežije změnu zařízení (pro přihlášené uživatele)
- Pro guest zůstane localStorage

**Soubory k vytvoření/úpravě:**
- `prisma/schema.prisma` — přidat Cart + CartItem modely
- `app/api/cart/route.ts` — GET/POST/PATCH/DELETE
- `app/api/cart/sync/route.ts` — sync localStorage → DB při přihlášení
- `lib/cart.ts` — rozšířit o server sync pro přihlášené

**Implementace:**
1. Prisma modely:
   ```prisma
   model Cart {
     id        String @id @default(cuid())
     userId    String @unique
     items     CartItem[]
     updatedAt DateTime @updatedAt
   }
   model CartItem {
     id       String @id @default(cuid())
     cartId   String
     partId   String
     quantity Int
     cart     Cart @relation(...)
     part     Part @relation(...)
   }
   ```
2. API: CRUD operace na cart
3. Sync logika: při login → merge localStorage cart s DB cart
4. lib/cart.ts: detekce auth stavu → localStorage NEBO API calls

**⚠️ POZOR:** Toto je low-priority. localStorage funguje pro MVP. Implementovat jen pokud je byznys požadavek na cross-device košík.

---

## P2 — NICE-TO-HAVE (fáze 2)

### Blok P2-1: Reviews/Ratings
**Effort:** ~2h | **Závislosti:** žádné

**Soubory k vytvoření:**
- `prisma/schema.prisma` — Review model
- `app/api/parts/[id]/reviews/route.ts`
- `components/web/ReviewSection.tsx`
- `components/web/ReviewForm.tsx`
- `components/web/StarRating.tsx`

**Implementace:**
1. Model: userId, partId, rating (1-5), text, createdAt
2. API: GET reviews, POST review (jen po DELIVERED objednávce)
3. Frontend: hvězdičky + texty pod detailem dílu
4. Agregace: průměrné hodnocení na ProductCard

---

### Blok P2-2: DonorCar model (sledování zdrojového vozidla)
**Effort:** ~2h | **Závislosti:** žádné

**Kontext z memory:** Donor car = celé bouráky. VIN→guided interview→20-30 dílů z 1 auta.

**Soubory k vytvoření:**
- `prisma/schema.prisma` — DonorCar model
- `app/api/donor-cars/route.ts` — CRUD
- `app/(pwa-parts)/parts/donor-cars/page.tsx` — seznam
- `app/(pwa-parts)/parts/donor-cars/new/page.tsx` — přidání (VIN → interview)
- `components/pwa-parts/donor-cars/DonorCarWizard.tsx`

**Implementace:**
1. Model: VIN, brand, model, year, condition, photos, partsList (relation to Part[])
2. Wizard: VIN decode → fotky → guided interview (motor OK?, převodovka OK?…) → generovat díly
3. Každý díl z interview = nový Part s donorCarId relací

---

### Blok P2-3: Visual/Image search (stub/placeholder)
**Effort:** ~1h (stub) | **Závislosti:** žádné

**Kontext:** Fáze 2 dle CLAUDE.md — zatím jen placeholder.

**Soubory k vytvoření:**
- `app/api/parts/visual-search/route.ts` — placeholder endpoint
- `components/web/VisualSearch.tsx` — upload UI s "Připravujeme" zprávou

**Implementace (stub):**
1. Upload UI: drag & drop foto dílu
2. Placeholder response: "Vizuální vyhledávání je ve vývoji. Zkuste textové vyhledávání."
3. Budoucí integrace: Claude Vision API nebo Google Cloud Vision

---

### Blok P2-4: "Zákazníci také koupili" (doporučovací systém)
**Effort:** ~1.5h | **Závislosti:** P2-1 (Reviews — volitelné)

**Soubory k vytvoření:**
- `app/api/parts/[id]/related/route.ts` — related parts API
- `components/web/AlsoBought.tsx` — "Zákazníci také koupili" sekce

**Implementace:**
1. Query: z OrderItem najdi ostatní parts ze stejných objednávek
   ```sql
   SELECT p.* FROM "Part" p
   JOIN "OrderItem" oi ON oi."partId" = p.id
   WHERE oi."orderId" IN (
     SELECT "orderId" FROM "OrderItem" WHERE "partId" = $currentPartId
   ) AND p.id != $currentPartId
   GROUP BY p.id ORDER BY COUNT(*) DESC LIMIT 6
   ```
2. Fallback: pokud málo dat → díly ze stejné kategorie
3. Zobrazit na detail stránce dílu pod RecommendedParts

---

### Blok P2-5: Wholesale/B2B tiers
**Effort:** ~2h | **Závislosti:** žádné

**Kontext:** Wolt model — free tool for suppliers, provize z prodeje. B2B = snížená provize pro velké odběratele.

**Soubory k vytvoření:**
- `prisma/schema.prisma` — WholesaleTier model (name, minOrderVolume, discountPercent, commissionRate)
- `app/api/admin/wholesale-tiers/route.ts` — CRUD
- `app/(admin)/admin/wholesale/page.tsx` — admin správa tierů
- Business logic v order creation — aplikovat tier discount

**⚠️ POZOR:** Toto závisí na byznys modelu. Konzultovat s PO před implementací.

---

## Pořadí implementace (doporučené)

```
Týden 1 (P0 — kritické):
  P0-1: Admin reklamace UI          ← nejrychlejší win, API existuje
  P0-2: Cron feed sync              ← automatizace, infrastruktura hotová
  P0-4: VIN → Parts propojení       ← 1 soubor, malá změna, velký impact
  
Týden 2 (P0 — pokračování):
  P0-3: Zásilkovna real API         ← první carrier, pattern pro ostatní
  P0-5: Admin dodavatelé            ← přehled pro BackOffice
  P0-6: Admin díly                  ← závisí na P0-5

Týden 3 (P1):
  P1-1: DPD carrier                 ← kopie Zásilkovna patternu
  P1-2: PPL + GLS + ČP carriers    ← batch 3 naráz
  P1-3: Stock alerts                ← rychlý cron + notifikace
  P1-4: OEM lookup                  ← search rozšíření

Týden 4+ (P1/P2):
  P1-5: Cart DB persistence         ← jen pokud byznys potřebuje
  P2-1: Reviews                     ← UX vylepšení
  P2-2: DonorCar                    ← nová feature
  P2-3: Visual search stub          ← placeholder
  P2-4: Also bought                 ← doporučení
  P2-5: Wholesale tiers             ← po konzultaci s PO
```

---

## Závislostní graf

```
P0-1 (Admin reklamace)     → nezávislý
P0-2 (Cron feed sync)      → nezávislý
P0-3 (Zásilkovna API)      → nezávislý
P0-4 (VIN→Parts)           → nezávislý
P0-5 (Admin dodavatelé)    → nezávislý
P0-6 (Admin díly)          → mírně závisí na P0-5 (sidebar pattern)

P1-1 (DPD)                 → závisí na P0-3 (pattern)
P1-2 (PPL+GLS+ČP)          → závisí na P0-3 (pattern)
P1-3 (Stock alerts)        → nezávislý
P1-4 (OEM lookup)          → nezávislý

P1-5 (Cart DB)             → nezávislý (ale low priority)
P2-1 (Reviews)             → nezávislý
P2-2 (DonorCar)            → nezávislý
P2-3 (Visual search)       → nezávislý
P2-4 (Also bought)         → nezávislý
P2-5 (Wholesale)           → konzultace s PO
```

**Paralelizovatelné bloky:**
- P0-1 + P0-2 + P0-4 (3 implementátoři naráz)
- P0-3 + P0-5 (2 implementátoři)
- P1-1 + P1-3 + P1-4 (3 implementátoři)

---

## STOP & ESCALATE pravidla

| Situace | Akce |
|---------|------|
| Zásilkovna API vrací chybu autentizace | STOP — ověřit env variables s uživatelem |
| Feed import vytváří duplicitní díly | STOP — review matching logic (externalId + feedConfigId) |
| Carrier API nedostupné | Fallback na dry-run mode, log warning |
| VIN decode selhává pro CZ vozy | STOP — vindecoder.eu nemusí mít CZ data, testovat s reálnými VIN |
| Bulk operace v admin mění >100 dílů | Confirm dialog + log akce |
