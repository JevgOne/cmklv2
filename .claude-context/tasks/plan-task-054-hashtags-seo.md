# Plan — TASK-054 Hashtags + SEO landing pages (Fáze 1) — R6

**Datum:** 2026-04-16
**Autor:** PLANOVAČ
**Revize:** R6 — 1 minor oprava z Evžen re-verify: §6.8 Footer pill count `m.` → `makléřů` (plný tvar, Rule 1). Wireframe ř. 766-767 + impl ř. 801.

**R5 (předchozí):** 2 finální opravy:
  1. Slug pro elektromobily tag je čistý (bez anglické zkratky) — strict Rule 1 i pro URL
  2. CTA "stát se makléřem" míří na existující `/registrace` route (původní target v návrhu neexistoval)

**R4 (předchozí):** opravy 4 blokátorů z Evžen reportu + 301 aliasy + "Elektromobily" label + level badge §14 note:
  1. FIX 1 — Stats bar wireframe sync (§6.2)
  2. FIX 2 — Admin nav entry pro `/admin/tagy` v `AdminSidebar.tsx`
  3. FIX 3 — Full TagInput spec v §7.2
  4. FIX 4 — JSON-LD ItemList + Person v §6.3b
  + 301 aliasy `/h/[slug]` a `/tag/[slug]` (§4.3.18b)
  + §14 poznámka o level badges out-of-scope
**Effort:** M-L (~5 h čistého implementačního času)
**Commit strategie:** 4 dílčí commity (viz §8)
**Baseline:** main (aktuální HEAD — implementátor ověří `git log`)

---

## §0 EXECUTIVE SUMMARY

**Cíl Fáze 1:** End-to-end funkční hashtag systém + **premium SEO destination page** (9-section landing).

**Výstup:**
- `Tag` entita (Prisma M2M na User) + seed 12 featured tagů + link k 4 seedovaným brokerům
- Broker edit `/muj-ucet/profil` → Tag input s autocomplete + create-new (max 10)
- `/profil/[slug]` → klikatelné hashtag pilly v infocolumn (post R4 side-by-side layout)
- **`/makleri/[slug]` → premium landing s 9 sekcemi** (§6)
- Admin `/admin/tagy` — read-only tabulka
- Sitemap zahrnuje tagy s >= 2 aktivními brokery
- 4 JSON-LD schemas: ItemList, Person, FAQPage, BreadcrumbList

---

## §1 KLÍČOVÁ ROZHODNUTÍ — STAV

| # | Rozhodnutí | Stav |
|---|---|---|
| A | URL `/makleri/[slug]` (plural) | ✅ SCHVÁLENO |
| B | `Tag` + Prisma implicit M2M | ✅ SCHVÁLENO |
| C | Hybrid: seed + autocomplete + create-new | ✅ SCHVÁLENO |
| D | Samostatný `/api/profile/tags` | ✅ SCHVÁLENO |
| E | Admin read-only | ✅ SCHVÁLENO |
| F | Seed +2-3 brokeři (Petr Svoboda, Marek Dvořák, Lucie Černá) | ✅ SCHVÁLENO |
| G | OG per-tag → Fáze 2 | ✅ ODLOŽENO |
| H | Featured panel na `/makleri` → Fáze 2 | ✅ ODLOŽENO |

---

## §2 PRISMA SCHEMA DIFF

**Přidat do `prisma/schema.prisma`:**

```prisma
// ============================================
// TAGY / HASHTAGY (SEO landing pages)
// ============================================

model Tag {
  id          String   @id @default(cuid())
  slug        String   @unique                 // "praha", "bmw", "elektromobily"
  label       String                           // "Praha", "BMW", "Elektromobily"
  category    String?                          // CITY | BRAND | SPECIALIZATION | SERVICE | OTHER
  isFeatured  Boolean  @default(false)
  createdById String?                          // null = seeded
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]   @relation("UserTags")

  @@index([isFeatured])
  @@index([category])
}
```

**Přidat do `model User`:**

```prisma
  // Profilové tagy / hashtagy (M2M)
  tags  Tag[]  @relation("UserTags")
```

Prisma auto-generuje implicit `_UserTags` join.

---

## §3 SEZNAM SOUBORŮ

### Nové soubory (create) — 15

| Soubor | Účel |
|---|---|
| `prisma/migrations/YYYYMMDD_add_tags/migration.sql` | auto-generated |
| `lib/tags.ts` | `normalizeTagInput`, `upsertTag`, `getRelatedTagsByCoOccurrence` |
| `lib/landing-copy.ts` | **per-category copy**: hero eyebrow/H1/subheadline, FAQ pools, CTA copy, sibling label |
| `app/api/tags/route.ts` | GET autocomplete + featured + brokerCount |
| `app/api/profile/tags/route.ts` | GET + PUT broker's own tags |
| `app/(web)/makleri/[slug]/page.tsx` | **9-section landing** (§6) — server, ISR 3600 |
| `app/(web)/makleri/[slug]/loading.tsx` | skeleton |
| `app/(web)/makleri/[slug]/not-found.tsx` | 404 + link zpět |
| `app/(admin)/admin/tagy/page.tsx` | admin read-only table |
| `components/web/TagPill.tsx` | klikatelný pill (default + muted variant) |
| `components/web/TagInput.tsx` | client autocomplete input |
| `components/web/LandingHero.tsx` | **Section 2** — eyebrow + H1 + subheadline + stats + avatars |
| `components/web/BrokerCard.tsx` | **Section 3** — featured + regular variant |
| `components/web/RelatedHashtags.tsx` | **Section 4** — co-occurrence pills |
| `components/web/CTABlock.tsx` | **Section 6 + 9** — auth-aware CTA (gradient or outline) |
| `app/(web)/h/[slug]/page.tsx` | **R4 301 alias** — `/h/praha` → `/makleri/praha` (`permanentRedirect`) |
| `app/(web)/tag/[slug]/page.tsx` | **R4 301 alias** — `/tag/bmw` → `/makleri/bmw` (`permanentRedirect`) |

### Upravované soubory (edit) — 7

| Soubor | Změna |
|---|---|
| `prisma/schema.prisma` | §2 diff |
| `prisma/seed.ts` | seed 12 tagů + 2-3 new brokeři + linking |
| `app/sitemap.ts` | `tagPages` generator (>= 2 brokeři) |
| `app/api/profile/[slug]/route.ts` | rozšířit `select` o `tags: { select: { slug, label } }` |
| `app/(web)/muj-ucet/profil/page.tsx` | Card "Hashtagy" s `<TagInput>` mezi Specializace a Služby |
| `app/(web)/profil/[slug]/page.tsx` | TagPill grid v `flex-1 min-w-0` infocolumn (mezi `{/* Bio */}` a `{/* Favorite brands */}`) |
| `components/admin/AdminSidebar.tsx` | **NOVÉ v R4** — přidat nav entry `{ id: "tags", href: "/admin/tagy", icon: "🏷️", label: "Tagy" }` do sekce "HLAVNÍ" (nebo vytvořit novou sekci "OBSAH") s `roles: ["ADMIN"]` |
| `components/web/FAQ.tsx` | **NENÍ potřeba edit** — accordion component už reusable; používá se v Section 7 |

### Znovu použité (reuse)

- `components/web/FAQ.tsx` — accordion
- `components/web/Breadcrumbs.tsx` — Section 1
- `lib/seo/slugify.ts` — normalizace
- `lib/profile-slug.ts` — slug gen pattern

---

## §4 IMPLEMENTACE — 4 FÁZE

### §4.1 Fáze A — Schema + migrace + seed (COMMIT 1)

1. Edit `prisma/schema.prisma` → §2 diff
2. `npx prisma migrate dev --name add_tags`
   - **STOP-1:** tsvector drift → `migrate reset --force && migrate dev --name add_tags`
3. `npx prisma generate`
4. Edit `prisma/seed.ts`:
   - Nový `seedTags()` — 12 tagů (§9)
   - `seedBrokers()` — ověřit že exist 4 brokeři (Jan Novák + Petr Svoboda + Marek Dvořák + Lucie Černá). Pokud některý chybí, přidat `createdAt`, `firstName`, `lastName`, `email`, `passwordHash` (bcrypt "heslo123"), `role: "BROKER"`, `status: "ACTIVE"`, `level`, `city`, `bio`, `totalSales`, `slug`.
   - `linkBrokerTags()` — §9 vazby
5. `npx prisma db seed` → verify v Prisma Studio
6. **COMMIT 1:** `feat: add Tag model with M2M user relation + seed 12 featured tags (task #54)`

