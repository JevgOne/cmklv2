# Plan — TASK-056/057/058 · /profil/[slug] vylepšení

**Scope:** Sjednotit vehicle karty (056), jazyky makléře (057), prodaná auta (058).
**Scope target:** `/profil/[slug]` (unified broker profile; `/makler/[slug]` je redirect).
**Žádné DB migrace.** Všechna potřebná pole již v schematu existují.

---

## Baseline (co už existuje)

| Pole | Místo | Stav |
|---|---|---|
| `User.languageSkills` | `prisma/schema.prisma:53` (Json?, `["čeština", ...]`) | Existuje + `/muj-ucet/profil` ho umí editovat (tlačítka, radky 420-428) + `getProfileData` ho selectuje |
| `User.totalSales` | `prisma/schema.prisma:35` (Int, default 0) | Gamifikace ho inkrementuje v `lib/gamification.ts:211-214` přes `calculateLevel` |
| `Vehicle.status = "SOLD"` | `prisma/schema.prisma:266` | Je v enum stringu; `api/broker/detailed-stats` ho používá (`route.ts:32`) |
| `Vehicle.soldAt` | `prisma/schema.prisma:317` | DateTime? — pro "prodáno kdy" |
| `Listing.status` | `prisma/schema.prisma:695` | Taky má `SOLD` |
| `stats.totalSales` v heru | `ProfileClient.tsx:330-332` | **UŽ se renderuje** jako "Prodeje" badge (`value={stats.totalSales}`) — ale jenom když `> 0` |
| `VehicleCard` | `components/web/VehicleCard.tsx` | Sdílená komponenta, vyžaduje `VehicleData` (23 polí, ~12 required) |
| Grid `/nabidka` | `app/(web)/nabidka/page.tsx:294` | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` |
| Grid profil vozidla | `ProfileClient.tsx:626` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` + custom `ProfileItemCard` (overlay + komentáře) |

---

## TASK-056 — Sjednotit vehicle karty

### Stav
- Profile `ProfileItemCard` (ProfileClient.tsx:830-889) je aspect-square s overlay textem + LikeButton/CommentSection pod kartou.
- `/nabidka` VehicleCard je aspect-[4/3], má: badge pill, TrustScore, favorite/compare button, hero price, "Detail →" CTA.
- Datový gap: API `/api/profile/[slug]/items` (tab="vehicles", route.ts:28-49) vrací: `id, slug, brand, model, year, price, mileage, fuelType, city, images[url], _count`.
- **Chybí:** `transmission`, `enginePower` (pro `hp`), `variant`, `trustScore`, `sellerType`, `broker` (pro `brokerName`).

### Strategie — **(A) Sdílet `VehicleCard`** ✓
Jediná možnost konzistentní UX. Strategie B (sladit styl) by zduplikovala 150 řádků JSX a badge logiku — nevyplácí se. Prop count je ~12 required, ale všechny fields máme v DB — jen je API nevyzvedává.

### Úpravy souborů

**1. `app/api/profile/[slug]/items/route.ts` (tab `"vehicles"` + `"listings"`)**
Rozšířit `select` o chybějící pole + `broker`:

```ts
// vehicles branch
select: {
  id: true, slug: true, brand: true, model: true, variant: true, year: true,
  price: true, mileage: true, fuelType: true, transmission: true,
  enginePower: true, trustScore: true, sellerType: true, city: true,
  images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
  broker: { select: { firstName: true, lastName: true } },
  _count: { select: { profileLikes: true, profileComments: true } },
},
```
Analogicky pro `listings` (+ `listingType`, `isPremium`, `user` pro `companyName/firstName/lastName`).

**2. `app/(web)/profil/[slug]/ProfileClient.tsx`**
- Import `VehicleCard` + `VehicleData` + fuel/transmission label mapy (vyextrahovat z `nabidka/page.tsx` do `lib/vehicle-labels.ts` — sdílený helper, odstraňuje duplicity).
- V `ProfileItemCard` pro `type === "vehicle"` | `"listing"` mapovat item → `VehicleData` a renderovat `<VehicleCard car={...} />`.
- **Zachovat** LikeButton + CommentSection pod kartou (profile-specific; VehicleCard je nemá) — wrap do `<div>`.
- Grid už je `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` — sladit na `gap-6` (/nabidka) pro pixel-konzistenci.
- Pro tab `parts` a `liked`/`flip`/`investment` nechat současný `ProfileItemCard` (jiný obsah, není to vozidlo).

**Skeleton (v `ProfileItemCard`):**
```tsx
if (type === "vehicle" || type === "listing") {
  const car: VehicleData = mapItemToVehicleData(item, type);
  return (
    <div>
      <VehicleCard car={car} />
      <div className="flex items-center gap-3 mt-2 px-0.5">
        <LikeButton {...entityProps} initialCount={likeCount} size="sm" />
        {commentCount > 0 && <span className="text-xs text-gray-400">💬 {commentCount}</span>}
      </div>
      <CommentSection {...entityProps} initialCount={commentCount} />
    </div>
  );
}
```

### Akceptace
1. Vehicle karta na `/profil/[slug]` má stejný vizuál jako na `/nabidka` (aspect 4/3, badge vlevo nahoře, TrustScore vlevo dole, favorite+compare vpravo, price + "Detail →").
2. Klik na kartu vede na `/nabidka/[slug]` (ne na listing detail jinou cestou).
3. LikeButton + CommentSection zůstávají funkční pod kartou.
4. API vrací `transmission`, `enginePower`, `trustScore`, `variant` pro profil items.
5. `npm run lint` + `npm run build` projdou; typescript-strict.

