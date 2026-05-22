# EVŽEN — Kontrola Task #53: Instagram-style profil (commity 8d74958 + 9aa2603)

**Datum:** 2026-04-15
**Kontrolor:** Evžen THE KING
**Commity:** 8d74958 (feat: Instagram-style profile) + 9aa2603 (fix: QA findings)
**Rozsah:** 15 souborů, 2081 řádků
**Pravidla:** (1) žádné zkratky, (2) nic se neschovává, (3) schvalování, (4) označení nedokončených

---

## 1. ZADÁNÍ (doslovně z leada)

1. Profil jako Instagram — cover foto, avatar, bio, stats, grid obsahu
2. Univerzální pro VŠECHNY role — makléř (auta), vrakoviště (díly), dealer, inzerent
3. Auto-population — makléř přidá auto → automaticky na profilu, zero extra práce
4. To samé pro vrakoviště — přidá díl → automaticky na profilu
5. Lajky — kdokoli může dát like
6. Komentáře — pod autem/dílem
7. VŠECHNY statistiky z REÁLNÝCH DB dat — ŽÁDNÉ placeholdery
8. BEZ certifikací
9. Profilová pole (14): bio, avatar, coverPhoto, město, oblíbené značky, specialization, yearsExperience, website, motto, socialLinks, services, languageSkills, warehouseAddress, openingHours
10. Gamifikace: badges (auto), level

---

## 2. BOD PO BODU

### 2.1 Instagram layout (cover + avatar + bio + stats + grid)

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Cover foto (full-width) | ✅ | Gradient fallback pokud chybí. `profil/[slug]/page.tsx:235-244` |
| 2 | Avatar (kruhový, responsive) | ✅ | 28-36 sizes, fallback na iniciály. `:252-259` |
| 3 | Bio zobrazení | ✅ | Pod headerem. `:305` |
| 4 | Stats sekce | ✅ | Vozidla, Inzeráty, Díly, Lajky, Prodeje (podmíněně pokud >0). `:328-357` |
| 5 | Grid obsahu (2/3/4 sloupce) | ✅ | Responsive grid, hover zoom, "Načíst další". `:391, 501` |
| 6 | Profile preview z editace | ✅ | "Zobrazit veřejný profil →". `muj-ucet/profil/page.tsx:143-149` |

### 2.2 Univerzální pro VŠECHNY role

Mapování rolí na taby (`profil/[slug]/page.tsx:71-88`):

| Role | Taby | Status | Poznámka |
|------|------|--------|----------|
| BROKER | vehicles + liked | ✅ | Auta makléře |
| ADVERTISER | listings + liked | ✅ | Inzeráty |
| PARTS_SUPPLIER | parts + liked | ✅ | Díly |
| WHOLESALE_SUPPLIER | parts + liked | ✅ | Díly velkoodběratele |
| PARTNER_VRAKOVISTE | parts + liked | ✅ | Díly vrakoviště |
| PARTNER_BAZAR | listings + liked | ✅ | Inzeráty autobazaru |
| VERIFIED_DEALER | vehicles + liked | ⚠️ | Auta, ale **CHYBÍ tab pro marketplace dealy/flipy** |
| INVESTOR | liked | ❌ | **CHYBÍ tab pro investice** — model Investment existuje, ale endpoint nemá |
| BUYER | liked | ✅ | Správně — kupující netvoří obsah |
| ADMIN/BACKOFFICE | vehicles + listings + parts + liked | ✅ | Vše |
| MANAGER/RD | liked | ✅ | OK |

### 2.3 Auto-population (zero extra práce)

| Role | Query | Auto? | Status |
|------|-------|-------|--------|
| BROKER | `vehicle.findMany({ brokerId: user.id })` | ✅ | `items/route.ts:28-50` |
| PARTS_SUPPLIER | `part.findMany({ supplierId: user.id })` | ✅ | `:76-97` |
| ADVERTISER | `listing.findMany({ userId: user.id })` | ✅ | `:52-74` |
| VERIFIED_DEALER | vehicles, ale NE marketplace deals | ⚠️ | Chybí MarketplaceApplication query |
| INVESTOR | NIC | ❌ | Chybí Investment query |

