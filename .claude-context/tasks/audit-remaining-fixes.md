# Audit: Zbývající opravy a vylepšení pro launch

**Datum:** 2026-04-12
**Agent:** Plánovač
**Zdroj:** Task #42 (team-lead)

---

## §1 Kritické — BLOKUJE LAUNCH

### 1.1 Chybějící `/public/images/placeholder-car.jpg`

**Závažnost:** VYSOKÁ — broken image na 10 místech
**Soubory:**
- `app/(web)/page.tsx:69`
- `app/(web)/nabidka/page.tsx:162,187`
- `app/(web)/nabidka/[slug]/page.tsx:276,303,898`
- `app/(web)/inzerce/page.tsx:106`
- `app/(web)/makler/[slug]/page.tsx:147`
- `app/(web)/nabidka/porovnani/CompareTable.tsx:103`
- `app/api/vehicles/[id]/similar/route.ts:135`

**Problém:** Adresář `/public/images/` neexistuje. Všechna vozidla bez fotek zobrazí broken image (404).
**Fix:** Vytvořit `/public/images/placeholder-car.jpg` — jednoduchý šedý placeholder s ikonou auta v CarMakler stylu (orange, Outfit font). Effort: 15 min.
**Blokuje:** Bez externího designu — implementátor může vytvořit generický placeholder.

### 1.2 Chybějící `logo.svg`

**Závažnost:** STŘEDNÍ — broken JSON-LD logo
**Soubor:** `lib/company-info.ts:43`
```typescript
logo: "https://carmakler.cz/brand/logo.svg",
```
**Problém:** Soubor `public/brand/logo.svg` neexistuje. Existují jen `.png` varianty. JSON-LD schema na `/o-nas` a homepage odkazuje na neexistující SVG.
**Fix:** Buď konvertovat `logo-color.png` na SVG, nebo změnit URL na `logo-color.png`. Effort: 5 min.

---

## §2 Důležité — VIZUÁLNÍ KVALITA

### 2.1 Invoice/Watermark logo problém

**Závažnost:** STŘEDNÍ
**Problém:** `logo-white.png` má text "Makler" v bílé — neviditelné na bílém pozadí. Pro watermark a faktury potřeba varianta s oranžovým+černým textem.
**Existující varianty:**
- `logo-color.png` (104 KB) — oranžové logo, může fungovat
- `logo-dark.png` (104 KB) — tmavá varianta
- `logo-white.png` (97 KB) — bílá varianta (pro tmavé pozadí)

**Fix:** Vytvořit `logo-watermark.png` — oranžové logo na průhledném pozadí, s černým/tmavým textem "Makler". Effort: vyžaduje grafický asset od designera.
**Blokuje:** External asset (designér nebo uživatel).

### 2.2 ShopTrustBar — text-badge placeholdery

**Závažnost:** NÍZKÁ — funkční ale neprofesionální
**Soubor:** `components/shop/ShopTrustBar.tsx:6-9`
**Problém:** Platební metody (Visa, MC, Apple Pay, Google Pay) a dopravci (Zásilkovna, DPD, PPL, GLS, Česká pošta) zobrazeny jako textové badges místo oficiálních SVG logotypů.
**Fix:** Stáhnout/vytvořit SVG ikony do `public/brand/payment-methods/` a `public/brand/carriers/`. Effort: 1h (stahování + integrace).
**Blokuje:** Brand asset approval od značek (Visa/MC mají brand guidelines).

---

## §3 Code quality — VYČISTIT PŘED LAUNCH

### 3.1 Orphan soubory (potvrzeno, bezpečné k smazání)

| Soubor | Nahrazeno | Aktivní varianta |
|--------|-----------|------------------|
| `components/web/Navbar.tsx` | ✅ `components/main/Navbar.tsx` | Importován v `app/(web)/layout.tsx` |
| `components/web/Footer.tsx` | ✅ `components/main/Footer.tsx` | Importován v layoutech |
| `components/web/MobileMenu.tsx` | ✅ `components/main/MobileMenu.tsx` | Importován v Navbar |

