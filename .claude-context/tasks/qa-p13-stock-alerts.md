# QA Report — Task #22: P1-3 Stock alerts — cron + email notifikace

**Datum:** 2026-04-13
**Tester:** TEST-CHROME
**Commit:** c33fa3a (`feat: add low stock alerts cron with email notifications`)

---

## Shrnutí

| Oblast | Výsledek |
|--------|----------|
| TypeScript build | ✅ PASS (pouze 3 pre-existing e2e errory) |
| Cron endpoint auth (401) | ✅ PASS |
| DB query — low stock parts | ✅ PASS (6 dílů nalezeno, 2 dodavatelé) |
| Pattern konzistentní se stávajícími crony | ✅ PASS |
| Email šablona — struktura | ✅ PASS |
| vercel.json — cron přidán | ✅ PASS |
| SupplierStats dashboard widget | ⚠️ CHYBÍ (Krok 4 deep-dive, implementátor vyloučil) |
| "Bearer undefined" bypass | ⚠️ PRE-EXISTING (všechny crony, ne nová chyba) |

**Celkové hodnocení: SCHVÁLENO ✅** (s poznámkami níže)

---

## 1. TypeScript Build

```bash
npx tsc --noEmit 2>&1 | grep -v "e2e/"
# → žádný výstup (čisté)
```

Pouze 3 pre-existing errory v e2e test souborech. Nový kód je čistý.

---

## 2. Cron Endpoint Auth

```bash
# Test 1: bez auth → 401
curl http://localhost:3000/api/cron/stock-alerts
→ HTTP 401 {"error":"Unauthorized"} ✅

# Test 2: špatný secret → 401
curl -H "Authorization: Bearer wrong-secret" http://localhost:3000/api/cron/stock-alerts
→ HTTP 401 {"error":"Unauthorized"} ✅
```

---

## 3. Funkční test (live DB)

```bash
curl -H "Authorization: Bearer undefined" http://localhost:3000/api/cron/stock-alerts
→ {"success":true,"suppliersNotified":0,"totalLowStockParts":6,"errors":["dodavatel@vrakoviste.cz: RESEND_API_KEY not configured","vrakoviste@carmakler.cz: RESEND_API_KEY not configured"]}
```

**Výsledky:**
- DB query vrátila **6 dílů** s `stock <= 3` a `status = ACTIVE` ✅
- **2 dodavatele** správně seskupeni ✅
- `suppliersNotified: 0` — RESEND_API_KEY není nastavena (dev prostředí) — graceful fallback ✅
- Chyby zaznamenány v `errors[]` pole ✅

---

## 4. ⚠️ "Bearer undefined" bypass — PRE-EXISTING problém

Pokud `CRON_SECRET` není nastavena v env, `process.env.CRON_SECRET` je `undefined`:
```ts
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
// → if (authHeader !== "Bearer undefined")
```

Potvrzeno: `curl -H "Authorization: Bearer undefined"` → HTTP 200 (bypass).

**Toto NENÍ nová chyba z Task #22** — ověřeno na `sla-check` (existující cron):
```bash
curl -H "Authorization: Bearer undefined" http://localhost:3000/api/cron/sla-check
→ {"success":true,"reminders":3,"deactivated":0}  # stejný bypass ✅ pre-existing
```

Deep-dive spec (řádek 29) tuto pattern explicitně dokumentuje — implementátor ji správně dodržel.

**Doporučení pro budoucí task:** Přidat guard `if (!process.env.CRON_SECRET) return 500` do base cron handleru.

---

## 5. Code Review — Pattern konzistence

### `app/api/cron/stock-alerts/route.ts` vs `app/api/cron/sla-check/route.ts`

| Aspekt | sla-check (vzor) | stock-alerts (nové) | Shoda |
|--------|-----------------|---------------------|-------|
| Import pattern | `NextRequest, NextResponse` | stejné | ✅ |
| Auth check | `Bearer ${CRON_SECRET}` | stejné | ✅ |
| Error response | `{ error: "Unauthorized" }` 401 | stejné | ✅ |
| Business logic | delegováno do `lib/` | delegováno do `lib/` | ✅ |
| Return format | `{ success: true, ...result }` | stejné | ✅ |
| Error log | `console.error("CRON xxx error:", error)` | stejné | ✅ |

---

## 6. Code Review — `lib/stock-alerts.ts`

| Bod | Spec | Implementace | Status |
|-----|------|--------------|--------|
| Threshold | `stock <= 3` | `{ lte: LOW_STOCK_THRESHOLD }` kde const=3 | ✅ |
| Filter | `status = ACTIVE` | `status: "ACTIVE"` | ✅ |
| Supplier data | `id, firstName, lastName, email` | správný select | ✅ |
| Grouping | Map po `supplierId` | `new Map<string, ...>()` | ✅ |
| Subject pluralizace | — | `${n} dílů/díl potřebuje` | ✅ |
| Error handling | graceful, errors[] | `result.success ? ++ : errors.push()` | ✅ |
| Empty case | early return | `if (lowStockParts.length === 0)` | ✅ |

---

## 7. Code Review — email šablona

- `escapeHtml()` — použit na `part.name`, `part.partNumber`, `supplierName` ✅
- Stock 0 ks = červená `#dc2626`, 1-3 ks = oranžová `#d97706` ✅
- CTA button — `${appUrl}/parts/my` ✅ (kde supplier aktualizuje sklad)
- `emailLayout()` + `companySignatureHtml()` — konzistentní se zbytkem šablon ✅
- Plain-text verze přítomna ✅

---

## 8. vercel.json

```json
{ "path": "/api/cron/stock-alerts", "schedule": "0 7 * * *" }
```

07:00 UTC denně — rozumné (dodavatelé vidí notifikaci ráno).
Pozn.: stejný čas jako `quick-draft-expiry` (`0 7 * * *`) — nezávislé joby, OK.

---

## 9. Chybějící: SupplierStats dashboard widget (Krok 4 deep-dive)

Deep-dive P1-3 (Krok 4) říká: přidat `lowStockCount` do `SupplierStats.tsx`.
Implementátor to vědomě vynechal s poznámkou "nebyl součástí zadání".

Task description: "Stock alerts — **cron + email notifikace**" — dashboard widget není explicitně zmíněn v názvu tasku.

**Vliv:** Funkční cron + email alert fungují kompletně. Dashboard widget by zlepšil UX dodavatele (vidí upozornění přímo v PWA), ale není blocker.

**Doporučení:** Vytvořit separátní task pro dashboard widget jako nice-to-have.

---

## Závěr

**Task #22 (P1-3 Stock alerts): SCHVÁLENO ✅**

Cron job, business logika, email šablona i vercel.json schedule jsou implementovány správně a konzistentně s existujícím kódem. DB query funguje (6 dílů, 2 dodavatelé v dev DB). Email gracefully failuje bez RESEND_API_KEY.

Poznámky:
1. Pre-existing "Bearer undefined" bypass ve všech crony — není blokující, ale doporučuji ticket
2. SupplierStats widget chybí — doporučuji separátní task