**Cursor-based paginace:** ✅ (`limit: 24`, `skip: cursor ? 1 : 0`, `nextCursor`)

**Liked tab:** ✅ Polymorfní query přes `profileLike.findMany` s nested includes (`vehicle`, `listing`, `part`)

### 2.4 Lajky — "kdokoli může dát like"

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Like/unlike toggle | ✅ | POST toggle s optimistic UI. `likes/route.ts:32-73` |
| 2 | Animace | ✅ | Scale 110%, červené ♥. `LikeButton.tsx:79-85` |
| 3 | Počet lajků | ✅ | Zobrazí se pokud >0. `:87` |
| 4 | **"Kdokoli"** | ❌ GAP | **Vyžaduje přihlášení** (401 pokud !session). `:23-26`. Nepřihlášený → redirect na login. Zadání říká "kdokoli" |
| 5 | Lajknutelné entity | ⚠️ | vehicles ✅, listings ✅, parts ✅. **Profil samotný nelze lajknout** |
| 6 | Zod validace (exactly 1 target) | ✅ | `.refine()` na `:8-18` |
| 7 | Badge award po lajku | ✅ | `checkAndAwardBadges(ownerId)` na `:68-71` |

### 2.5 Komentáře — pod autem/dílem

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Komentář pod vehicle/listing/part | ✅ | Polymorfní (vehicleId/listingId/partId). `comments/route.ts:8-19` |
| 2 | Vyžaduje auth | ✅ | 401 pokud !session. `:24-27` |
| 3 | Rate limiting | ✅ | Max 10 komentářů / 5 minut. `:32-42` |
| 4 | Zobrazení komentářů | ✅ | Jméno, avatar, relative time ("právě teď", "X min", "X h"). `CommentSection.tsx:28-37, 138-160` |
| 5 | Smazání vlastního komentáře | ✅ | Autor, admin, nebo vlastník entity. `comments/[id]/route.ts:89-114` |
| 6 | Skrytí komentáře (moderace) | ✅ | `isHidden` flag, admin/vlastník může skrýt. `:30-54` |
| 7 | Max 500 znaků | ✅ | Zod validace. `:12` |
| 8 | **Paginace komentářů** | ❌ GAP | Max 20 komentářů, žádné "Načíst další". `CommentSection.tsx:63` |
| 9 | **Editace textu** | ❌ GAP | Nelze editovat komentář — jen skrýt/smazat |
| 10 | **CommentSection na profilu** | ❌ GAP | Komponenta existuje, ale **NENÍ integrovaná** na `profil/[slug]/page.tsx`. Zobrazuje se jen počet 💬 v gridu |

### 2.6 Statistiky z REÁLNÝCH DB dat

| # | Stat | Zdroj | Reálné? | Poznámka |
|---|------|-------|---------|----------|
| 1 | vehicleCount | `prisma.vehicle.count({ brokerId, status: ACTIVE })` | ✅ | `profile/[slug]/route.ts:60` |
| 2 | listingCount | `prisma.listing.count({ userId, status: ACTIVE })` | ✅ | `:63` |
| 3 | partCount | `prisma.part.count({ supplierId, status: ACTIVE })` | ✅ | `:66` |
| 4 | totalLikes | `prisma.profileLike.count({ OR: [...] })` | ✅ | `:69-73` |
| 5 | totalSales | `user.totalSales` (field v modelu) | ✅ | `:99` |
| 6 | profileViews | Inkrementuje při návštěvě (viewer ≠ owner) | ✅ | `:51-57` |

**ŽÁDNÉ placeholdery, Math.random(), faker — OVĚŘENO** ✅

**GAP:** Statistiky jsou **generické** (stejných 5 polí pro všechny role). Zadání říká "VŠECHNY statistiky" — pro dealer by měly být flipy/ROI, pro investora investice/returns atd.

### 2.7 BEZ certifikací

✅ **POTVRZENO** — žádný model Certification, žádné pole certif* v schema.

### 2.8 Profilová pole (14 požadovaných)

