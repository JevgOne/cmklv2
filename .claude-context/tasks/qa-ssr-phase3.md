# QA Report: SSR migrace Fáze 3 — uživatelský účet (commit 61454a6)

**Datum:** 2026-05-07  
**Reviewer:** kontrolor  
**Commit:** `61454a6ea82a21bf41527e9a540105958ee3d99d`  
**Rozsah:** 15 souborů — 10 page.tsx + 5 nových client islands

---

## A) Simplify kontrola

✅ **ČISTÝ REFACTOR**

- Čistá separace: SSR page fetches data → serializes → passes as props to client island
- Všechny `useEffect` + `fetch()` API cally odstraněny
- 5 čistě zaměřených client islands (jednoúčelové)
- 5 stránek je 100% SSR (dotazy, poptavky, muj-ucet, shop/objednavky, dily/objednavky)
- `oblibene/page.tsx` správně filtruje null listings před předáním do client

**Bonus fix:** `dily/moje-objednavky` — odkaz vracení/reklamace opraveny z `/shop/moje-objednavky/...` na správné `/dily/moje-objednavky/...` (bug zmíněn v plánu)

---

## B) Debug kontrola

**npm run build:** ✅ exit 0, 0 errors  
**npm run lint:** ✅ 0 errors, 684 warnings (ext. deps)

---

## C) Reverzní kontrola

### 1. Žádný "use client" na page.tsx (10/10)

| Stránka | "use client"? |
|---------|--------------|
| `muj-ucet/page.tsx` | ✅ NE |
| `muj-ucet/profil/page.tsx` | ✅ NE |
| `muj-ucet/oblibene/page.tsx` | ✅ NE |
| `muj-ucet/garaz/page.tsx` | ✅ NE |
| `muj-ucet/dotazy/page.tsx` | ✅ NE |
| `muj-ucet/poptavky/page.tsx` | ✅ NE |
| `moje-inzeraty/page.tsx` | ✅ NE |
| `moje-inzeraty/[id]/page.tsx` | ✅ NE |
| `shop/moje-objednavky/page.tsx` | ✅ NE |
| `dily/moje-objednavky/page.tsx` | ✅ NE |

### 2. Metadata

⚠️ **0/10 stránek má `export const metadata`**

Toto je **záměrná volba** dle plánu (`plan-ssr-phase3.md`). Authenticated user dashboard stránky jsou privátní — žádná SEO hodnota, robots noindex. Plánový checklist metadata neuvádí. Akceptovatelné.

### 3. Suspense

ℹ️ **0/10 stránek používá Suspense**

Záměrně správné pro Phase 3 pattern. Suspense je potřeba pouze pro `useSearchParams` (dynamické search params). Phase 3 client islands používají pouze `useState` + optionálně `useRouter` → Suspense není nutné.

### 4. Prisma queries na serveru

✅ Všechny Prisma queries jsou v `async` Server Components.  
✅ Auth pattern: `getServerSession(authOptions)` + `redirect("/login")` na všech 10 stránkách.

### 5. Date serializace

| Stránka | Vzor | Status |
|---------|------|--------|
| `garaz/page.tsx` | `c.createdAt.toISOString()` předáno do GarageManager | ✅ |
| `moje-inzeraty/page.tsx` | `l.createdAt.toISOString()` předáno do MyListingsManager | ✅ |
| `moje-inzeraty/[id]/page.tsx` | 4x `.toISOString()` (listing + publishedAt + inquiries.createdAt + inquiries.repliedAt) | ✅ |
| `oblibene/page.tsx` | Žádné Date pole v serialized (listing.select neobsahuje createdAt) | ✅ |
| `dotazy/page.tsx` | `formatDate(inquiry.createdAt)` — server-side, není předáno do client | ✅ |
| `poptavky/page.tsx` | Server-side formátování | ✅ |
| `shop/moje-objednavky/page.tsx` | `order.createdAt.toLocaleDateString()` — server-side JSX | ✅ |
| `dily/moje-objednavky/page.tsx` | Stejný pattern jako shop/objednavky | ✅ |
| `muj-ucet/page.tsx` | Žádné Date pole | ✅ |
| `muj-ucet/profil/page.tsx` | Žádné Date pole v serialized | ✅ |

### 6. Client islands mají "use client"

✅ Všech 5 islands: `FavoritesList`, `GarageManager`, `ListingDetailManager`, `MyListingsManager`, `ProfileEditor`

---

## Výsledek

✅ **SCHVÁLENO — implementace odpovídá plánu Phase 3.**

- Hlavní kritéria (no "use client", Prisma na serveru, Date serializace) splněna 10/10
- Metadata záměrně chybí (privátní stránky) — dle plánu správné
- Suspense záměrně chybí (props pattern, bez useSearchParams) — technicky správné
- Build + lint OK
