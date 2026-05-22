# Implementace P0-08: Migrace SQLite → PostgreSQL

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedene zmeny

### 1. `prisma/schema.prisma`
- Provider zmenen z `sqlite` na `postgresql`
- Odstranen custom `output = "../node_modules/.prisma/client"` (neni potreba s PostgreSQL)
- URL se ridi pres `prisma.config.ts` (Prisma 7 pattern — `url` v schema neni podporovano)

### 2. `prisma.config.ts`
- Datasource URL zmeneno z `"file:./dev.db"` na `postgresql://zen@localhost:5432/carmakler`
- URL pro Migrate se cte z `process.env.DATABASE_URL` s fallbackem

### 3. `lib/prisma.ts`
- Kompletni prepis: SQLite adapter (`PrismaBetterSqlite3`) nahrazen PostgreSQL adapterem (`PrismaPg` + `pg.Pool`)
- Import zmenen z `".prisma/client"` na `"@prisma/client"`
- Pridan logging pro development

### 4. `prisma/seed.ts`
- Hlavicka (radky 1-8) prepsana: SQLite adapter nahrazen PostgreSQL adapterem
- Zbytek seed.ts (2700+ radku) beze zmeny

### 5. `prisma/seed-partners.ts`
- Stejne jako seed.ts — SQLite adapter nahrazen PostgreSQL adapterem

### 6. `package.json`
- Odstraneny: `better-sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3`
- Pridany: `@prisma/adapter-pg@7.5.0`, `pg@^8`

### 7. `prisma/migrations/`
- Smazano 23 starych SQLite migraci
- Vytvorena nova baseline: `20260405061246_init_postgresql/migration.sql`

### 8. `.env.local`
- Vytvoreno s `DATABASE_URL=postgresql://zen@localhost:5432/carmakler`

### 9. `dev.db`
- Smazano (jiz nepotrebne)

---

## Odchylky od planu

### Prisma 7 kompatibilita
Plan predpokladal `url = env("DATABASE_URL")` v schema.prisma a jednoduchy `new PrismaClient()`. Prisma 7.5.0 vsak:
- **Nepodporuje** `datasource.url` v schema.prisma
- **Vyzaduje** adapter pattern pro PrismaClient (stejne jako u SQLite)
- URL pro Migrate se predava pres `prisma.config.ts`

Proto se pouziva `@prisma/adapter-pg` + `pg` Pool misto primocarejsiho pripojeni.

### Dalsi soubory
Plan zmnil 4 soubory, ale `prisma/seed-partners.ts` taky pouzival PrismaClient primo — opraven take.

---

## Overeni

- [x] `npx prisma migrate dev` — PASS (baseline migrace vytvorena)
- [x] `npx prisma db seed` — PASS (vsechna seed data vlozena)
- [x] `npm run build` — PASS (299 stranek, 0 chyb)
- [x] `npm run test:run` — PASS (141 testu, 15 souboru)
- [x] `better-sqlite3` a `@prisma/adapter-better-sqlite3` NEJSOU v `package.json`
- [x] `dev.db` neexistuje
- [x] Import v `lib/prisma.ts` je z `"@prisma/client"`
- [x] Vsechny stare SQLite migrace smazany
- [x] Nova baseline migrace `init_postgresql` existuje
- [x] `.env.local` obsahuje validni PostgreSQL connection string

---

## Poznamky pro deployment

- PostgreSQL 16 nainstalovan lokalne pres Homebrew (`brew services start postgresql@16`)
- Databaze `carmakler` vytvorena lokalne
- Pro produkci nastavit `DATABASE_URL` env var s SSL a connection pooling
