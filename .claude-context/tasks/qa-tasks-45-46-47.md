# QA Report — Tasks #45, #46, #47

**Datum:** 2026-05-22  
**Commity:** `14fea43` (Task #45), `415b7e4` (Task #46), Task #47 (StkPriceTable)

---

## Task #45 — SEO fixy: PASS ✅ (s medium poznámkou)

### 1. JSON-LD v fragment wrapperu — ✅

Obě code paths v `nabidka/[slug]/page.tsx` používají `<>` fragment:

```tsx
// Vehicle path (line 503):
return (
  <>
    <script type="application/ld+json" ... />  {/* Car schema */}
    <script type="application/ld+json" ... />  {/* BreadcrumbList */}
    <div className="min-h-screen ...">
```

```tsx
// Listing path (line 1089):
return (
  <>
    <script type="application/ld+json" ... />  {/* Listing schema */}
    <script type="application/ld+json" ... />  {/* BreadcrumbList */}
    <div className="min-h-screen ...">
```

Root cause fix správný — `<>` wrapper zajistí serializaci do HTML streamu. ✅

### 2. Duplicitní titulky — ✅

Grep `CarMakléř.*CarMakléř` vrací 0 výsledků v titulcích. Příklad fix:
```
- title: "Autoservisy — ověřené recenze | CarMakléř"  // layout přidá druhou kopii
+ title: "Autoservisy — ověřené recenze"               // layout přidá jednou
```
Všech ~20 stránek opraveno. ✅

### 3. BreadcrumbList na autoservisy/stk/hledat — ✅

`components/web/Breadcrumbs.tsx` komponent renderuje JSON-LD BreadcrumbList **i vizuální** breadcrumb v jednom:
```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem", position: i + 1, name: item.label,
    ...(item.href ? { item: `https://carmakler.cz${item.href}` } : {}),
  })),
};
return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <nav>...</nav>
  </>
);
```

Výsledek po fixu:
- `autoservisy`: `items=[{label:"Domů",href:"/"},{label:"Autoservisy"}]` → JSON-LD má Domů + item URL ✅
- `stk`: `items=[{label:"Domů",href:"/"},{label:"STK stanice"}]` → stejně ✅
- `hledat`: `items=[{label:"Domů",href:"/"},{label:"Hledání"}]` → ✅

Breadcrumbs komponent je Server Component (no "use client") → správně renderuje do HTML. ✅

### 4. SearchAction URL — ✅

`lib/seo.ts:389`:
```typescript
urlTemplate: "https://carmakler.cz/hledat?q={search_term_string}"
```
Bylo: `/dily/katalog?q=`, nyní správně `/hledat?q=`. ✅

### 5. Organization name — ✅ (hlavní) ⚠️ (vedlejší)

`generateOrganizationJsonLd()` — opraveno:
```typescript
name: "CarMakléř"  // line 351, 383, 440, 650, 712 — všechny opraveny ✅
```

**⚠️ MEDIUM — 4 výskyty "CarMakler" stále v kódu:**

| Funkce | Řádek | Kontext |
|---|---|---|
| `generateServiceJsonLd` | 157 | `service.provider \|\| "CarMakler"` (fallback) |
| `generateArticleJsonLd` | 183 | `article.author \|\| "CarMakler"` (fallback) |
| `generateArticleJsonLd` | 187 | `publisher.name: "CarMakler"` (hardcoded) |
| (jiná funkce) | 258 | `name: "CarMakler"` |

Tyto se zobrazí v JSON-LD pro autoservisy a blog články. Neblokující (hlavní Organization schema je správný), ale nekonzistentní. Fix: nahradit `"CarMakler"` za `"CarMakléř"` na těchto 4 místech.

### Build ✅

```
✓ Compiled successfully in 42s
✓ Generating static pages (1306/1306)
Exit: 0
```

---

## Task #46 — OG images (Cloudinary): PASS ✅

### Pokrytí

| Soubor | getOptimizedUrl | Import z cloudinary | Status |
|---|---|---|---|
| `blog/[slug]/opengraph-image.tsx` | `getOptimizedUrl(article.coverImage, 1200, "auto")` | ✅ | ✅ |
| `nabidka/[slug]/opengraph-image.tsx` | `getOptimizedUrl(rawImage, 1200, "auto")` | ✅ | ✅ |
| `profil/[slug]/opengraph-image.tsx` | `getOptimizedUrl(user.avatar, 240, "auto")` | ✅ | ✅ |

Všechny 3 soubory importují z `@/lib/cloudinary`. ✅

### Kvalita — blog/[slug] OG image je excelentní

- Fallback na dark gradient pokud chybí coverImage ✅
- `coverUrl` jako full-bleed background + dark overlay ✅
- Dynamická velikost fontu titulku (40px pro >50 znaků, 48px jinak) ✅
- Author avatar, jméno, datum, délka čtení, kategorie badge ✅
- Orange accent line dole ✅
- `ogImageOptions()` → Outfit font ✅

### Build ✅ (sdílený s Task #45)

---

## Task #47 — STK ceník: PASS ✅

### lib/stk-pricing.ts

| Požadavek | Status |
|---|---|
| `StkPriceGroup` type ("personal"\|"motorcycle"\|"commercial"\|"trailer") | ✅ |
| `group` field na každém `StkPriceRow` | ✅ |
| `STK_PRICE_GROUPS` record (label + icon pro každou skupinu) | ✅ |
| 4 skupiny: osobní, motorky, nákladní, přívěsy/traktory | ✅ |
| `highlight: true` na M1 (osobní automobil) | ✅ |
| 13 kategorií (M1, M1G, L, N1-N3, M2-M3, O1-O4, T) | ✅ |
| `emise: null` u přívěsů (O1-O4) | ✅ |

### components/web/StkPriceTable.tsx

| Požadavek | Status |
|---|---|
| `<Card>` wrapper | ✅ |
| 4 skupiny v pořadí (personal, motorcycle, commercial, trailer) | ✅ |
| M1 highlighted: `bg-orange-50 border-l-4 border-orange-400` | ✅ |
| M1 badge "Nejčastější" (`bg-orange-100 text-orange-700`) | ✅ |
| Trailer note (přívěsy bez emisí) | ✅ |
| Žádný horizontal scroll — flex layout `justify-between` | ✅ |
| Ceny formátované česky (`toLocaleString("cs-CZ")`) | ✅ |
| Emise podmíněně zobrazeny (null → nevykreslí) | ✅ |

### StkPriceCalc.tsx NESMÍ být změněn — ✅

`git log -- "components/web/StkPriceCalc.tsx"` → žádný nový commit. Nedotčen. ✅

### Mobile responsive

Komponenta používá jednoduché flex `justify-between` na řádku — žádné tabulky, žádný `overflow-x-auto`. Funguje na všech šířkách. ✅

### Build ✅ (sdílený)

---

## Souhrn

| Task | Výsledek | Poznámka |
|---|---|---|
| **#45 — SEO fixy** | **PASS ✅** | ⚠️ Medium: 4× "CarMakler" v generateArticle/ServiceJsonLd |
| **#46 — OG Cloudinary** | **PASS ✅** | Blog OG je excelentní (cover + meta) |
| **#47 — STK ceník** | **PASS ✅** | StkPriceCalc nedotčen, M1 správně highlighted |
| **Build** | **PASS ✅** | 0 errors, 1306/1306 static pages |
