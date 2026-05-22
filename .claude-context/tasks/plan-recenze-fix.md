# Plan: Opravit Recenze

**Task:** #6
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Bugfix + Enhancement
**Závažnost:** MEDIUM

---

## 1. Nalezené problémy

### BUG A: Tab filtr nefunguje — nesouhlasí typy (CRITICAL)

**ReviewList** (`components/web/ReviewList.tsx`, řádek 18-22) má tabs:
```tsx
const tabs = [
  { value: "all", label: "Všechny" },
  { value: "SELLER", label: "Prodejci" },  // ❌ nikdy nematchne
  { value: "BUYER", label: "Kupující" },    // ❌ nikdy nematchne
];
```

**ReviewForm** (`components/web/ReviewForm.tsx`, řádek 10-16) vytváří typy:
```tsx
{ value: "GENERAL", label: "Obecná zkušenost" },
{ value: "SALE", label: "Prodej auta" },       // ← tohle je "prodejce"
{ value: "PURCHASE", label: "Nákup auta" },    // ← tohle je "kupující"
{ value: "PARTS", label: "Nákup dílů" },
{ value: "MARKETPLACE", label: "Marketplace" },
```

**Důsledek:** Tab "Prodejci" filtruje `r.type === "SELLER"`, ale žádná recenze nemá type "SELLER" (mají "SALE"). Filtr nikdy nic nenajde → empty state.

**Fix:** Sladit tab values s typy z formuláře.

### BUG B: Badge varianta nefunguje — stejný type mismatch

**ReviewList** řádek 85:
```tsx
<Badge variant={review.type === "SELLER" ? "verified" : "new"}>
  {review.type === "SELLER" ? "Ověřený prodej" : review.type === "BUYER" ? "Ověřený nákup" : "Recenze"}
</Badge>
```

Nikdy neukáže "Ověřený prodej" ani "Ověřený nákup" — protože typy jsou `SALE`/`PURCHASE`, ne `SELLER`/`BUYER`.

**Fix:** Mapovat na správné typy (`SALE` → "Ověřený prodej", `PURCHASE` → "Ověřený nákup").

### CHYBÍ C: Admin stránka pro schvalování recenzí

Recenze se vytváří s `isPublished: false` (API route řádek 37). Admin je notifikován (řádek 43-54), notifikace odkazuje na `/admin/reviews`. Ale tato stránka **NEEXISTUJE**.

**Důsledek:** Recenze odeslané přes formulář se nikdy nezobrazí na webu, protože nikdo je nemůže schválit.

### NICE-TO-HAVE D: Chybí JSON-LD pro recenze (SEO)

Stránka `/recenze` nemá structured data (`AggregateRating`, `Review`). Google neukáže hvězdičky ve výsledcích vyhledávání.

---

## 2. Implementační plán

### Krok 1: Opravit tab filtr v ReviewList (BUG A)

**Soubor:** `components/web/ReviewList.tsx`

```tsx
// PŘED (řádek 18-22):
const tabs = [
  { value: "all", label: "Všechny" },
  { value: "SELLER", label: "Prodejci" },
  { value: "BUYER", label: "Kupující" },
];

// PO:
const tabs = [
  { value: "all", label: "Všechny" },
  { value: "SALE", label: "Prodej auta" },
  { value: "PURCHASE", label: "Nákup auta" },
  { value: "PARTS", label: "Autodíly" },
  { value: "MARKETPLACE", label: "Marketplace" },
];
```

**Alternativa (méně tabů):**
```tsx
const tabs = [
  { value: "all", label: "Všechny" },
  { value: "SALE", label: "Prodejci" },
  { value: "PURCHASE", label: "Kupující" },
];
```

**Doporučení:** Použít druhou variantu (méně tabů, GENERAL/PARTS/MARKETPLACE padají do "Všechny").

### Krok 2: Opravit Badge v ReviewList (BUG B)

