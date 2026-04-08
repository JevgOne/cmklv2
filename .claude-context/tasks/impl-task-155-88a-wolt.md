# IMPL #155 — #88a Wolt commission model

**Plan:** `.claude-context/tasks/plan-task-154-88a-wolt-dispatch.md` (commit `ac84eee`)
**Workflow:** pre-flight → §3 schema → §4 API → §5 UI → §6 webhook → /simplify → 1 feat commit

---

## §15 Dispatch checklist (22 items)

### Schema + migrace (§3)

1. ✅ **Partner.commissionRate** `Decimal(4,2) @default(15.00)`
2. ✅ **Partner.commissionRateAt** `DateTime @default(now())`
3. ✅ **Partner.stripeAccountId** `String?` (nullable per Q1)
4. ✅ **PartnerCommissionLog model** s `oldRate / newRate / reason / changedById / changedAt`
5. ✅ **OrderItem snapshot fields** — `commissionRateApplied / carmaklerFee / supplierPayout`
6. ✅ **User.commissionChanges** inverse relation (`PartnerCommissionChanger`)
7. ✅ **Migration** `20260408061812_add_partner_commission_and_order_split` — clean SQL bez DROP INDEX side effects (manuálně očištěno od recurring tsvector drift)
8. ✅ **Compound index** `@@index([partnerId, changedAt])` na PartnerCommissionLog (audit log queries)

### API (§4)

9. ✅ **PATCH `/api/admin/partners/[id]/commission`** — Zod validace (`min(12).max(20).multipleOf(0.5)` + `reason min(10).max(500)`), `canEditCommission` gate (Q3: ADMIN+BACKOFFICE), 403/400/404 gates, no-op check, atomický `$transaction([log.create, partner.update])`
10. ✅ **GET `/api/admin/partners/[id]/commission/history`** — read-only audit log, `take: 50`, normalizace Decimal → number
11. ✅ **GET `/api/admin/reports/commission-summary`** — total partners, avg rate, distribution buckets, Y2D revenue + carmakler fees v Europe/Prague timezone (Q5)

### UI (§5)

12. ✅ **CommissionRateSlider** — range input 12–20 % step 0.5 (Q4), 17 distinct positions, žádný free-form input
13. ✅ **CommissionEditDialog** — Modal + Textarea, `canSave = rateChanged && reasonValid && !saving`, REASON_MIN_LENGTH = 10, error handling
14. ✅ **CommissionHistoryList** — collapsible viewer, default 3 nejnovější + "Zobrazit všech {n}", FetchState discriminated union, `reloadKey` prop pro parent-driven refetch, `formatRelative` helper
15. ✅ **PartnerDetail.tsx integration** — nový "Provize" Card mezi původními karty, Stripe Connect warning banner pokud `!stripeAccountId`, "Upravit sazbu" button gate, `onSaved` callback updates partner state + increments reload key

### Webhook (§6)

16. ✅ **applyCommissionSplit(orderId)** — pro každý OrderItem snapshot (rate/fee/payout) + Stripe Connect transfer
17. ✅ **Replay guard** — `commissionRateApplied !== null` skip
18. ✅ **Graceful fallback** — bez `stripeAccountId` jen warn + skip transferu (Q1)
19. ✅ **idempotencyKey** — `commission_${orderId}_${item.id}` chrání před duplicitou při webhook replay
20. ✅ **try/catch wrap** — selhání nesmí shodit webhook (Stripe by retryoval celý event)
21. ✅ **transfer_group + metadata** — `order_${orderId}` + `{ orderId, orderItemId, partnerId, commissionRate }` pro reconciliation
22. ✅ **Default 15 %** pokud supplier nemá partnerAccount (legacy / non-vrakoviště)

---

## Verifikace

- **TypeScript:** 0 errors (`npx tsc --noEmit` clean)
- **ESLint:** 0 errors, 3 warnings (všechny pre-existing v PartnerDetail.tsx, unrelated)
- **Prisma:** schema valid, migrate status "Database schema is up to date!"
- **Build:** předchozí běh `next build` ✓ Compiled, ✓ 1213/1213 static pages, all 3 nové routes přítomny

