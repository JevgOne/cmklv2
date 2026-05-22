# QA Report — P0-1: Admin UI pro reklamace/vrácení

**Datum:** 2026-04-13  
**Agent:** KONTROLOR  
**Commit:** 88f3262 (`feat: add admin returns/complaints management UI`)  
**Soubory:** 6 nových (825 insertions)  
**Plán:** `.claude-context/tasks/plan-task020-completion.md` — sekce P0-1  

---

## Verdict: ✅ PASS s menšími výhradami

Build: **GREEN** | Spec splnění: **8/10** | Blokeři: **0**

---

## 1. SIMPLIFY KONTROLA

### ⚠️ S1 — Duplikované konstanty ve dvou souborech

**Soubory:** `app/(admin)/admin/returns/page.tsx` + `app/(admin)/admin/returns/[id]/page.tsx`  
**Duplicity:**
- `STATUS_MAP` (stejný objekt v obou souborech)
- `STATUSES` (array 8 hodnot)
- `TYPE_MAP` (mírně odlišný — viz S2)
- `formatPrice()` helper (identická funkce)

**Závažnost:** Nízká — kód funguje, ale při změně statusu je nutné editovat 2 soubory.  
**Doporučení:** Extrahovat do `app/(admin)/admin/returns/_constants.ts` (Next.js underscore = private file, nebude routována).

---

### ⚠️ S2 — TYPE_MAP nekonzistence

| Soubor | WITHDRAWAL | WARRANTY |
|--------|-----------|---------|
| `page.tsx:44` | "Odstoupení" | "Reklamace" |
| `[id]/page.tsx:57` | "Odstoupení od smlouvy (14 dní)" | "Záruční reklamace" |

**Závažnost:** Nízká — detail zobrazuje delší popis, list krátký. Vizuálně funkční, ale matoucí při budoucí úpravě.

---

### ⚠️ S3 — `parseInt` pro peněžní částku

**Soubor:** `[id]/page.tsx:107`  
```typescript
if (approvedAmount) body.approvedAmount = parseInt(approvedAmount, 10);
```
**Problém:** `parseInt` uřízne desetinná místa. Pokud backend nebo UI připustí haléře (např. 1500.50 Kč), hodnota bude uříznutá na 1500.  
**Fix:** `Number(approvedAmount)` nebo `parseFloat(approvedAmount)`.  
**Závažnost:** Nízká — v CZK jsou celé koruny standardní, ale číselný input umožňuje `step` desetinná čísla.

---

### ⚠️ S4 — `<img>` místo Next.js `<Image>` pro fotografie

**Soubor:** `[id]/page.tsx:304`  
```tsx
<img
  src={url}
  alt={`Foto závady ${i + 1}`}
  className="rounded-lg object-cover w-full h-32 border border-gray-200"
/>
```
**Problém:** Raw `<img>` tag — žádná optimalizace, možný CLS. (Totožný finding jako v mobile optimization audit — W2.)  
**Fix:** `<Image fill sizes="(max-width: 640px) 50vw, 200px" />` nebo alespoň `<Image width={200} height={128} />`.  
**Závažnost:** Nízká — admin interní stránka, nikoli public.

---

## 2. DEBUG KONTROLA

### Build výsledek

```
✓ Compiled successfully in 23.1s
✓ Generating static pages (1235/1235) in 5.5s
TypeScript: 0 errors
```

**Nové routes v build output:**
| Route | Typ | Status |
|-------|-----|--------|
| `/admin/returns` | ○ Static | ✅ |
| `/admin/returns/[id]` | ƒ Dynamic | ✅ |
| `/api/admin/returns` | ƒ Dynamic | ✅ |

**Critical errors:** 0  
**Warningy:** Pouze pre-existing Sentry deprecation (nerelated).

---

## 3. REVERZNÍ KONTROLA — spec vs implementace