### §4.2 Fáze B — API + lib (COMMIT 2)

7. Create `lib/tags.ts`:
   ```ts
   import { prisma } from "@/lib/prisma";
   import { slugify } from "@/lib/seo/slugify";

   export function normalizeTagInput(input: { slug?: string; label: string }) {
     const label = input.label.trim();
     if (!label || label.length > 50) throw new Error("Invalid label");
     const slug = input.slug ?? slugify(label);
     if (!slug) throw new Error("Invalid slug");
     return { slug, label };
   }

   export async function upsertTag(slug: string, label: string, createdById?: string) {
     return prisma.tag.upsert({
       where: { slug },
       create: { slug, label, createdById: createdById ?? null },
       update: {}, // nerušíme label
     });
   }

   /**
    * Co-occurrence: tagy které sdílejí brokery s currentTag.
    * Raw SQL via $queryRaw — nejrychlejší.
    */
   export async function getRelatedTagsByCoOccurrence(tagId: string, limit = 6) {
     return prisma.$queryRaw<Array<{ slug: string; label: string; category: string | null; shared: bigint }>>`
       SELECT t.slug, t.label, t.category, COUNT(*)::bigint AS shared
       FROM "_UserTags" ut1
       JOIN "_UserTags" ut2 ON ut1."B" = ut2."B" AND ut1."A" != ut2."A"
       JOIN "Tag" t ON t.id = ut2."A"
       JOIN "User" u ON u.id = ut1."B"
       WHERE ut1."A" = ${tagId}
         AND u.role = 'BROKER'
         AND u.status = 'ACTIVE'
       GROUP BY t.slug, t.label, t.category
       ORDER BY shared DESC
       LIMIT ${limit}
     `;
   }
   ```

8. Create `lib/landing-copy.ts` — per-category templates (§6.7).

9. Create `app/api/tags/route.ts`:
   - GET `?q=<search>&featured=<bool>` → `{ tags: [{ slug, label, brokerCount, isFeatured }] }`
   - Používá `prisma.tag.findMany({ include: { _count: { select: { users: { where: { role: "BROKER", status: "ACTIVE" } } } } }, take: 20 })`

10. Create `app/api/profile/tags/route.ts`:
    - GET (auth) → `{ tags: [{ slug, label }] }`
    - PUT (auth) body `{ tags: [{ slug?, label }] }` (max 10, Zod) → upsert + `prisma.user.update({ ..., data: { tags: { set: [...tagIds] } } })`

11. Edit `app/api/profile/[slug]/route.ts` — `select: { ..., tags: { select: { slug: true, label: true } } }`

12. **COMMIT 2:** `feat: tag API + co-occurrence query + landing copy library (task #54)`

### §4.3 Fáze C — Edit UI + Profil pills + Admin + Sitemap (COMMIT 3)

13. Create `components/web/TagPill.tsx` (§7.1)
14. Create `components/web/TagInput.tsx` (§7.2) — client, debounced autocomplete, a11y combobox
15. Edit `app/(web)/muj-ucet/profil/page.tsx`:
    - State `tags: {slug,label}[]`, max 10 enforced v UI
    - `useEffect`: fetch `/api/profile/tags`
    - `onSubmit`: PUT `/api/profile/edit` + PUT `/api/profile/tags` (parallel OK)
    - Nová `<Card>` "Hashtagy (max 10)" mezi Specializace a Služby

16. Edit `app/(web)/profil/[slug]/page.tsx`:
    - Rozšířit user state o `tags`
    - V `flex-1 min-w-0` infocolumn (R4 layout) mezi `{/* Bio */}` a `{/* Favorite brands */}`:
      ```tsx
      {user.tags && user.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {user.tags.map((tag) => (
            <TagPill key={tag.slug} slug={tag.slug} label={tag.label} size="sm" />
          ))}
        </div>
      )}
      ```

17. Create `app/(admin)/admin/tagy/page.tsx`:
    - Server component, `getServerSession` role check → non-ADMIN redirect "/"
    - `prisma.tag.findMany({ include: { _count: { select: { users: true } } }, orderBy: [{ isFeatured: "desc" }, { users: { _count: "desc" } }] })`
    - Table: slug · label · category · featured badge · createdAt · brokerCount · createdBy

17b. Edit `components/admin/AdminSidebar.tsx` — **Rule 3 compliance** — přidat nav entry:
    ```ts
    // Do existující sekce "HLAVNÍ" přidat nový item za "users":
    { id: "tags", href: "/admin/tagy", icon: "🏷️", label: "Tagy" }
    // ALE: AdminSidebar "HLAVNÍ" má roles ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"]
    // Tagy jsou ADMIN-only (AC8) → vytvoř novou NavSection:
    {
      title: "OBSAH",
      items: [
        { id: "tags", href: "/admin/tagy", icon: "🏷️", label: "Tagy" },
      ],
      roles: ["ADMIN"],
    }
    ```
    Přidat za sekci "MARKETPLACE" v `navSections` array (řádek cca 80).
    **Proč:** `/admin/tagy` page sama by bez nav entry porušila Rule 3 (URL-only stránka, admin ji nenajde).

18. Edit `app/sitemap.ts`:
    ```ts
    let tagPages: MetadataRoute.Sitemap = [];
    try {
      const tags = await prisma.tag.findMany({
        where: { users: { some: { role: "BROKER", status: "ACTIVE" } } },
        select: { slug: true, updatedAt: true, _count: { select: { users: true } } },
      });
      tagPages = tags
        .filter((t) => t._count.users >= 2)
        .map((t) => ({
          url: `${BASE_URL}/makleri/${t.slug}`,
          lastModified: t.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
    } catch {}
    ```

18b. **301 aliasy** — vytvořit 2 thin route handlers (per-route `permanentRedirect`):
    ```ts
    // app/(web)/h/[slug]/page.tsx
    import { permanentRedirect } from "next/navigation";
    export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
      const { slug } = await params;
      permanentRedirect(`/makleri/${slug}`);
    }
    ```
    ```ts
    // app/(web)/tag/[slug]/page.tsx (identický pattern)
    ```
    Levné (2 soubory × ~5 řádek), zachytí alt SEO formy (`/h/praha`, `/tag/bmw` → `/makleri/praha`, `/makleri/bmw`). 301 permanent je Google-recommended pro slug migrace.

19. **COMMIT 3:** `feat: broker tag editor + profile pills + admin overview + sitemap + 301 aliases (task #54)`

### §4.4 Fáze D — **Premium Landing Page** (COMMIT 4) — §6

20. Create `components/web/LandingHero.tsx` (§6 Section 2)
21. Create `components/web/BrokerCard.tsx` (§6 Section 3)
22. Create `components/web/RelatedHashtags.tsx` (§6 Section 4)
23. Create `components/web/CTABlock.tsx` (§6 Section 6 + 9)
24. Create `app/(web)/makleri/[slug]/page.tsx` — **9 sekcí** (§6)
25. Create `app/(web)/makleri/[slug]/loading.tsx` + `not-found.tsx`
26. Build check, smoke test `/makleri/praha` + `/makleri/bmw`
27. **COMMIT 4:** `feat: premium hashtag landing with 9-section UX + JSON-LD schemas (task #54)`

---

## §5 API KONTRAKT

### `GET /api/tags`
- Query: `?q=<search>` (autocomplete) nebo `?featured=true` (homepage panel)
- Response: `{ tags: Array<{ slug, label, brokerCount, isFeatured }> }` (limit 20)
- Public, no auth

### `GET /api/profile/tags`
- Auth required (401 jinak)
- Response: `{ tags: Array<{ slug, label }> }`

### `PUT /api/profile/tags`
- Auth required
- Body: `{ tags: Array<{ slug?, label }> }` (max 10, label 1-50 chars)
- Response 200: `{ tags: Array<{ slug, label }> }`
- Response 400 Zod / 401 auth

### (related hashtags = server-side v landing page, NE samostatný API endpoint pro MVP)

---

## §6 LANDING PAGE `/makleri/[slug]` — 9 SEKCÍ (§4.3.17 rewrite)

**Layout:** 9 sekcí top-to-bottom. Container `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` (kromě hero = full-bleed).

**ISR:** `export const revalidate = 3600`.

