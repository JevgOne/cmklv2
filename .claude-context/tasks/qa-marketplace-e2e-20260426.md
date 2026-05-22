# QA Report — E2E Testy Marketplace (Playwright)

**Datum:** 2026-04-26  
**Autor:** Kontrolor  
**Commit:** 0f7bcda  
**Dev server:** OFFLINE — testy nespuštěny, provedena statická analýza  
**Status: ⚠️ PODMÍNĚNĚ OK — 3 bugy v testech, jinak kvalitní**

---

## SHRNUTÍ

58 testů, 4 spec soubory, 1 helpers soubor. Struktura je dobrá, pokrytí rolí kompletní. Nalezeny **3 bugy** (2 testy vždy projdou s false positive, 3 API testy selžou při spuštění). Lifecycle happy path není end-to-end testován (závisí na DB seed datech).

---

## PŘEHLED TESTŮ

| Soubor | Testy | Describe skupiny |
|--------|-------|-----------------|
| `public.spec.ts` | 15 | Landing, Apply Form, Role Gating |
| `dealer.spec.ts` | 12 | Dealer Dashboard, Opportunity Wizard |
| `investor.spec.ts` | 11 | Investor Dashboard, Investment Flow, Investment API |
| `admin.spec.ts` | 20 | Admin Dashboard, Applications, Flip Detail, API Auth, Payments |
| **Celkem** | **58** | **13 describe skupin** |

---

## VÝSLEDKY BĚHU

Dev server offline — testy nespuštěny. Níže je statická analýza.

---

## BUGY V TESTECH

### 🔴 BUG-T1: 3 API testy čekají 403, dostanou 401

**Soubor:** `admin.spec.ts:216-235`

```ts
// Test očekává 403
test("PUT /api/marketplace/investments/fake-id/confirm-payment — requires ADMIN role", async ({ request }) => {
  const res = await request.put(...);
  expect(res.status()).toBe(403); // ❌ FAIL — dostane 401
});
```

**Příčina:** Unauthenticated request → API route vrací `401` (nepřihlášený), ne `403` (špatná role):
```ts
// confirm-payment/route.ts:
if (!session?.user?.id) return 401  // ← unauthenticated → 401
if (!ADMIN_ROLES.includes(role)) return 403  // ← špatná role → 403
```

Admin applications routes správně vracejí 403 pro unauthenticated (kombinují check).  
Marketplace API routes vrací 401 → 403 odděleně.

**Postižené testy:** 3 testy (confirm-payment, approve, payout)  
**Fix:** Změnit `toBe(403)` na `toBe(401)` pro tyto 3 marketplace (ne admin) routes

### 🔴 BUG-T2: Test "step 1 — fill fields enables Pokračovat" bez finální assertace

**Soubor:** `dealer.spec.ts:92-135`

```ts
test("step 1 — fill fields enables Pokračovat", async ({ page }) => {
  // ... fills fields ...
  await page.waitForTimeout(300);
  // ← konec testu — žádná expect()!
});
```

Test vždy projde (i kdyby button zůstal disabled). False positive.

**Fix:** Přidat `await expect(continueBtn).toBeEnabled()` na konec

### ⚠️ BUG-T3: Nadměrné použití conditional tests — false positives na prázdném DB

Vzor v celém testsuite:
```ts
if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
  // assertions here
}
// ← pokud element není viditelný, test PROJDE bez jakékoli assertace
```

Příklady:
- `dealer.spec.ts` — "dealer only sees own flips": jen kontroluje absenci error zprávy
- `investor.spec.ts` — "invest modal — min 10000 Kč validation": celá logika podmíněná
- `admin.spec.ts` — "application detail page loads", "admin actions visible"

**Dopad:** Na clean DB (bez seed) projde ~30% testů bez jediné smysluplné assertace.

**Fix (doporučení):** Přidat `test.skip(!hasSeededData, "Vyžaduje seed data")` nebo seed DB před testem.

---

## KVALITA TESTŮ — POZITIVA

### ✅ Dobrá organizace
- 4 spec soubory striktně odděleny podle role (public, dealer, investor, admin)
- `helpers.ts` s `login()` a `dismissCookieConsent()` — DRY
- `beforeEach` pro login eliminuje duplicitu

### ✅ API testy pomocí `request` fixture
```ts
test("POST /api/marketplace/investments — requires auth", async ({ request }) => {
  const res = await request.post(...);
  expect(res.status()).toBe(401);
});
```
Efektivní, rychlé, nezávislé na UI.

### ✅ Pokrytí F-fixů z plánu
| Fix | Test |
|-----|------|
| F9 — marketAnalysis odstraněn | `step 3 — sale estimate (no marketAnalysis field)` |
| F7 — dealer email pro admina | `admin can see dealer email in flip detail` |
| F6 — wizard step validace | `step 1 — Pokračovat disabled without required fields` |
| F2 — reject payment UI | `pending payments table shows confirm and reject buttons` |

### ✅ Role gating kompletně pokryt
- Neautentizovaný → redirect na apply ✅
- Broker role → blocked z dealer a investor ✅
- API bez tokenu → 401/403 ✅

### ✅ TypeScript čistý
Žádné TS chyby v marketplace e2e souborech (pre-existing chyby jsou v jiných e2e souborech).

---

## LIFECYCLE POKRYTÍ

| Krok lifecyclu | Pokrytí | Poznámka |
|----------------|---------|----------|
| Public landing | ✅ | 4 testy |
| Apply form submit | ✅ | Podmíněný (potřeba UI) |
| Role gating | ✅ | 5 testů |
| Dealer dashboard | ✅ | Own flips filter ověřen (UI level) |
| Wizard 4 kroky | ✅ | Step validace, back nav, shrnutí |
| Wizard submission | ❌ | Není test na finální submit → redirect |
| Admin applications list | ✅ | |
| Admin approve/reject application | ⚠️ | Podmíněný — jen pokud existuje application |
| Investor dashboard | ✅ | Portfolio stats, sekce |
| Admin schválení flipu | ⚠️ | Podmíněný |
| FUNDING → FUNDED transition | ❌ | Netestováno |
| Investor investuje (modal submit) | ❌ | Jen validace min, ne submit |
| Admin potvrzuje platbu | ⚠️ | Podmíněný |
| Dealer: IN_REPAIR → FOR_SALE | ❌ | Netestováno |
| Admin payout (40/40/20) | ❌ | Netestováno |
| COMPLETED stav | ❌ | Netestováno |

---

## TECHNICKÝ DLUH

### ⚠️ Křehké selektory v `fillStep1()`

```ts
// dealer.spec.ts:230-249
for (let i = 0; i < count; i++) {
  const input = inputs.nth(i);
  const label = await input.evaluate((el) => {
    const labelEl = el.closest("div")?.querySelector("label");
    return labelEl?.textContent || "";
  });
  if (label.includes("Značka")) { await input.fill("Škoda"); }
```

Iteruje VŠECHNY inputs na stránce hledáním přes label text. Křehké při refaktoru UI.  
**Doporučení:** Přidat `data-testid="brand-input"` na vstupy ve wizard.

### ⚠️ `waitForTimeout` místo deterministického čekání

Celkem ~18× `waitForTimeout(300-2000)` napříč testy.  
**Doporučení:** Nahradit `waitForLoadState("networkidle")` nebo `waitForSelector`.

---

## CHYBÍ PLAYWRIGHT CONFIG CHECK

```ts
// helpers.ts:17
export async function login(page: Page, email: string, password: string) {
  await page.goto("/prihlaseni");
```

Relativní URL funguje jen pokud playwright.config.ts má správný `baseURL`.
