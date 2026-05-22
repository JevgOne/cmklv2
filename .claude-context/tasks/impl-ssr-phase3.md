# IMPL: SSR migrace Fáze 3 — Uživatelský účet (10 stránek)

**Datum:** 2026-05-05
**Commit:** `61454a6`
**Status:** HOTOVO

## Změny

### Nové client components (components/web/)
| Soubor | Export | Důvod client |
|--------|--------|-------------|
| `FavoritesList.tsx` | `FavoritesList` | `removeFavorite()` POST + useState |
| `GarageManager.tsx` | `GarageManager` | CRUD (add/delete/setDefault) + form state |
| `MyListingsManager.tsx` | `MyListingsManager` | Tabs filter, Dropdown akce, Modal delete, statusPill |
| `ListingDetailManager.tsx` | `ListingDetailManager` | Reply form, promote onClick, useRouter |
| `ProfileEditor.tsx` | `ProfileEditor` | 20+ useState, ImageUpload, TagInput, form onSubmit |

### Migrované stránky
| Soubor | Typ | Změny |
|--------|-----|-------|
| `(web)/muj-ucet/page.tsx` | Page → SSR | Odebráno "use client", useState, useEffect, fetch. Přidán Prisma count queries + user select. Žádný nový soubor. |
| `(web)/muj-ucet/dotazy/page.tsx` | Page → SSR (100%) | Odebráno "use client", useState, useEffect, fetch. EmptyState onAction nahrazeno za Link. Žádný client component. |
| `(web)/muj-ucet/poptavky/page.tsx` | Page → SSR (100%) | Odebráno "use client", useState, useEffect, fetch. Prisma query s include offers+supplier. Žádný client component. |
| `(web)/muj-ucet/oblibene/page.tsx` | Page → SSR | Odebráno "use client". Prisma query s include listing. Data předány do FavoritesList. |
| `(web)/muj-ucet/garaz/page.tsx` | Page → SSR | Odebráno "use client". Prisma query CustomerGarage. Date serializace toISOString(). Data předány do GarageManager. |
| `(web)/muj-ucet/profil/page.tsx` | Page → SSR | Odebráno "use client". Prisma user select + tags M2M. Json pole castovány. Data předány do ProfileEditor. |
| `(web)/moje-inzeraty/page.tsx` | Page → SSR | Odebráno "use client". Prisma listing query + maxListings logika (replika z API route). Data předány do MyListingsManager. |
| `(web)/moje-inzeraty/[id]/page.tsx` | Page → SSR | Odebráno "use client", useParams. `await params` pro id. Prisma listing+images+inquiries. Date serializace. Data předány do ListingDetailManager. |
| `(web)/shop/moje-objednavky/page.tsx` | Page → SSR | Odebráno "use client". Prisma order query. OrderTracker importován přímo (client island). |
| `(web)/dily/moje-objednavky/page.tsx` | Page → SSR | Identický pattern jako shop/moje-objednavky. Opraveny linky na /dily/ prefix. |

### Klíčové technické detaily
- **Auth pattern:** `getServerSession(authOptions)` + `redirect("/login")` na všech 10 stránkách
- **Date serializace:** `.toISOString()` na všech Date polích před předáním do client components
- **Json casting:** `services as string[]`, `socialLinks as Record<string, string>`, `specializations as string`
- **Re-fetch:** Client components zachovávají `fetchXyz()` funkce pro refresh po CRUD mutacích
- **maxListings logika:** Replikována z `/api/listings/my` route (baseLimits per accountType + listingCredits)
- **EmptyState → Link:** Na SSR stránkách (dotazy, poptavky) nahrazeno `EmptyState onAction` za inline SSR empty state s `<Link>`
- **notFound():** Použito na `moje-inzeraty/[id]` pro neexistující listing

## Statistiky
- **15 souborů změněno** (10 page.tsx + 5 nových client components)
- **1992 insertions, 1984 deletions**
- **5 nových client island souborů**
- **5 stránek 100% SSR** (žádný client component)

## Ověření
- **Build:** OK (0 errors, compiled in 20.5s)
- **Lint:** OK (0 errors, 684 pre-existing warnings)
