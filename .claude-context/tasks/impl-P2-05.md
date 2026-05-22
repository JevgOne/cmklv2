# Implementace P2-05: Smart Search (PostgreSQL fulltext)

**Status:** DONE
**Datum:** 2026-04-05

## Změny

### SQL Migrace (existující, opravena)
- `prisma/migrations/20260405_add_fulltext_search/migration.sql`
  - Oprava: `"title"` → `"variant"` v Listing searchVector (Listing nemá title sloupec)
  - pg_trgm extension pro fuzzy matching
  - tsvector columns + GIN indexy na Part, Vehicle, Listing
  - Triggery pro auto-update searchVector při INSERT/UPDATE
  - Trigram indexy pro autocomplete (Part.name, Vehicle.brand, Vehicle.model)

### Schema update
- `prisma/schema.prisma`
  - Part: `searchVector Unsupported("tsvector")?`
  - Vehicle: `searchVector Unsupported("tsvector")?`
  - Listing: `searchVector Unsupported("tsvector")?`

### lib/search.ts (NOVÝ)
- `sanitizeQuery()` — sanitizace pro tsquery (prefix matching s :*)
- `smartSearch()` — fulltext search přes Part + Listing s ts_rank řazením
- `getSearchSuggestions()` — autocomplete přes pg_trgm similarity

### /api/search/smart (NOVÝ)
- `GET /api/search/smart?q=...` — plný search s výsledky
- `GET /api/search/smart?q=...&suggestions=true` — jen autocomplete
- Parametry: `type`, `page`, `limit`

### SmartSearchBar (existující)
- Komponenta již existovala s ARIA combobox, keyboard nav, 200ms debounce
- Volá `/api/search/smart?q=...&suggestions=true` pro autocomplete

## Build
- ✅ `next build` prošel bez chyb
