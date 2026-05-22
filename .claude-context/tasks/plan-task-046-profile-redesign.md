# Plán: TASK-046 — Profil makléře — kompletní redesign

**Datum:** 2026-04-25
**Autor:** Plánovač
**Priorita:** 1
**Závislosti:** TASK-044 (kariérní systém s hvězdičkami) — musí být hotový první
**Odhadovaný rozsah:** ~15 souborů, VELKÝ task

---

## Kontext

Stávající profil makléře zobrazuje:
- LevelProgressBar s obratovými prahy (`LevelProgressBar.tsx`)
- Badge s hvězdičkovou úrovní (`LevelBadge.tsx`) — **už existuje po TASK-044**
- Statistiky (vozidla, inzeráty, díly, lajky, prodáno)
- Cover photo + avatar + bio + specializace + kontakt

**Co uživatel chce změnit:**
1. SMAZAT: progress bar na veřejném profilu (ukazuje obrat a prahy — citlivé)
2. SMAZAT: staré milníky/kroky (pokud existují — v aktuálním kódu už nejsou)
3. PŘIDAT: hvězdičkový badge (bez cen/procent) na veřejném profilu
4. PŘIDAT: reputační badge z recenzí (nový systém pro makléře)
5. PŘIDAT: Instagram-like layout
6. VYLEPŠIT: karty makléřů na homepage
7. DVA POHLEDY: veřejný (hvězdičky bez detailů) vs interní (obrat, %, provize)

---

## Stávající soubory

### Veřejný profil

| # | Soubor | Popis | Řádky |
|---|--------|-------|-------|
| 1 | `app/(web)/profil/[slug]/page.tsx` | Server component — fetch dat, SEO metadata | ~230 |
| 2 | `app/(web)/profil/[slug]/ProfileClient.tsx` | Client component — celý UI profilu | ~700+ |
| 3 | `components/ui/LevelProgressBar.tsx` | Progress bar s obratem a regionálními prahy | ~80 |

### Karty makléřů

| # | Soubor | Popis |
|---|--------|-------|
| 4 | `components/web/BrokerCard.tsx` | Karta makléře (homepage, directory, tag pages) |
| 5 | `components/web/BrokerGrid.tsx` | Grid s řazením (prodeje/úroveň/nejnovější) |
| 6 | `app/(web)/makleri/page.tsx` | Directory stránka s kartami |
| 7 | `app/(web)/page.tsx` (řádky 521-547) | Homepage sekce "TOP Makléři" |

### Gamifikace

| # | Soubor | Popis |
|---|--------|-------|
| 8 | `components/pwa/gamification/LevelBadge.tsx` | Hvězdičkový badge (⭐×N + "Makléř") |
| 9 | `components/pwa/gamification/AchievementCard.tsx` | Achievement kartička |
| 10 | `components/pwa/gamification/LeaderboardTable.tsx` | Leaderboard tabulka |

### PWA profil

| # | Soubor | Popis |
|---|--------|-------|
| 11 | `app/(pwa)/makler/stats/page.tsx` | Stats dashboard (544 řádků) — interní pohled |
| 12 | `components/pwa/profile/BrokerStats.tsx` | Mini stats karta |

### Recenze (stávající)

| # | Model | Popis |
|---|-------|-------|
| 13 | `SupplierReview` (prisma) | Recenze na dodavatele dílů (1-5 hvězd, text, orderId) |
| — | **BrokerReview** | **NEEXISTUJE** — potřeba vytvořit |

---

## Implementační plán

### Fáze 1: BrokerReview model + API (nový recenzní systém)

**Krok 1 — Prisma model** (`prisma/schema.prisma`)

```prisma
model BrokerReview {
  id        String   @id @default(cuid())
  brokerId  String
  broker    User     @relation("BrokerReviews", fields: [brokerId], references: [id])
  reviewerId String
  reviewer  User     @relation("ReviewerReviews", fields: [reviewerId], references: [id])
  vehicleId String?
  vehicle   Vehicle? @relation(fields: [vehicleId], references: [id])
  rating    Int      // 1-5
  text      String?
  isPublic  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([reviewerId, brokerId, vehicleId])
  @@index([brokerId])
}
```

Přidat do User modelu:
```prisma
brokerReviews     BrokerReview[] @relation("BrokerReviews")
reviewerReviews   BrokerReview[] @relation("ReviewerReviews")
```

**Krok 2 — API routes**

- `POST /api/broker/[id]/review` — prodejce hodnotí makléře po prodeji
- `GET /api/broker/[id]/reviews` — veřejný seznam recenzí

**Krok 3 — Agregované statistiky na User**

Přidat do User modelu:
```prisma
reviewCount    Int    @default(0)
reviewAvg      Float  @default(0)
```

Aktualizovat po každé nové recenzi (trigger v API route).

**STOP-1:** Migrace — `npx prisma migrate dev`. Pokud drift, řešit standardním `migrate reset --force` (dev only).

