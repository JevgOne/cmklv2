# IMPL: SEO Admin Center — Fáze 2 SEO ekosystému

**Task #1** | Implementátor | 2026-05-26
**Status:** HOTOVO

---

## Souhrn

SEO Admin Center byl implementován kompletně podle plánu v `plan-seo-admin-center.md`. Všechny 4 fáze (A–D) jsou dokončeny.

## Co bylo implementováno

### Fáze A: API + backend
- `lib/seo-audit.ts` — audit engine (auditPage + computeHealthScore)
- `app/api/admin/seo/pages/route.ts` — GET (list + filter), POST (create), PATCH (bulk actions)
- `app/api/admin/seo/pages/[id]/route.ts` — GET, PATCH, DELETE
- `app/api/admin/seo/audit/route.ts` — GET (health score), POST (run audit + persist)
- `scripts/seed-seo-pages.ts` — seed script s ~200 stránkami (static, LP brand/city/body/price, parts)

### Fáze B: Dashboard + tabulka
- `components/admin/seo/SeoStatusBadge.tsx` — OK/WARNING/ERROR/unaudited badge
- `components/admin/seo/SeoHealthCards.tsx` — dashboard cards (score, ok, warnings, errors, issues, coverage, recent changes)
- `app/(admin)/admin/seo/page.tsx` — SEO Dashboard (server component)
- `components/admin/seo/SeoMetadataTable.tsx` — full tabulka s filtry, inline edit, bulk select, CSV export, pagination
- `app/(admin)/admin/seo/metadata/page.tsx` — metadata list page
- AdminSidebar — SEO sekce (Dashboard, Metadata, Audit) pro ADMIN roli

### Fáze C: Detail + audit
- `components/admin/seo/SeoPageEditForm.tsx` — full edit form s SERP preview, OG preview, audit section, schema.org (read-only)
- `app/(admin)/admin/seo/metadata/[id]/page.tsx` — detail page (server component, auth check)
- `components/admin/seo/SeoAuditRunner.tsx` — audit execution, scope selection, results with severity filter
- `app/(admin)/admin/seo/audit/page.tsx` — audit page

### Fáze D: Bulk + polish
- Bulk select + actions (MARK_OK, SET_NO_INDEX, REMOVE_NO_INDEX, DELETE) in SeoMetadataTable
- CSV export (STOP-6 compliant — no internal IDs)
- Pagination via Pagination component
- Loading/error states — 8 nových souborů (loading.tsx + error.tsx pro všechny 4 routes)

## STOP pravidla — dodržena
- STOP-1: Auto-register nepřepisuje existující data (seed script: upsert only if title/desc null)
- STOP-2: DELETE override = revert to code defaults (confirm dialog)
- STOP-3: Audit nikdy nemění metadata — jen auditStatus/auditNotes/lastAuditedAt
- STOP-4: Všechny API routes mají requireAdmin() check
- STOP-5: Inline edit má debounce ref (save on blur/Enter, cancel on Escape)
- STOP-6: CSV export neobsahuje interní ID
- STOP-7: noIndex bulk action vyžaduje confirm dialog
- STOP-8: schemaTypesJson je read-only v admin UI

## Build
- TypeScript: 0 errors
- Next.js build: PASS
