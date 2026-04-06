# Impl #29 — Marketplace public apply form + MarketplaceApplication model

**Task ID:** #45 (implementation of planovaný task #29)
**Plán:** `.claude-context/tasks/plan-task-29-marketplace-public-landing.md` sekce 3.1–3.7
**Branch:** main
**Datum:** 2026-04-06

## Scope

Veřejný apply flow pro marketplace VIP platformu — odblokovat přístup pro neověřené návštěvníky. Hlavní změny:

1. **Nový Prisma model `MarketplaceApplication`** — uchovává žádosti bez uživatelského účtu (firstName, lastName, email, phone, role, companyName, ico, investmentRange, message, gdprConsent, ipAddress, userAgent, status, reviewedBy, convertedUser).
2. **Rewrite `/api/marketplace/apply`** na **veřejný endpoint** bez session requirement. Přidán honeypot (field `website`), IP-based rate limit (5 req / 15 min), anti-duplicate check (24h window, stejný email + status=NEW), fire-and-forget admin notifikace + user confirmation email.
3. **Nová stránka `/marketplace/apply`** (server component) s Breadcrumbs, Alert pro `reason=auth_required|not_authorized`, loading.tsx, error.tsx.
4. **ApplyForm refactor** — client component s `initialRole` prop, všechny povinné fields, investment range select (jen pro investor), honeypot, GDPR checkbox, thank-you state.
5. **Landing page `/marketplace`** — odstraněn inline `<ApplyForm>` sekce, přidán searchParams + Alert banner `reason=not_authorized`, hero CTA `<Link href="/marketplace/apply?role=...">`.
6. **Middleware** — unauth → `/marketplace/apply?reason=auth_required&role=...`, wrong role → `/marketplace?reason=not_authorized`.
7. **2 email templates** (admin notification + user confirmation) — **direct import pattern**, NE přes `generateEmail()` factory (stejně jako u #19).

## Dotčené soubory

### Prisma
- `prisma/schema.prisma` — nový model `MarketplaceApplication` + 2 User relations (`marketplaceApplicationsReviewed`, `marketplaceApplicationsConverted`)
- `prisma/migrations/20260406100000_marketplace_application/migration.sql` — nová migrace

### Validator
- `lib/validators/marketplace.ts` — rozšíření `applySchema` (firstName, lastName, email, phone, gdprConsent, investmentRange, refine pro dealer validation)

### API
- `app/api/marketplace/apply/route.ts` — **rewrite** bez session, s honeypot/rate-limit/anti-dup/emaily

### Email templates (NOVÉ)
- `lib/email-templates/marketplace-application-admin.ts` — notifikace adminům
- `lib/email-templates/marketplace-application-confirmation.ts` — potvrzení uživateli

### Stránky (NOVÉ)
- `app/(web)/marketplace/apply/page.tsx` — server component s Alert banners
- `app/(web)/marketplace/apply/loading.tsx` — spinner
- `app/(web)/marketplace/apply/error.tsx` — error boundary

### Úpravy
- `app/(web)/marketplace/page.tsx` — searchParams + Alert + CTA link update
- `components/web/marketplace/ApplyForm.tsx` — rewrite (initialRole prop, všechny fields, honeypot)
- `middleware.ts` — marketplace dealer/investor gating → apply page redirects

## Acceptance criteria check

| Kritérium | Stav | Poznámka |
|---|---|---|
| `/marketplace/apply` funguje pro anonymous user | ✅ | Server component, searchParams pro role/reason |
| Apply form má firstName, lastName, email, phone, role, message, gdprConsent | ✅ | Povinná pole + validace Zod |
| Investment range jen pro investora | ✅ | `<select>` podmíněně renderovaný |
| Dealer musí vyplnit companyName + IČO | ✅ | Zod `.refine()` na serveru + `canSubmit` na klientovi |
| Honeypot field proti botům | ✅ | `website` field — absolutely positioned off-screen |
| Rate limit na IP | ✅ | 5 req / 15 min přes `rateLimit()` helper |
| Anti-duplicate check | ✅ | 24h window, stejný email + status=NEW → 409 |
| Email adminu s detaily žádosti | ✅ | `marketplace-application-admin.ts` — fire-and-forget |
| Email uživateli s potvrzením | ✅ | `marketplace-application-confirmation.ts` — fire-and-forget |
| Admin DB notification | ✅ | `prisma.notification.createMany` pro všechny ACTIVE admin rolí |
| Middleware redirect unauth → apply page | ✅ | `?reason=auth_required&role=...` |
| Middleware redirect wrong role → landing | ✅ | `?reason=not_authorized` |
| Landing page Alert pro oba důvody | ✅ | `<Alert variant="warning">` — server-side, NE client toast |
| CTA na landing page míří na `/marketplace/apply?role=...` | ✅ | Dvě hero tlačítka + bottom CTA sekce |
| Build + lint green | ✅ | `npm run build` prošel; lint errors jsou pre-existing |

## Guardrails dodržené (z task_assignment)

- ✅ Email templates NEjsou registrovány v `generateEmail()` factory (direct import, stejně jako #19)
- ✅ Alert banner pro reason je **server-side** (ne client toast — plán doporučuje jednodušší variant)
- ✅ API endpoint rewrite — NE přidávání session check, plně veřejný
- ✅ Landing page `export const revalidate = 3600` odstraněno kvůli searchParams incompatibility

## Odchylky od plánu

1. **Migrace ručně aplikovaná přes psql** — Prisma migrate dev detekoval pre-existující drift v Listing/Part/Vehicle searchVector indexes a chtěl resetovat DB. Workaround:
   - Generoval jsem SQL přes `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
   - Migrace uložena do `prisma/migrations/20260406100000_marketplace_application/migration.sql`
   - Aplikováno přes `psql "postgresql://zen@localhost:5432/carmakler" -f ...`
   - Manuálně registrováno v `_prisma_migrations`: `INSERT ... applied_steps_count=1`
   - `npx prisma generate` regeneroval klienta
   - **Pozor:** na produkci bude potřeba nejprve vyřešit searchVector drift (otevřený issue), nebo migraci aplikovat přes stejný workaround
2. **`MarketplaceRedirectNotice` client-side toast NE implementován** — plán popisoval client-side toast jako alternativu, ale team-lead v task_assignmentu výslovně doporučil **server-side Alert** (jednodušší). Implementoval jsem jen Alert banner. Pokud v budoucnu bude potřeba dismissible toast, lze přidat jako další component.
3. **Honeypot name `website`** — plán navrhoval "hidden field"; vybral jsem konkrétní název `website` (běžný pattern, boty ho auto-fillují).
4. **Rate limit hodnoty** — 5 req / 15 min (reasonable pro apply form); plán konkrétní limit nezmiňoval.
5. **Investment range hodnoty** — `"10k-50k" | "50k-200k" | "200k-1M" | "1M+"` (enum); plán pouze požadoval field existenci.
6. **Admin DB notification** — plán zmiňoval jen email; přidal jsem i DB notification přes `prisma.notification.createMany` pro admin dashboard banner konzistenci s ostatními flows.

## Risk assessment

| Riziko | Severity | Mitigation |
|---|---|---|
| Prisma drift na prod DB blokuje deploy | **High** | Dokumentovaný workaround v `impl-task-29-marketplace-apply.md` (tento soubor); DevOps musí aplikovat ručně nebo nejdřív srovnat searchVector drift |
| Rate limit Map store je in-memory (ne Redis) | Low | Pro apply form dostatečné — denní objem << serverless restart cyklus; pokud scaling, přepnout na Redis |
| Emailové služby (Resend) down | Low | Fire-and-forget pattern — žádost se uloží do DB i když email selže |
| Spam boti překonají honeypot | Low | Rate limit + anti-duplicate + admin manuální review jsou další vrstvy |
| 24h anti-dup okno příliš agresivní | Low | Legitimate user neposlal by 2x během 24h; 409 response je jasný UX feedback |

## Build / Lint

- `npm run build` → ✅ PASS, všechny routy vygenerovány včetně `/marketplace/apply`
- `npm run lint` → pre-existing errors v `e2e/comprehensive-batch-test.spec.ts` (require() imports) a `components/ui/Tabs.tsx` (React compiler memoization skip); **žádné nové errors** v dotčených souborech

## Notes pro follow-up

- **Admin panel pro MarketplaceApplication review** — NEimplementováno (není v scope #29); potřeba další task na admin UI list/detail/approve/reject flow s konverzí na User účet
- **Email templates NEjsou v `generateEmail()` factory** — vědomé rozhodnutí, konzistentní s #19; pokud v budoucnu potřeba centralizovat, přidat jako `type: "MARKETPLACE_APPLICATION_ADMIN" | "MARKETPLACE_APPLICATION_CONFIRMATION"`
- **E2E test chybí** — měl by být přidán jako samostatný task (happy path + honeypot + rate limit + duplicate)