---

### Fáze 2: Veřejný profil — Instagram-like redesign

**Krok 4 — Nový layout `ProfileClient.tsx`**

Stávající layout:
```
[Cover photo]
[Avatar + Name + Role + Badges + LevelProgressBar]
[Stats row]
[Actions]
[About card]
[Specializations card]
[Contact card]
[Tabs + Items grid]
```

Nový Instagram-like layout:
```
[Cover photo — ponechat]
[Avatar (centrované) + Name + Role + City]
[Star badge (⭐-⭐⭐⭐⭐⭐) — BEZ obratů/procent]
[Reputation badge (★ 4.8 · 12 recenzí) — nový]
[Stats row (Instagram-style: 3-4 čísel v řadě)]
[Action buttons (Zavolat / Napsat / Sdílet)]
[Bio — kratší, pod stats]
[Tabs: Vozidla | Inzeráty | Recenze | O mně]
[Content grid]
```

**Klíčové změny:**

A. **SMAZAT `LevelProgressBar` z veřejného profilu** (řádek 384):
```diff
-  {user.role === "BROKER" && (
-    <LevelProgressBar level={user.level} totalRevenue={user.totalRevenue ?? 0} regionTier={user.regionTier} size="md" />
-  )}
```
Progress bar ukazuje obrat a prahy — **citlivé interní informace**, nemá co dělat na veřejném profilu.

B. **PONECHAT `LevelBadge`** — zobrazit hvězdičky (⭐×N) bez dalších detailů. Stávající Badge s `levelLabel` je OK, jen bez progress baru.

C. **PŘIDAT reputační badge** — nová komponenta:
```tsx
// components/web/ReputationBadge.tsx
interface ReputationBadgeProps {
  rating: number;    // 0-5 průměr
  reviewCount: number;
  size?: "sm" | "md";
}
```
Zobrazení: `★ 4.8 (12 recenzí)` — zlatá hvězda + číslo + počet

D. **Instagram-style stats** — centrované, bold čísla:
```tsx
<div className="flex justify-center gap-8 py-4">
  <Stat value={stats.totalSales} label="Prodejů" />
  <Stat value={stats.vehicles} label="Aktivní" />
  <Stat value={reviewCount} label="Recenzí" />
  <Stat value={stats.totalLikes} label="Lajků" />
</div>
```

E. **Nový tab "Recenze"** — přidat do `ROLE_TABS` pro BROKER:
```typescript
BROKER: ["vehicles", "reviews", "liked"],
```

F. **Recenze grid** — seznam recenzí s rating stars, text, jméno + datum:
```tsx
// components/web/BrokerReviewCard.tsx
interface BrokerReviewCardProps {
  rating: number;
  text: string | null;
  reviewerName: string;
  vehicleName: string | null;
  createdAt: string;
}
```

**Krok 5 — Centrování avataru** (Instagram-style)

Stávající: avatar vlevo, info vpravo (flex-row)
Nový: avatar centrovaný nahoře, info pod ním (flex-col, items-center)

```diff
- <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
+ <div className="flex flex-col items-center text-center">
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 ...">
```

**STOP-2:** Po implementaci otestovat na mobilu — Instagram-like layout musí být mobile-first a vypadat dobře na 375px šířce.

---

### Fáze 3: BrokerCard redesign

**Krok 6 — Vylepšit `BrokerCard.tsx`**

Stávající karta:
```
[Avatar (w-20) + Name + Badge + City]
[Stats grid (3 cols): Prodáno / Aktivní / Specializace]
[Bio (2 řádky)]
[Tags]
[Buttons]
```

Nový design — kompaktnější, Instagram-like:
```
[Avatar (w-16, centrovaný) + Star badge overlay]
[Name + City]
[Reputation badge (★ 4.8)]
[Mini stats row (Prodáno · Aktivní)]
[CTA button]
```

Změny:
- Menší avatar s hvězdičkovým badge jako overlay (v rohu)
- Reputační badge prominentně
- Bio odebrat z karty (příliš mnoho textu)
- Tags odebrat z karty (příliš mnoho detailů)
- Jeden CTA button místo dvou

**Krok 7 — Aktualizovat data v `BrokerCard` props**

Přidat do `BrokerCardBroker`:
```typescript
reviewAvg: number;
reviewCount: number;
```

Aktualizovat dotazy v `makleri/page.tsx` a `page.tsx` (homepage).

---

### Fáze 4: Dva pohledy — veřejný vs interní

**Krok 8 — Veřejný profil: POUZE vizuální hvězdičky**

Na veřejném profilu (`/profil/[slug]`):
- ✅ Zobrazit: hvězdičkový badge (⭐-⭐⭐⭐⭐⭐)
- ✅ Zobrazit: reputační badge (★ 4.8, 12 recenzí)
- ✅ Zobrazit: počet prodejů, aktivních vozidel, lajků
- ❌ NEZOBRAZOVAT: obrat, provize %, regionální prahy, progress bar
- ❌ NEZOBRAZOVAT: `totalRevenue`, `commissionRate`, `regionTier`