---

## TASK-057 — Jazyky makléře

### Stav
- `User.languageSkills` Json? existuje; `getProfileData` ho selectuje; `ProfileClient.tsx:476-479` ho už renderuje jako **plain text** (`{languages.join(", ")}`) v sekci "Specializace".
- Šedé/modré/oranžové badge pattern už ve stejné sekci pro služby a specializace.

### Strategie — **(B) Sladit styl** ✓
Jazyky už renderujeme, jen nejsou tagy. Kosmetická změna, ne feature.

### Úpravy souborů

**`app/(web)/profil/[slug]/ProfileClient.tsx` (block 471-480)**

```tsx
{languages.length > 0 && (
  <div>
    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
      Jazyky
    </h3>
    <div className="flex flex-wrap gap-1.5">
      {languages.map((lang) => (
        <span
          key={lang}
          className="text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full"
        >
          {lang}
        </span>
      ))}
    </div>
  </div>
)}
```

Styl = copy ze specializací (orange-50/orange-700), aby vypadaly jednotně s brand barvou.

### Akceptace
1. Sekce "Jazyky" v "Specializace" kartě renderuje oranžové pill tagy (stejný styl jako Specializace).
2. Pokud `languageSkills` je `[]` / `null`, sekce se neobjeví (`hasSpecCard` guard už existuje).
3. Existující editor v `/muj-ucet/profil` (linka 420+) beze změny → změny se propagují.

---

## TASK-058 — Prodaná auta

### Stav
- `stats.totalSales` (z `User.totalSales`) **už se renderuje** v hero rowu (ProfileClient.tsx:330) jako "Prodeje" badge — ale jen když `> 0`.
- `User.totalSales` udržuje `lib/gamification.ts` po každé SOLD události.
- **Ale** `page.tsx` (linka 60-102) nemá `prisma.vehicle.count({ status: "SOLD", brokerId })` — `totalSales` se čte pouze z `User.totalSales` sloupce.

### Strategie — **(A) Hero metric + label "Prodáno"** ✓
Uživatel chce metriku, ne sekci s historií. `User.totalSales` je source of truth (udržovaný gamifikací). Žádná DB migrace.

**Rozhodnutí:** label "Prodáno" (ne "Prodeje" — uživatel chce konkrétní wording) a nezatajovat když `= 0` pro BROKER/MANAGER (zero-state "0 Prodáno" je motivační signál).

### Úpravy souborů

**1. `app/(web)/profil/[slug]/ProfileClient.tsx` (block 330-332)**
Změnit label + zobrazovat vždy pro makléřské role:

```tsx
// místo:
// {stats.totalSales > 0 && <Stat value={stats.totalSales} label="Prodeje" />}

{(user.role === "BROKER" || user.role === "MANAGER" ||
  user.role === "REGIONAL_DIRECTOR") && (
  <Stat value={stats.totalSales} label="Prodáno" />
)}
```

**2. Volitelné zpřesnění — `app/(web)/profil/[slug]/page.tsx`**
Pokud chceme **authoritative count přímo z DB** (obejít `User.totalSales` drift):

```ts
// přidat do Promise.all:
prisma.vehicle.count({
  where: { brokerId: user.id, status: "SOLD" },
}),
// + pro listings:
prisma.listing.count({
  where: { userId: user.id, status: "SOLD" },
}),
```
Pak `stats.totalSales = vehicleSoldCount + listingSoldCount` místo `user.totalSales`.

**Doporučení:** udělat zpřesnění #2 — gamifikace může zaostávat (cron/event), `count()` je real-time a levný (1 index scan).

### Akceptace
1. Hero rowu pro BROKER/MANAGER/REGIONAL_DIRECTOR vždy ukazuje "X Prodáno".
2. Hodnota = `Vehicle.count(status=SOLD, brokerId) + Listing.count(status=SOLD, userId)` (pokud aplikujeme #2).
3. Pro ostatní role (INVESTOR, VERIFIED_DEALER, ADVERTISER, ...) se "Prodáno" neukazuje — jejich role-stats už mají vlastní metriky.
4. Zero state ("0 Prodáno") se zobrazí místo skrytí.

### STOP triggers — NEAKTIVNÍ
- Žádná DB migrace nepotřeba ✓
- Žádná nová tabulka ✓
- VehicleCard má 12 required props — API je umí dodat (po rozšíření `select`) ✓

---

## Závislosti & pořadí

1. **TASK-057** (self-contained, 15 min) — dělat první, zero risk.
2. **TASK-058** (hero stat + optional DB count, 20 min) — nezávislé.
3. **TASK-056** (API expand + VehicleCard integrace, 60-90 min) — největší, dělat last.
   - Sub-krok: extract `fuelLabels`/`transmissionLabels` do `lib/vehicle-labels.ts` (cleanup, používá je i `/nabidka/page.tsx`).

## Testování
- Manual: `/profil/jan-novak` (seed broker) — vidět 3 tabs, vozidla jako VehicleCard, oranžové language tags, "Prodáno X" v hero.
- Build: `npm run build` musí projít (TS strict).
- Existující Playwright testy (pokud pokrývají profil) — reread `tests/e2e/profile*.spec.ts`.
