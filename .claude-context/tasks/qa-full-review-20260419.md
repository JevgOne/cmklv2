# QA Review — Production Commits 2026-04-19

**Reviewer:** kontrolor  
**Scope:** BrokerCard redesign, homepage BrokerCard integration, Navbar logo, FooterBase weblyx, PlatformSwitcher footer, CSP Unsplash, drift migration  
**Date:** 2026-04-19

---

## Summary

| File | Status | Findings |
|------|--------|----------|
| `components/web/BrokerCard.tsx` | ⚠️ WARN | `<img>` bez lazy loading |
| `app/(web)/page.tsx` | ❌ FAIL | 3 bugy (badge logika, hp/city rendering, slug fallback) |
| `components/main/Navbar.tsx` | ❌ FAIL | Dropdown klávesnicová accessibility |
| `components/common/FooterBase.tsx` | ✅ PASS | Vše OK |
| `components/ui/PlatformSwitcher.tsx` | ✅ PASS | justify-center neovlivňuje jiné varianty |
| `next.config.ts` | ⚠️ WARN | CSP stále Report-Only (bez blokování) |
| `migration.sql` | ✅ PASS | Idempotentní správně, jeden preventivní warn |

---

## 1. `components/web/BrokerCard.tsx` — ⚠️ WARN

### PASS
- `StatCell`: `value > 0 ? value : "—"` — korektní handling nuly ✓
- Avatar fallback s initials přes `getInitials()` (která správně ošetřuje null/undefined) ✓
- `broker.bio && (...)` guard před renderováním biu ✓
- `visibleTags.length > 0` guard ✓
- `hiddenCount = Math.max(0, ...)` — žádná záporná čísla ✓
- `truncate max-w-full` na jméno — dlouhá jména oříznutá ✓
- `aria-label` na tel. odkazu: `Zavolat ${firstName} ${lastName}` ✓
- `LEVEL_LABEL[broker.level] ?? "Makléř"` — fallback pro neznámé levely ✓
- `line-clamp-2` na bio ✓
- `<article>` sémantický tag ✓
- Responzivní grid: funguje na mobile i desktop ✓

### WARN
**W1 — `<img>` místo `next/image`** (line 59)  
Avatary se neoptimalizují (WebP, lazy loading, responsive sizes). Pro 3 karty na homepage je dopad malý, ale při rozšíření (stránka makléřů) bude problém. Komentář `eslint-disable-next-line` ukazuje záměr, ale chybí `loading="lazy"`.

```tsx
// Navrhované doplnění:
<img
  src={broker.avatar}
  alt={`${broker.firstName} ${broker.lastName}`}
  loading="lazy"   // ← přidat
  className="w-20 h-20 rounded-full object-cover border-[3px] border-white"
/>
```

---

## 2. `app/(web)/page.tsx` — ❌ FAIL

### BUG-1 — Badge ternary vždy zobrazí badge (kritické)
**Lines 404–409** — Automobil s `badge === "default"` zobrazí "⭐ TOP" nesprávně.

```tsx
// BUGGY — default badge dostane TOP variantu:
{car.badge === "verified" ? (
  <Badge variant="verified">✓ Ověřeno</Badge>
) : (
  <Badge variant="top">⭐ TOP</Badge>  // ← i pro badge="default"!
)}

// OPRAVA:
{car.badge !== "default" && (
  car.badge === "verified" ? (
    <Badge variant="verified">✓ Ověřeno</Badge>
  ) : (
    <Badge variant="top">⭐ TOP</Badge>
  )
)}
```

### BUG-2 — Prázdný HP a city se vždy renderují (kosmetické)
**Lines 425–430** — Pokud `car.hp === ""` nebo `car.city` je null, zobrazí se jen emoji bez hodnoty ("⚡ " nebo "📍").

```tsx
// hp: v.enginePower ? `${v.enginePower} HP` : ""  ← může být prázdný string
// city: V.city je nullable

// OPRAVA — přidat podmínky:
{car.hp && (
  <span>⚡ {car.hp}</span>
)}
{car.city && (
  <span>📍 {car.city}</span>
)}
```

### BUG-3 — Fallback slug `"makler"` způsobí duplicitní React klíče
**Line 106** — `slug: b.slug || "makler"` — pokud více makléřů nemá slug (null), React dostane `key="makler"` pro více karet.