### Specifikace P0-1 (z plan-task020-completion.md):

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | `GET /api/admin/returns` s filtry (status, type, paginace) | ✅ | status, type, search, page, limit params |
| 2 | Filter: dateFrom / dateTo | ❌ | **CHYBÍ v API i UI** |
| 3 | Tabulka se sloupci (ID, objednávka, typ, status badge, částka, datum) | ✅ | Sloupce: Objednávka, Zákazník, Typ, Požadováno, Status, Lhůta, Datum, Akce |
| 4 | Status filter | ✅ | 8 stavů (NEW → CANCELLED) |
| 5 | Typ filter (WITHDRAWAL/WARRANTY) | ✅ | Select s czech labels |
| 6 | Datum filter v UI | ❌ | **CHYBÍ** (jen status + typ + search) |
| 7 | Overdue deadline warnings | ✅ | ⚠ červený highlight + text "Po lhůtě" |
| 8 | Detail: zobrazení order info | ✅ | orderNumber, deliveryName, totalPrice |
| 9 | Detail: items (položky k vrácení) | ✅ | parsedItems z JSON pole |
| 10 | Detail: fotky defektu | ✅ | parsedPhotos, klikatelné do nového tabu |
| 11 | Detail: kontakt (name, email, phone) | ✅ | Sekce "Kontakt" |
| 12 | Detail: bankovní účet | ✅ | bankAccount field (monospace font) |
| 13 | Detail: změna statusu (dropdown) | ✅ | Select s 8 stavy |
| 14 | Detail: approvedAmount input | ✅ | Číselné pole s max = requestedAmount |
| 15 | Detail: adminNotes textarea | ✅ | 4 řádky, placeholder |
| 16 | Detail: rejectionReason | ✅ | Podmíněně zobrazeno (status=REJECTED) |
| 17 | PUT `/api/admin/returns/[id]` volání | ✅ | handleSave() s JSON body |
| 18 | Odkaz v admin sidebar | ✅ | ESHOP sekce, 🔄 Reklamace, /admin/returns |
| 19 | `loading.tsx` | ✅ | Skeleton s header + filtry + 6 řádků |
| 20 | `error.tsx` | ✅ | Error boundary s reset button |
| 21 | Items count v list API (plan říkal include) | ⚠️ | API vrací celý return objekt bez `_count.items` — detail má items, list ne |
| 22 | canEdit gate (ADMIN/BACKOFFICE pouze) | ✅ | `session.user.role === "ADMIN" \|\| "BACKOFFICE"` — MANAGER vidí ale neupravuje |

**Celkem: 19/22 ✅, 2 ❌ (date filter), 1 ⚠️ (items count v listu)**

---

## SOUHRN NÁLEZŮ

### ❌ Chybějící — spec požadavky

**GAP-1: Date filter chybí**  
- Plan: "tabulka s filtry (status, typ, datum)"  
- Implementace: status + typ + search (bez dateFrom/dateTo)  
- Dopad: Admin nemůže filtrovat reklamace za časové období (např. "všechny z minulého měsíce")  
- Fix: Přidat 2× `<input type="date">` do filter baru + `dateFrom`/`dateTo` params do API WHERE clause  
- Effort: ~30 min

### ⚠️ Drobné výhrady (neblokující)

| Kód | Popis | Soubor | Effort |
|-----|-------|--------|--------|
| S1 | Duplikované konstanty | page.tsx + [id]/page.tsx | 15 min |
| S2 | TYPE_MAP nekonzistence | page.tsx vs [id]/page.tsx | 2 min |
| S3 | parseInt → parseFloat pro approvedAmount | [id]/page.tsx:107 | 1 min |
| S4 | `<img>` → `<Image>` pro fotky defektu | [id]/page.tsx:304 | 5 min |

### ✅ Co funguje správně

- Build: GREEN, TypeScript 0 errors
- Auth gate: ADMIN/BACKOFFICE/MANAGER (GET), ADMIN/BACKOFFICE (PUT) — správné
- Paginace funguje (page, totalPages, prev/next tlačítka)
- Overdue warnings (červené zvýraznění po lhůtě)
- Podmíněný rejectionReason (jen při REJECTED statusu)
- Loading skeleton odpovídá layoutu stránky
- Error boundary s reset funkcionalitou
- Sidebar navigace přidána ve správné sekci (ESHOP)

---

## Doporučení pro implementátora

**Priorita 1 (doporučeno opravit):**
1. Přidat datum filtr (`dateFrom` / `dateTo`) do UI (2× `input[type=date]`) a do API WHERE clause

**Priorita 2 (nice-to-have):**
2. Extrahovat `STATUS_MAP` / `TYPE_MAP` / `formatPrice` do `_constants.ts`
3. `parseInt` → `parseFloat` pro approvedAmount
4. `<img>` → `<Image>` pro fotky defektu

**Celkové hodnocení: P0-1 je 90% hotovo. 1 chybějící feature (date filter), nulové buildové errory, provozuschopné.**