**generateMetadata:**
- title: `{h1CopyByCategory(tag)} — Carmakléř` (např. "Makléři v Praze — Carmakléř")
- description: `{subheadlineByCategory(tag)}`
- canonical: `pageCanonical(/makleri/${slug})`
- OG: title, description, `images: [{ url: "/og/makleri-tag.png" }]` (fallback, custom = Fáze 2)
- robots: `noindex,follow` pokud `brokerCount < 2`

### §6.1 SECTION 1 — Breadcrumb

**Obsah:** `Domů → Makléři → #{label}`

**Implementace:**
```tsx
<Breadcrumbs
  items={[
    { label: "Domů", href: "/" },
    { label: "Makléři", href: "/makleri" },
    { label: `#${tag.label}` },
  ]}
/>
```

**JSON-LD:** `BreadcrumbList` (přidat inline ve stránce).

**Design:** `pt-4 pb-2` wrapper, existující Breadcrumbs styling.

### §6.2 SECTION 2 — Hero (premium, full-bleed)

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────┐
│ [eyebrow: Lokalita]                                              │
│                                                                  │
│  H1: Makléři v Praze                       [avatar overlap ×4]   │
│  (category-specific, human copy)                                 │
│                                                                  │
│  subheadline (1-2 věty, category-specific SEO copy)              │
│                                                                  │
│  [12 makléřů] · [142 úspěšných prodejů] · [3 TOP makléřů]        │
│  · [38 aktivních vozidel]                                        │
│                                                                  │
│  [Najít makléře ↓]   [Chci se stát makléřem]                     │
└──────────────────────────────────────────────────────────────────┘
```

**Poznámka R4 (Evžen FIX 1):** Wireframe je IDENTICKÝ s implementation spec níže — žádné zkratky ("Prům.", "ROI") v UI copy. Wireframe texty jsou exact-match k labelům z `§6.2 stats chip row`.

**Komponenta:** `components/web/LandingHero.tsx`

**Copy (per category):**

| Category | Eyebrow | H1 | Subheadline template |
|---|---|---|---|
| CITY | `Lokalita` | `Makléři v ${inLocative(label)}` | `Najděte ověřeného makléře v ${inLocative(label)} — ${count} specialistů, ${totalSoldVehicles} úspěšných prodejů.` |
| BRAND | `Značka` | `Specialisté na ${label}` | `Prodejte své ${label} přes certifikovaného specialistu. ${count} makléřů s expertízou na značku.` |
| SPECIALIZATION | `Specializace` | `Specialisté: ${label}` | `Makléři se specializací na ${label.toLowerCase()}. Znají trh, odvod, legislativu.` |
| SERVICE | `Služba` | `${label}` (pure label — např. "Výkup do 24 hodin") | `Makléři nabízející službu ${label.toLowerCase()}. Rychlé jednání, férová cena, bez skrytých poplatků.` |
| OTHER | `Hashtag` | `Makléři #${label}` | `Certifikovaní makléři označení hashtagem #${label}.` |

**Stats chip row (4 metriky):**
- `{count} makléřů` — `users.length`
- `{totalSoldVehicles} úspěšných prodejů` — Vehicle where status=SOLD AND brokerId IN ids, COUNT. Nahrazuje "totalDeals" (žádný Deal model neexistuje — viz §6.4 note)
- `{topLevelCount} TOP makléřů` — COUNT users WHERE level IN ("SENIOR","TOP"). Nahrazuje avgRoi (ROI je pro INVESTOR, ne brokerů)
- `{activeVehicles} aktivních vozidel` — Vehicle where status=ACTIVE AND brokerId IN ids, COUNT

*Poznámka: team-lead navrhl `průměrné ROI` + `průměrná doba prodeje`, ale tato data neexistují u brokerů (ROI = INVESTOR pole). Substituovány reálnými broker metrikami. Confirmed v otázce §13.1.*

**Featured brokers overlap avatars (top-right desktop / pod subheadline mobile):**
- 4 avatary s `-ml-3` overlap, `ring-2 ring-white`
- Top 4 by `totalSales DESC`

**Design tokens:**
- Background: `bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600`
- Padding: `py-14 sm:py-20 md:py-28`
- Container `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`
- Eyebrow: `inline-block text-xs font-semibold uppercase tracking-wider text-white/80 bg-white/10 px-3 py-1 rounded-full`
- H1: `text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-4 leading-tight`
- Subheadline: `text-lg sm:text-xl text-white/90 mt-4 max-w-3xl leading-relaxed`
- Stats row: `flex flex-wrap gap-3 mt-8`, každý chip: `bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium`
- CTAs (mt-8, flex gap-3):
  - Primary: `bg-white text-orange-600 hover:bg-orange-50 font-semibold px-6 py-3 rounded-full`
  - Secondary: `border-2 border-white/70 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-full`

**Mobile stack:** vše stacked, CTAs full-width, avatars pod subheadline.

**Čeština locative (pro CITY):** hard-coded mapa v `lib/landing-copy.ts`:
```ts
const CITY_LOCATIVE: Record<string, { locative: string; genitive: string }> = {
  "praha":       { locative: "Praze",       genitive: "Prahy" },
  "brno":        { locative: "Brně",        genitive: "Brna" },
  "ostrava":     { locative: "Ostravě",     genitive: "Ostravy" },
  "plzen":       { locative: "Plzni",       genitive: "Plzně" },
  "liberec":     { locative: "Liberci",     genitive: "Liberce" },
  "hradec-kralove": { locative: "Hradci Králové", genitive: "Hradce Králové" },
  "ceske-budejovice": { locative: "Českých Budějovicích", genitive: "Českých Budějovic" },
  "olomouc":     { locative: "Olomouci",    genitive: "Olomouce" },
};
export function inLocative(slug: string, label: string) {
  return CITY_LOCATIVE[slug]?.locative ?? `${label}`; // fallback: raw label
}
```

### §6.3 SECTION 3 — Broker Grid

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ [Řadit: ▼ Podle prodejů ▾] [Úroveň] [Nejnovější]             │
│                                                              │
│ ┌────────────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ DOPORUČENÝ     │ │          │ │          │                 │
│ │ (larger, 2×col)│ │  regular │ │  regular │                 │
│ │ Jan Novák      │ │  card    │ │  card    │                 │
│ └────────────────┘ └──────────┘ └──────────┘                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│ │          │ │          │ │          │                       │
│ └──────────┘ └──────────┘ └──────────┘                       │
│                                                              │
│              [Zobrazit více (12 z 24)]                       │
└──────────────────────────────────────────────────────────────┘
```

**Komponenta:** `components/web/BrokerCard.tsx` (featured + regular variant)

**Design:**
- Container: `id="broker-grid" className="py-12 md:py-16"`
- Sort row: `flex gap-2 mb-6` — 3 togglable buttons (Prodeje / Úroveň / Nejnovější). State v `useState`, re-sort přes `useMemo` (client). SSR default = totalSales DESC.
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6`
- Featured card (první): `lg:col-span-2` + `border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-white` + "Doporučený" badge
- Regular card: `bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-lg transition-all`

**Card obsah (BrokerCard):**
- Avatar 80×80 (96×96 featured) — `rounded-full` + initials fallback
- Jméno: `text-lg font-bold text-gray-900` (featured: `text-xl`)
- Level badge (TOP/SENIOR/BROKER/JUNIOR) — reuse `<Badge>`
- City pill: `text-xs text-gray-500` (vedle avataru)
- **Tag pills** (max 3, "+N" overflow): `TagPill size="sm" variant="muted"`
- Bio excerpt: `text-sm text-gray-600 line-clamp-2 mt-3`
- Stats row: `flex gap-4 mt-4 pt-4 border-t border-gray-100 text-sm`:
  - `{totalSales} prodejů`
  - `{level}`
  - (featured-only) `{activeVehicles} aktivních vozidel`
- CTAs `mt-4 flex gap-2`:
  - Primary: `Zobrazit profil` → `/profil/{slug}` (novější Instagram-style, bohatší UX)
  - Secondary (pokud `phone && showPhone`): `Kontaktovat` → `tel:{phone}`
- Celá card hover: lift `hover:shadow-lg hover:border-orange-300`

**Featured selection (MVP):** první broker po aktuálním sortu je `featured=true`. Fáze 2: `Tag.featuredBrokerId` override pole.

**Pagination:**
- Server: `take: 24` (bezpečný limit pro MVP)
- Client: prvních 12 zobrazeno, "Zobrazit více" button rozšíří na 24
- Fáze 2: cursor-based infinite scroll

### §6.3b JSON-LD ItemList + Person (R4 — Evžen FIX 4)

