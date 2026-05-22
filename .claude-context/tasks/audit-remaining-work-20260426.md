# Audit — Zbývající práce po TASK-001 až TASK-042

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Rozsah:** TASK-043 stav, nedokončené plány, TODO/FIXME v kódu

---

## 1. TASK-043 (Blog/Magazín) — Co je hotovo vs chybí

### HOTOVO (implementováno a nasazeno):

| # | Feature | Stav | Soubory |
|---|---------|------|---------|
| 1 | Article model + DB | ✅ | `prisma/schema.prisma` (Article, ArticleCategory, ArticleTag, ArticleTagLink) |
| 2 | Blog listing stránka | ✅ | `app/(web)/blog/page.tsx` |
| 3 | Blog detail stránka | ✅ | `app/(web)/blog/[slug]/page.tsx` |
| 4 | Kategorie stránky | ✅ | `app/(web)/blog/kategorie/[slug]/page.tsx` |
| 5 | Admin CRUD | ✅ | `app/(admin)/admin/blog/page.tsx`, `[id]/edit/` |
| 6 | AI draft generátor | ✅ | `app/api/blog/ai-generate/route.ts`, `admin/blog/ai-drafts/` |
| 7 | JSON-LD Article schema | ✅ | `lib/seo.ts` → `generateArticleJsonLd` |
| 8 | Sitemap integration | ✅ | `app/sitemap.ts` (blog articles z DB) |
| 9 | Reakce (emoji) | ✅ | `ArticleReaction` model + `api/blog/articles/[id]/reactions/` + `components/web/blog/ArticleReactions.tsx` |
| 10 | Komentáře s moderací | ✅ | `ProfileComment.articleId` + `api/blog/articles/[id]/comments/` + `components/web/blog/ArticleComments.tsx` |
| 11 | Newsletter (double opt-in) | ✅ | `NewsletterSubscriber` model + `api/newsletter/subscribe/` + `api/newsletter/confirm/` + `components/web/blog/NewsletterSignup.tsx` |
| 12 | Share buttons | ✅ | `app/(web)/blog/[slug]/ShareButtons.tsx` |
| 13 | Admin komentáře moderace | ✅ | `app/(admin)/admin/blog/comments/` + `api/admin/comments/[commentId]/` |
| 14 | Admin sidebar link | ✅ | `AdminSidebar.tsx:93` → "Komentáře" |

### CHYBÍ (z původního TASK-043 zadání):

| # | Feature | Priorita | Popis |
|---|---------|----------|-------|
| 1 | **Makléřský blog editor** | **STŘEDNÍ** | `app/(pwa)/makler/blog/` NEEXISTUJE. Makléři nemůžou psát články přes PWA dashboard. Články jdou psát jen přes admin panel. |
| 2 | **AI topic suggestion** | **NÍZKÁ** | `api/blog/ai-suggest-topics` NEEXISTUJE. AI umí generovat drafty (ai-generate), ale neumí navrhovat témata automaticky. |
| 3 | **Tag stránky na blogu** | **NÍZKÁ** | `app/(web)/blog/tag/[slug]/page.tsx` neexistuje jako standalone stránka. Tagy se filtrují přes ?tag= query param na /blog, ale nemají dedikovanou landing page. |

**Verdikt TASK-043:** ~85% kompletní. Makléřský editor je jediný větší chybějící kus.

---

## 2. Nedokončené plány — ČEKÁ NA SCHVÁLENÍ / IMPLEMENTACI

### A. Plány čekající na schválení leadem (8):

| # | Plán | Téma | Priorita |
|---|------|------|----------|
| 1 | `plan-dashboard-export.md` | Admin Export button → dropdown s CSV vozidla/makléři/provize | STŘEDNÍ |
| 2 | `plan-fix-admin-broker-pages.md` | Chybějící admin broker detail/edit stránky (404 na "Zobrazit"/"Upravit") | **VYSOKÁ** |
| 3 | `plan-admin-search-bar.md` | Admin search bar je nefunkční placeholder | STŘEDNÍ |
| 4 | `plan-sitemap-jsonld-audit.md` | Rozšíření sitemap + JSON-LD (Fáze 3+4 zbývají) | STŘEDNÍ |
| 5 | `plan-redesign-vehicle-intake.md` | PWA nabírání aut redesign | STŘEDNÍ |
| 6 | `plan-vehicle-intake-redesign.md` | Alternativní vehicle intake redesign (s defect photos) | STŘEDNÍ |
| 7 | `plan-fix-vehicle-intake-issues.md` | Fix bugs v nabírání aut flow | STŘEDNÍ |
| 8 | `plan-fix-vin-page-no-draft.md` | VIN stránka bez draft state | NÍZKÁ |
| 9 | `plan-ai-description-from-equipment.md` | AI popis z výbavy vozidla | NÍZKÁ |
| 10 | `plan-blog-redesign.md` | Blog redesign plán (IMPLEMENTOVÁNO — status neaktualizován) | ~~HOTOVO~~ |

### B. Plány čekající na implementaci (2):

| # | Plán | Status | Poznámka |
|---|------|--------|----------|
| 1 | `impl-blog-redesign.md` | ČEKÁ NA IMPLEMENTACI | **Ale JIŽ IMPLEMENTOVÁNO** — status neaktualizován |
| 2 | `impl-sitemap-jsonld.md` | ČEKÁ NA IMPLEMENTACI | **Fáze 1+2 IMPLEMENTOVÁNY** — Fáze 3+4 zbývají |