```tsx
// RIZIKO: React duplicate key warning + možné DOM glitche
slug: b.slug || "makler",

// LEPŠÍ: použít ID jako fallback (které je vždy unikátní)
slug: b.slug ?? b.id,
// nebo přidat id do selectu jako záložní klíč
```

### WARN
**W2 — Inline JSON.parse duplicuje `parseCities` util** (line 113)

```tsx
// page.tsx inline:
(() => { try { return JSON.parse(b.cities); } catch { return []; } })()

// lib/utils.ts již obsahuje:
export function parseCities(raw: string | null | undefined): string[]
```
DRY violation — použít `parseCities(b.cities)`.

**W3 — Silent error swallowing** (lines 75–77, 123–125)

```tsx
} catch {
  /* DB unavailable — fall back to empty */
}
```
Chyby mimo DB nedostupnost (typové chyby, Prisma chyby) se tiše pohltí. Doporučit alespoň `console.error` v produkci nebo Sentry capture.

### PASS
- `getFeaturedBrokers` filtruje `status: "ACTIVE"` ✓
- `orderBy: { totalSales: "desc" }` ✓
- `_count: { vehicles: { where: { status: "ACTIVE" } } }` — správně počítá jen aktivní vozidla ✓
- `brokers.length > 0 && (...)` — sekce se skryje pokud nejsou makléři ✓
- `cars.length > 0 && (...)` — sekce se skryje pokud nejsou vozy ✓
- `dangerouslySetInnerHTML` pro JSON-LD — data jsou hardcoded, žádné XSS riziko ✓
- `proKoho` klíče jsou unikátní (`title + subtitle`) ✓

---

## 3. `components/main/Navbar.tsx` — ❌ FAIL

### BUG-4 — Dropdowns nejsou dostupné přes klávesnici (accessibility)
**Lines 111–175** — Dropdowny "Služby" a "O nás" se otevírají pouze na CSS `:hover`. Keyboard uživatelé:
- Mohou tabnout na `<button>`, ale dropdown se neotevře
- Chybí `aria-expanded`, `aria-haspopup="menu"` na buttonech
- Chybí focus trigger (`:focus-within` na containeru nebo JS listener)

```tsx
// Aktuální (hover-only):
<div className="relative group">
  <button type="button">Služby <ChevronDownIcon /></button>
  <div className="... opacity-0 invisible group-hover:opacity-100 group-hover:visible ...">

// OPRAVA — přidat focus-within trigger + ARIA:
// 1. CSS: přidat `group-focus-within:opacity-100 group-focus-within:visible`
// 2. Button: přidat aria-expanded={isOpen} aria-haspopup="menu"
// 3. ChevronIcon: group-hover:rotate-180 → group-hover:rotate-180 group-focus-within:rotate-180
```

**WCAG 2.1 SC 2.1.1 (Level A) — keyboard accessible.** Toto je accessibility selhání.

### WARN
**W4 — Duplicate href v oNas dropdownu** (lines 52–55)  
"O CarMakléři" i "Náš tým" vedou na `/o-nas`. Nejde o kódovou chybu, ale UX nesrovnalost. Pravděpodobně `/tym` nebo `/o-nas#tym` bylo zamýšleno.

### PASS
- Logo `h-6 sm:h-8 w-auto` — čitelné na sm+, na mobile 24px je na hraně ale akceptovatelné ✓
- `aria-label="Hlavni navigace"` na `<nav>` ✓
- `Image` komponenta s `priority` pro logo ✓
- `shrink-0` na logo a pravé tlačítky — správné ✓

---

## 4. `components/common/FooterBase.tsx` — ✅ PASS

- `weblyx.cz` odkaz má `target="_blank" rel="noopener noreferrer"` ✓
- Social links mají `aria-label` (Facebook, Instagram, YouTube) ✓
- `isPlaceholder()` guardy pro IČO/DIČ — správně skrývá placeholder hodnoty ✓
- `currentYear = new Date().getFullYear()` — SSR Server Component, volá se per-request, rok správný ✓
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — správná responzivita ✓
- Produkt sloupec: klíče `${productColumn.title}-${i}` — statický seznam, index je akceptovatelný ✓
- `aria-label="Právní informace"` na legal nav ✓
- Footer PlatformSwitcher s `variant="footer"` — vycentrovaný ✓

---

## 5. `components/ui/PlatformSwitcher.tsx` — ✅ PASS

