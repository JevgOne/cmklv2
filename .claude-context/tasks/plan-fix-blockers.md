# Plan oprav — 3 blockery + marketplace kompletnost

**Datum:** 2026-04-05
**Autor:** Planovac (agent team)
**Status:** Hotovo

---

## BLOCKER 1: REGIONAL_DIRECTOR redirect loop

### Problem
`middleware.ts:6` — `ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"]` neobsahuje `"REGIONAL_DIRECTOR"`.

Dusledek: Uzivatel s roli `REGIONAL_DIRECTOR` se po prihlaseni presmeruje na `/admin/dashboard` (viz `login/page.tsx:64`), ale middleware na radku 143 kontroluje `ADMIN_ROLES.includes(token.role)` — REGIONAL_DIRECTOR neni v poli → middleware presmeruje na `/` → nekonecna smycka nebo 403.

### Oprava
**Soubor:** `middleware.ts`
**Radek:** 6

```typescript
// PRED:
const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

// PO:
const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];
```

### Overeni
- Prihlasit se jako REGIONAL_DIRECTOR → musi se dostat na `/admin/dashboard` bez redirect loop

---

## BLOCKER 2: 4 pravni stranky bez diakritiky

### Problem
Tyto 4 pravni stranky maji veskery text tela BEZ ceske diakritiky (hacky, carky). Nazvy souboru a metadata jsou OK, ale body text je bez diakritiky. To je neprijatelne pro verejne-pravni stranky.

### Postizene soubory a rozsah

#### 2a. `app/(web)/reklamacni-rad/page.tsx` (287 radku)
- Metadata: OK (s diakritikou)
- Body text: **BEZ diakritiky** od radku 59 ("Platny od...") az do konce
- Priklad: "Tento reklamacni rad upravuje postup pri uplatnovani prav z vadneho plneni" → "Tento reklamační řád upravuje postup při uplatňování práv z vadného plnění"
- Take obsahuje placeholdery `[DOPLNIT]` a TODO na radku 275

#### 2b. `app/(web)/obchodni-podminky/page.tsx`
- Metadata: OK (s diakritikou)
- Body text: **BEZ diakritiky** od radku 59 ("Platne od...")
- Priklad: "Tyto obchodni podminky upravuji vzajemna prava a povinnosti" → "Tyto obchodní podmínky upravují vzájemná práva a povinnosti"
- Obsahuje placeholdery `[DOPLNIT]`

#### 2c. `app/(web)/ochrana-osobnich-udaju/page.tsx`
- Metadata: OK (s diakritikou)
- Body text: **BEZ diakritiky** od radku 59 ("Platne od...")
- Priklad: "Spravcem osobnich udaju je CarMakler s.r.o." → "Správcem osobních údajů je CarMakler s.r.o."
- Obsahuje placeholdery `[DOPLNIT]`

#### 2d. `app/(web)/zasady-cookies/page.tsx`
- Metadata: OK
- Body text: **BEZ diakritiky** od radku 84 ("Posledni aktualizace...")
- Cookies tabulka (radky 19-67): BEZ diakritiky v "purpose" a "expiry" polich
- Priklad: "Autentizace uzivatele (prihlaseni)" → "Autentizace uživatele (přihlášení)"

### Oprava
**Pro kazdy soubor:** Prepsat VESKERY text v body (JSX stringy) s korektni ceskou diakritikou.

**Pravidla:**
- Metadata (title, description, openGraph) — ponechat, jsou OK
- JSON-LD schema — ponechat, jsou OK
- Kod (nazvy promennych, CSS tridy) — neupravovat
- Vsechny `[DOPLNIT]` placeholdery — ponechat (jsou zamerne, cekaji na realne udaje)
- Pravni odkazy (zakony, paragrafy) — zachovat presne zneni s diakritikou

**Priklad transformace pro reklamacni-rad:**
```
"Tento reklamacni rad upravuje postup pri uplatnovani prav z vadneho plneni"
→
"Tento reklamační řád upravuje postup při uplatňování práv z vadného plnění"
```

### Poradi oprav (dle priority)
1. `reklamacni-rad/page.tsx` — nejvice textu, obsahuje i BLOCKER 3
2. `obchodni-podminky/page.tsx` — druhy nejdelsi
3. `ochrana-osobnich-udaju/page.tsx`
4. `zasady-cookies/page.tsx` — nejkratsi

---

## BLOCKER 3: TODO viditelny zakaznikum

### Problem
`app/(web)/reklamacni-rad/page.tsx:275` obsahuje:
```tsx
<strong>[TODO: pridat odkaz na PDF po implementaci]</strong>
```
Toto je viditelne zakaznikum v produkci.

### Oprava
Nahradit TODO textem, ktery dava smysl i bez PDF:

```tsx
// PRED:
<strong>[TODO: pridat odkaz na PDF po implementaci]</strong>

// PO:
<strong>Pro stažení vzorového formuláře nás kontaktujte na <a href="mailto:reklamace@carmakler.cz">reklamace@carmakler.cz</a>.</strong>
```

Alternativa (pokud se nechce odkazovat na email):
```tsx
<strong>Vzorový formulář vám bude zaslán na vyžádání e-mailem.</strong>
```

---

## MARKETPLACE KOMPLETNOST — analyza

### Aktualni stav stranky

