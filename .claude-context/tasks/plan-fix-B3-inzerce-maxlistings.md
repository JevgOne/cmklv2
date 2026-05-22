# Plan: FIX B3 — Inzerce maxListings hardcoded → per-account-type limit

**Task:** #25
**Blocker ID:** B3 z audit-deep-stubs-broken-20260424.md
**Soubor:** `app/(web)/moje-inzeraty/page.tsx:142`
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## ANALÝZA

### Stávající stav:
- **Řádek 142:** `const maxListings = 10; // Placeholder, API by mělo vracet skutečný limit`
- Counter zobrazuje `{activeCount}/{maxListings}` — vždy "X/10"
- Progress bar počítá `activeCount / maxListings * 100`
- Tlačítko "Nový inzerát" je disabled na `activeCount >= maxListings`

### Business pravidla (z CLAUDE.md):
| Typ účtu | Pole v DB | Limit | Platnost |
|----------|-----------|-------|----------|
| PRIVATE | `accountType = "PRIVATE"` | 1 inzerát | 60 dní |
| BAZAAR | `accountType = "BAZAAR"` | 10 inzerátů | 90 dní |
| DEALER | `accountType = "DEALER"` | neomezeno | neomezeno |

### Relevantní DB schema:
- `User.accountType: String?` — "PRIVATE", "DEALER", "BAZAAR" (řádek 71 schema.prisma)
- `User.role: String` — "ADVERTISER" pro inzerenty
- `User.listingCredits: Int @default(0)` — předplacené inzeráty (Bundle 30ks)

### API `/api/listings/my/route.ts`:
- Vrací jen `{ listings }` — **nevrací** accountType ani maxListings
- Potřebuje rozšíření o user info

---

## IMPLEMENTAČNÍ PLÁN (2 kroky)

### Krok 1: Rozšířit API `/api/listings/my` — přidat limit info

**Soubor:** `app/api/listings/my/route.ts`

Přidat user query a `maxListings` do response. Za stávající `prisma.listing.findMany` přidat:

```ts
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { accountType: true, listingCredits: true },
});

const accountType = user?.accountType || "PRIVATE";

function getMaxListings(type: string, credits: number): number | null {
  // null = neomezeno
  const base: Record<string, number | null> = {
    PRIVATE: 1,
    BAZAAR: 10,
    DEALER: null,
  };
  const limit = base[type] ?? 1;
  if (limit === null) return null;
  return limit + credits; // Base + dokoupené kredity
}

const maxListings = getMaxListings(accountType, user?.listingCredits ?? 0);
```

Změnit response na:
```ts
return NextResponse.json({
  listings,
  accountType,
  maxListings, // number | null (null = neomezeno)
});
```

---

### Krok 2: Aktualizovat client component — použít data z API

**Soubor:** `app/(web)/moje-inzeraty/page.tsx`

**2a) Přidat state (za ř. 74):**
```ts
const [maxListings, setMaxListings] = useState<number | null>(10);
```

**2b) Upravit fetch parsing (ř. 85-86):**
```ts
const data = await res.json();
setListings(data.listings || []);
setMaxListings(data.maxListings);
```

**2c) SMAZAT řádek 142:** `const maxListings = 10;`

**2d) Counter display (ř. 153-154) — upravit:**
```tsx
<p className="text-sm font-semibold text-gray-900">
  {maxListings === null
    ? `${activeCount} aktivních inzerátů`
    : `${activeCount}/${maxListings} aktivních inzerátů`}
</p>
```

**2e) Progress bar (ř. 156-160) — podmíněně zobrazit:**
```tsx
{maxListings !== null && (
  <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1">
    <div
      className="h-full bg-orange-500 rounded-full transition-all"
      style={{ width: `${Math.min((activeCount / maxListings) * 100, 100)}%` }}
    />
  </div>
)}
```

**2f) Limit reached label (ř. 164-166):**
```tsx
{maxListings !== null && activeCount >= maxListings && (
  <span className="text-xs text-red-500 font-semibold">Limit dosažen</span>
)}
```

**2g) Button disabled (ř. 172):**
```tsx
<Button variant="primary" disabled={maxListings !== null && activeCount >= maxListings}>
```

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `app/api/listings/my/route.ts` | EDIT | +user query, +maxListings v response |
| 2 | `app/(web)/moje-inzeraty/page.tsx` | EDIT | Použít maxListings z API, null = neomezeno |

---

## ACCEPTANCE CRITERIA

- [ ] PRIVATE účet vidí "1/1 aktivních inzerátů" (nebo "1/1+N" s kredity)
- [ ] BAZAAR účet vidí "3/10 aktivních inzerátů"
- [ ] DEALER účet vidí "15 aktivních inzerátů" (bez /max, bez progress baru)
- [ ] DEALER nemá disabled tlačítko "Nový inzerát"
- [ ] PRIVATE s dosaženým limitem vidí "Limit dosažen" a disabled button
- [ ] listingCredits se přičítají k base limitu
- [ ] Progress bar se nezobrazuje pro DEALER (neomezeno)
- [ ] Účet bez `accountType` (null) fallback na PRIVATE (limit 1)

## STOP PRAVIDLA

- **STOP-1:** Pokud `accountType` je null pro většinu existujících users → zkontrolovat registrační flow
- **STOP-2:** Pokud `listingCredits` logika koliduje s jinými systémy → eskalovat

## ODHAD

- **Složitost:** Nízká (2 soubory, ~20 řádků změn)
- **Risk:** Nízký
