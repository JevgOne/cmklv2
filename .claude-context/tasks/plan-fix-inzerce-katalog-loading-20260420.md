# Investigace: inzerce.carmakler.cz katalog — nekonečné načítání

**Vytvořeno:** 2026-04-20
**Task:** #23

---

## Co vidí uživatel

Na `inzerce.carmakler.cz` (nebo `/inzerce/katalog`) se zobrazuje oranžový spinner s textem "Načítání katalogu..." a stránka se nikdy nenačte.

---

## Analýza kódu

### `app/(web)/inzerce/katalog/page.tsx`
```tsx
import { redirect } from "next/navigation";
export default function InzerceKatalogPage() {
  redirect("/nabidka");
}
```
Celá stránka je **jen redirect** na `/nabidka`. Žádné DB query, žádný fetch.

### `app/(web)/inzerce/katalog/loading.tsx`
```tsx
<div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
<p className="text-sm text-gray-500">Načítání katalogu...</p>
```
**Toto je ten spinner**, který uživatel vidí. Next.js zobrazí `loading.tsx` (Suspense boundary) zatímco `page.tsx` renderuje.

### Middleware flow (pro subdomain `inzerce`)
```
inzerce.carmakler.cz/katalog
  → middleware rewrite: /inzerce/katalog
  → page.tsx: redirect("/nabidka")
  → 307 → inzerce.carmakler.cz/nabidka
  → middleware special case (řádek 168): rewrite → /nabidka (main)
  → /nabidka loads (katalog vozidel)
```

Middleware má na řádku 168 speciální případ:
```tsx
if (subdomain === "inzerce" && pathname === "/nabidka") {
  const response = NextResponse.rewrite(new URL("/nabidka", request.url));
  // ...
}
```
Komentář v kódu říká: "redirect to /katalog caused infinite loop: /katalog→redirect /nabidka→redirect /katalog". **Tento fix už existuje.**

---

## Kde je problém — 4 scénáře

### Scénář 1 (NEJPRAVDĚPODOBNĚJŠÍ): Infrastruktura nefunguje

Viz **Task #15** (`plan-fix-inzerce-subdomain-20260419.md`). Subdomain `inzerce.carmakler.cz` pravděpodobně nemá:
- DNS A záznam
- Nginx `server_name` pro subdomain
- SSL certifikát

**Pokud DNS nefunguje:** Browser ukazuje vlastní chybu (ERR_NAME_NOT_RESOLVED), NE naše loading.tsx.
**Pokud Nginx nefunguje:** Browser ukazuje connection refused/timeout.
**Pokud SSL nefunguje:** Browser ukazuje SSL warning.

→ Spinner z `loading.tsx` by se zobrazil **jen pokud Next.js request dorazí do aplikace**. Pokud uživatel vidí NÁŠ spinner (s textem "Načítání katalogu..."), infrastruktura funguje a problém je jinde.

### Scénář 2: SITE_PASSWORD gate blokuje subdomain

Middleware řádky 142-151: pokud je env `SITE_PASSWORD` nastaveno, KAŽDÝ request se redirectne na `/gate`.

Na inzerce subdomain:
```
inzerce.carmakler.cz/* → middleware gate check → redirect /gate
→ middleware rewrite: /inzerce/gate
→ app/(web)/inzerce/gate/page.tsx NEEXISTUJE → 404 nebo error
```

**Ověření:** Je `SITE_PASSWORD` nastaveno na produkci?

### Scénář 3: `/nabidka` page je pomalá (performance issue)

Redirect z `/inzerce/katalog` → `/nabidka` funguje, ale `/nabidka` page má **PERFORMANCE BUG**:

```tsx
// app/(web)/nabidka/page.tsx řádky 92-115
const [dbVehicles, vehicleTotal, dbListings, listingTotal] = await Promise.all([
  prisma.vehicle.findMany({
    where: vehicleWhere,
    include: { images: ..., broker: ... },
    orderBy: { createdAt: "desc" },
    // ⚠️ ŽÁDNÉ `take` LIMIT!
  }),
  prisma.vehicle.count({ where: vehicleWhere }),
  prisma.listing.findMany({
    where: listingWhere,
    include: { images: ..., user: ... },
    orderBy: [{ isPremium: "desc" }, { createdAt: "desc" }],
    // ⚠️ ŽÁDNÉ `take` LIMIT!
  }),
  prisma.listing.count({ where: listingWhere }),
]);
```

**Problem:** Obě `findMany` query nemají `take` limit — fetchují VŠECHNY záznamy z DB. Pagination je in-memory:
```tsx
const skip = (page - 1) * limit;
const vehicles = allCards.slice(skip, skip + limit); // JS array slice, ne DB limit
```