**Kde:** Inline v `app/(web)/makleri/[slug]/page.tsx` na konci Section 3 (Broker Grid), před `</section>`. Server-rendered, ne v client component (aby Google Bot to viděl v initial HTML).

**Template:**
```tsx
{/* JSON-LD: ItemList + Person (každý broker jako ListItem s nested Person) */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Makléři — ${tag.label}`,
      "numberOfItems": brokers.length,
      "itemListElement": brokers.map((b, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Person",
          "name": `${b.firstName} ${b.lastName}`,
          "url": `${BASE_URL}/profil/${b.slug}`,
          "jobTitle": "Certifikovaný makléř",
          ...(b.city && {
            "address": {
              "@type": "PostalAddress",
              "addressLocality": b.city,
              "addressCountry": "CZ",
            },
          }),
          ...(b.avatar && { "image": b.avatar }),
        },
      })),
    }),
  }}
/>
```

**Validace:** Google Rich Results Test na `/makleri/praha` musí vracet ItemList schema bez errors. Person nested v `item` field.

**Proč:** Evžen §11.3 AC19 vyžaduje 4 schemas (ItemList + Person + FAQPage + BreadcrumbList). Bez ItemList a Person nebyla kryta Evžen AC23.

### §6.4 SECTION 4 — Related Hashtags

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ Mohlo by vás zajímat                                         │
│                                                              │
│ [#BMW 4] [#Škoda 2] [#Elektromobily 2] [#Automat 1]          │
│ [#Luxusní vozy 1] [#Family cars 1]                           │
└──────────────────────────────────────────────────────────────┘
```

**Komponenta:** `components/web/RelatedHashtags.tsx`

**Logic:** `getRelatedTagsByCoOccurrence(tag.id, 6)` — raw SQL query (§4.2.7). Pokud <3 brokeři v tagu → fallback: top 6 featured tagů z jiných kategorií.

**Empty state:** pokud žádné related tagy → sekce HIDE.

**Design:**
- Section wrapper: `py-10 border-t border-gray-200`
- H2: `text-2xl font-bold text-gray-900 mb-5`
- Flex wrap pills: `flex flex-wrap gap-2`
- Per pill: `inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-700 transition`:
  - Label: `<span className="font-semibold">#{label}</span>`
  - Count: `<span className="text-xs text-gray-500">{count} makléřů</span>`

### §6.5 SECTION 5 — Social Proof ("Nedávné úspěchy")

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ Nedávné úspěchy makléřů v #Praha                             │
│                                                              │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 🚗 BMW X5       │ │ 🚗 Škoda Octavia│ │ 🚗 Mercedes C   │ │
│ │ 890 000 Kč      │ │ 250 000 Kč      │ │ 650 000 Kč      │ │
│ │ Praha · 3 dny zp│ │ Praha · týden   │ │ Brno · 2 týdny  │ │
│ │ — Jan Novák     │ │ — Petr Svoboda  │ │ — Marek Dvořák  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                              │
│ nebo fallback: "Od spuštění zprostředkovali makléři v #Praha │
│ celkem 142 prodejů."                                         │
└──────────────────────────────────────────────────────────────┘
```

**Zdroj dat:** **`Vehicle`** model (ne Deal — ten neexistuje). Vehicle má `status="SOLD"`, `soldPrice`, `soldAt`, `brand`, `model`, `city`, `brokerId` (relation `user` v Vehicle modelu).

**Query:**
```ts
const recentDeals = await prisma.vehicle.findMany({
  where: {
    status: "SOLD",
    userId: { in: brokerIds }, // assuming Vehicle.userId = broker
    soldAt: { not: null },
  },
  select: {
    id: true, brand: true, model: true, year: true, soldPrice: true, soldAt: true, city: true,
    user: { select: { firstName: true, lastName: true, slug: true } },
  },
  orderBy: { soldAt: "desc" },
  take: 3,
});
```

*Implementátor ověří field name (`userId` vs `brokerId`) ve schema — za Vehicle:290 je `users User @relation` — viz schema.prisma:15 (`vehicles Vehicle[]` na User).*

**Empty state logika:**
- Pokud `recentDeals.length === 0` → fallback card:
  - "Makléři v #{label} za celou dobu činnosti zprostředkovali **{totalSoldAllTime}** prodejů."
  - Pokud i totalSoldAllTime = 0 → **HIDE sekci** (neshowat prázdnou)

**Design:**
- Section wrapper: `py-12 bg-gray-50 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-2xl sm:px-6`
- H2: `text-2xl font-bold text-gray-900 mb-6`
- Grid: `grid grid-cols-1 md:grid-cols-3 gap-5`
- Card: `bg-white rounded-xl p-5 shadow-sm`:
  - Emoji + brand/model: `text-lg font-bold text-gray-900`
  - Price: `text-orange-600 font-bold text-xl mt-1`
  - Meta: `text-sm text-gray-500 mt-1` (city + relative time)
  - Broker attribution: `text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100` — `— <Link className="hover:text-orange-600">Jan Novák</Link>`

### §6.6 SECTION 6 — CTA Block (mid-page, auth-aware)

**Wireframe (non-auth):**
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [orange gradient bg, rounded-2xl]                           │
│                                                              │
│  Také byste rádi prodali auto v Praze?                       │
│  Vyberte si z {count}+ certifikovaných makléřů.              │
│                                                              │
│  [Najít makléře ↓]  [Chci se stát makléřem]                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Wireframe (auth broker):**
```
│  Jste makléř v oblasti Praha?                                │
│  Přidejte si tento tag do profilu a získejte nové klienty.   │
│                                                              │
│  [Přidat tag do profilu]                                     │
```

**Komponenta:** `components/web/CTABlock.tsx` (props: `variant: "mid" | "bottom"`, `tag`, `session`)

**Auth logic (server-side):**
- `getServerSession(authOptions)` v landing page
- Pass `session` prop do CTABlock

**Copy (per category + auth state) v `lib/landing-copy.ts`:**
```ts
export function getCTACopy(tag: Tag, authed: boolean, role?: string) {
  if (authed && role === "BROKER") {
    return {
      heading: `Jste makléř v oblasti ${tag.label}?`,
      body: `Přidejte si tento tag do profilu a získejte nové klienty.`,
      primary: { text: "Přidat tag do profilu", href: "/muj-ucet/profil#hashtags" },
    };
  }
  if (tag.category === "CITY") return {
    heading: `Také byste rádi prodali auto v ${inLocative(tag.slug, tag.label)}?`,
    body: `Vyberte si z certifikovaných makléřů.`,
    primary: { text: "Najít makléře", href: "#broker-grid" },
    secondary: { text: "Chci se stát makléřem", href: "/registrace" },
  };
  if (tag.category === "BRAND") return {
    heading: `Chcete prodat ${tag.label}?`,
    body: `Využijte certifikovaného specialistu.`,
    primary: { text: "Najít specialistu", href: "#broker-grid" },
    secondary: { text: "Jsem specialista", href: "/registrace" },
  };
  // etc
}
```

**Design:**
- Wrapper: `py-12 md:py-16`
- Inner: `bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 sm:p-12 text-center`
- H2: `text-2xl sm:text-3xl font-extrabold text-white`
- Body: `text-white/90 mt-3`
- CTAs: `mt-6 flex flex-wrap gap-3 justify-center`
  - Primary: `bg-white text-orange-600 hover:bg-orange-50 font-semibold px-6 py-3 rounded-full`
  - Secondary: `border-2 border-white/70 text-white hover:bg-white/10 px-6 py-3 rounded-full`

### §6.7 SECTION 7 — FAQ (accordion + FAQPage schema)

**Komponenta:** reuse `components/web/FAQ.tsx` (accordion)

**Copy (per category):** v `lib/landing-copy.ts`:

```ts
export function getFAQ(tag: Tag, stats: { count: number; totalSold: number }): FAQItem[] {
  switch (tag.category) {
    case "CITY":
      return [
        { question: `Kolik stojí makléř v ${inLocative(tag.slug, tag.label)}?`,
          answer: `Makléři v síti Carmakléř si účtují provizi 5 % z prodejní ceny, minimálně 25 000 Kč. Cena zahrnuje kompletní servis — od ocenění po předání novému majiteli.` },
        { question: `Jak dlouho trvá prodej auta přes makléře v ${inLocative(tag.slug, tag.label)}?`,
          answer: `Průměrně 2–4 týdny. Makléř převezme vozidlo, zajistí fotky, inzerci, komunikaci s kupci a přípravu smluv. Vy pouze převezmete peníze.` },
        { question: `Co když moje auto má vadu — vezme ho makléř v ${inLocative(tag.slug, tag.label)}?`,
          answer: `Ano — makléř posoudí stav a doporučí férovou cenu. Transparentnost vadí u prodeje hraje ve váš prospěch.` },
        { question: `Jak si vybrat správného makléře v ${inLocative(tag.slug, tag.label)}?`,
          answer: `Projděte si profily níže, zkuste si přečíst reference, podívejte se na úroveň (TOP/SENIOR/Makléř). Klikněte na "Zobrazit profil" pro detail.` },
      ];
    case "BRAND":
      return [
        { question: `Proč prodat ${tag.label} přes specialistu?`,
          answer: `Specialista na značku ${tag.label} zná kupce, má kontakty na sběratele a dokáže vyjednat vyšší cenu než generický inzerát.` },
        { question: `Vezme specialista i staré ${tag.label}?`,
          answer: `Ano — u ${tag.label} často vzácné kusy mají i vyšší hodnotu s věkem. Specialista posoudí stav a navrhne cenu.` },
        { question: `Kolik můžu získat za své ${tag.label}?`,
          answer: `Expertní ocenění na základě roku, nájezdu, stavu, výbavy. V síti Carmakléř je celkem ${stats.count} specialistů na ${tag.label} — kontaktujte kteréhokoliv pro odhad.` },
        { question: `Jak probíhá prodej ${tag.label} přes specialistu?`,
          answer: `1) Předběžné ocenění. 2) Fyzická prohlídka. 3) Profesionální fotografie a inzerce. 4) Komunikace s kupci. 5) Smluvní prodej a předání.` },
      ];
    case "SPECIALIZATION":
      return [
        { question: `Co znamená specializace "${tag.label}"?`,
          answer: `Makléři označení tagem ${tag.label} mají zkušenost a expertízu právě v této oblasti trhu s vozidly.` },
        { question: `Jaké výhody přináší specializace?`,
          answer: `Lepší cena, rychlejší prodej, odborná komunikace s kupci, znalost specifik (legislativa, servis, sběratelská hodnota).` },
        { question: `Kolik makléřů tuto specializaci nabízí?`,
          answer: `Aktuálně ${stats.count} certifikovaných makléřů se specializuje na ${tag.label.toLowerCase()}.` },
        { question: `Jak najít toho pravého?`,
          answer: `Projděte si jejich profily, prohlédněte referenční auta, kontaktujte toho, jehož styl vám sedí.` },
      ];
    case "SERVICE":
      return [
        { question: `Jak funguje "${tag.label}"?`,
          answer: `Proces je přizpůsobený rychlosti — makléř přijede, ocení, sepíše smlouvu a zaplatí buď hotově nebo převodem.` },
        { question: `Dostanu hotovost nebo převodem?`,
          answer: `Dle dohody — obojí je standardem. U částek nad 270 000 Kč zákon vyžaduje bezhotovostní úhradu.` },
        { question: `Co pokud mám auto na leasing?`,
          answer: `Makléř pomůže s doplacením a odkupem — vyřízení leasingu prodloužení procesu o 2–5 pracovních dní.` },
        { question: `Kolik stojí ${tag.label.toLowerCase()}?`,
          answer: `Provize je 5 % z prodejní ceny, min. 25 000 Kč. V případě výkupu se provize strhává z ceny.` },
      ];
    default: // OTHER
      return [
        { question: `Co znamená #${tag.label}?`,
          answer: `Hashtag #${tag.label} používají certifikovaní makléři pro označení své specializace nebo servisní oblasti.` },
        { question: `Kolik makléřů tento hashtag používá?`,
          answer: `Aktuálně ${stats.count} makléřů.` },
        { question: `Jak najít toho pravého?`,
          answer: `Projděte si jejich profily níže.` },
      ];
  }
}
```

**JSON-LD FAQPage schema:**
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    }),
  }}
/>
```

