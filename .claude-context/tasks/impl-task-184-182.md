# IMPL #184 — TASK-020 Eshop autodíly gap-fix (#182)

**Task:** #184 IMPL TASK-020 Eshop autodíly gap-fix
**Plan:** `.claude-context/tasks/plan-task-182-eshop-dily-gap.md` (efa03a2)
**Datum:** 2026-04-09
**Branch:** main
**Commits delivered (6+1, atomic):**

| # | Hash | Subject |
|---|---|---|
| A | `9dfadde` | feat(#182-A): schema + migration manufacturer/warranty + WHOLESALE_SUPPLIER role marker |
| B | `5c13bbd` | feat(#182-B): API + validators + middleware — manufacturer/warranty/WHOLESALE_SUPPLIER |
| C | `04ce6ae` | feat(#182-C): PWA wizard manufacturer + warranty input fields |
| D | `776ff72` | feat(#182-D): web detail render block + katalog manufacturer filter |
| E | `ab58f27` | feat(#182-E): seed WHOLESALE_SUPPLIER user + 3 sample aftermarket parts |
| F | `335886d` | test(#182-F): E2E parts-wholesale.spec.ts — wholesale flow + manufacturer filter |
| G | `1b539a3` | chore(#182-G): /simplify cleanup — drop narrating task refs |

---

## §1 — Scope delivered

| Gap | Položka | Status |
|---|---|---|
| 1 | `WHOLESALE_SUPPLIER` v `User.role` (String comment marker, **NE Prisma enum**) | ✅ Schema + middleware + 2 API allowedRoles + seed user |
| 2 | `Part.manufacturer String?` (max 100) + B-tree index + ILIKE search | ✅ Schema + migration + validator + API filter + wizard input + detail/katalog UI |
| 3 | `Part.warranty String?` (max 50) | ✅ Schema + migration + validator + wizard input + detail render |

**Out of scope (per task brief STOP rules):**
- Phase B (Q4: defer kompletně)
- Stripe Connect / pricing changes
- Advanced fulltext (Q3: B-tree + ILIKE, žádný tsvector pro manufacturer)
- Notifications

---

## §2 — Lead decisions (§7 plan) — implementation map

| # | Q | Decision | Implementation |
|---|---|---|---|
| Q1 | WHOLESALE_SUPPLIER role typ | MARKER only, sdílí PWA s PARTS_SUPPLIER | `User.role` String comment append, `PARTS_SUPPLIER_ROLES` middleware extension, **žádný separátní wizard** |
| Q2 | warranty type | String permissive (max 50, žádný enum) | `z.string().max(50).optional()` + Input field s placeholder "24 měsíců, zákonná, doživotní" |
| Q3 | manufacturer search | B-tree index + ILIKE (NE tsvector) | `@@index([manufacturer])` + `where.manufacturer = { contains, mode: "insensitive" }` |
| Q4 | Phase B | Defer kompletně | Žádné Phase B touches |
| Q5 | UI conditional rendering | Both fields always visible, both optional | Wizard inputs vždy visible. Detail block container schovaný jen pokud `(!manufacturer && !warranty)`, jinak každé pole conditional render |

---

## §3 — STOP-1 ritual — tsvector drift handling

Standard recurring drift confirmed (memory `project_recurring_tsvector_drift.md`, precedent #155 + #162):

```
- Drift detected: Your database schema is not in sync with your migration history.
[*] Listing.searchVector idx — Removed
[*] Part.name + Part.searchVector idx — Removed
[*] Vehicle.brand + Vehicle.model + Vehicle.searchVector idx — Removed
```

**Postup:**
1. Eskaloval team-leadovi → fresh ACK Option A obdržen v current session
2. Prisma 7.5 nově vyžaduje `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var s textem consent zprávy → eskaloval fresh consent → lead poslal `ACK Option A ... Mas GREEN LIGHT spusti Option A sled`
3. `migrate reset --force` → 8 baseline migrací reapplied
4. `migrate dev --name add_part_manufacturer_warranty` → vygenerovalo migraci s **bogus DROP INDEX** statementy (drift artefakty)
5. **Vyčistil migrační soubor** — ponechány jen `ALTER TABLE Part ADD COLUMN manufacturer/warranty` + `CREATE INDEX Part_manufacturer_idx`
6. Druhý `migrate reset --force` → cleaned migrace aplikována, baseline indexy intact
7. `prisma db seed` → 11 parts (8 baseline + 3 wholesale), Wholesale login viditelný

**Production unaffected** — dev DB only.

---

## §4 — Files changed (13 files, +299/-7)

### Commit A — schema + migration
- `prisma/schema.prisma` — User.role comment + Part.manufacturer/warranty fields + `@@index([manufacturer])`
- `prisma/migrations/20260409062848_add_part_manufacturer_warranty/migration.sql` — cleaned (jen ALTER+CreateIndex pro manufacturer)

### Commit B — API + validators + middleware
- `lib/validators/parts.ts` — createPartSchema (manufacturer max 100, warranty max 50), partFilterSchema (manufacturer search)
- `app/api/parts/route.ts` — allowedRoles + WHOLESALE_SUPPLIER, POST persist, GET ILIKE filter + search OR rozšíření
- `app/api/parts/import/route.ts` — allowedRoles + CsvRow + create
- `middleware.ts` — `PARTS_SUPPLIER_ROLES` + WHOLESALE_SUPPLIER

### Commit C — PWA wizard
- `components/pwa-parts/parts/DetailsStep.tsx` — `PartDetails.manufacturer` + Input
- `components/pwa-parts/parts/PricingStep.tsx` — `PricingData.warranty` + Input
- `app/(pwa-parts)/parts/new/page.tsx` — initial state + submit body

### Commit D — Web detail + katalog
- `app/(web)/dily/[slug]/page.tsx` — gray-100 rounded-xl block mezi popisem a dodavatelem
- `app/(web)/dily/katalog/page.tsx` — manufacturer state + Input filter (lg:grid-cols-7) + URLSearchParams

### Commit E — Seed
- `prisma/seed.ts` — wholesale1 (`velkoobchod@carmakler.cz`, "Auto Kelly Test s.r.o.") + 3 parts (TRW, Bosch, Sachs)

### Commit F — E2E
- `e2e/parts-wholesale.spec.ts` (NEW, 123 LOC) — 4 headed Chromium tests

### Commit G — Simplify
- `prisma/seed.ts` + `prisma/schema.prisma` — drop narrating task refs

---

## §5 — Acceptance checks

| Check | Výsledek |
|---|---|
| `npx prisma validate` | ✅ Schema valid |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (555 warnings pre-existing `.next` bundle noise) |
| `npm run build` | ✅ `Compiled successfully in 18.7s` |
| Migrate reset + db seed | ✅ Parts 8→11, Users +1 (20 total), Wholesale login output |
| STOP-1 ritual | ✅ Eskaloval, fresh ACK, cleaned migration |
| STOP-2 scope creep | ✅ Žádné Phase B touches |
| STOP-3 protected files | ✅ Žádné touches |
| STOP-4 unexpected lint/build fail | ✅ Žádné nové errory |

---

## §6 — REUSE summary (Commit G review)

Subagent reuse review: **0 MUST-FIX findings.**

Pre-existing convention debt (out of scope):
- `PARTS_SUPPLIER_ROLES` 3-file lockstep duplikace (middleware.ts + 2 API routes) — matches existing `INZERENT_ROLES`/`MAKLER_ROLES`/`BUYER_ROLES` middleware-local convention. Refactor by spawned new abstraction beyond 3-file scope rule.

Quality cleanup (Commit G):
- Trimmed task refs ze seed log + schema inline comment per existing prevailing style.

---

## §7 — Pipeline next

- **#185 kontrolor** — verify proti plan §3.1-§3.11 + STOP rules
- **#186 evžen** — smart code review
- **#187 test-chrome** — headed run `e2e/parts-wholesale.spec.ts`
- **#188 deploy** — production rollout (7-step canonical, **manuální `prisma db seed` na produkci nebude třeba** — schema-only migration, žádný seed delta v produkci)
- **#189 evžen deploy review**
- **#190 user**

**Do NOT push** — pipeline čeká, lokální commits na `main` (od `efa03a2` po `1b539a3`).

---

## §8 — Known notes

- **Prisma 7.5 AI guard:** Nově blokuje `migrate reset --force` z Claude Code bez `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<exact user consent text>"`. Pro budoucí STOP-1 ritualy jet workflow: eskalovat → user pošle krátký consent → použít text jako env var.
- **Reset auto-seed:** Prisma 7.5 + `prisma.config.ts` + `migrations.seed` neauto-runuje seed po `migrate reset --force` (na rozdíl od starého `package.json` config). Manuální `prisma db seed` po reset je nutný (no-op pro production deploy, jen pro dev verifikaci).
- **Lint warnings (555):** Všech 555 warnings je z `.next/` bundle artefaktů (minified `e:`, `t:` vars). Pre-existing baseline, žádný nový z #184.

---

**HOTOVO** — Task #184 ready for #185 kontrolor.
Commits `9dfadde`, `5c13bbd`, `04ce6ae`, `776ff72`, `ab58f27`, `335886d`, `1b539a3` na `main`.