Pokud je v DB hodně záznamů, tato stránka bude:
1. Trvat dlouho (DB vrací tisíce rows s JOIN na images + broker/user)
2. Spotřebovat hodně RAM na serveru
3. Ukazovat `loading.tsx` spinner dokud se data nenačtou

**Toto je bug nezávislý na subdomain** — ovlivňuje i `carmakler.cz/nabidka`.

### Scénář 4: Client-side navigace (Link) nefunguje na subdomain

Pokud uživatel klikne `<Link href="/nabidka">` na inzerce landing page, Next.js provede client-side navigaci. RSC flight data request jde na `inzerce.carmakler.cz/nabidka` — middleware to rewrituje na `/nabidka`, ale RSC response může mít issue s routing metadata pokud se liší subdomain routing od expected page tree.

**Ověření:** Otestovat navigaci přes Link vs. přímý URL vstup.

---

## Doporučené opravy

### FIX-1: Performance fix pro `/nabidka` (CRITICAL)

Přidat DB-level pagination místo in-memory:

```tsx
// PŘED (špatně):
prisma.vehicle.findMany({ where: vehicleWhere, orderBy: ... })
// → vrací VŠECHNY záznamy

// PO (správně):
prisma.vehicle.findMany({ where: vehicleWhere, orderBy: ..., skip, take: limit })
// → vrací jen 18 záznamů pro aktuální stránku
```

**Soubor:** `app/(web)/nabidka/page.tsx`
**Rozsah:** ~15 řádků (přesunout `skip`/`take` do prisma query, smazat JS slice)

### FIX-2: Smazat redirect, nasměrovat přímo

Místo `/inzerce/katalog` → redirect `/nabidka` s loading.tsx uprostřed, přesměrovat rovnou v middleware:

```tsx
// V middleware.ts, přidat PŘED getRewriteUrl:
if (subdomain === "inzerce" && pathname === "/katalog") {
  const response = NextResponse.rewrite(new URL("/nabidka", request.url));
  response.headers.set("x-subdomain", subdomain);
  return response;
}
```

Tím se vyhne loading.tsx spinneru — middleware rewrite je instantní, stránka `/nabidka` se renderuje rovnou.

**Alternativa:** Smazat `app/(web)/inzerce/katalog/` celý adresář (page.tsx + loading.tsx). Middleware rewrite pokryje `/katalog` → `/nabidka`.

### FIX-3: SITE_PASSWORD gate pro subdomény

Ověřit, zda gate redirect funguje na subdoménách. Pokud `/gate` page neexistuje pod `/inzerce/gate`, přidat `/gate` do `SKIP_REWRITE_PREFIXES`:

```tsx
const SKIP_REWRITE_PREFIXES = [
  // ... existing
  "/gate",  // ← přidat
];
```

---

## Checklist pro fix

1. [ ] Ověřit: vidí uživatel NÁŠ spinner (oranžový, "Načítání katalogu...") nebo browser error?
2. [ ] Pokud náš spinner → problém je v redirect chain nebo /nabidka performance
3. [ ] Pokud browser error → problém je infrastruktura (viz Task #15)
4. [ ] FIX-1: Přidat DB-level pagination do `/nabidka` page
5. [ ] FIX-2: Přesunout /katalog redirect do middleware (eliminovat loading.tsx flash)
6. [ ] FIX-3: Přidat `/gate` do SKIP_REWRITE_PREFIXES
7. [ ] Test: `inzerce.localhost:3000/katalog` → zobrazí katalog vozidel
8. [ ] Test: `inzerce.localhost:3000/nabidka` → zobrazí katalog vozidel
9. [ ] `npm run build` projde bez chyb

---

## Závěr

Existují 4 možné příčiny "nekonečného načítání":

| Příčina | Pravděpodobnost | Ověření |
|---------|-----------------|---------|
| Infrastruktura (DNS/Nginx/SSL) | VYSOKÁ | `dig inzerce.carmakler.cz`, `curl -I https://inzerce.carmakler.cz` |
| SITE_PASSWORD gate | STŘEDNÍ | Zkontrolovat produkční `.env` |
| /nabidka DB performance | STŘEDNÍ | Zkontrolovat počet záznamů v DB, měřit query time |
| Client-side RSC navigace | NÍZKÁ | Testovat Link klik vs. přímý URL |

**Nejjistější oprava:** Kombinace FIX-1 (DB pagination) + FIX-2 (middleware redirect místo page redirect) + FIX-3 (gate skip) eliminuje 3 ze 4 příčin. Infrastruktura (4. příčina) vyžaduje server přístup.