**Design:**
- Section wrapper: `py-12 md:py-16 border-t border-gray-200`
- H2: `text-2xl font-bold text-gray-900 mb-6`
- FAQ.tsx default styling

### §6.8 SECTION 8 — Footer "Další {category}"

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ Další lokality                     [Všechny hashtagy →]      │
│                                                              │
│ [#Brno 2 makléřů] [#Ostrava 1 makléřů] [#Plzeň 1 makléřů]   │
│ [#Liberec 1 makléřů] [#Hradec Králové 1 makléřů] ...         │
└──────────────────────────────────────────────────────────────┘
```

**Logic:** Zobraz siblings tagy stejné kategorie (exclude current), order featured desc + brokerCount desc, take 12.

**Copy:**
- CITY: "Další lokality"
- BRAND: "Další značky"
- SPECIALIZATION: "Další specializace"
- SERVICE: "Další služby"
- OTHER: "Další hashtagy"

**Query:**
```ts
const siblings = await prisma.tag.findMany({
  where: {
    category: tag.category,
    NOT: { id: tag.id },
    users: { some: { role: "BROKER", status: "ACTIVE" } },
  },
  include: { _count: { select: { users: true } } },
  orderBy: [{ isFeatured: "desc" }, { users: { _count: "desc" } }],
  take: 12,
});
```

**Design:**
- Section wrapper: `py-10 border-t border-gray-200`
- Heading row: `flex items-center justify-between mb-5`
  - H2: `text-xl font-bold text-gray-900`
  - Link: `text-sm text-orange-600 hover:text-orange-700` — "Všechny hashtagy" → `/hashtagy` (Fáze 2 — může být placeholder link pro MVP nebo jen odstranit)
- Pills grid: `flex flex-wrap gap-2`
- Per pill: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-orange-300 text-sm`
  - `#{label}` + `<span className="text-xs text-gray-400">{count} makléřů</span>` (plný tvar, žádná zkratka — konzistence s §6.2 Hero a §6.4 Related)

**Empty state:** pokud 0 siblings → HIDE sekci.

### §6.9 SECTION 9 — Bottom CTA (final, před site footer)

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│               Nenašli jste to co hledáte?                    │
│          Prohlédněte si všechny naše makléře.                │
│                                                              │
│                [Všichni makléři]                             │
└──────────────────────────────────────────────────────────────┘
```

**Komponenta:** `CTABlock variant="bottom"` (jemnější variant bez orange bg)

**Design:**
- Section wrapper: `py-16 bg-gray-50 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-2xl sm:px-6 text-center`
- H2: `text-2xl font-bold text-gray-900`
- Body: `text-gray-600 mt-2`
- Button: `inline-flex bg-orange-500 text-white hover:bg-orange-600 font-semibold px-6 py-3 rounded-full mt-6` → `/makleri`

---

## §6a DESIGN NOTES (tokens, typography, spacing)

| Element | Token |
|---|---|
| Container | `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` |
| Section gap | `py-10` (tight) / `py-12 md:py-16` (default) |
| Primary color | `#F97316` (Tailwind `orange-500`) |
| Gradient | `bg-gradient-to-r from-orange-500 to-orange-600` |
| Soft orange bg | `bg-orange-50` |
| Card border | `border border-gray-200 rounded-xl` |
| Card hover | `hover:border-orange-300 hover:shadow-lg transition-all` |
| Featured card | `border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-white` |
| H1 | `text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight` |
| H2 | `text-2xl sm:text-3xl font-bold` |
| H3 (card names) | `text-lg font-bold` |
| Body | `text-base leading-relaxed text-gray-700` |
| Small | `text-sm text-gray-600` |
| Font | Outfit (inherited from `layout.tsx`) |
| Divider | `border-t border-gray-200` mezi sekcemi 4,7,8 |

**Mobile-first:** všechny sekce hez/usable pod 640px, žádný horizontal scroll, CTAs full-width, grid stackuje.

---

## §7 KOMPONENTY — FULL SPEC (R4 — Evžen FIX 3)

### §7.1 `components/web/TagPill.tsx`

**Props:**
```ts
interface TagPillProps {
  slug: string;
  label: string;
  size?: "sm" | "md";             // default "md"
  variant?: "default" | "muted";  // default "default"
  clickable?: boolean;            // default true (pokud false → span, ne Link)
}
```

**JSX:**
```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TagPill({ slug, label, size = "md", variant = "default", clickable = true }: TagPillProps) {
  const base = "inline-flex items-center gap-1 rounded-full font-medium transition-colors";
  const sizeClass = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const variantClass =
    variant === "muted"
      ? "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"
      : "bg-orange-50 text-orange-700 hover:bg-orange-100";
  const className = cn(base, sizeClass, variantClass);

  const content = <><span className="text-orange-500">#</span>{label}</>;

  if (!clickable) return <span className={className}>{content}</span>;
  return (
    <Link href={`/makleri/${slug}`} className={cn(className, "no-underline")} aria-label={`Makléři s hashtagem ${label}`}>
      {content}
    </Link>
  );
}
```

**Použití:**
- `/profil/[slug]` infocolumn — `<TagPill slug={t.slug} label={t.label} size="sm" />`
- `BrokerCard` — `<TagPill slug={t.slug} label={t.label} size="sm" variant="muted" />`
- `RelatedHashtags` — custom pill (ne TagPill, potřebuje count badge)

### §7.2 `components/web/TagInput.tsx` — client, autocomplete, full spec

**Props:**
```ts
interface TagInputProps {
  value: Array<{ slug: string; label: string }>;
  onChange: (tags: Array<{ slug: string; label: string }>) => void;
  maxTags?: number;   // default 10
  placeholder?: string; // default "Napište hashtag a stiskněte Enter..."
}
```

**State:**
```ts
const [inputText, setInputText] = useState("");
const [suggestions, setSuggestions] = useState<Array<{ slug: string; label: string; brokerCount: number }>>([]);
const [isOpen, setIsOpen] = useState(false);
const [activeIndex, setActiveIndex] = useState(-1);
const [isLoading, setIsLoading] = useState(false);
const debounceRef = useRef<NodeJS.Timeout | null>(null);
const inputRef = useRef<HTMLInputElement>(null);
const listboxId = useId();
```

**Effects:**
```ts
// Debounced fetch
useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  if (inputText.trim().length === 0) {
    setSuggestions([]);
    setIsOpen(false);
    return;
  }
  setIsLoading(true);
  debounceRef.current = setTimeout(async () => {
    try {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(inputText.trim())}`);
      const data = await res.json();
      // Filtruj už vybrané
      const selected = new Set(value.map((t) => t.slug));
      setSuggestions((data.tags || []).filter((s: {slug: string}) => !selected.has(s.slug)));
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, 200);
  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };
}, [inputText, value]);
```

**Handlers:**
```ts
function addTag(tag: { slug: string; label: string }) {
  if (value.length >= (maxTags ?? 10)) {
    toast.error(`Maximum ${maxTags ?? 10} hashtagů`);
    return;
  }
  if (value.some((t) => t.slug === tag.slug)) return;
  onChange([...value, tag]);
  setInputText("");
  setSuggestions([]);
  setIsOpen(false);
  setActiveIndex(-1);
  inputRef.current?.focus();
}