**Krok 9 — Interní pohled: PWA stats stránka (beze změn)**

PWA stránka `/makler/stats` již zobrazuje:
- Celkový obrat, provize, průměrná provize
- Progress bar k další hvězdičce s regionálními prahy
- Leaderboard, achievements
- **Toto NEMĚNIT** — interní pohled pro makléře samotné

**Krok 10 — Admin pohled: ponechat stávající**

Admin stránka `/admin/manager/brokers/[id]` ukazuje:
- Status, kontakt, vozidla, provize
- **Toto NEMĚNIT** — admin potřebuje vidět vše

---

### Fáze 5: Review submission flow

**Krok 11 — Kdy se žádá o recenzi?**

Po úspěšném prodeji (handover) poslat prodejci email s odkazem na hodnocení:

Soubor: `app/api/vehicles/[id]/handover/route.ts`

Po vytvoření Commission záznamu přidat:
```typescript
// Poslat email prodejci s odkazem na hodnocení makléře
await sendEmail({
  to: seller.email,
  subject: "Jak jste byli spokojeni s makléřem?",
  html: emailLayoutHTML(reviewRequestContent, ""),
});
```

**Krok 12 — Review formulář**

Nová stránka: `app/(web)/recenze/[token]/page.tsx`
- Token-based (nepřihlášený prodejce může hodnotit)
- 1-5 hvězd + volitelný text
- Jednoduchý formulář, max 500 znaků

---

## Přehled všech změn

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `prisma/schema.prisma` | EDIT | Přidat BrokerReview model + User fields (reviewCount, reviewAvg) |
| 2 | `app/api/broker/[id]/review/route.ts` | NOVÝ | POST: prodejce hodnotí makléře |
| 3 | `app/api/broker/[id]/reviews/route.ts` | NOVÝ | GET: veřejný seznam recenzí |
| 4 | `components/web/ReputationBadge.tsx` | NOVÝ | ★ 4.8 (12 recenzí) badge |
| 5 | `components/web/BrokerReviewCard.tsx` | NOVÝ | Kartička recenze |
| 6 | `app/(web)/profil/[slug]/ProfileClient.tsx` | EDIT | Instagram-like layout, smazat progress bar, přidat recenze tab |
| 7 | `app/(web)/profil/[slug]/page.tsx` | EDIT | Přidat reviewCount/reviewAvg do fetch |
| 8 | `components/web/BrokerCard.tsx` | EDIT | Kompaktnější design, reputation badge |
| 9 | `app/(web)/makleri/page.tsx` | EDIT | Přidat reviewAvg/reviewCount do dotazu |
| 10 | `app/(web)/page.tsx` | EDIT | Přidat reviewAvg/reviewCount pro homepage karty |
| 11 | `app/(web)/recenze/[token]/page.tsx` | NOVÝ | Review formulář (token-based) |
| 12 | `app/api/reviews/[token]/route.ts` | NOVÝ | GET/POST pro token-based review |
| 13 | `app/api/vehicles/[id]/handover/route.ts` | EDIT | Přidat email s žádostí o recenzi |
| 14 | `lib/role-labels.ts` | EDIT | Přidat "reviews" tab do ROLE_TABS |

## STOP pravidla

| # | Podmínka | Akce |
|---|----------|------|
| STOP-1 | Prisma migrace selže | Řešit drift standardním postupem |
| STOP-2 | Instagram layout nečitelný na mobilu 375px | Odladit breakpointy |
| STOP-3 | TASK-044 ještě není hotový | NELZE začít — hvězdičkový systém musí existovat |

## Acceptance criteria

1. ✅ Veřejný profil nezobrazuje obrat, provize %, progress bar
2. ✅ Veřejný profil zobrazuje hvězdičkový badge (⭐-⭐⭐⭐⭐⭐) bez finančních detailů
3. ✅ Veřejný profil zobrazuje reputační badge (★ X.X, N recenzí)
4. ✅ Tab "Recenze" na profilu makléře s kartami recenzí
5. ✅ Instagram-like centrovaný layout na mobilu
6. ✅ BrokerCard na homepage/directory obsahuje reputation badge
7. ✅ Prodejce dostane email s žádostí o recenzi po handoveru
8. ✅ Prodejce může hodnotit makléře přes token-based formulář
9. ✅ BrokerReview model v DB s rating 1-5 + volitelný text
10. ✅ PWA stats stránka (interní) — beze změn, stále zobrazuje obrat a provize
11. ✅ Admin pohled — beze změn

## Závislosti

- **TASK-044** (kariérní systém) — MUSÍ být dokončený, protože hvězdičkové úrovně (STAR_1-STAR_5) musí existovat v DB a gamifikaci
- **Žádné nové npm balíčky** — vše řešitelné stávajícími nástroji (Prisma, Next.js, Tailwind)