**Fix:** `git rm` — 3 soubory, 0 risk. Effort: 2 min.

### 3.2 WorkflowChecklist — chybějící foto auto-check keys

**Závažnost:** NÍZKÁ (feature je nová, ještě není v produkci)
**Soubor:** `components/pwa/vehicles/VehicleDetailHub.tsx` (~line 328-340)
**Problém:** `WorkflowChecklist` definuje auto-check keys `hasExteriorPhotos`, `hasInteriorPhotos`, `hasEvidencePhotos`, ale `VehicleDetailHub` je NEPŘEDÁVÁ v `autoChecks` propu.

**Aktuálně předáváno:**
```typescript
autoChecks={{
  hasContact, hasBasicInfo, hasVin, hasDescription, hasPrice, hasSigned, isActive
}}
```

**Chybí:**
```typescript
hasExteriorPhotos: vehicle.images.filter(i => i.category?.startsWith("ext_")).length >= 8,
hasInteriorPhotos: vehicle.images.filter(i => i.category?.startsWith("int_") || i.category?.startsWith("eng_")).length >= 5,
hasEvidencePhotos: vehicle.images.filter(i => i.category?.startsWith("evi_")).length >= 3,
```

**Fix:** Přidat 3 klíče do autoChecks v VehicleDetailHub. Effort: 15 min.
**Poznámka:** Závisí na tom, jestli `VehicleImage` má pole `category`/`slotId`. Pokud ne → auto-check nemožný bez schema změny. V tom případě nechat jako manuální kroky.

---

## §4 TODO/FIXME v kódu

| Soubor | Line | TODO | Priorita | Blokováno? |
|--------|------|------|----------|------------|
| `app/api/vehicles/[id]/handover/route.ts` | 185 | TASK-026: automatický email kupujícímu po 7 dnech | NÍZKÁ | Ne — nice-to-have follow-up systém |
| `components/shop/ShopTrustBar.tsx` | 6-9 | `TODO(designer)`: Nahradit text-badges SVG ikonami | NÍZKÁ | Ano — brand assets |
| `lib/shipping/carriers/ppl.ts` | 35 | Real PPL API integration | NÍZKÁ | Ano — smlouva s dopravcem |
| `lib/shipping/carriers/dpd.ts` | 34 | Real DPD API integration | NÍZKÁ | Ano — smlouva s dopravcem |
| `lib/shipping/carriers/gls.ts` | 37 | Real GLS API integration | NÍZKÁ | Ano — smlouva s dopravcem |
| `lib/shipping/carriers/zasilkovna.ts` | 35,48,57 | Real Zásilkovna API (3 calls) | NÍZKÁ | Ano — smlouva s dopravcem |
| `lib/shipping/carriers/ceska-posta.ts` | 34 | Real Česká pošta API | NÍZKÁ | Ano — smlouva s dopravcem |
| `lib/seo/pricingAggregate.ts` | 16 | JSONB array path query migration | NÍZKÁ | Ne — výkon optimalizace |
| `components/web/Navbar.tsx` | 2 | Orphan cleanup | XS | Ne |
| `components/web/Footer.tsx` | 2 | Orphan cleanup | XS | Ne |
| `components/web/MobileMenu.tsx` | 2 | Orphan cleanup | XS | Ne |

---

## §5 Stav integracích třetích stran