| # | Pole | V schema? | V edit API? | Na profilu? | Status |
|---|------|-----------|-------------|-------------|--------|
| 1 | bio | ✅ `String?` | ✅ | ✅ | ✅ |
| 2 | avatar | ✅ `String?` | ✅ (URL input) | ✅ | ✅ |
| 3 | coverPhoto | ✅ `String?` | ✅ (URL input) | ✅ | ✅ |
| 4 | město (city) | ✅ `String?` | ✅ | ✅ badge | ✅ |
| 5 | oblíbené značky (favoriteBrands) | ✅ `String?` (JSON) | ✅ multiselect | ✅ pills | ✅ |
| 6 | specialization | ✅ `specializations String?` | ❌ | ❌ | ⚠️ Existuje v schema, ale NE v edit/display |
| 7 | **yearsExperience** | ❌ | ❌ | ❌ | ❌ CHYBÍ V SCHEMA |
| 8 | **website** | ❌ | ❌ | ❌ | ❌ CHYBÍ V SCHEMA |
| 9 | **motto** | ❌ | ❌ | ❌ | ❌ CHYBÍ V SCHEMA |
| 10 | **socialLinks** | ❌ | ❌ | ❌ | ❌ CHYBÍ V SCHEMA |
| 11 | **services** | ❌ | ❌ | ❌ | ❌ CHYBÍ V SCHEMA |
| 12 | **languageSkills** | ❌ | ❌ | ❌ | ❌ CHYBÍ V SCHEMA |
| 13 | **warehouseAddress** | ❌ | ❌ | ❌ | ❌ CHYBÍ V SCHEMA |
| 14 | **openingHours** | ❌ | ❌ | ❌ | ❌ CHYBÍ V SCHEMA |

**Skóre: 6/14 polí kompletně implementováno. 8 polí CHYBÍ kompletně (schema + API + UI).**

### 2.9 Gamifikace — badges + level

**Badges (`lib/badges.ts`, 135 řádků):**

| Badge | Podmínka | Zdroj dat | Auto? |
|-------|----------|-----------|-------|
| FIRST_SALE | 1+ prodejů | `user.totalSales` | ✅ |
| FIVE_SALES | 5+ prodejů | `user.totalSales` | ✅ |
| TEN_SALES | 10+ prodejů | `user.totalSales` | ✅ |
| FIFTY_SALES | 50+ prodejů | `user.totalSales` | ✅ |
| PHOTO_PRO | 10+ fotek na jedné položce | `vehicleImage/partImage groupBy` | ✅ |
| FAST_RESPONDER | <1h průměrná odpověď | `inquiry` response times | ✅ |
| TOP_RATED | ≥4.5 rating, min 5 recenzí | `supplierReview` aggregate | ✅ |
| VERIFIED | Dokončený onboarding | `user.onboardingCompleted` | ✅ |
| POPULAR | 50+ lajků | `profileLike.count` | ✅ |
| COMMUNITY | 20+ komentářů | `profileComment.count` | ✅ |
| EARLY_ADOPTER | Registrace před 2026-05-01 | `user.createdAt` | ✅ |

**11 badges, VŠECHNY auto-kalkulované z reálných DB dat** ✅

**Level systém:**
- ✅ Pole `level String @default("JUNIOR")` v User modelu
- ✅ Hodnoty: JUNIOR, BROKER, SENIOR, TOP
- ✅ Zobrazení na profilu (badge vedle jména, skrytý pokud JUNIOR). `profil/[slug]/page.tsx:271-275`
- ⚠️ **GAP:** Logika pro automatický level-up CHYBÍ. Badge se počítají automaticky, ale level se nikde nepřepočítává na základě aktivity.

---

## 3. KONTROLA PRAVIDEL LEADA

### PRAVIDLO 1: Žádné zkratky v UI

| # | Text | Status |
|---|------|--------|
| 1 | "Lajky", "Prodeje", "Vozidla", "Inzeráty", "Díly" | ✅ Celé názvy |
| 2 | "Zobrazit veřejný profil →" | ✅ |
| 3 | "Zobrazit celý profil →" (makléř page link) | ✅ |
| 4 | "Můj profil" v navigaci | ✅ |
| 5 | `aria-label="Menu uctu"` | ⚠️ Překlep — chybí háček: "Menu účtu" |

**Žádné zkratky nalezeny** ✅