- Footer varianta: `flex flex-wrap items-center justify-center gap-3` — `justify-center` přidán správně ✓
- Navbar varianta (`flex items-center gap-1`) — **nezměněna** ✓
- Navbar-mobile varianta — **nezměněna** ✓
- `aria-current={isCurrent ? "page" : undefined}` — správné použití ✓
- Marketplace záměrně odstraněn (komentář `#101`) — klíč "marketplace" v `PlatformKey` type zůstává pro typové bezpečí ✓
- `theme` prop nevyužit ve footer variantě — přijat ale ignorován, bez chyby ✓

---

## 6. `next.config.ts` — ⚠️ WARN

### PASS
- `images.unsplash.com` přidán do `img-src` CSP ✓
- `images.unsplash.com` přidán do `remotePatterns` pro Next.js optimalizaci ✓
- `unsafe-eval` jen v dev módu ✓
- Redundantní `X-Frame-Options: DENY` + `frame-ancestors 'none'` — ne chyba, backward compat pro starší browsery ✓
- www redirect na bare domain ✓

### WARN
**W5 — CSP je stále `Content-Security-Policy-Report-Only`** (line 119)  
Reportovací mód — porušení se pouze hlásí, ale **NEblokují**. Neposkytuje žádnou faktickou ochranu před XSS/injection. Jakmile bude `/api/csp-report` endpoint ověřen a porušení odstraněna, měl by se header přepnout na `Content-Security-Policy`.

**W6 — `report-uri` místo `report-to`** (line 60)  
`report-uri` je deprecated v prospěch `report-to` + `Reporting-Endpoints` hlavičky. Funkční, ale zastaralé.

---

## 7. `prisma/migrations/20260416083700_sync_schema_drift/migration.sql` — ✅ PASS

### Idempotence — vše správně
| Operace | IF NOT EXISTS / IF EXISTS | Status |
|---------|--------------------------|--------|
| `DROP CONSTRAINT` | `IF EXISTS` | ✓ |
| `DROP INDEX` | `IF EXISTS` | ✓ |
| `ADD COLUMN` | `IF NOT EXISTS` | ✓ |
| `CREATE TABLE` | `IF NOT EXISTS` | ✓ |
| `CREATE INDEX` | `IF NOT EXISTS` | ✓ |
| `CREATE UNIQUE INDEX` | `IF NOT EXISTS` | ✓ |
| `ADD CONSTRAINT` (FK) | `DO $$ EXCEPTION WHEN duplicate_object THEN NULL` | ✓ |
| `ALTER COLUMN DROP NOT NULL` | PostgreSQL no-op pokud již nullable | ✓ |

### WARN
**W7 — Unique index na nullable sloupci bez cleanup guidance**  
Komentáře na začátku migrace varují:
```
- A unique constraint covering [userId,partId] on Favorite will be added. If there are existing duplicate values, this will fail.
- A unique constraint covering [rmaNumber] on ReturnRequest will be added. If there are existing duplicate values, this will fail.
```
`CREATE UNIQUE INDEX IF NOT EXISTS` ochrání pouze před **již existujícím indexem**, ne před **duplicitními daty**. Pokud existují duplicitní záznamy, migrace selže. Doporučit přidat cleanup query nebo dokumentovat prerekvizitu.

**W8 — `StockNotification.partId` FK používá RESTRICT**  
Mazání Part záznamu selže pokud existují neoznámené notifikace. Zvážit CASCADE pro lepší maintainability.

---

## Kritické nálezy pro opravu

| ID | Soubor | Popis | Závažnost |
|----|--------|-------|-----------|
| BUG-1 | page.tsx:404-409 | Badge "default" zobrazuje TOP badge | Střední |
| BUG-2 | page.tsx:425-430 | Prázdný HP/city renderuje sirotčí emoji | Nízká |
| BUG-3 | page.tsx:106 | Fallback slug "makler" → duplicitní React klíče | Nízká |
| BUG-4 | Navbar.tsx:111-175 | Dropdown nepřístupný klávesnicí (WCAG A) | Vysoká |

## Warningy (nedoporučená ale neblokující)

| ID | Popis |
|----|-------|
| W1 | BrokerCard img bez loading="lazy" |
| W2 | Inline JSON.parse duplikuje parseCities util |
| W3 | Silent catch swallowing v data loaderech |
| W4 | Duplicate href v O nás dropdown |
| W5 | CSP stále Report-Only bez blokování |
| W6 | report-uri deprecated |
| W7 | Unique index bez cleanup guidance |
| W8 | StockNotification FK RESTRICT místo CASCADE |
