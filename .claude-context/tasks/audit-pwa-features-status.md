# Audit: Stav PWA funkcí — VIN, AI ceny, smlouva, výbava

**Datum:** 2026-04-24

---

## 1. VIN dekódování — FUNGUJE

**Verdikt: Plně funkční, napojené na reálné API.**

| Vrstva | Soubor | Stav |
|--------|--------|------|
| Lib | `lib/vin-decoder.ts` | vindecoder.eu API (primary) + NHTSA vPIC fallback |
| API | `app/api/vin/decode/route.ts` | GET s Zod validací, auth check |
| Frontend | `components/pwa/vehicles/new/VinStep.tsx` | Plný UI: input, validace, dekódování, zobrazení dat |
| Duplicity | fetch `/api/vin/check-duplicate` | Auto-check po zadání 17 znaků |
| Offline | IndexedDB cache via `offlineStorage.getCachedVin()` | Cachuje dekódovaná data offline |

**Detaily:**
- vindecoder.eu vyžaduje `VINDECODER_API_KEY` + `VINDECODER_API_SECRET` env vars
- Pokud vindecoder.eu selže nebo nemá klíče → automatický NHTSA fallback (free, no key)
- Normalizace fuel type, transmission, body type, drive type do českých enum hodnot
- Timeout 10s
- Kamerový sken VIN — **UI stub** (tlačítko "Již brzy", disabled)

---

## 2. AI asistované ceny — NEEXISTUJE (ale AI popis ANO)

**Verdikt: AI cenový odhad CHYBÍ. AI generování popisu FUNGUJE.**

### Co FUNGUJE:
| Feature | Soubor | Stav |
|---------|--------|------|
| AI generování popisu | `app/api/assistant/generate-description/route.ts` | Claude Sonnet 4.6 via @anthropic-ai/sdk |
| AI chat asistent | `app/api/assistant/chat/route.ts` | Claude API + knowledge base, rate limit 50/h |
| Tlačítko v PricingStep | `components/pwa/vehicles/new/PricingStep.tsx:137` | "Vygenerovat popis AI" → volá generate-description |

### Co NEEXISTUJE:
- **Žádný AI cenový odhad** — v PricingStep makléř zadává cenu ručně
- **Žádný pricing API endpoint** — žádný `/api/pricing/estimate` nebo similar
- **PriceCalculator** (`components/web/PriceCalculator.tsx`) — existuje na webu (`/kolik-stoji-moje-auto`), ale je to **čistá matematika** (depreciační křivka `basePrice * 0.88^age * kmFactor`), NE AI/ML, NE reálná tržní data

### Shrnutí AI:
- Claude API je napojený a funkční pro **popisy** a **chat asistenta**
- Pro **ceny** neexistuje žádný AI/ML model ani napojení na tržní data
- PriceCalculator na webu je jen orientační kalkulačka (marketing tool)

---

## 3. Smlouvy — FUNGUJE

**Verdikt: Plně funkční systém — wizard, šablony, digitální podpis, PDF generování.**

| Vrstva | Soubor | Stav |
|--------|--------|------|
| Wizard | `components/pwa/contracts/ContractWizard.tsx` | 4-step: Typ → Vozidlo → Detaily → Náhled |
| Šablony | `lib/contract-templates/brokerage.ts` | Zprostředkovatelská smlouva |
| | `lib/contract-templates/handover.ts` | Předávací protokol |
| | `lib/contract-templates/broker-agreement.ts` | Smlouva s makléřem |
| Podpis | `components/pwa/contracts/SignatureCanvas.tsx` | Canvas-based digitální podpis (touch + mouse) |
| | `components/pwa/contracts/SignatureFlow.tsx` | Flow: prodejce → makléř podpis |
| PDF | `app/api/contracts/[id]/pdf/route.ts` | jsPDF generování, upload na Cloudinary |
| API CRUD | `app/api/contracts/route.ts` | POST vytvoření |
| | `app/api/contracts/[id]/route.ts` | GET/PATCH/DELETE |
| | `app/api/contracts/[id]/sign/route.ts` | POST podepsání |
| | `app/api/contracts/[id]/send/route.ts` | POST odeslání emailem |
| Stránky | `app/(pwa)/makler/contracts/` | Seznam, detail, nová, podpis |
| Komponenty | `ContractCard, ContractsList, ContractFilters, ContractPreview, ContractPdfButton, ContractSendButton` | Kompletní UI |

**Detaily:**
- PDF obsahuje: header CARMAKLER, sekce smlouvy, podpisy (base64 PNG), GPS lokaci podpisu, datum
- PDF se uploaduje na Cloudinary po vygenerování
- Smlouva musí být podepsaná před generováním PDF (DRAFT status = nelze)
- Plný Prisma model `Contract` s vazbami na Vehicle + Broker

---

## 4. Výbava vozu — FUNGUJE

**Verdikt: Plně funkční — Prisma model, kategorizovaný selektor, VIN import.**

| Vrstva | Soubor | Stav |
|--------|--------|------|
| Prisma | `schema.prisma:258` | `equipment String?` (JSON array) na Vehicle |
| Prisma | `schema.prisma:691` | `equipment String?` (JSON array) na VehicleDraft |
| Selektor | `components/pwa/vehicles/new/EquipmentSelector.tsx` | Kategorizovaný checkbox seznam |
| Typy | `types/vehicle-draft.ts` | `DEFAULT_EQUIPMENT_CATALOG` s kategoriemi |
| Integrace | `DetailsStep.tsx`, `ReviewStep.tsx`, `PricingStep.tsx` | Použito v nabíracím wizardu |

**Detaily:**
- Výbava je organizovaná do kategorií (accordion UI)
- Podpora VIN-decoded výbavy (pokud API vrátí equipment)
- Možnost přidat vlastní položky (custom input per kategorie)
- Katalog se cachuje v IndexedDB pro offline použití
- Výbava se posílá do AI generate-description pro lepší popisy
- Zobrazuje se ve `VehicleDetailHub.tsx` a `VehicleSpecs.tsx`

---

## Souhrnná tabulka

| Funkce | Stav | Napojení |
|--------|------|----------|
| VIN dekódování | **FUNGUJE** | vindecoder.eu API + NHTSA fallback |
| VIN kamerový sken | **STUB** | UI tlačítko "Již brzy" (disabled) |
| AI cenový odhad | **CHYBÍ** | Žádný endpoint, žádný model |
| AI generování popisu | **FUNGUJE** | Claude Sonnet 4.6 (@anthropic-ai/sdk) |
| AI chat asistent | **FUNGUJE** | Claude API + knowledge base |
| Web cenová kalkulačka | **FUNGUJE** (ne AI) | Lokální math formula (marketing) |
| Smlouvy — wizard | **FUNGUJE** | 4-step wizard, 3 šablony |
| Smlouvy — digitální podpis | **FUNGUJE** | Canvas-based (touch/mouse) |
| Smlouvy — PDF | **FUNGUJE** | jsPDF + Cloudinary upload |
| Smlouvy — email | **FUNGUJE** | Resend API |
| Výbava vozu | **FUNGUJE** | Kategorizovaný selektor, VIN import, custom items |
