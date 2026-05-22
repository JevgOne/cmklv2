# QA Report — Task #18: Autoservisy MVP

**Datum:** 2026-05-22  
**Commit:** b4dff04  
**Výsledek: FAIL ❌ — BLOCKER: migrace chybí**

---

## 1. KRITICKÝ PROBLÉM — Migrace nevytvořena

**Acceptance criteria:** "Úspěšná migrace (`npx prisma migrate dev`)" ❌

`prisma/schema.prisma` přidává 2 nové modely (AutoServis + ServisReview) + 3 User relace, ale **žádná migration nebyla commitnuta**.

```
Poslední migrace: 20260520210000_add_extended_vehicle_fields (2026-05-20)
Commit b4dff04: 2026-05-22 — žádný soubor v prisma/migrations/
```

**Důsledek:** DB tabulky `AutoServis` a `ServisReview` NEEXISTUJÍ. Veškerá API volání na těchto modelech crashnou s Prisma chybou.

**Fix:**
```bash
npx prisma migrate dev --name add_autoservisy
# commitnout prisma/migrations/...add_autoservisy/
```

---

## 2. Simplify kontrola

### ⚠️ Admin PUT bez Zod validace (`app/api/admin/autoservisy/route.ts`)

```ts
const { id, ...data } = body;
await prisma.autoServis.update({ where: { id }, data });  // raw passthrough
```

Žádný Zod schema — admin může přepsat libovolné pole včetně `slug`, `source`, atd.  
**Závažnost:** LOW (pouze ADMIN/BACKOFFICE role), ale doporučuji přidat whitelist polí.

### ⚠️ Admin sidebar — špatná sekce

Autoservisy přidány do Blog sekce (vedle ai-drafts, comments, tags). Funkční, ale nesémantické.

### ⚠️ Recenze pagination nekompletní

`const [reviews] = useState(initialReviews)` — žádný setter, žádné "Načíst více".  
`totalReviews` prop přijat ale nevyužit v UI.  
**Závažnost:** LOW pro MVP (do 20 recenzí), ale při růstu bude problém.

---

## 3. Debug kontrola

**Lint:** 0 errors na všech 9 souborech (API routes, pages, komponenty) ✅

---

## 4. Reverzní kontrola vs. plán

### Prisma schema

| Požadavek | Status |
|---|---|
| AutoServis model — všechna pole dle spec | ✅ |
| ServisReview model — všechna pole dle spec | ✅ |
| User relace: ownedServisy, addedServisy, servisReviews | ✅ |
| Cascade delete (ServisReview při smazání AutoServisu) | ✅ |
| 8 indexů na AutoServis (city, isPublished, averageRating, …) | ✅ |
| 4 indexy na ServisReview (servisId, isPublished, rating, authorUserId) | ✅ |
| **Migrace vytvořena** | ❌ CHYBÍ |

### API routes

| Endpoint | Status | Poznámka |
|---|---|---|
| GET /api/autoservisy | ✅ | city/category/tier/insurance/rating/search filtry |
| POST /api/autoservisy | ✅ | Zod validace, slug = name+city, auth required |
| GET /api/autoservisy/[id] | ✅ | ID nebo slug lookup |
| GET /api/autoservisy/[id]/reviews | ✅ | Paginace, jen published |
| POST /api/autoservisy/[id]/reviews | ✅ | Zod validace, isPublished:false (STOP-3) |
| PUT /api/admin/autoservisy | ⚠️ | Funkční, bez Zod (raw body) |
| PUT /api/admin/autoservisy/reviews/[id] | ✅ | Auth check, rating recalculation |
| DELETE /api/admin/autoservisy/reviews/[id] | ✅ | Auth check |

### Veřejné stránky

| Stránka | Status | Poznámka |
|---|---|---|
| /autoservisy — seznam + hero | ✅ | Filtry v ServisyList komponentě |
| /autoservisy/[slug] — detail | ✅ | generateMetadata, breadcrumbs, kontakt |
| JSON-LD AutoRepair na detailu | ✅ | Včetně AggregateRating (podmíněně) |
| Cross-linking "Hledáte auto?" | ✅ | Sidebar na detail stránce |
| loading.tsx + not-found.tsx | ✅ | |
| OG obrázek (options, ne { ...size }) | ✅ | |
| město/kategorie landing pages | ⚠️ | Není — STOP-5: MVP skip (OK) |

### Admin

| Požadavek | Status |
|---|---|
| /admin/autoservisy page | ✅ |
| AdminServisyTable — toggle isVerified/isPublished/isFeatured | ✅ |
| Pending reviews count na servisu | ✅ |
| Admin sidebar odkaz | ✅ (špatná sekce, ale funkční) |
| Admin může schválit/odmítnout recenzi | ✅ |
| Rating recalculation po approve | ✅ |

### STOP pravidla

| STOP | Status |
|---|---|
| STOP-1: Žádné platby/transakce | ✅ |
| STOP-2: Žádné scrapované recenze | ✅ |
| STOP-3: isPublished: false na recenzi | ✅ (komentář v kódu) |
| STOP-4: Slug z name+city | ✅ |
| STOP-5: Město/kategorie landing = Fáze 2 | ✅ |
| STOP-6: Žádný claim flow | ✅ |

### Slugify — české diakritiky

`slugify()` v `lib/utils.ts`: `.normalize("NFD")` + strip diacritics ✅  
"Auto Kovář Praha 4" → "auto-kovar-praha-4" ✅

---

## Acceptance Criteria

| Kritérium | Status |
|---|---|
| AutoServis + ServisReview v Prisma schema | ✅ |
| **Úspěšná migrace** | ❌ CHYBÍ |
| /autoservisy zobrazuje seznam | ✅ (runtime selže bez migrace) |
| Filtrování město/kategorie | ✅ |
| /autoservisy/[slug] detail + recenze | ✅ |
| Recenze formulář → DB s isPublished:false | ✅ |
| Admin /admin/autoservisy CRUD | ✅ |
| Admin schválení/odmítnutí recenze | ✅ |
| OG obrázek | ✅ |
| JSON-LD AutoRepair | ✅ |
| npm run build projde | ⚠️ neověřeno (blokuje migrace) |
| České diakritiky v slugech | ✅ |

---

## Závěr

Implementace je **kvalitní a kompletní** — schema, API, stránky, admin panel odpovídají plánu. Jediný **BLOCKER** je chybějící migrace. Po `prisma migrate dev` bude Task PASS.

**Akce:** `npx prisma migrate dev --name add_autoservisy` + commit migration souboru.
