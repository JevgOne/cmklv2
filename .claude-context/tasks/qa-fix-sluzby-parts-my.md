# QA Report: FIX /sluzby 404 + /parts/my všechny statusy

**Tasks:** #30 + #33  
**Commity:** `6bf0687` (#30), `b1b3ef9` (#33)  
**Kontrolor:** KONTROLOR agent  
**Datum:** 2026-04-24

---

## VERDIKT: ✅ PASS (oba tasky)

---

## Task #30 — `/sluzby` index stránka (commit `6bf0687`)

**Soubor:** `app/(web)/sluzby/page.tsx`

```tsx
export const metadata: Metadata = {
  title: "Služby — financování, pojištění, prověrka vozidla",
  description: "Kompletní služby pro nákup i prodej auta...",
  alternates: pageCanonical("/sluzby"),
};
```

✅ Server Component — metadata funguje ✅  
✅ `pageCanonical("/sluzby")` — SEO canonical ✅  
✅ OpenGraph metadata ✅

**3 service cards:**

| Služba | Href | Icon |
|--------|------|------|
| Financování auta | `/sluzby/financovani` | 🧮 |
| Pojištění auta | `/sluzby/pojisteni` | 🛡️ |
| Prověrka vozidla | `/sluzby/proverka` | 🔍 |

✅ Všechny 3 existující subpage jsou odkazovány ✅  
✅ `Card hover` — interaktivní karty ✅  
✅ `Link` s `no-underline` ✅  
✅ Grid: 1 sloupec → 3 sloupce (sm) ✅  
✅ Breadcrumbs: Domů → Služby ✅  
✅ H1 "Naše služby" + popis ✅

**AC:** `/sluzby` vrátí 200 (stránka existuje) ✅

---

## Task #33 — `/api/parts/my` (commit `b1b3ef9`)

### API (`app/api/parts/my/route.ts`)

**Auth — role allow-list:**
```ts
const SUPPLIER_ROLES = [
  "PARTS_SUPPLIER",
  "WHOLESALE_SUPPLIER",
  "PARTNER_VRAKOVISTE",
  "ADMIN",
  "BACKOFFICE",
];
```
✅ 3 supplier role typy + admin ✅

**Klíčová oprava — žádný hardcoded `status: "ACTIVE"` filter:**
```ts
const where: Record<string, unknown> = {
  supplierId: session.user.id,  // vlastní díly suppliéra
};

if (status && ["ACTIVE", "INACTIVE", "SOLD"].includes(status)) {
  where.status = status;  // filter JEN pokud explicitně zadán
}
```
✅ Bez `?status=` parametru → vrátí VŠECHNY statusy suppliéra ✅  
✅ Whitelist validace statusů — bezpečné ✅  
✅ Bez filtru neznámý status nelze injektovat ✅

**Pagination:**
```ts
const page = Math.max(1, parseInt(params.get("page") ?? "1"));
const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50")));
```
✅ `Math.max(1, ...)` — stránka min 1 ✅  
✅ `Math.min(100, ...)` — limit max 100, ochrana před abuse ✅

**Admin override:**
```ts
if (["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
  const targetSupplier = params.get("supplierId");
  if (targetSupplier) where.supplierId = targetSupplier;
  else delete where.supplierId;  // admin bez supplierId → vidí vše
}
```
✅ Admin/backoffice může zobrazit díly konkrétního suppliéra nebo všechny ✅

**Counts pro tabs (klíčové):**
```ts
const baseWhere = { ...where };
delete baseWhere.status;   // counts vždy bez status filtru

const [parts, total, activeCount, inactiveCount, soldCount] = await Promise.all([
  prisma.part.findMany({ where, ... }),
  prisma.part.count({ where }),
  prisma.part.count({ where: { ...baseWhere, status: "ACTIVE" } }),
  prisma.part.count({ where: { ...baseWhere, status: "INACTIVE" } }),
  prisma.part.count({ where: { ...baseWhere, status: "SOLD" } }),
]);
```
✅ `baseWhere` odstraní status filtr → counts jsou vždy pro všechny statusy ✅  
✅ Paralelní query — efektivní ✅  
✅ Tabs zobrazují správné počty i při filtrování ✅

**Response:**
```ts
return NextResponse.json({
  parts: parts.map(p => ({ ...p, image: p.images[0]?.url ?? null, images: undefined })),
  total,
  page,
  totalPages: Math.ceil(total / limit),
  counts: { all: activeCount + inactiveCount + soldCount, ACTIVE, INACTIVE, SOLD },
});
```
✅ `counts.all` = součet všech (ne `total` který závisí na filtru) ✅  
✅ `images` odstraněno z response (normalizace) ✅

---

### UI (`app/(pwa-parts)/parts/my/page.tsx`)

**Fetch s tab parametrem:**
```tsx
const statusParam = activeTab !== "all" ? `?status=${activeTab}` : "";
const res = await fetch(`/api/parts/my${statusParam}`);
```
✅ "all" tab → bez `?status=` → API vrátí vše ✅  
✅ "ACTIVE"/"INACTIVE"/"SOLD" tab → `?status=ACTIVE` atd. ✅

**Counts a tab counts:**
```tsx
setCounts(data.counts ?? {});
// ...
<PartFilters activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
```
✅ counts předány do PartFilters pro zobrazení počtů v tabech ✅  
✅ `useEffect([activeTab])` — re-fetch při změně tabu ✅

**PartCard status prop:**
```tsx
status={part.status as "ACTIVE" | "SOLD" | "INACTIVE"}
```
✅ Typ cast správně pokrývá všechny 3 stavy ✅

**Empty state:**
```tsx
{!loading && parts.length === 0 && (
  <div className="text-center py-12">
    <div className="text-4xl mb-3">📦</div>
    <p className="text-gray-500 font-medium">Žádné díly v této kategorii</p>
  </div>
)}
```
✅ Zobrazí se pro každý tab pokud nejsou díly ✅

---

## Acceptance Criteria

| AC | Task | Popis | Výsledek |
|----|------|-------|---------|
| 30-1 | #30 | `/sluzby` vrací 200 (ne 404) | ✅ |
| 30-2 | #30 | Metadata (title + description) | ✅ |
| 30-3 | #30 | Rozcestník na 3 subpage | ✅ |
| 33-1 | #33 | API bez filtru vrací ACTIVE+INACTIVE+SOLD | ✅ |
| 33-2 | #33 | `?status=ACTIVE/INACTIVE/SOLD` filtruje správně | ✅ |
| 33-3 | #33 | Counts pro taby (vždy bez status filtru) | ✅ |
| 33-4 | #33 | Auth: supplier roles + admin ✅ | ✅ |
| 33-5 | #33 | UI: tab switch → refetch s správným param | ✅ |
| 33-6 | #33 | UI: counts zobrazeny v tabech | ✅ |

---

## Otevřené body (nekritické)

| # | Závažnost | Popis |
|---|-----------|-------|
| 1 | ℹ️ | `parts/my/page.tsx` — silent `catch {}` bez error state. Konzistentní s pwa-parts stylem, ale "Neaktivní" / "Prodané" taby zůstanou bez vysvětlení při network chybě. |

---

## Souhrn

| Task | Commit | Verdict |
|------|--------|---------|
| #30 — /sluzby index stránka | `6bf0687` | ✅ PASS |
| #33 — /parts/my všechny statusy | `b1b3ef9` | ✅ PASS |

**Oba tasky připraveny k evžen review / merge.**