| Stranka | Existuje | Chranena middleware | Funkcni |
|---------|----------|-------------------|---------|
| `/marketplace` (landing) | ✅ | ❌ (verejna) | ✅ |
| `/marketplace/dealer` (dashboard) | ✅ | ✅ VERIFIED_DEALER | ✅ |
| `/marketplace/dealer/nova` (nova prilezitost) | ✅ | ✅ VERIFIED_DEALER | ✅ |
| `/marketplace/dealer/[id]` (detail) | ✅ | ✅ VERIFIED_DEALER | ✅ |
| `/marketplace/investor` (dashboard) | ✅ | ✅ INVESTOR | ✅ |
| `/marketplace/investor/[id]` (detail investice) | ✅ | ✅ INVESTOR | ✅ |

### Apply form (registrace)
- ✅ `ApplyForm` komponenta existuje v `/marketplace` landing page
- ✅ Podporuje obe role: VERIFIED_DEALER a INVESTOR
- ✅ Odesila na `/api/marketplace/apply` (POST)
- ✅ API route existuje a ma Zod validaci

### Prihlaseni flow
- ✅ `/login` presmeruje VERIFIED_DEALER → `/marketplace/dealer` (radek 81)
- ✅ `/login` presmeruje INVESTOR → `/marketplace/investor` (radek 78)
- ✅ Middleware chrari `/marketplace/dealer*` pro MARKETPLACE_DEALER_ROLES
- ✅ Middleware chrari `/marketplace/investor*` pro MARKETPLACE_INVESTOR_ROLES
- ✅ Neprihlaseny uzivatel → redirect na `/login?callbackUrl=...`

### Admin sprava
- ✅ `/admin/marketplace` — seznam prilezitosti
- ✅ `/admin/marketplace/[id]` — detail s akcemi (schvaleni, platby)

### API routes
- ✅ `/api/marketplace/opportunities` — CRUD
- ✅ `/api/marketplace/opportunities/[id]` — detail
- ✅ `/api/marketplace/opportunities/[id]/approve` — schvaleni
- ✅ `/api/marketplace/opportunities/[id]/payout` — vyplata
- ✅ `/api/marketplace/investments` — vytvoreni investice
- ✅ `/api/marketplace/investments/[id]/confirm-payment` — potvrzeni platby
- ✅ `/api/marketplace/apply` — zadost o pristup
- ✅ `/api/marketplace/stats` — statistiky

### Loading/Error soubory
- ✅ Vsechny marketplace stranky maji loading.tsx i error.tsx

### Navigace
- ✅ Marketplace NENI v hlavni navigaci (Navbar/Footer) — spravne, je VIP
- ✅ Pristup je jen pres primy URL `/marketplace`

### Komponenty
- ✅ `ApplyForm` — formular zadosti
- ✅ `DealerStats` — statistiky realizatora
- ✅ `FlipTimeline` — timeline flipu
- ✅ `InvestModal` — modal pro investovani
- ✅ `InvestorPortfolio` — portfolio investora
- ✅ `OpportunityCard` — karta prilezitosti
- ✅ `OpportunityWizard` — wizard pro novou prilezitost
- ✅ `ProfitCalculator` — kalkulacka zisku

### VERDIKT: Marketplace je KOMPLETNI ✅
Vsechny stranky, API, middleware, komponenty, loading/error existuji. Flow je:
1. Uzivatel prijde na `/marketplace` → vidi landing s info + apply form
2. Vyplni zadost (dealer/investor) → API ji ulozi
3. Admin schvali v `/admin/marketplace`
4. Uzivatel se prihlasi → redirect na spravny dashboard
5. Dealer: vytvori prilezitost → ceka na schvaleni → investori investuji
6. Investor: prohliizi prilezitosti → investuje pres InvestModal

---

## Souhrn — poradi implementace

| # | Typ | Oprava | Soubor | Slozitost |
|---|-----|--------|--------|-----------|
| 1 | BLOCKER | REGIONAL_DIRECTOR do ADMIN_ROLES | `middleware.ts:6` | Trivial (1 radek) |
| 2 | BLOCKER | Odstranit TODO na radku 275 | `reklamacni-rad/page.tsx:275` | Trivial (1 radek) |
| 3 | BLOCKER | Diakritika v reklamacni-rad | `reklamacni-rad/page.tsx` | Stredni (cely soubor) |
| 4 | BLOCKER | Diakritika v obchodni-podminky | `obchodni-podminky/page.tsx` | Stredni (cely soubor) |
| 5 | BLOCKER | Diakritika v ochrana-osobnich-udaju | `ochrana-osobnich-udaju/page.tsx` | Stredni (cely soubor) |
| 6 | BLOCKER | Diakritika v zasady-cookies | `zasady-cookies/page.tsx` | Mala (kratsi soubor) |
| 7 | INFO | Marketplace je kompletni | — | Zadna akce |

### Zavislosti
- Krok 2 a 3 se daji spojit (oba meni `reklamacni-rad/page.tsx`)
- Kroky 3-6 jsou nezavisle — mohou byt paralelizovany
- Krok 1 je zcela nezavisly

### Ocekavany cas
- Krok 1: ~1 min
- Krok 2: ~1 min
- Kroky 3-6: ~20-30 min celkem (velke soubory s pravnim textem)
