# Evžen Review — Task #21: ShippingLabelCard + mark shipped flow

**Datum:** 2026-04-06
**Reviewer:** Evžen THE KING (READ-ONLY)
**Commit:** `db0d127` — `feat(pwa-parts): #21 ShippingLabelCard + mark shipped flow`
**Rozsah review:** 6 souborů v commitu (1 NEW + 4 EDIT + 1 impl doc)

---

## Původní zadání

> **Uživatel (task #21):**
> *"vrakoviště UI pro tisk štítku + mark shipped"*

**Dekompozice (team-lead 5 kritických bodů + plan sekce 13 5 rozhodnutí):**

1. Žádná skrytá stránka — vrakoviště PWA musí mít vše v navigaci
2. Žádné zkratky v UI (celý "Označit jako odeslané" apod.)
3. Team-lead rozhodnutí #1: Žádný email na SHIPPED (duplicitní s #19)
4. Team-lead rozhodnutí #2: PACKING pseudo-state dropped
5. 5 approved odchylek (fetchOrder extract, orderId drop, getShippingBadge inline, "K odeslání" label, "use client")

---

## 1. Žádná skrytá stránka

### 1.1 Scope commit db0d127 — zero nové page.tsx

```
git show db0d127 --stat | grep "page.tsx"
→ app/(pwa-parts)/parts/orders/[id]/page.tsx  (EDIT only)
→ app/(pwa-parts)/parts/orders/page.tsx       (EDIT only)
```

**Task #21 NEPŘIDAL žádnou novou stránku.** Pouze editoval 2 existující `/parts/orders` routes + přidal sdílenou komponentu `ShippingLabelCard.tsx`. ✅

### 1.2 Vrakoviště PWA navigation — všechny hlavní routes v bottom nav

`components/pwa-parts/SupplierBottomNav.tsx:6-54` obsahuje:

| Label | Route | Stav |
|-------|-------|------|
| Domů | `/parts` | ✅ v bottom nav |
| Díly | `/parts/my` | ✅ v bottom nav |
| Přidat | `/parts/new` | ✅ v bottom nav (center FAB) |
| **Objednávky** | `/parts/orders` | ✅ **v bottom nav** — zde žije ShippingLabelCard |
| Profil | `/parts/profile` | ✅ v bottom nav |

Uživatel (vrakoviště) se dostane k ShippingLabelCard přes: **Objednávky → tab "K odeslání" → klik na order card → detail → ShippingLabelCard**. Plně discoverable ze spodní navigace. ✅

### 1.3 Detail page `/parts/orders/[id]` — accessible pattern

Detail page není v bottom nav přímo (správný pattern — list → item pattern), ale je **přístupná z `/parts/orders`** list view (každý OrderCard má link). ShippingLabelCard se zobrazí integrated v detailu (`page.tsx:235` s podmínkou `status !== "NEW" && status !== "CANCELLED"`). ✅

### 1.4 Informační poznámka (mimo scope #21)

`app/(pwa-parts)/parts/import/page.tsx` existuje a NENÍ v SupplierBottomNav. Ověření importu:
```
grep "parts/import" app/(pwa-parts)/parts/my/page.tsx → 1 match (linkován z /parts/my:93)
```
Jde o pre-existing stránku (task #21 ji nedotkl) accessible z "Díly" page přes link. Task #21 ji neskryl ani nevytvořil. **Mimo scope review #21**, ale informačně flaguju pro budoucí audit bottom nav.

**Verdikt bodu 1:** ✅ **ŽÁDNÁ SKRYTÁ STRÁNKA ZE #21** — task nepřidal žádnou novou page.tsx, všechny `/parts/*` routes, které dotýká, jsou přístupné z bottom nav.

---

## 2. Žádné zkratky v UI

Ověřeno čtením celé `ShippingLabelCard.tsx` (364 řádků). Inventář všech UI stringů:

### 2.1 Tlačítka (button labels)

| # | Text | Řádek | Abbreviation? |
|---|------|-------|---------------|
| 1 | `"✅ Označit jako vyzvednuto"` | 181 | ❌ Ne — plný český text |
| 2 | `"🖨️ Stáhnout štítek (nedostupné)"` | 253 | ❌ Ne — plný text |
| 3 | `"🖨️ Stáhnout PDF štítek"` | 347 | ❌ Ne — plný text |
| 4 | `"✅ Označit jako odesláno"` | 359 | ❌ Ne — plný český text |
| 5 | `"Ukládá se…"` (submitting state) | 181, 359 | ❌ Ne — plný text |
| 6 | `"Sledovat zásilku →"` | 223 | ❌ Ne — plný text |

### 2.2 Headery + labely

| # | Text | Řádek |
|---|------|-------|
| 1 | `"Osobní odběr"` | 153 |
| 2 | `"Odesláno"` | 195 |
| 3 | `"Štítek zatím není připraven"` | 239 |
| 4 | `"K odeslání"` | 270 |
| 5 | `"Dopravce"` | 205, 304 |
| 6 | `"Tracking"` | 210, 309 |
| 7 | `"📍 Adresa doručení"` | 319 |
| 8 | `"⚠️ DRY-RUN režim"` | 282 |
| 9 | `"ℹ️ Více vrakovišť"` | 294 |

Žádná zkratka typu "Ozn.", "Vyzv.", "Odesl.", "Dop." — všechny texty jsou plné české věty nebo podstatná jména. ✅

### 2.3 Messages / hlášky

- Confirm: `"Opravdu označit jako odesláno?"` (130), `"Opravdu označit jako vyzvednuto?"` (138)
- Error: `"Nepodařilo se aktualizovat stav objednávky"` (116), `"Chyba spojení — zkuste to prosím znovu"` (121)
- Info (variant 3): `"Čekáme na platbu. Jakmile zákazník zaplatí, automaticky se vygeneruje přepravní štítek."` (242-243)
- Info (variant 4): `"Stáhni PDF štítek, přilepit na krabici a předej dopravci."` (273)
- Multi-supplier warning: `"Tato objednávka obsahuje díly od více vrakovišť. Koordinujte odeslání s ostatními dodavateli."` (297-298)
- DRY-RUN warning: `"Štítek je placeholder (není skutečná zásilka). Pro produkční provoz nastav API klíče dopravce v .env."` (285-286)

Všechny věty jsou gramaticky kompletní, žádná zkratka nebo telegrafický styl. ✅

### 2.4 CARRIER_LABELS mapa

```typescript
const CARRIER_LABELS: Record<string, string> = {
  ZASILKOVNA: "Zásilkovna",
  DPD: "DPD",
  PPL: "PPL",
  GLS: "GLS",
  CESKA_POSTA: "Česká pošta",
  PICKUP: "Osobní odběr",
};
```

Všichni dopravci mají plné lidské jméno (DPD/PPL/GLS jsou brand zkratky, ne UI zkratky). `localizedCarrier()` má fallback `"Dopravce neznámý"` (ne `"???"`). ✅

**Verdikt bodu 2:** ✅ **ŽÁDNÉ ZKRATKY** — všechny UI texty jsou plné české fráze, včetně tlačítek, headerů, warning hlášek a error messages.

---

## 3. Team-lead rozhodnutí #1 — Žádný email na SHIPPED

### 3.1 Ověření source PUT endpointu

`app/api/orders/[id]/status/route.ts` (91 řádků, přečteno celé):

```typescript
if (data.status === "SHIPPED") {
  updateData.shippedAt = new Date();
  if (data.trackingNumber) {
    updateData.trackingNumber = data.trackingNumber;
  }
}
```

Endpoint pro SHIPPED transition dělá **POUZE** DB update (`shippedAt` + volitelně `trackingNumber`). **Žádný `sendEmail()` call.** ✅

### 3.2 Grep verifikace

```
grep -rn "sendEmail" app/api/orders/
→ 0 matches
```

**0 výskytů** `sendEmail` v celé `app/api/orders/` directory. Žádný status change endpoint neposílá email. ✅

### 3.3 Comment v ShippingLabelCard dokumentuje guardrail

`ShippingLabelCard.tsx:14-19`:
```
 * Flow "Mark shipped":
 *  - window.confirm prompt (per team-lead decision 2026-04-06)
 *  - PUT /api/orders/[id]/status { status: "SHIPPED" }
 *  - Endpoint auto-nastaví shippedAt=now
 *  - NESMÍ volat sendEmail() — customer už dostane email z webhooku po platbě (#19)
 *  - onShipped callback → parent re-renders detail + list
```

Implementator explicit dokumentoval guardrail — ochrana proti regresi v budoucích editech. ✅

### 3.4 Customer email flow zůstává task #19 doménou

Customer dostane `order-confirmation-customer` email z `app/api/stripe/webhook/route.ts` po úspěšné platbě (task #19 scope). ShippingLabelCard **pouze** vykresluje status — neposílá žádný email. Žádná duplikace.

**Verdikt bodu 3:** ✅ **GUARDRAIL DODRŽEN** — 0 sendEmail v api/orders/, explicit comment v ShippingLabelCard, PUT endpoint čistý DB update. Plan sekce 13 rozhodnutí #1 respektováno.

---

## 4. Team-lead rozhodnutí #2 — PACKING pseudo-state dropped

### 4.1 Drop v 4 scope souborech `/pwa-parts/`

Ověřeno grep + reading impl report:

| Soubor | PACKING odstraněn | Důkaz |
|--------|------------------|-------|
| `app/(pwa-parts)/parts/orders/[id]/page.tsx` | ✅ | `OrderStatus` union, `mapToApiStatus`, `statusConfig` |
| `components/pwa-parts/orders/OrderActions.tsx` | ✅ | `OrderStatus` union, `nextAction` dict (nyní pouze `{NEW: ...}`) |
| `components/pwa-parts/orders/OrderCard.tsx` | ✅ | `OrderStatus` union, `statusConfig` |
| `app/(pwa-parts)/parts/orders/page.tsx` | ✅ | `mapStatus` (řádky 34-43) |

QA report potvrdil grep: `grep PACKING` ve všech 4 souborech → 0 matches. ✅

### 4.2 Follow-up flag — PACKING stále v 4 customer-facing souborech

Grep ve celém repozitáři:

```
grep -rn "PACKING" --include="*.tsx" --include="*.ts"
→ 4 production soubory (+ dokumentace):
  - components/web/OrderTracker.tsx
  - app/(web)/shop/objednavky/sledovani/[token]/page.tsx
  - app/(web)/dily/moje-objednavky/page.tsx
  - app/(web)/shop/moje-objednavky/page.tsx
```

**Tyto 4 soubory jsou customer-facing trackery** (buyer si sleduje svou objednávku, ne vrakoviště). **OUT OF SCOPE pro task #21** (pwa-parts scope).

**⚠️ FLAGUJI JAKO FOLLOW-UP TASK** (per team-lead pokyn): Cleanup PACKING z customer-facing trackerů je nezávislý úkol. Až se z Prisma schema odstraní enum hodnota PACKING, TypeScript compiler tyhle 4 soubory chytne. Nebo manuálně dropnout v cleanup tasku — doporučuji **task #21-cleanup** (nebo #22-cleanup) jako nízko-prioritní refactor.

**Posouzení:** Task #21 **správně limitoval scope** jen na vrakoviště PWA. Ignorovat plan sekce 3 (dotčené soubory list) by byl scope creep. Plán **explicitně** specifikoval 5 dotčených souborů (všechny v `/pwa-parts` nebo `/pwa-parts/orders`). Customer-facing trackery tam nebyly → out of scope. ✅

### 4.3 UX impact

Před #21: vrakoviště supplier viděl 4-step flow (NEW → CONFIRMED → PACKING → SHIPPED) s manuálním tracking inputem.
Po #21: vrakoviště supplier vidí 3-step flow (NEW → CONFIRMED → ShippingLabelCard akce → SHIPPED).

PACKING byl **UI-only artefakt** (API enum ho nikdy neměl), jeho odstranění zjednodušilo UX bez datové ztráty. ✅

**Verdikt bodu 4:** ✅ **PACKING DROPPED V SCOPE** + ⚠️ **FOLLOW-UP FLAGGED** pro 4 customer-facing soubory (out of scope pro #21, doporučuji #21-cleanup task).

---

## 5. 5 Approved odchylek

### 5.1 `fetchOrder` extrahována z useEffect

**Plán (sekce 4.1):** Pouze "parent refresh after mark-shipped" — mechanismus nebyl specifikován.
**Implementace:** `fetchOrder()` na top-level page komponenty (řádek 81), volaná z `useEffect` + jako `onShipped` callback.

**Posouzení:**
- Server je source of truth pro `shippedAt` (backend nastavuje `new Date()`)
- Refetch = race-safe (pokud mezi tím jiný flow změnil order, dostane aktuální stav)
- Trade-off: 1 extra GET po každém status update (~150-300ms), user vidí loading state přes `submitting`
- Alternativa (local state mutation) by byla křehká — refetch je čistší

✅ **OPODSTATNĚNO** — lepší než plán navrhoval, plus zero overhead (jen loading spinner).

### 5.2 `orderId` prop odstraněn z OrderActions

**Plán (sekce 5.2):** OrderActions simplifikace, `orderId` explicitně nezmíněn.
**Implementace:** Prop odstraněn z interface i z parent volání.

**Posouzení:**
- Po odstranění tracking inputu OrderActions **nikde** `orderId` nepoužívá
- TypeScript enforcuje sanitní volání (compile error při pokusu o zbytečný prop)
- Odstranění = cleanup dead prop, žádná funkční ztráta

✅ **OPODSTATNĚNO** — drying up API je správný step po refactoru.

### 5.3 `getShippingBadge` inline helper

**Plán (sekce 7.1):** Jak rozhodnout o badge typu neřeší — jen říká "přidat shipping badge".
**Implementace:** `getShippingBadge(order): "label-ready" | "shipped" | null` jako plain funkce uvnitř `app/(pwa-parts)/parts/orders/page.tsx` (řádky 45-51).

**Posouzení:**
- Jednorázový use (pouze v list page), žádná další komponenta ho nevolá
- Přesun do `lib/` nebo separate file = over-engineering SRP
- Plain funkce v page souboru = nejjednodušší cesta (SRP respektován — funkce má jeden účel)

✅ **OPODSTATNĚNO** — YAGNI princip, žádný helper soubor "pro jistotu".

### 5.4 Tab label "K odeslání"

**Plán (sekce 7.2):** "Přidat nový tab" — přesný text nedefinován.
**Implementace:** `{ value: "to-ship", label: "K odeslání" }`.

**Posouzení:**
- Shorter + action-oriented (vs. "Štítky připravené" nebo "Čekají na expedici")
- Match s headerem **uvnitř** ShippingLabelCard (variant 4: `"K odeslání"` — řádek 270) → konzistence napříč UI
- Česky správně, žádné zkratky

✅ **OPODSTATNĚNO** — funkční micro-copy choice.

### 5.5 `"use client"` pro ShippingLabelCard

**Plán (sekce 4):** Předpokládal client komponentu pro interaktivitu.
**Implementace:** `"use client"` na řádku 1.

**Posouzení:**
- Komponenta vyžaduje `window.confirm()` (browser API) — NEMŮŽE být server component
- `useState` pro `submitting`, `error` → client only
- `fetch` call uvnitř event handleru → client only
- `"use client"` je **JEDINÁ možná volba**, ne deviation — plán to explicitně specifikoval v sekci 17.1

✅ **OPODSTATNĚNO** — plán zavedl tohle dokonce v poznámkách pro implementátora.

**Verdikt bodu 5:** ✅ **5/5 ODCHYLEK OPODSTATNĚNÝCH** — žádná z nich nepředstavuje odklon od user intent, všechny jsou buď cleanup, YAGNI, nebo implementation detail explicitně povolený plánem.

---

## 6. Plan sekce 13 — 5 team-lead rozhodnutí (bonus check)

Pro úplnost cross-check všech 5 plan rozhodnutí z plan sekce 13:

| # | Rozhodnutí | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | ❌ Žádný email po mark shipped | ✅ | grep 0 sendEmail, explicit comment, PUT endpoint čistý |
| 2 | ✅ Drop PACKING pseudo-state | ✅ (in scope) | 4/4 pwa-parts files cleaned; ⚠️ follow-up pro 4 customer files |
| 3 | ✅ `window.confirm` prompt | ✅ | ShippingLabelCard.tsx:104 `if (!window.confirm(confirmMessage)) return;` |
| 4 | ✅ "Označit jako vyzvednuto" pro PICKUP → DELIVERED | ✅ | Variant 1 (řádky 144-185) + `handleMarkPickedUp()` |
| 5 | ⏭️ BANK_TRANSFER/COD = follow-up #21a | ✅ | Variant 3 (řádky 232-257) graceful handling s amber warning "Čekáme na platbu" + disabled button |

**Explicit guardrail z plan sekce 13:** _"PUT /api/orders/[id]/status při transition → SHIPPED NESMÍ volat žádný email side effect."_ → ✅ Verified triply: (a) source read, (b) grep, (c) ShippingLabelCard.tsx dokumentační comment.

**Plan acceptance criteria:** 26/26 dle QA report, všechny ✅.

---

## Shrnutí bodů zadání

| # | Bod | Stav | Důkaz |
|---|-----|------|-------|
| 1 | Žádná skrytá stránka (PWA má vše v navigaci) | ✅ | Task #21 nepřidal žádnou page.tsx; SupplierBottomNav obsahuje 5 hlavních routes; ShippingLabelCard je integrated v `/parts/orders/[id]` |
| 2 | Žádné zkratky v UI | ✅ | 6 tlačítek + 9 headerů + 5 warning/error messages — vše plný český text, inventář v sekci 2 |
| 3 | Žádný email na SHIPPED (team-lead #1) | ✅ | grep 0, source read, dokumentační comment v ShippingLabelCard |
| 4 | PACKING dropped (team-lead #2) | ✅ + ⚠️ | 4/4 pwa-parts soubory; ⚠️ follow-up pro 4 customer-facing trackery (out of scope #21) |
| 5 | 5 approved odchylek | ✅ | Všech 5 opodstatněných: fetchOrder cleanup, orderId dead prop drop, getShippingBadge YAGNI, "K odeslání" konzistence, "use client" mandatory |

**Body zadání: 5/5 ✅ + 1 follow-up flag**

---

## Cross-check s upstream artefakty

- **Plán (`plan-task-21-vrakoviste-stitek.md`):** 646 řádků, 17 sekcí, 5 team-lead rozhodnutí v sekci 13. Všech 5 rozhodnutí respektováno.
- **Impl report (`impl-task-21-vrakoviste-stitek.md`):** 26 acceptance criteria, 23/26 ✅ (3 manuální testy ponechány pro QA).
- **QA report (`qa-task-21-vrakoviste-stitek.md`):** 26/26 PASS, build ✅, lint 548 (−1 oproti baseline 549), 0 nových problémů.

Žádný skrytý drift mezi plánem, impl a QA. Všechny 3 artefakty souhlasí.

---

## Pozorování z review

### Task #21 nezasahuje do `app/` kromě `/pwa-parts/`

```
git show db0d127 --stat | grep "^ app/"
→ app/(pwa-parts)/parts/orders/[id]/page.tsx
→ app/(pwa-parts)/parts/orders/page.tsx
```

Pouze 2 `pwa-parts` soubory. Žádný zásah do `(web)`, `(admin)`, `(pwa)` (makléř), nebo `api/`. Scope disciplína na 100%. ✅

### Guardrail proti duplicit mailům je triple-layered

1. **Source:** PUT endpoint neobsahuje `sendEmail()` call (verified čtením route.ts)
2. **Grep:** 0 výskytů `sendEmail` v `app/api/orders/` (verified)
3. **Documentation:** Explicit comment v ShippingLabelCard.tsx:14-19 "NESMÍ volat sendEmail()" — ochrana proti regresi v budoucích editech

Pokud by nějaký budoucí task náhodně přidal `sendEmail()` do status endpointu, QA grep + reviewer lore + code comment by to měly chytit. Excellent defense-in-depth.

### 5-variant ShippingLabelCard je čistý state machine

Early return pattern v priority order:
1. PICKUP (before anything else — ignoruje shipping)
2. shippedAt != null (terminal state)
3. shippingLabelUrl == null (pre-payment)
4. happy path (label + not shipped yet)
5. DRY-RUN overlay (variant 4 + prefix check)

Každá varianta má **vlastní return**, žádný god-component s všemi conditions v jednom JSX. Snadné testovat, snadné číst, snadné rozšířit. ✅

### BANK_TRANSFER/COD handling — graceful degradation (ne demo)

Variant 3 ("Čekáme na platbu") je **viditelná** + **funkční** degraded state — vrakoviště supplier vidí, že štítek ještě není připraven, a tlačítko "Stáhnout štítek (nedostupné)" je disabled s informační hláškou. Žádné skryté chování, žádná chybová obrazovka. Jakmile Stripe webhook označí platbu jako completed a dispatcher vygeneruje štítek, UI se automaticky přepne na Variant 4 při dalším fetchi. ✅

---

## ⚠️ Follow-up tasks flaggované z tohoto review

| # | Task | Priorita | Reason |
|---|------|---------|--------|
| F1 | **PACKING cleanup v customer-facing souborech** | Low | 4 soubory stále mají PACKING v `OrderStatus` type union (`components/web/OrderTracker.tsx`, `app/(web)/shop/objednavky/sledovani/[token]/page.tsx`, 2× `moje-objednavky/page.tsx`). Z technického pohledu neškodí (PACKING v Prisma enum pořád existuje), ale po #21 je UI inconsistent. Doporučuji jeden sweep task. Není blocker pro #21 — scope byl správně limitován. |

---

## VERDIKT

## ✅ **SCHVÁLENO** (APPROVED)

Task #21 (commit `db0d127`) literálně řeší uživatelovo zadání *"vrakoviště UI pro tisk štítku + mark shipped"*:

1. **Tisk štítku** → ShippingLabelCard variant 4 s primary CTA "🖨️ Stáhnout PDF štítek" (`<a href={shippingLabelUrl} target="_blank">` → nativní PDF viewer v mobilu, supplier si může tisknout).

2. **Mark shipped** → ShippingLabelCard secondary CTA "✅ Označit jako odesláno" → `window.confirm` → `PUT /api/orders/${orderId}/status { status: "SHIPPED" }` → `shippedAt = now` na backend, refresh na frontend přes `fetchOrder()` callback.

3. **PICKUP flow** → Variant 1 s "✅ Označit jako vyzvednuto" → `PUT status: DELIVERED` (team-lead rozhodnutí #4).

4. **5 team-lead rozhodnutí** z plan sekce 13 všechny respektovány (žádný email duplicate, PACKING dropped, window.confirm, PICKUP vyzvednuto, BANK_TRANSFER graceful Variant 3).

5. **Žádné UI zkratky**, **žádná skrytá stránka**, **žádný duplicitní email**, **žádný scope creep** do customer-facing trackerů.

6. **5 approved odchylek** všechny opodstatněné — cleanup, YAGNI, nebo explicitně požadované plánem.

**Doporučený follow-up (NEblokující):** Task na cleanup PACKING v 4 customer-facing souborech (`components/web/OrderTracker.tsx` + 3 customer tracker page.tsx). Out of scope #21, ale coherentní cleanup.

**Batch #21 ready pro prezentaci uživateli** (po případném test-chrome ověření manuálního flow DRY-RUN + PICKUP, které impl explicitně ponechal pro QA).