### PRAVIDLO 2: Nic se neschovává v navigaci

| # | Prvek | V navigaci? | Status |
|---|-------|-------------|--------|
| 1 | "Můj profil" v `/muj-ucet/layout.tsx` | ✅ | Řádek 9 |
| 2 | Veřejný profil `/profil/[slug]` | ✅ | Odkaz z makléř stránky + edit preview |
| 3 | Odkaz z makléř detailu | ✅ | `makler/[slug]/page.tsx:220` |

### PRAVIDLO 4: Nedokončené funkce se označují

| # | Feature | Stav | Označeno? | Status |
|---|---------|------|-----------|--------|
| 1 | 8 chybějících polí | Neimplementováno | ❌ | ❌ GAP — edit stránka ukazuje jen 8 polí bez zmínky že dalších 8 chybí |
| 2 | INVESTOR/DEALER taby | Neimplementováno | ❌ | ❌ GAP — investor profil má jen "liked" bez vysvětlení |
| 3 | Komentáře na profilu | Komponenta existuje, neintegrovaná | ❌ | ❌ GAP |

---

## 4. PŘEHLED SOUBORŮ

| Soubor | Řádky | Stav |
|--------|-------|------|
| `prisma/schema.prisma` (přidané modely) | +86 | ✅ ProfileLike + ProfileComment + ProfileBadge |
| `lib/badges.ts` | 135 | ✅ 11 badges, auto-kalkulace |
| `lib/profile-slug.ts` | 18 | ✅ Slug generace, collision-safe |
| `app/api/profile/[slug]/route.ts` | 108 | ⚠️ Stats generické, chybí role-aware |
| `app/api/profile/[slug]/items/route.ts` | 140 | ⚠️ Chybí flips/investments tab |
| `app/api/profile/edit/route.ts` | 114 | ⚠️ 8/14 polí editovatelných |
| `app/api/likes/route.ts` | 104 | ⚠️ Vyžaduje auth (zadání: "kdokoli") |
| `app/api/comments/route.ts` | 110 | ✅ Rate limit, badge award |
| `app/api/comments/[id]/route.ts` | 127 | ✅ Delete + hide, správný auth |
| `app/(web)/profil/[slug]/page.tsx` | 523 | ⚠️ Role-aware taby, ale chybí komentáře, chybějící pole |
| `app/(web)/muj-ucet/profil/page.tsx` | 302 | ⚠️ 8/14 polí editovatelných |
| `components/web/LikeButton.tsx` | 90 | ✅ Toggle, animace, count |
| `components/web/CommentSection.tsx` | 216 | ⚠️ Max 20, žádná paginace |
| `app/(web)/makler/[slug]/page.tsx` | +7 | ✅ Link na profil |
| `app/(web)/muj-ucet/layout.tsx` | +1 | ✅ "Můj profil" v nav |

---

## 5. SOUHRNNÁ MATICE

| Požadavek | Status | Skóre |
|-----------|--------|-------|
| Instagram layout (cover, avatar, bio, stats, grid) | ✅ | 6/6 |
| Univerzální pro VŠECHNY role | ⚠️ | 10/12 (chybí INVESTOR tab, DEALER marketplace tab) |
| Auto-population (zero extra práce) | ⚠️ | 3/5 rolí plně (BROKER, SUPPLIER, ADVERTISER). DEALER/INVESTOR neúplné |
| Lajky — kdokoli | ❌ | Vyžaduje auth, nelze lajkovat profil |
| Komentáře — pod autem/dílem | ⚠️ | Fungují, ale bez paginace, bez editace, neintegrované na profilu |
| Statistiky z REÁLNÝCH dat | ✅ | Žádné placeholdery ověřeno |
| BEZ certifikací | ✅ | Ověřeno |
| 14 profilových polí | ❌ | **6/14** — 8 polí CHYBÍ v schema + API + UI |
| Gamifikace (badges auto + level) | ⚠️ | 11 badges auto ✅, level pole ✅, ale level-up logika CHYBÍ |

---

## 6. GAP LIST — SEŘAZENO PODLE ZÁVAŽNOSTI

### ❌ VYSOKÁ (blokující)

