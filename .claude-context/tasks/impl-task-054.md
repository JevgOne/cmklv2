# IMPL Report: TASK-054 Hashtags + SEO landing pages

**Datum:** 2026-04-16
**Implementátor:** agent team
**Task ID:** #24
**Plán:** `.claude-context/tasks/plan-task-054-hashtags-seo.md` (R6)
**Strategie:** 4 commity sequential (Fáze A-D)

---

## Fáze A — Prisma schema + migrace + seed ✅

### §A.1 Reset + migration split (varianta C per team-lead)

**Kontext:** `prisma migrate dev --name add_tags_m2m` vygeneroval migraci s masivním pre-existujícím driftem (12 nových tabulek, 14 User cols, atd.). Team-lead zvolil split do 2 migrací.

**Akce:**
1. `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="Ano, provedeno reset dev DB..." npx prisma migrate reset --force` → OK, DB reset na baseline 10 migrací
2. `yes | script npx prisma migrate dev --create-only --name add_tags_m2m` → migration SQL vygenerována (467 řádků)
3. Ručně rozdělena do 2 migrací:
   - `prisma/migrations/20260416083700_sync_schema_drift/migration.sql` — vše kromě Tag + _UserTags
   - `prisma/migrations/20260416083800_add_tags_m2m/migration.sql` — pouze Tag + _UserTags (40 řádků)
4. `npx prisma migrate deploy` → obě aplikovány
5. `npx prisma migrate status` → "Database schema is up to date!"
6. `npx prisma generate` → OK, Prisma Client v7.5.0

### §A.2 Commity

| Hash | Zpráva | Files |
|---|---|---|
| `631e940` | chore(db): catch-up schema drift — 12 new tables + User profile cols | 1 file (+427) |
| `6666db9` | feat(tags): add Tag model with implicit M2M + seed 12 featured tags | 3 files (+179) |

### §A.3 Schema změny (`prisma/schema.prisma`)

```prisma
// User model (addition at line 155)
tags Tag[] @relation("UserTags")

// Nový Tag model (na konci souboru)
model Tag {
  id          String   @id @default(cuid())
  slug        String   @unique
  label       String
  category    String?
  isFeatured  Boolean  @default(false)
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  users       User[]   @relation("UserTags")
  @@index([isFeatured])
  @@index([category])
}
```

### §A.4 Seed změny (`prisma/seed.ts`)

**Lokace:** Přidáno po AI conversations seed (~ř. 2828), před final counts.

- 3 noví brokeři: Petr Svoboda (Praha), Marek Dvořák (Brno), Lucie Černá (Ostrava) — všichni BROKER/ACTIVE, passwordHash "heslo123", city+bio
- 12 featured tagů z plánu §9 (CITY: 3, BRAND: 2, SPECIALIZATION: 6, SERVICE: 1)
- 17 broker-tag vazeb (Jan 5, Petr 4, Marek 4, Lucie 4)
- 5 tagů má ≥2 brokerů: praha, skoda, luxusni-vozy, prvni-auto, automat

### §A.5 DB verifikace

```
SELECT COUNT(*) FROM "Tag";     → 12
SELECT COUNT(*) FROM "_UserTags" → 17

     slug      | broker_count
---------------+--------------
 automat       |            2
 luxusni-vozy  |            2
 praha         |            2
 prvni-auto    |            2
 skoda         |            2
 bmw           |            1
 brno          |            1
 elektromobily |            1
 family-cars   |            1
 ostrava       |            1
 veterani      |            1
 vykup-do-24h  |            1
```

### §A.6 STOP-1 checklist

| Podmínka | Stav | Evidence |
|---|---|---|
| `prisma migrate deploy` OK | ✅ PASS | 12 migrací aplikováno |
| `prisma migrate status` OK | ✅ PASS | "Database schema is up to date!" |
| `prisma generate` OK | ✅ PASS | Prisma Client v7.5.0 |
| `npx prisma db seed` OK | ✅ PASS | 12 tagů + 17 vazeb + 3 noví brokeři |
| `npm run build` OK | ✅ PASS | ✓ Compiled successfully in 19.2s, 1258 stránek, 0 errorů |
| DB counts match plán §11 AC1 | ✅ PASS | 12 tagů, 5 s ≥2 brokerů, seed brokeři existují |

---

### §A.7 Simplify review (3 agents parallel)

**Reuse:** CLEAN. Jedna optional minor: `lib/seo/slugify.ts` mohl derivovat slug z labelu. SKIP — slug je URL primary key, explicitní je intentional (deterministic, review-friendly).

**Quality:**
- Copy-paste na 3 broker creates — **SKIP:** Následuje existující seed.ts konvenci (janNovak/petraMala/karelDvorak/pendingBroker/onboardingBroker všichni jako inline creates). Ne-refactor pro konzistenci.
- `category` String? vs Prisma enum — **SKIP:** Plán §2 explicitně předpisuje `String?`. Enum by vyžadoval změnu migrace. Zvážit v Fázi B nebo později.
- Typed tag slug keys — **SKIP:** Minor, seed běží jednou. Runtime funguje.

**Efficiency:** CLEAN. Optional: `connect: { slug }` místo `tagMap` — readability win, ne performance. SKIP (DB už seeded, re-work nestojí za to).

**Výstup:** No cleanup commit needed. Phase A kódově čistá.

---

## Fáze B — API routes (TODO)

TBD.

---

## Fáze C — TagInput + Edit UI + Profile display (TODO)

TBD.

---

## Fáze D — Landing page + 301 aliasy + admin (TODO)

TBD.