function removeTag(slug: string) {
  onChange(value.filter((t) => t.slug !== slug));
}

function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  const hasCreateOption = inputText.trim().length >= 2 && !suggestions.some((s) => s.label.toLowerCase() === inputText.trim().toLowerCase());
  const listLength = suggestions.length + (hasCreateOption ? 1 : 0);

  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActiveIndex((i) => Math.min(i + 1, listLength - 1));
    setIsOpen(true);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActiveIndex((i) => Math.max(i - 1, 0));
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      addTag(suggestions[activeIndex]);
    } else if (activeIndex === suggestions.length && hasCreateOption) {
      // Create-new option
      addTag({ slug: slugify(inputText.trim()), label: inputText.trim() });
    } else if (inputText.trim().length >= 2) {
      // Enter bez výběru → create-new (pokud label unique)
      addTag({ slug: slugify(inputText.trim()), label: inputText.trim() });
    }
  } else if (e.key === "Escape") {
    setIsOpen(false);
    setActiveIndex(-1);
  } else if (e.key === "Backspace" && inputText === "" && value.length > 0) {
    removeTag(value[value.length - 1].slug);
  }
}
```

**JSX:**
```tsx
<div className="relative">
  {/* Selected pills row + input */}
  <div className="flex flex-wrap items-center gap-2 min-h-[44px] w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
    {value.map((tag) => (
      <span key={tag.slug} className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
        <span className="text-orange-500">#</span>{tag.label}
        <button
          type="button"
          onClick={() => removeTag(tag.slug)}
          aria-label={`Odebrat ${tag.label}`}
          className="ml-1 text-orange-600 hover:text-orange-800"
        >
          ×
        </button>
      </span>
    ))}
    <input
      ref={inputRef}
      type="text"
      role="combobox"
      aria-expanded={isOpen}
      aria-controls={listboxId}
      aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
      aria-autocomplete="list"
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={() => inputText && setIsOpen(true)}
      placeholder={value.length === 0 ? (placeholder ?? "Napište hashtag a stiskněte Enter...") : ""}
      disabled={value.length >= (maxTags ?? 10)}
      className="flex-1 min-w-[150px] outline-none text-sm bg-transparent disabled:cursor-not-allowed"
    />
  </div>

  {/* Counter */}
  <div className="mt-1.5 text-xs text-gray-500 flex justify-between">
    <span>{value.length}/{maxTags ?? 10} hashtagů</span>
    {isLoading && <span>Hledám…</span>}
  </div>

  {/* Dropdown */}
  {isOpen && (suggestions.length > 0 || inputText.trim().length >= 2) && (
    <ul
      id={listboxId}
      role="listbox"
      className="absolute z-10 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg"
    >
      {suggestions.map((s, idx) => (
        <li
          key={s.slug}
          id={`${listboxId}-opt-${idx}`}
          role="option"
          aria-selected={activeIndex === idx}
          onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
          className={cn(
            "px-3 py-2 cursor-pointer flex items-center justify-between text-sm",
            activeIndex === idx ? "bg-orange-50" : "hover:bg-gray-50"
          )}
        >
          <span><span className="text-orange-500">#</span>{s.label}</span>
          <span className="text-xs text-gray-400">{s.brokerCount} makléřů</span>
        </li>
      ))}
      {/* Create-new option */}
      {inputText.trim().length >= 2 && !suggestions.some((s) => s.label.toLowerCase() === inputText.trim().toLowerCase()) && (
        <li
          id={`${listboxId}-opt-${suggestions.length}`}
          role="option"
          aria-selected={activeIndex === suggestions.length}
          onMouseDown={(e) => {
            e.preventDefault();
            addTag({ slug: slugify(inputText.trim()), label: inputText.trim() });
          }}
          className={cn(
            "px-3 py-2 cursor-pointer flex items-center gap-2 text-sm border-t border-gray-100",
            activeIndex === suggestions.length ? "bg-orange-50" : "hover:bg-gray-50"
          )}
        >
          <span className="text-orange-500">+</span>
          <span>Vytvořit: <strong className="text-orange-700">#{inputText.trim()}</strong></span>
        </li>
      )}
    </ul>
  )}