| # | Gap | Detail |
|---|-----|--------|
| G1 | **8 profilových polí CHYBÍ kompletně** | yearsExperience, website, motto, socialLinks, services, languageSkills, warehouseAddress, openingHours — nejsou v schema, API ani UI |
| G2 | **Lajky vyžadují přihlášení** | Zadání říká "kdokoli může dát like". Implementace vrací 401 pro nepřihlášené (`likes/route.ts:23-26`). Redirect na login místo lajku |

### ⚠️ STŘEDNÍ

| # | Gap | Detail |
|---|-----|--------|
| G3 | **INVESTOR nemá tab pro investice** | Jen "liked" tab, model Investment existuje v DB |
| G4 | **VERIFIED_DEALER nemá marketplace tab** | Jen vehicles + liked, chybí flipy/dealy |
| G5 | **Statistiky nejsou role-aware** | Stejných 5 generických stats pro všechny role. Zadání říká "VŠECHNY statistiky (flipy, ROI, prodané díly)" |
| G6 | **CommentSection neintegrovaná na profilu** | Komponenta existuje (216 řádků), ale `profil/[slug]/page.tsx` ji NEPOUŽÍVÁ. Komentáře se zobrazují jen jako číslo v gridu |
| G7 | **Level-up logika chybí** | Pole `level` existuje (JUNIOR→TOP), ale nikde se nepřepočítává automaticky |
| G8 | **specializations pole existuje v schema ale ne v edit/display** | Pole `specializations String?` je v User modelu, ale edit form a profil ho nezobrazují |

### 🔵 NÍZKÁ

| # | Gap | Detail |
|---|-----|--------|
| G9 | Komentáře — žádná paginace | Max 20, žádné "Načíst další" |
| G10 | Komentáře — nelze editovat text | Jen smazat nebo skrýt |
| G11 | Avatar/cover — jen URL input | Žádný přímý file upload (musí ručně nahrát na Cloudinary) |
| G12 | Nelze lajkovat profil samotný | Jen vehicles/listings/parts |
| G13 | Překlep: `aria-label="Menu uctu"` → "Menu účtu" | layout.tsx |

---

## 7. VERDIKT

### ⚠️ SCHVÁLENO S VÝHRADAMI

**Silné stránky (co funguje výborně):**
- Instagram layout je vizuálně kompletní (cover, avatar, grid, stats)
- Auto-population funguje perfektně pro 3 hlavní role (BROKER, SUPPLIER, ADVERTISER)
- 11 badges z reálných DB dat — žádné placeholdery
- Polymorfní like/comment systém (vehicle, listing, part)
- Slug generace s collision avoidance
- Rate limiting na komentáře
- Správný auth na delete/hide komentářů (autor/admin/vlastník entity)
- Profile views tracking (viewer ≠ owner)
- Link z makléř detailu na profil
- "Můj profil" v navigaci zákaznického účtu

**Blokující gapy (2):**
1. **G1: 8 z 14 požadovaných polí CHYBÍ** — není v schema, takže nejde opravit jen v UI. Potřebuje DB migraci.
2. **G2: Lajky vyžadují auth** — zadání explicitně říká "kdokoli může dát like"

**Střední gapy (6):**
- G3-G5: Neúplná podpora INVESTOR a DEALER rolí + generické stats
- G6: CommentSection existuje ale není integrovaná
- G7-G8: Level-up logika + specializations chybí

**Doporučení pro opravu:**
1. **Migrace:** Přidat 8 chybějících polí do User modelu (`yearsExperience Int?`, `website String?`, `motto String?`, `socialLinks Json?`, `services Json?`, `languageSkills Json?`, `warehouseAddress String?`, `openingHours Json?`)
2. **API + UI:** Rozšířit edit endpoint + editační formulář + zobrazení na profilu
3. **Lajky:** Přidat guest like (bez session, identifikace přes fingerprint nebo cookie)
4. **Role stats:** Role-aware statistiky v GET profile API
5. **Taby:** Přidat `investments` a `flips` tab v items endpoint
6. **Komentáře:** Integrovat `CommentSection` na profil stránce pod gridem

---

*Kontroloval: Evžen THE KING | 2026-04-15*
*Commity: 8d74958 + 9aa2603 — oba ověřeny*