| Integrace | Stav | Poznámka |
|-----------|------|----------|
| **Stripe** | PLNĚ FUNKČNÍ | Checkout, webhooks, Connect — production ready |
| **Cloudinary** | MIGRACE PLÁNOVÁNA | Přechod na self-hosted (Task #32 v implementaci) |
| **Resend** | FUNKČNÍ | Email sending wired |
| **VIN decoder** | FUNKČNÍ | vindecoder.eu + NHTSA fallback |
| **CEBIA** | FUNKČNÍ | API route exists, Stripe payment gate |
| **Pusher** | NEINTEGROVÁNO | Pouze zmíněno v e2e test komentáři. Žádný kód. |
| **Zásilkovna widget** | ČÁSTEČNĚ | Frontend widget integrován, backend API dry-run |
| **PPL/DPD/GLS/ČP** | DRY-RUN | Všech 5 dopravců vrací mock data. Čeká na smlouvy. |
| **Plausible** | WIRED | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var |
| **Sentry** | WIRED | Error tracking + source maps |
| **GoSMS/Twilio** | NEINTEGROVÁNO | SMS env vars v .env.example, žádný kód |

---

## §6 Stav `company-info.ts`

**Aktuální stav:** Všechny `[DOPLNIT]` placeholdery ODSTRANĚNY. Reálná data vyplněna:
- IČO: `21957151` ✅
- DIČ: `CZ21957151` ✅
- Adresa: `Školská 660/3, 110 00 Praha` ✅
- Telefon: `733 179 199` ✅
- Email: `info@carmakler.cz` ✅

**Poznámka v kódu (line 54):** "Odebrat fiktivní pobočky Brno a Ostrava" — HOTOVO, zůstává jen Praha centrála. Poznámku v komentáři lze smazat.

---

## §7 Prioritizovaný akční plán

### Tier 1: OPRAVIT TEĎKA (žádné externí závislosti, <1h celkem)

| # | Akce | Effort | Soubor |
|---|------|--------|--------|
| A | Vytvořit `/public/images/placeholder-car.jpg` | 15 min | nový soubor |
| B | Opravit `logo.svg` URL v company-info.ts (→ `logo-color.png`) | 5 min | `lib/company-info.ts:43` |
| C | Smazat 3 orphan soubory | 2 min | `components/web/{Navbar,Footer,MobileMenu}.tsx` |
| D | Smazat zastaralý komentář "fiktivní pobočky" | 1 min | `lib/company-info.ts:54-56` |
| E | Wire foto auto-check keys v VehicleDetailHub | 15 min | `components/pwa/vehicles/VehicleDetailHub.tsx` |

### Tier 2: OPRAVIT PŘI PŘÍŠTÍM DEPLOY (nízké riziko)

| # | Akce | Effort | Blokováno? |
|---|------|--------|------------|
| F | ShopTrustBar SVG ikony | 1h | Brand assets (Visa/MC guidelines) |
| G | Logo watermark varianta (orange+black na transparentu) | External | Designér/uživatel |
| H | TASK-026 follow-up email po předání | 2h | Ne, nice-to-have |

### Tier 3: ČEKÁ NA EXTERNÍCH (nelze opravit teď)

| # | Akce | Blokováno čím |
|---|------|---------------|
| I | Shipping carrier API integrace (5 dopravců) | Smlouvy s dopravci |
| J | SMS integrace (GoSMS/Twilio) | Rozhodnutí + smlouva |
| K | Pusher real-time | Architektonické rozhodnutí (polling vs WebSocket vs SSE) |
| L | JSONB array path query optimalizace | Nízká priorita, performance fine |

---

## §8 Shrnutí

| Kategorie | Počet | Stav |
|-----------|-------|------|
| Kritické (blokuje launch) | 2 | placeholder-car.jpg + logo.svg URL |
| Vizuální kvalita | 2 | Logo varianta + ShopTrustBar |
| Code cleanup | 4 | Orphany + komentáře + auto-check keys |
| TODO v kódu | 11 | 3 opravitelné teď, 8 čeká na externích |
| Integrace funkční | 6 | Stripe, Resend, VIN, CEBIA, Plausible, Sentry |
| Integrace dry-run | 5 | PPL, DPD, GLS, Zásilkovna, ČP |
| Integrace neimplementované | 2 | Pusher, SMS |

**Doporučení:** Tier 1 (A-E) je opravitelný za <1h implementátorem, žádné externí závislosti. Udělat PŘED dalším deploy.
