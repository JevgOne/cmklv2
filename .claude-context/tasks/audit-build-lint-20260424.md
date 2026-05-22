# Audit: Build + Lint + Stubs + Dead Imports
**Datum:** 2026-04-24  
**Kontrolor:** KONTROLOR agent  
**Task:** #22

---

## 1. BUILD

```
npm run build
✓ Compiled successfully in 21.1s
✓ TypeScript — OK (žádné errory)
✓ Generating static pages (1265/1265) in 5.9s
```

**Výsledek: ✅ BUILD PASS** — žádné TypeScript chyby, 1265 routes vygenerováno.

**Klíčové routes (nové od posledního auditu):**
```
/admin/notifications     ✅
/admin/profile           ✅
/admin/vehicles/[id]     ✅
/admin/vehicles/[id]/edit ✅
/api/admin/profile       ✅
/api/admin/vehicles/[id] ✅
/api/assistant/price-estimate ✅
```

---

## 2. LINT

```
npm run lint → Exit code 1
✖ 648 problems (3 errors, 645 warnings)
  0 errors and 176 warnings potentially fixable with --fix
```

### 🔴 3 ERRORY — `scripts/audit-pwa-apps.js` (NE produkce)

```
scripts/audit-pwa-apps.js
  1:22  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
  2:12  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
  3:14  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
```

**Příčina:** Node.js Playwright audit script používá CommonJS `require()`.  
**Dopad na produkci: ŽÁDNÝ** — soubor není součástí Next.js buildu.  
**Fix:** Přidat `scripts/` do `.eslintignore`.

### ⚠️ Warningy v NOVĚ přidaných souborech

| Soubor | Řádek | Problém | Pravidlo |
|---|---|---|---|
| `components/admin/NotificationBell.tsx` | 76 | `Date.now()` impure v render | `react-hooks/purity` |
| `app/(admin)/admin/vehicles/[id]/page.tsx` | 137 | `<img>` místo `<Image />` | `@next/next/no-img-element` |
| `components/admin/VehiclesPageContent.tsx` | 64 | `<img>` místo `<Image />` | `@next/next/no-img-element` |

**Detail NotificationBell.tsx:76:**
```tsx
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();  // ← impure
```
Fix: přesunout `Date.now()` mimo render nebo přijmout warning (funkčně OK).

### ℹ️ 642 Pre-existing warningů (přehled)

| Typ | Soubory (odhad) | Popis |
|---|---|---|
| `no-unused-vars` | ~150 | Nepoužité importy/proměnné |
| `no-img-element` | ~80 | `<img>` místo `<Image />` |
| `no-explicit-any` | ~100 | Explicitní `any` typy |
| `exhaustive-deps` | ~50 | Chybějící useEffect deps |
| `no-html-link-for-pages` | ~10 | `<a>` místo `<Link />` |
| ostatní | ~252 | |

Tato varování existovala před aktuálními implementacemi.

---

## 3. GREP: "Již brzy" / Stubs

```
grep -rn "Již brzy|již brzy" app/ components/
→ 0 výsledků
```

**✅ Žádné "Již brzy" stubs** — stub VIN tlačítko v VinStep.tsx byl nahrazen funkčním tlačítkem v commitu 272da54.

---

## 4. GREP: TODO / FIXME / HACK

### Nalezené TODOs (3 relevantní):

| Soubor | Řádek | Obsah |
|---|---|---|
| `app/api/vehicles/[id]/handover/route.ts` | 185 | `// TODO: TASK-026 — automatický email kupujícímu po 7 dnech (follow-up systém)` |
| `components/shop/ShopTrustBar.tsx` | 6 | `// TODO(designer): Aktuálně text-badges jako placeholder. Nahradit` |
| `lib/seo/pricingAggregate.ts` | 16 | `// TODO #87d — PostgreSQL JSONB array path query migrace` |

**Žádné FIXME ani HACK** nalezeny.

### Placeholder data v produkčním kódu:

| Soubor | Řádek | Problém |
|---|---|---|
| `app/(pwa)/makler/stats/page.tsx` | 126, 322, 343 | Placeholder data pro bar chart a line chart grafy |
| `app/(web)/nabidka/[slug]/page.tsx` | 805 | `{/* Location map placeholder */}` — mapa není implementována |
| `app/(web)/page.tsx` | 297 | `{/* Right — video/image placeholder */}` — hero video sekce |

---

## 5. GREP: Disabled tlačítka bez handleru (stubs)

### Hardcoded `disabled` bez dynamické podmínky:

| Soubor | Řádek | Tlačítko | Stav |
|---|---|---|---|
| `components/admin/BrokersPageContent.tsx:185` | 185 | "Exportovat" | 🔴 Stub — žádný handler, žádný tooltip |
| `components/admin/VehiclesPageContent.tsx:189` | 189 | "Filtrovat" | 🔴 Stub — žádný handler, žádný tooltip |
| `components/admin/VehiclesPageContent.tsx:192` | 192 | "Přidat vozidlo" | ✅ Záměrné — má `title` tooltip vysvětlující PWA workflow |

**BrokersPageContent.tsx:185:**
```tsx
<Button variant="outline" size="sm" disabled>
  Exportovat
</Button>
```
Nefunkční "Exportovat" tlačítko bez tooltipu ani vysvětlení — uživatel neví proč je disabled.

**VehiclesPageContent.tsx:189:**
```tsx
<Button variant="outline" size="sm" disabled>
  Filtrovat
</Button>
```
Nefunkční "Filtrovat" tlačítko — filtrace vozidel v admin panelu není implementována.

---

## 6. Mrtvé importy / Dead links

### Všechny nové komponenty jsou správně importovány:

| Komponenta | Importována v |
|---|---|
| `VinScanModal` | `VinStep.tsx` ✅ |
| `NotificationBell` | `AdminHeader.tsx` ✅ |
| `ProfileForm` (admin) | `app/(admin)/admin/profile/page.tsx` ✅ |
| `NotificationsPageContent` | `app/(admin)/admin/notifications/page.tsx` ✅ |

### 🔴 Unstaged deletion (kritické):

```
app/api/vin/scan/route.ts — smazán z working tree, ale NENÍ zacommitován
git status: deleted: app/api/vin/scan/route.ts
```

Soubor byl přidán v commitu 272da54, ale VinScanModal nakonec používá Tesseract.js (ne Claude Vision API). Nutno zacommitovat smazání.

### ⚠️ Modifikovaný `public/sw.js` (necommitován):

```
git diff HEAD: M public/sw.js
```

Service Worker byl modifikován v working tree mimo build. Zkontrolovat zda je záměrný nebo vedlejší efekt Serwist buildu.

---

## 7. Souhrn nálezů

| Oblast | Status | Priorita |
|---|---|---|
| **Build** | ✅ PASS | — |
| **Lint errory** | 3 errory (scripts/ only) | Nízká — neopravit kvůli produkci |
| **Nové lint warnings** | 3 warnings | Nízká |
| **"Již brzy" stubs** | ✅ ŽÁDNÉ | — |
| **TODO/FIXME** | 3 TODOs (předem known) | Nízká |
| **Stub disabled buttons** | 2 stubs (Exportovat, Filtrovat) | Střední |
| **Placeholder grafy** | 3 sekce | Střední |
| **Mrtvé importy** | ✅ ŽÁDNÉ | — |
| **Unstaged deletion** | `app/api/vin/scan/route.ts` | 🔴 Kritická |
| **sw.js necommitován** | Zkontrolovat | Střední |

### Doporučené akce (prioritizováno):

1. **🔴** Zacommitovat smazání `app/api/vin/scan/route.ts`
2. **⚠️** Zkontrolovat `public/sw.js` — zda je modifikace záměrná
3. **⚠️** Přidat tooltip/vysvětlení k "Exportovat" a "Filtrovat" v admin (`BrokersPageContent`, `VehiclesPageContent`)
4. **ℹ️** Přidat `scripts/` do `.eslintignore` pro eliminaci 3 lint errorů
5. **ℹ️** Opravit `Date.now()` warning v NotificationBell.tsx