**Soubor:** `components/web/ReviewList.tsx`

```tsx
// PŘED (řádek 85-87):
<Badge variant={review.type === "SELLER" ? "verified" : "new"}>
  {review.type === "SELLER" ? "Ověřený prodej" : review.type === "BUYER" ? "Ověřený nákup" : "Recenze"}
</Badge>

// PO:
<Badge variant={review.type === "SALE" ? "verified" : review.type === "PURCHASE" ? "new" : "default"}>
  {review.type === "SALE" ? "Prodej auta"
   : review.type === "PURCHASE" ? "Nákup auta"
   : review.type === "PARTS" ? "Autodíly"
   : review.type === "MARKETPLACE" ? "Marketplace"
   : "Recenze"}
</Badge>
```

### Krok 3: Admin stránka pro schvalování recenzí (CHYBÍ C)

Vytvořit `app/(admin)/admin/reviews/page.tsx`:

**Funkce:**
- Seznam všech recenzí (isPublished i nepublished)
- Filtr: Ke schválení / Publikované / Odmítnuté
- Pro každou recenzi: Schválit / Odmítnout / Smazat
- Zobrazit: jméno, město, typ, rating, text, datum

**Komponenty:**
- `components/admin/reviews/AdminReviewsTable.tsx` — tabulka s akcemi

**API route:**
- `app/api/admin/reviews/[id]/route.ts` — PUT (approve/reject), DELETE

**Schema change:** Přidat `rejectedReason` field? Nebo stačit `isPublished: true/false` + delete. Minimální verze: stačí toggle `isPublished`.

**Admin sidebar:** Přidat odkaz na `/admin/reviews` do admin navigace.

### Krok 4 (OPTIONAL): JSON-LD pro recenze

**Soubor:** `app/(web)/recenze/page.tsx`

Přidat `<script type="application/ld+json">` s:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CarMakléř",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "42"
  }
}
```

---

## 3. Seznam souborů k úpravě

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/web/ReviewList.tsx` | FIX | Tab values + Badge type mapping |
| `app/(admin)/admin/reviews/page.tsx` | NEW | Admin stránka pro schvalování |
| `components/admin/reviews/AdminReviewsTable.tsx` | NEW | Tabulka recenzí s akcemi |
| `app/api/admin/reviews/[id]/route.ts` | NEW | API pro approve/reject/delete |
| Admin sidebar | EDIT | Přidat odkaz na /admin/reviews |
| `app/(web)/recenze/page.tsx` | EDIT (optional) | JSON-LD structured data |

---

## 4. Priorita kroků

1. **Krok 1 + 2** — MUST (5 min, bug fix — filtry nefungují)
2. **Krok 3** — MUST (admin schvalování — bez toho je formulář k ničemu)
3. **Krok 4** — NICE-TO-HAVE (SEO, může počkat)

---

## 5. STOP pravidla

- **STOP-1:** Ověřit že typy v ReviewForm odpovídají typům v ReviewList tabech
- **STOP-2:** Ověřit admin reviews stránku — test schválení + zamítnutí + refresh stránky /recenze
- **STOP-3:** Admin sidebar — najít kde je navigace definována, přidat odkaz konzistentně

---

## 6. Acceptance Criteria

- [ ] Tab "Prodejci" na /recenze filtruje správně recenze typu SALE
- [ ] Tab "Kupující" na /recenze filtruje správně recenze typu PURCHASE
- [ ] Badge u recenze zobrazuje správný typ ("Prodej auta", "Nákup auta", "Autodíly", "Marketplace", "Recenze")
- [ ] Admin stránka /admin/reviews existuje a je přístupná
- [ ] Admin může schválit recenzi (toggle isPublished → true)
- [ ] Admin může odmítnout/smazat recenzi
- [ ] Schválená recenze se zobrazí na /recenze
- [ ] `npm run build` projde bez chyb