## STOP-3 escalation history

Při pre-flight `prisma migrate dev` byla detekována pre-existing drift (3 migrace "modified after applied" + missing searchVector indexes). Per plán §14 + memory `feedback_stop_escalate_literal` jsem ESKALOVAL na lead s 4 options. Lead autorizoval **Option A (reset dev DB)** s explicitním "uživatel autorizoval Option A". Permanentní fix recurring tsvector drift je out-of-scope #88a (separátní task).

Migration SQL byla manuálně očištěna od 6 DROP INDEX statements (Listing_searchVector_idx, Part_name_trgm_idx, Part_searchVector_idx, Vehicle_brand_trgm_idx, Vehicle_model_trgm_idx, Vehicle_searchVector_idx) které byly side effect drift detection — production bound file obsahuje JEN #88a-relevantní DDL.

## /simplify findings & fixes

Spuštěny 3 paralelní review agents (reuse / quality / efficiency).

**Reuse review:** No duplicates found. All 7 checklist items čisté — patterny matchují existing project konvenci nebo nemají pre-existing helper.

**Quality fixes applied:**
- ✅ Decimal leak — serializace v `app/api/partners/[id]/route.ts` (`Number(partner.commissionRate)`), drop `number | string` union v `PartnerDetail.tsx`, drop 3× `Number(...)` coercion calls
- ✅ Buckets DRY — single `BUCKETS` const v `commission-summary/route.ts` driving distribution loop
- ✅ Comment cleanup — smazáno ~18 narration/ticket-ref komentářů z 9 souborů, ponechány jen genuine WHY invariants (replay guard, idempotency, graceful fallback rationale)
- ✅ canEditCommission v PartnerDetail.tsx zjednodušen na alias `canActivate` (eliminace duplicity)
- ⏭️ Role helper extraction (skipped — match existing inline pattern, 15+ admin routes used)

**Efficiency fixes applied:**
- ✅ `applyCommissionSplit` — paralelní `Promise.all` pro `orderItem.update` (independent WHERE by id, safe), serializované transfers (backpressure proti Stripe rate limit)
- ✅ Stripe `idempotencyKey` na `transfers.create` — chrání před duplicitou při webhook replay
- ✅ `commission-summary` — `findMany` + `aggregate` paralelizovány přes `Promise.all`
- ⏭️ Background queue pro commission split (skipped — out of scope #88a, flagged as future optimization)

## Out-of-scope (§13)

- Vision OCR (#88b)
- Voice input (#88b)
- PWA dispatch screen (#88c)
- Stripe Connect onboarding UI (`stripeAccountId` zůstává nullable, manuální setup)
- Permanent fix tsvector migration drift (separátní task)

## Files changed

**Modified (4):**
- `prisma/schema.prisma` (+25 řádků, target edits, žádný `prisma format` noise)
- `app/api/stripe/webhook/route.ts` (+96 řádků, applyCommissionSplit funkce)
- `app/api/partners/[id]/route.ts` (+5 řádků, Decimal serializace)
- `components/admin/partners/PartnerDetail.tsx` (+62 řádků, Provize Card + state)

**New (8):**
- `prisma/migrations/20260408061812_add_partner_commission_and_order_split/migration.sql`
- `app/api/admin/partners/[id]/commission/route.ts`
- `app/api/admin/partners/[id]/commission/history/route.ts`
- `app/api/admin/reports/commission-summary/route.ts`
- `components/admin/partners/CommissionRateSlider.tsx`
- `components/admin/partners/CommissionEditDialog.tsx`
- `components/admin/partners/CommissionHistoryList.tsx`
- `.claude-context/tasks/impl-task-155-88a-wolt.md` (this report)

## Commit

**Hash:** _to be filled after commit_
**Message:** `feat(#88a): Wolt model — partner commission slider + Stripe split + audit log`