### C. Další ready-for-impl plány (starší):

| # | Plán | Poznámka |
|---|------|----------|
| 1 | `plan-broker-card-ig-redesign.md` | READY FOR IMPLEMENTATION — Instagram-style broker karty |
| 2 | `plan-homepage-broker-cards.md` | Ready for implementation — homepage broker karty |
| 3 | `plan-task-111.md` | READY — čeká na lead approval |

---

## 3. TODO/FIXME/STUB v kódu

### Aktivní TODOs (4):

| # | Soubor | TODO | Priorita |
|---|--------|------|----------|
| 1 | `app/api/vehicles/[id]/handover/route.ts:219` | `TASK-026 — automatický email kupujícímu po 7 dnech (follow-up systém)` | STŘEDNÍ |
| 2 | `components/shop/ShopTrustBar.tsx:6` | `TODO(designer): text-badges jako placeholder. Nahradit za SVG loga platebních metod` | NÍZKÁ |
| 3 | `lib/seo/pricingAggregate.ts:16` | `TODO #87d — migraci na PostgreSQL JSONB array path query` | NÍZKÁ |
| 4 | `lib/shipping/README.md:188` | Zásilkovna XML parsing regexem místo proper XML parserem | NÍZKÁ |

### Stuby/Placeholdery (3):

| # | Soubor | Problém | Stav |
|---|--------|---------|------|
| 1 | `app/(partner)/partner/messages/page.tsx` | "Plná komunikace bude brzy k dispozici" | Stub — jen notifikace |
| 2 | `app/(pwa)/makler/stats/page.tsx:337,358` | "bar chart placeholder" / "line chart placeholder" — div-based místo recharts | Funkční ale basic |
| 3 | `app/(pwa)/makler/onboarding/training/page.tsx:57` | "Video bude brzy dostupné" — placeholder pro onboarding video | Čeká na video obsah |

### Vyřešené (z posledních sessions):

| # | Problém | Stav |
|---|---------|------|
| ~~A1~~ | Admin Export button (stub) | ✅ **IMPLEMENTOVÁNO** — `api/admin/export/route.ts` existuje |
| ~~K1~~ | Admin broker detail 404 | ✅ **EXISTUJE** — `admin/brokers/[id]/page.tsx` + `/edit/` |

---

## 4. Backlog nápady (z backlog-napady-20260425.md)

| # | Nápad | Stav | Priorita |
|---|-------|------|----------|
| 1 | TASK-044: Kariérní systém s hvězdičkami | Plán existuje, implementace probíhá | **VYSOKÁ** |
| 2 | Nová loga v PDF/smlouvách | Plán existuje (plan-task-045) | STŘEDNÍ |
| 3 | Fonty (Exo 2 + Inter vs Outfit) | ČEKÁ NA ROZHODNUTÍ | NÍZKÁ |
| 4 | Registrace makléře — kontrola flow | Plán existuje (plan-task-047) | STŘEDNÍ |
| 5 | Průvodce aplikací (onboarding) | Plán existuje (plan-task-048/052) | STŘEDNÍ |
| 6 | Scénář uvítací video | Plán existuje (plan-task-049) | NÍZKÁ |
| 7 | Profil makléře — Instagram redesign | Plán READY (plan-broker-card-ig-redesign) | STŘEDNÍ |
| 8 | Reputační systém (Trust Score) | Plán existuje (plan-task-050) | STŘEDNÍ |
| 9 | Like na profil makléře | IMPLEMENTOVÁNO (ProfileLike) | ~~HOTOVO~~ |
| 10 | Interní chat / support systém | K naplánování | NÍZKÁ |

---

## 5. Doporučení — co má smysl dělat dál

### Priorita 1 — Rychlé fixy (< 1h každý):

| # | Úkol | Důvod |
|---|------|-------|
| 1 | Aktualizovat status hotových plánů | `impl-blog-redesign.md`, `plan-blog-redesign.md`, `plan-dashboard-export.md` → HOTOVO |
| 2 | Handover follow-up email (TODO z route.ts:219) | Jediný STŘEDNÍ TODO v produkčním kódu |

### Priorita 2 — Smysluplné features (2-4h):

| # | Úkol | Důvod |
|---|------|-------|
| 3 | Makléřský blog editor v PWA | Zbývá z TASK-043 — makléři nemůžou psát články |
| 4 | Admin search bar funkční | Uživatelé vidí input ale nemůže hledat |
| 5 | Sitemap + JSON-LD Fáze 3+4 | 4 nové generátory (LocalBusiness, AggregateRating, JobPosting, Person) + napojení |

### Priorita 3 — Větší features (backlog):

| # | Úkol | Důvod |
|---|------|-------|
| 6 | TASK-044: Kariérní hvězdičky | Uživatelem požadováno, plán existuje |
| 7 | Broker card Instagram redesign | Plán READY, vizuální upgrade |
| 8 | Reputační systém (Trust Score) | Komplexní ale unikátní hodnota platformy |

### NEprioritní (odložit):

- Partner messages real-time chat — partnerský modul je sekundární
- Stats recharts upgrade — div-based grafy fungují
- Zásilkovna XML parser — funguje, jen křehké
- ShopTrustBar SVG badges — čeká na brand assets

---

*Audit dokončen: 2026-04-26*