</div>
```

**A11y checklist:**
- `role="combobox"` na inputu
- `aria-expanded`, `aria-controls` (listbox id), `aria-activedescendant` (highlighted option id)
- `role="listbox"` na `<ul>`, `role="option"` na `<li>`, `aria-selected`
- Remove buttons mají `aria-label="Odebrat <label>"`
- Keyboard: ArrowDown/Up/Enter/Escape/Backspace (posledně přidaný)

**Validace:**
- `label` 1–50 chars (UI + API Zod parity)
- Max `maxTags` (default 10) — input `disabled` při limitu + toast na 11. pokus
- Duplicates (stejný slug) silently ignored

**Error states:**
- API 500 (fetch fail) → `setSuggestions([])`, input works (user může create-new)
- PUT 400 Zod → toast error ze `/muj-ucet/profil` page

**Přibližná velikost:** ~180 řádek TSX (s komentáři). Core JSX ~80 ř.

---

## §7b API SUMMARY (opakuju z §5)

Beze změny vs předchozí revize.

---

## §8 COMMIT PLÁN (4 commity)

| # | Commit | Fáze | Risk |
|---|---|---|---|
| 1 | `feat: add Tag model with M2M user relation + seed 12 featured tags (task #54)` | A | STŘEDNÍ (migrace) |
| 2 | `feat: tag API + co-occurrence query + landing copy library (task #54)` | B | NÍZKÝ |
| 3 | `feat: broker tag editor + profile pills + admin overview + sitemap + 301 aliases (task #54)` | C | STŘEDNÍ |
| 4 | `feat: premium hashtag landing with 9-section UX + JSON-LD schemas (task #54)` | D | VYŠŠÍ (9 sekcí, 5 komponent) |

**Ne-amend, ne-reset** (memory `feedback_git_reset_approval.md`).

---

## §9 SEED DATA — 12 FEATURED TAGŮ + 4 BROKER VAZBY

### Tagy

```ts
const FEATURED_TAGS = [
  // CITY
  { slug: "praha",            label: "Praha",              category: "CITY" },
  { slug: "brno",             label: "Brno",               category: "CITY" },
  { slug: "ostrava",          label: "Ostrava",            category: "CITY" },
  // BRAND
  { slug: "bmw",              label: "BMW",                category: "BRAND" },
  { slug: "skoda",            label: "Škoda",              category: "BRAND" },
  // SPECIALIZATION
  { slug: "elektromobily",    label: "Elektromobily",       category: "SPECIALIZATION" }, // R5: slug i label bez "EV" (strict Rule 1). SEO query "elektromobily ev" pokrýt v H1/description via `lib/landing-copy.ts` (např. subheadline "...elektromobilů (EV)...")
  { slug: "luxusni-vozy",     label: "Luxusní vozy",       category: "SPECIALIZATION" },
  { slug: "veterani",         label: "Veterání",           category: "SPECIALIZATION" },
  { slug: "prvni-auto",       label: "První auto",         category: "SPECIALIZATION" },
  { slug: "family-cars",      label: "Rodinná auta",       category: "SPECIALIZATION" },
  { slug: "automat",          label: "Automat",            category: "SPECIALIZATION" },
  // SERVICE
  { slug: "vykup-do-24h",     label: "Výkup do 24h",       category: "SERVICE" },
];
```

### Brokeři (přidat pokud neexistují)

1. **Jan Novák** (existuje, slug `jan-novak-praha`)
2. **Petr Svoboda** — Praha, BROKER level, slug `petr-svoboda-praha`, email `petr.svoboda@carmakler.cz`, pw `heslo123`
3. **Marek Dvořák** — Brno, SENIOR level, slug `marek-dvorak-brno`, email `marek.dvorak@carmakler.cz`, pw `heslo123`
4. **Lucie Černá** — Ostrava, BROKER level, slug `lucie-cerna-ostrava`, email `lucie.cerna@carmakler.cz`, pw `heslo123`

### Broker → Tag vazby

| Broker | Tagy |
|---|---|
| Jan Novák | `praha`, `bmw`, `skoda`, `elektromobily`, `luxusni-vozy` |
| Petr Svoboda | `praha`, `skoda`, `family-cars`, `automat` |
| Marek Dvořák | `brno`, `luxusni-vozy`, `veterani`, `prvni-auto` |
| Lucie Černá | `ostrava`, `prvni-auto`, `vykup-do-24h`, `automat` |

**Výsledek:** `praha` = 2 br., `skoda` = 2 br., `luxusni-vozy` = 2 br., `prvni-auto` = 2 br., `automat` = 2 br. → **5 tagů testovatelných jako landing + indexed v sitemap**.

---

## §10 STOP THRESHOLDS (literal escalation)

| # | STOP | Akce |
|---|---|---|
| STOP-1 | `migrate dev` tsvector drift fail | `migrate reset --force` (memory `project_recurring_tsvector_drift.md`) |
| STOP-2 | `prisma generate` fail | eskaluj |
| STOP-3 | `npm run build` TS/lint error | fix + NEW commit (ne amend). >10 min stuck → eskaluj |
| STOP-4 | Seed brokers < 2 pro všechny featured tagy | přidej brokery (§9) |
| STOP-5 | API endpoint 500 | eskaluj s logem |
| STOP-6 | `/profil/[slug]` R4 layout regrese po TagPill pill render | STOP — tagy ADDITIVE, nesmí měnit header flex |
| STOP-7 | Landing page neprokazuje všech 9 sekcí z §6 (např. chybí FAQ, chybí related) | STOP — NE "bazoš list", uživatel explicitně chce premium |
| STOP-8 | Lighthouse SEO score < 85 na `/makleri/praha` | eskaluj — pravděpodobně chybějící meta/JSON-LD/canonical |

---

## §11 ACCEPTANCE CRITERIA

### §11.1 Funkční core (AC1–AC10)

1. Migrace OK, `Tag` model exists, 12 tagů seed + 4 brokeři + 20 broker-tag vazeb (5 z 12 featured tagů má >= 2 brokery)
2. Broker edit `/muj-ucet/profil` — sekce "Hashtagy", autocomplete z `/api/tags?q=`, create-new varianta, max 10 enforced (UI + API)
3. `/profil/jan-novak-praha` — TagPill grid v infocolumn, klik → `/makleri/<slug>`
4. `/makleri/praha` — 200 OK, server-rendered, 9 sekcí viditelných
5. `/makleri/neexistujici-xyz` → 404 not-found page
6. `/makleri/<tag s 1 brokerem>` → `<meta name="robots" content="noindex,follow">`
7. `/sitemap.xml` obsahuje 5 URL (`praha`, `skoda`, `luxusni-vozy`, `prvni-auto`, `automat`)
8. Admin `/admin/tagy` — tabulka 12 tagů s counts (admin role); non-admin redirect. **AdminSidebar obsahuje sekci "OBSAH" s linkem "Tagy" → `/admin/tagy` viditelným pouze pro roli ADMIN** (R4 FIX 2 Rule 3 compliance — nav entry, ne jen URL).
9. `GET /api/tags?q=pra` vrací tag Praha
10. `PUT /api/profile/tags` 11-ti tagů → 400 Zod error
10b. **R4 — 301 aliasy:** `GET /h/praha` → 301 `/makleri/praha`; `GET /tag/bmw` → 301 `/makleri/bmw` (ověř `curl -I` → `HTTP/1.1 308` od Next.js nebo `301` per konfiguraci)

### §11.2 Landing UX premium (AC11–AC25) — **klíčová sekce**

11. **AC11 Section 1 Breadcrumb:** `Domů › Makléři › #Praha` + BreadcrumbList JSON-LD v `<head>`
12. **AC12 Section 2 Hero:** orange gradient bg, eyebrow "Lokalita", H1 `Makléři v Praze` (NE `#Praha`), subheadline, 4 stats chips, 4 featured avatars overlap, 2 CTAs
13. **AC13 Hero category copy:** test `/makleri/bmw` → H1 `Specialisté na BMW`; `/makleri/vykup-do-24h` → H1 `Výkup do 24h`; `/makleri/luxusni-vozy` → H1 `Specialisté: Luxusní vozy`
14. **AC14 Section 3 Broker Grid:** 3/2/1 responsive cols, first card featured (2× width + orange border), sort toggles (3 buttons) funkční client-side
15. **AC15 BrokerCard obsah:** avatar, jméno, level badge, city, TagPills (max 3 +N), bio line-clamp-2, stats row (Prodeje/Úroveň/Aktivní), CTA "Zobrazit profil"
16. **AC16 Pagination:** > 12 brokerů → "Zobrazit více" button rozšíří na 24
17. **AC17 Section 4 Related Hashtags:** 6 pills z co-occurrence, clickable → další landing
18. **AC18 Section 5 Social Proof:** 3 recent SOLD vehicles, fallback message pokud 0 → sekce skrytá pokud i fallback = 0
19. **AC19 Section 6 CTA (auth-aware):** non-auth vidí primary + secondary; přihlášený BROKER vidí "Přidat tag do profilu"
20. **AC20 Section 7 FAQ:** 4 otázky per category (CITY/BRAND/SPECIALIZATION/SERVICE), accordion funkční, FAQPage JSON-LD validní (Rich Results Test)
21. **AC21 Section 8 Footer "Další {category}":** `/makleri/praha` → zobrazuje Brno + Ostrava (siblings CITY); `/makleri/bmw` → Škoda (siblings BRAND)
22. **AC22 Section 9 Bottom CTA:** "Nenašli jste?" + "Všichni makléři" → `/makleri`
23. **AC23 JSON-LD schemas (R4):** 4 schemas present, všechny validní v Google Rich Results Test:
    - **ItemList** (inline v §6.3b pod Broker Grid) — `numberOfItems`, `itemListElement[]`
    - **Person** (nested v každém ListItem.item) — `name`, `url`, `jobTitle`, `address.addressLocality`, optional `image`
    - **FAQPage** (§6.7) — `mainEntity[]` Question/Answer
    - **BreadcrumbList** (§6.1) — BreadcrumbList s 3 ListItem
24. **AC24 Mobile < 640px:** všechny sekce bez horizontal scroll, grid 1-col, CTAs full-width
25. **AC25 Lighthouse SEO:** score >= 85 na `/makleri/praha`

### §11.3 Regression (AC26–AC30)

26. `/profil/[slug]` R4 side-by-side layout beze změny
27. `/makler/[slug]` broker profil beze změny (sitemap, render, metadata)
28. `/makleri` listing beze změny
29. `/muj-ucet/profil` — existující pole (specializations, services, languageSkills, favoriteBrands) beze změny
30. `npm run build` OK, žádné TS/lint errory

---

## §12 EFFORT BREAKDOWN

| Fáze | Čas | Complexity |
|---|---|---|
| A: Schema + migrace + seed (+3 brokeři) | ~30 min | nízká |
| B: API + lib/tags + lib/landing-copy (copy templates 4 kategorie × 4 FAQ) | ~60 min | střední (copy writing) |
| C: Edit UI + profile pills + admin + sitemap | ~75 min | střední |
| D: Landing page 9 sekcí + 5 komponent + 4 JSON-LD | **~120 min** | VYŠŠÍ — 9 sections bundled |
| Build + Lighthouse + Rich Results smoke test | ~30 min | — |
| **Total** | **~5 h** | **M-L** |

---

## §13 OTEVŘENÉ OTÁZKY

### §13.1 Stats chip metriky — substituce ROI/avgDays

Team-lead navrhl 4 metriky: `count`, `totalDeals`, `avgRoi`, `avgDays`. Ale:
- `Deal` entita **neexistuje** → použij Vehicle SOLD count jako proxy pro `totalDeals` (nazvi "úspěšných prodejů")
- `avgRoi` je INVESTOR pole, ne BROKER → substituuj `topLevelCount` (count SENIOR+TOP brokerů)
- `avgDays` (průměrná doba prodeje) — možné jako `(vehicle.soldAt - vehicle.createdAt)` průměr, ale pro MVP nejspíš 0-data. Substituuj `activeVehicles` (count Vehicle WHERE status="ACTIVE" v tomto tagu)

**Finální 4 stats:** `{count} makléřů · {totalSoldVehicles} úspěšných prodejů · {topLevelCount} TOP makléřů · {activeVehicles} aktivních vozidel`

**Otázka:** OK substituce? Alternativy (pokud chceš `avgDays`): přidej computed field do dotazu `AVG(soldAt - createdAt)` — ale pro broker MVP jsou stats často null → raději `activeVehicles` jako real number.

### §13.2 Section 8 "Všechny hashtagy" link

Heading row v Section 8 navrhuje link `Všechny hashtagy →` (hypotetický `/hashtagy` overview). Ten neexistuje a v tomto tasku se nebuduje. **2 volby:**
- (a) Odstranit link pro MVP (default v plánu)
- (b) Přidat placeholder `/hashtagy` route (prostá lista všech tagů, ~15 min extra)

Doporučuji (a) — nekomplikovat scope. OK?


---

## §14 CO NENÍ V TOMTO PLÁNU (Fáze 2+)

- Per-tag custom OG image (dnes fallback `/og/makleri-tag.png`)
- Per-tag custom hero image (dnes gradient)
- Tag moderace (merge/rename/delete v admin)
- `Tag.featuredBrokerId` override (MVP = auto top by totalSales)
- Paginace > 24 brokerů (MVP = 24 + client expand)
- Featured tag panel na `/makleri` listing
- Tag na inzerátech/vozidlech/dílech (zatím jen User)
- Tag analytics (trending/growth)
- i18n (EN labely)
- Consolidace `/makler/[slug]` ↔ `/profil/[slug]` (samostatný audit-task-055 doporučeno)
- `/hashtagy` overview page (Section 8 link)
- **Level badge terminologie** (`TOP/SENIOR/BROKER/JUNIOR`) — pre-existing pojmenování v celém Carmakleru (profily, achievements, admin tabulky). Změna mimo scope TASK-054 — by vyžadovala cross-task audit. Flagged Evženem jako "worth flagging pro design systém" → vytvořit samostatný audit-task (nejedná se o Rule 1 violation, level names jsou plné názvy, ne zkratky).

---

## §15 MEMORY REMINDERS

- `project_recurring_tsvector_drift.md` — STOP-1 fix
- `reference_deploy_checklist.md` — `prisma generate` povinné po migraci
- `feedback_git_reset_approval.md` — 4 NEW commity, NE reset/amend
- `feedback_stop_escalate_literal.md` — literal STOP rituál v §10
- `feedback_no_parallel_impl_test.md` — po HOTOVO SEKVENČNĚ test-chrome
- `feedback_planovac_consistent_ranges.md` — acceptance v §11 zarovnané s STOP v §10

---

**END OF PLAN R6**

---

## §18 R6 CHANGELOG (vs R5)

| Oblast | Změna |
|---|---|
| §6.8 Footer wireframe (ř. 766-767) | Pill count label zkratka nahrazena plným tvarem `makléřů` |
| §6.8 Footer impl (ř. 801) | `<span>{count} makléřů</span>` — konzistence s §6.2 Hero a §6.4 Related Hashtags |

**Důvod:** Evžen R5 re-verify — Rule 1 compliance (žádné zkratky v UI copy). `m.` bylo jediné zbývající abbreviation v plánu.

**Effort delta:** 0 (1-string rename × 3 výskyty). Celkový effort zůstává **~5 h**.

---

## §17 R5 CHANGELOG (vs R4)

| Oblast | Změna |
|---|---|
| §2 Prisma schema comment (ř. 60) | Sjednocen slug-example s aktuálním seedem (bez anglické zkratky) |
| §6.6 CTA copy (CITY, BRAND) | `secondary.href` → `/registrace` (existující route) |
| §9 seed FEATURED_TAGS | Slug pro elektromobily tag je čistý CZ (bez anglické zkratky); label beze změny |
| §9 broker→tag mapa | Aktualizovaný slug v Jan Novákově seznamu tagů |
| §11.1 AC | Staré AC 10c odstraněno (R4 obsahovalo SEO-kompromis, v R5 neplatí — URL je čistý) |
| §13 open questions | Dotaz na CTA target ZRUŠEN — rozhodnutí finalizováno na `/registrace` |

**Effort delta:** 0 (rename 5 identifikátorů napříč plánem). Celkový effort zůstává **~5 h**.

**SEO poznámka k slug změně:** Pokud chceme zachytit alternativní CZ query (EN zkratka se vyskytuje v uživatelských dotazech), implementátor může přidat zmínku v subheadline / meta description via `lib/landing-copy.ts` — např. `"Specialisté na elektromobily (zkratka v závorkách) — prodej, výkup, ocenění"`. URL slug zůstává čistý, hlavní query v CZ je plné české slovo.

---

## §16 R4 CHANGELOG (vs R3)

| Oblast | R3 | R4 |
|---|---|---|
| Stats bar wireframe §6.2 | "[142 dealů] · [úroveň TOP 3/12] · [aktivních 38]" (mismatch s impl) | "[142 úspěšných prodejů] · [3 TOP makléřů] · [38 aktivních vozidel]" (exact match s impl spec) |
| Admin nav §3 + §4.3 | `/admin/tagy` page bez nav entry (Rule 3 risk) | + `AdminSidebar.tsx` edit + step 17b (nová sekce "OBSAH", ADMIN only) |
| TagInput §7.2 | "viz R1 plán" (R1 neexistuje) | Full spec: props, state, effects, handlers, JSX ~180 ř., a11y combobox |
| JSON-LD §6.3b | Chybělo ItemList + Person | Nová subsekce §6.3b s template (server-rendered inline) |
| Seed §9 Elektromobily | `label: "Elektromobily EV"` | `label: "Elektromobily"` (slug zachován) — strict Rule 1 |
| 301 aliasy §4.3.18b + §3 | chybělo | `app/(web)/h/[slug]/page.tsx` + `app/(web)/tag/[slug]/page.tsx` — `permanentRedirect` |
| §14 out-of-scope | — | + level badges note (audit-task doporučen) |
| AC nové | — | AC10b 301 aliasy, AC10c Elektromobily label, AC23 detailed 4 schemas |
| Commit 3 msg | "...sitemap (task #54)" | "...sitemap + 301 aliases (task #54)" |

**Effort delta:** +~15 min (301 aliasy 2 soubory × 5 ř., AdminSidebar 5 ř. edit, TagInput spec je už v R3 plánu očekáván). Celkový effort zůstává **~5 h**.

**Rule 1/3 compliance:** ✅ všech 4 Evžen blokátorů opraveno.

