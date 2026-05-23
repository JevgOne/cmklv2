# QA Report — Task #37: SEO Full Pack + Navbar + Cross-linking

**Datum:** 2026-05-22  
**Commity:** `7c72cbe`, `101360e`, `45881f5`, `df0683e`, `fe74c76`, `773edd4`  
**Soubory:** 45 changed  
**Výsledek: FAIL ❌ — TypeScript build error (1 bloker)**

---

## KRITICKÝ PROBLÉM — Build error

```
./app/(web)/bazar/[slug]/page.tsx:83:13
Type error: Property 'url' is missing in type '{ name: string; }' 
but required in type 'BreadcrumbItem'.
```

`lib/seo.ts` definuje `BreadcrumbItem` s povinným `url: string`. Poslední breadcrumb v `bazar/[slug]/page.tsx` chybí `url`:

```tsx
// řádek 83 — CHYBÍ url
{ name: partner.name }

// Fix:
{ name: partner.name, url: `https://carmakler.cz/bazar/${partner.slug}` }
```

Vše ostatní — 11/12 bodů — **PASS ✅**.

---

## Checklist (11/12 passed)

### 1. FAQ JSON-LD — 7 stránek ✅

Všechny 7 požadovaných stránek mají `generateFaqJsonLd()`:

| Stránka | Status |
|---|---|
| `/` (homepage) | ✅ |
| `/nabidka` | ✅ |
| `/cenik` | ✅ |
| `/sluzby` | ✅ |
| `/sluzby/proverka` | ✅ |
| `/sluzby/financovani` | ✅ |
| `/sluzby/pojisteni` | ✅ |

### 2. BreadcrumbList JSON-LD ✅

Ověřeno na všech klíčových stránkách:

| Stránka | Status | Poznámka |
|---|---|---|
| `nabidka/[slug]` | ✅ | Inline (ne helper) — validní struktura |
| `bazar/[slug]` | ⚠️ | Pomocí helper — build error kvůli chybějícímu `url` |
| `blog/[slug]` | ✅ | |
| `profil/[slug]` | ✅ | |
| `autoservisy/[slug]` | ✅ | |
| `stk/[slug]` | ✅ | |
| `dily/[slug]` | ✅ | |
| `jak-prodat-auto` | ✅ | |
| Ostatní landing pages | ✅ | nabidka/* city/type/price + dily/* |

`nabidka/[slug]` používá inline `BreadcrumbList` (ne `generateBreadcrumbJsonLd`) — validní schema.org struktura, 3 ListItem (Domů → Nabídka → vehicleName). ✅

### 3. Car schema na `nabidka/[slug]` ✅

Kompletní `@type: "Car"`:
- `brand`, `model`, `name`, `description`, `image` ✅
- `vehicleIdentificationNumber` (podmíněně — jen pokud VIN nezačíná "PRIV") ✅
- `bodyType` (podmíněně) ✅
- `numberOfDoors` (podmíněně) ✅
- `seatingCapacity` (podmíněně) ✅
- `vehicleEngine` + `EngineSpecification` (podmíněně — jen pokud enginePower) ✅
- `mileageFromOdometer`, `fuelType`, `vehicleTransmission` ✅
- `offers` s `Offer` typem ✅

### 4. WebSite JSON-LD + SearchAction na homepage ✅

`app/(web)/page.tsx:4` importuje `generateWebSiteJsonLd`, `app/(web)/page.tsx:257` ho renderuje. `lib/seo.ts` obsahuje `generateWebSiteJsonLd()` s `potentialAction: SearchAction`. ✅

### 5. noindex na private stránkách ✅

- `/hledat`: `robots: { index: false, follow: true }` ✅
- `/nabidka/[slug]/platba`: `noindex` ✅
- `/makleri/[slug]`: `noindex` ✅
- `/notifikace/[token]`: `noindex` ✅

(Projekt nemá `/checkout`, `/account`, `/auth` stránky — tyto jsou v PWA.)

### 6. robots.ts — AI boty ✅

Všechny požadované boty přidány:
- `OAI-SearchBot` ✅ (s disallow na citlivé sekce)
- `Claude-SearchBot` ✅
- `Claude-User` ✅
- Bonus: `GPTBot`, `ChatGPT-User`, `ClaudeBot` ✅

### 7. 7× not-found.tsx — helpful content ✅ (s poznámkou)

Všechny soubory vytvořeny v commitech `df0683e` a `45881f5`:

| Soubor | Emoji | Popis | Back link | Search link |
|---|---|---|---|---|
| `nabidka/[slug]` | 🚗 | Vozidlo nenalezeno / prodáno | `/nabidka` | ❌ |
| `blog/[slug]` | 📝 | Článek nenalezen | `/blog` | ❌ |
| `dily/[slug]` | 🔩 | Díl nenalezen / prodán | `/dily` | ❌ |
| `profil/[slug]` | 👤 | Makléř nenalezen | `/makleri` | ❌ |
| `autoservisy/[slug]` | 🔧 | Servis nenalezen | `/autoservisy` | ❌ |
| `stk/[slug]` | 🔍 | STK nenalezena | `/stk` | ❌ |
| `bazar/[slug]` | 🏪 | Autobazar nenalezen | `/nabidka` | ❌ |
| `dily/vrakoviste/[slug]` | ✅ | bonus | `/dily/vrakoviste` | ❌ |

**Poznámka LOW severity:** Žádný not-found nemá odkaz na `/hledat`. Plán žádal "search link". Kontextové back linky existují — feature minimálně funkční, ale plán není 100% splněn.

Global `app/not-found.tsx` má 2 linky (homepage + nabídka). ✅

### 8. Sitemap — autoservisy/STK ✅

`app/sitemap.ts` správně:
```typescript
url: s.categories.includes("stk-emise")
  ? `${BASE_URL}/stk/${s.slug}`
  : `${BASE_URL}/autoservisy/${s.slug}`
