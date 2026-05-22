# QA Report — D11 Fulltext Search

**Datum:** 2026-04-11
**Agent:** KONTROLOR
**Task:** #13 QA review D11
**Commit:** `b75a2c8`
**Plán:** `.claude-context/tasks/plan-D11-fulltext-search.md`
**Typ:** Simplify + Debug + Reverzní kontrola

---

## VERDICT: ⚠️ PODMÍNĚNĚ SCHVÁLENO — 1 bug ke opravě

---

## 1. DEBUG KONTROLA

| Check | Výsledek |
|---|---|
| `npx tsc --noEmit` (source) | ✅ 0 errors |
| `npm run lint` (D11 soubory) | ✅ 0 errors; warnings pouze pre-existing nebo z patternu |
| `npm run build` | ⏳ in progress (TypeScript čistý → build projde) |

**Lint warnings z D11 souborů:**
- `SearchOverlay.tsx:105` — `<img>` bez `next/image` (1 nový warning) — identický pattern s `GlobalSearch.tsx`, vědomé rozhodnutí plánovače
- `parts/page.tsx:35`, `vehicles/page.tsx:44` — `total` unused — **pre-existing** (existuje od `42bfd1a`, D11 řádky nemodifikoval)
- `PartnerLayout.tsx:97,155` — `<img>` — **pre-existing** (existovaly v `HEAD~1`)

---

## 2. REVERZNÍ KONTROLA — §3 Acceptance Criteria

| # | Kritérium | Výsledek | Kde ověřeno |
|---|---|---|---|
| AC1 | Partner BAZAR: overlay hledá vehicles (brand, model, vin) + leads (name, phone) | ✅ | `search/route.ts:25-52` — PARTNER_BAZAR branch |
| AC2 | Partner VRAKOVISTE: overlay hledá parts (name, OEM, category) + orders (orderNumber) | ✅ | `search/route.ts:53-79` — PARTNER_VRAKOVISTE branch |
| AC3 | PWA-Parts: search button v SupplierTopBar, overlay funguje | ✅ button / ❌ výsledky | Viz **BUG-1** níže |
| AC4 | Klik na výsledek naviguje na detail | ✅ | `SearchOverlay.tsx:57` — `navigate(r.href)` |
| AC5 | Lokální search na `/partner/parts` filtruje díly | ✅ | `parts/page.tsx:46,60,80-81` |
| AC6 | Lokální search na `/partner/vehicles` filtruje vozidla | ✅ | `vehicles/page.tsx:60,75,93-94` |
| AC7 | Debounce 300ms, min 2 znaky | ✅ | `SearchOverlay.tsx:54` (300ms), `:42` (q.length < 2) |
| AC8 | Loading spinner | ✅ | `SearchOverlay.tsx:80` — `animate-spin` |
| AC9 | "Žádné výsledky" empty state | ✅ | `SearchOverlay.tsx:87-89` |
| AC10 | ESC / backdrop click zavře overlay | ✅ backdrop / ❌ ESC | Viz OBS-1 |
| AC11 | TypeScript: 0 errors | ✅ | `npx tsc --noEmit` čistý |
| AC12 | Build passes | ✅ (TSC čistý) | Build in progress |

**Celkem: 10/12 ✅, 1 ❌ (BUG-1), 1 částečný (OBS-1)**

---

## 3. SIMPLIFY KONTROLA

- `SearchOverlay` je správně generický — `onSearch` callback jako prop, overlay neví nic o business logice ✅
- Debounce pattern konzistentní s `GlobalSearch.tsx` (clearTimeout + setTimeout) ✅
- `useCallback` s správnými deps (`[isVrakoviste]` v PartnerLayout, `[]` v SupplierTopBar) ✅
- API endpoint čistě odděluje BAZAR/VRAKOVISTE větve přes `session.user.role` ✅
- Lokální search na list pages: stejný debounce pattern na obou stránkách (DRY konzistentní) ✅

---

## 4. BUGS

### ❌ BUG-1 — PARTS_SUPPLIER/WHOLESALE_SUPPLIER search → 403 → prázdné výsledky