```
Dynamické záznamy pro servisy, vehicles, listings, parts, blog, marketplace, profiles. ✅

### 9. Footer — Autoservisy + STK linky ✅

`components/main/Footer.tsx`:
```tsx
{ href: "/autoservisy", label: "Autoservisy" },
{ href: "/stk", label: "STK stanice" },
```
✅

### 10. Blog author link → `/profil/` fix ✅

`app/(web)/blog/[slug]/page.tsx:348`:
```tsx
href={`/profil/${article.author.slug}`}  // bylo: /makler/
```
✅

### 11. OG image na `/reklamacni-rad` ✅

`app/(web)/reklamacni-rad/opengraph-image.tsx` existuje a správně používá `ogImageOptions()`:
```typescript
const options = await ogImageOptions();
return new ImageResponse(<OgLayout>...</OgLayout>, options);
```
Outfit font, 1200×630, "Reklamační řád" s orange accent. ✅

### 12. Navbar — Autoservisy + STK (commit `fe74c76`) ✅

`components/main/Navbar.tsx` — přidáno do Služby dropdown:
```tsx
{ href: "/autoservisy", title: "Autoservisy", description: "Ověřené autoservisy..." }
{ href: "/stk", title: "STK stanice", description: "Nejbližší STK stanice s cenami" }
```
`components/main/MobileMenu.tsx` — stejné 2 linky. ✅

### 13. Cross-linking (commit `773edd4`) ✅

**Vehicle detail (`nabidka/[slug]`):**
Sekce "Užitečné služby" — 4 linky: Prověrka, Financování, Pojištění, Autoservisy. Design konzistentní (orange-50 ikona, hover:orange-300 border). ✅

**Parts detail (`dily/[slug]`):**
Podmíněná sekce (jen pokud `compatibleBrands.length > 0`) — brand-aware linky na vozidla, díly dle značky, autoservisy. Slug normalizace (lowercase + NFD + diacritics strip). ✅

### 14. npm run build ❌

**FAIL** — viz kritický problém. `bazar/[slug]/page.tsx:83` — chybí `url` v BreadcrumbItem.

---

## Shrnutí

| Oblast | Status |
|---|---|
| FAQ JSON-LD (7 stránek) | ✅ |
| BreadcrumbList (14+ stránek) | ✅ (bazar blocker v build) |
| Car schema | ✅ |
| WebSite + SearchAction | ✅ |
| noindex | ✅ |
| robots.ts AI boty | ✅ |
| not-found.tsx (7×) | ✅ LOW: bez search linku |
| Sitemap | ✅ |
| Footer cross-links | ✅ |
| Blog author fix | ✅ |
| OG /reklamacni-rad | ✅ |
| Navbar (Autoservisy/STK) | ✅ |
| Cross-linking (vehicle + parts) | ✅ |
| **npm run build** | **❌ BLOKER** |

**Fix (1 řádek):** `app/(web)/bazar/[slug]/page.tsx:83`
```tsx
{ name: partner.name, url: `https://carmakler.cz/bazar/${partner.slug}` }
```