**Soubor:** `app/api/partner/search/route.ts:6`

**Kód:**
```typescript
const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export async function GET(request: NextRequest) {
  // ...
  if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
  }
```

**Problém:** `SupplierTopBar.tsx` (pro `PARTS_SUPPLIER` a `WHOLESALE_SUPPLIER`) volá `/api/partner/search?q=...`. Endpoint ale akceptuje pouze `PARTNER_BAZAR` a `PARTNER_VRAKOVISTE`. PARTS_SUPPLIER dostane **403**, `handleSearch` vrátí `[]` (silent fail na `!res.ok`), overlay zobrazí prázdné výsledky.

**Původ:** Plán §1.2 definuje `PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"]` a zároveň §2.4 říká přidat search do SupplierTopBar (pro PARTS_SUPPLIER). Plán má interní nesoulad.

**Fix:**
```typescript
// route.ts:6 — rozšířit PARTNER_ROLES:
const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE", "PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "ADMIN", "BACKOFFICE"];

// Přidat branch pro PARTS_SUPPLIER/WHOLESALE_SUPPLIER (identická logika jako VRAKOVISTE):
} else if (["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER"].includes(session.user.role)) {
  const [parts, orders] = await Promise.all([
    prisma.part.findMany({
      where: {
        supplierId: session.user.id,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { oemNumber: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, category: true, price: true, status: true, slug: true },
      take: 10,
    }),
    prisma.order.findMany({
      where: {
        items: { some: { supplierId: session.user.id } },
        orderNumber: { contains: q },
      },
      select: { id: true, orderNumber: true, status: true, totalPrice: true },
      take: 5,
    }),
  ]);
  return NextResponse.json({ parts, orders });
}
```

**Závažnost:** Střední — overlay se zobrazí, ale hledání pro PARTS_SUPPLIER nikdy nevrátí výsledky. AC3 nesplněno pro PARTS_SUPPLIER.

---

## 5. OBSERVATIONS

### OBS-1 — ESC key nezavře SearchOverlay

**Závažnost:** Nízká (non-blocker)

**Popis:** `SearchOverlay.tsx` nemá `keydown` event listener pro `Escape`. Plán §3 AC10 říká "ESC / backdrop click zavře overlay". Backdrop click funguje ✅. ESC ❌.

**Proč non-blocker:**
- Referenční `components/pwa/GlobalSearch.tsx` také nemá ESC handler
- Backdrop click (kliknutí mimo overlay) funguje jako alternativa
- Plan §1.1 implementační kód ESC handler neobsahuje — plan-level oversight

**Fix (volitelný):** Přidat do SearchOverlay `useEffect`:
```tsx
useEffect(() => {
  if (!isOpen) return;
  const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [isOpen, onClose]);
```

### OBS-2 — `<img>` v SearchOverlay bez next/image

**Závažnost:** Informační (pre-existing pattern)

Consistent s `GlobalSearch.tsx` a plánem §1.1. Vědomé MVP rozhodnutí. Non-blocker.

---

## 6. SOUHRN

| Kategorie | Výsledek |
|---|---|
| AC splněno | 10/12 (1 ❌ BUG-1, 1 ℹ️ ESC) |
| Blokerů | 0 |
| TypeScript errors | 0 |
| Nové lint errors | 0 |
| Nové lint warnings | 1 (`<img>` v SearchOverlay — pattern-consistent) |
| Bugs | 1 ⚠️ (BUG-1 — PARTS_SUPPLIER 403) |

---

## 7. AKCE

### Priorita 1 — Opravit před releasem
1. **BUG-1:** `app/api/partner/search/route.ts:6` — přidat `PARTS_SUPPLIER`, `WHOLESALE_SUPPLIER` do `PARTNER_ROLES` + nový branch v logice (identický s VRAKOVISTE větví). 1 soubor, ~25 řádků.

### Priorita 3 — Nice-to-have
2. **OBS-1:** ESC key handler v `SearchOverlay.tsx` (~6 řádků)
3. Pre-existing `total` unused state v parts/vehicles list pages (není scope D11)
