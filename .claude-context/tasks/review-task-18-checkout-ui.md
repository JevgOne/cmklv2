# Review task #18 — Checkout UI (6 dopravců + flat ceny)

**Datum:** 2026-04-06
**Reviewer:** Evžen THE KING
**Task:** #32 — review task #18 proti doslovnému zadání
**Commit:** `a1e0985`

---

## 1. ZADÁNÍ OD UŽIVATELE (literal citace)

1. "nainstaluj tam do toho **stripe pay**, zasilkovnu, DPD a všechny tyhle dopravce **konkretne jenom do ESHOPU**"
2. "**jednotlivě**" (ne Balíkobot aggregator)
3. "**smlouvu budeme mít my** budou to posílat přes nás" (Carmakler drží smlouvu)
4. "**stripe + dopravci musí být jenom u shopu**" (pro NOVÉ integrace; pre-existing Stripe v inzerci/marketplace/CEBIA ponecháno dle mého review #25)

---

## 2. OVĚŘENÍ 6 POŽADAVKŮ OD TEAM-LEADA

### Bod 1 — Stripe integrace v eshop checkoutu → ✅ SPLNĚNO

**Důkaz:** `app/(web)/shop/objednavka/page.tsx:18-22`:
```typescript
const paymentMethods = [
  { value: "BANK_TRANSFER", label: "Bankovní převod", desc: "Platba předem na účet" },
  { value: "COD", label: "Dobírka", desc: "Platba při převzetí (+39 Kč)" },
  { value: "CARD", label: "Platba kartou", desc: "Okamžitá platba přes Stripe" },
];
```

Wizard step 2 (řádky 210-238) zobrazí všechny 3 payment methods jako radio karty. `handleSubmit` (řádky 113-116) přesměruje na Stripe Checkout URL:
```typescript
if (data.checkoutUrl) {
  window.location.href = data.checkoutUrl;
}
```

**Poznámka:** OrderForm.tsx je pouze komponenta pro delivery data — payment method výběr je v `page.tsx` jako samostatný wizard step. Team-lead zadání "OrderForm umožňuje Stripe" je správně, jen umístění je v page.tsx, ne v OrderForm (to je architektonicky OK — OrderForm je pouze step 1 "Doručení", step 2 "Platba" je v page.tsx).

Zde se nejedná o nový Stripe kód — Stripe integrace je z dřívějších tasků (P2 features), task #18 jen zajišťuje že payment step je správně napojený na Stripe Checkout flow.

### Bod 2 — 5 dopravců + PICKUP = 6 → ✅ SPLNĚNO

**Důkaz 1:** `lib/shipping/prices.ts:21-28`:
```typescript
export const CARMAKLER_SHIPPING_PRICES: Record<DeliveryMethod, number> = {
  ZASILKOVNA: 79,
  DPD: 109,
  PPL: 99,
  GLS: 109,
  CESKA_POSTA: 129,
  PICKUP: 0,
};
```

**Důkaz 2:** `lib/shipping/types.ts:12-17` DeliveryMethod type:
```typescript
export type DeliveryMethod =
  | "ZASILKOVNA"
  | "DPD"
  | "PPL"
  | "GLS"
  | "CESKA_POSTA"
  | "PICKUP";
```

**Důkaz 3:** `lib/validators/parts.ts:74` Zod enum:
```typescript
deliveryMethod: z.enum(["ZASILKOVNA", "DPD", "PPL", "GLS", "CESKA_POSTA", "PICKUP"]),
```

**Důkaz 4:** `OrderForm.tsx:42,117-179` iteruje `getShippingMethods()` a renderuje **6 radio karet** v pořadí ZASILKOVNA → PPL → DPD → GLS → CESKA_POSTA → PICKUP (dle `order` pole v SHIPPING_METHOD_INFO).

**Triple consistency check:**
- TypeScript `DeliveryMethod` type = 6 hodnot
- Zod enum = 6 hodnot
- `CARMAKLER_SHIPPING_PRICES` = 6 klíčů
- `SHIPPING_METHOD_INFO` = 6 klíčů
- UI render = 6 karet

Všechno shodné. ✅

### Bod 3 — Přímé integrace, ne Balíkobot → ✅ SPLNĚNO

Task #18 samotný Balíkobot neriff — používá pouze `getShippingPrice()` + `getShippingMethods()` z `lib/shipping/prices.ts`. Tyto funkce pracují s lokálním ceníkem, ne s aggregator API.

Skutečné carrier klienty implementuje task #16 (5 samostatných klientů: `ZasilkovnaClient`, `DpdClient`, `PplClient`, `GlsClient`, `CeskaPostaClient`) — to jsem schválil ve svém review #22 jako "přímé integrace, zero Balíkobot reference" (grep `balikobot|shipmondo|aggregator` → 0 nálezů v `lib/shipping/`).

Task #18 na task #16 staví a neporušuje to. ✅

### Bod 4 — Carmakler drží smlouvy, flat prices → ✅ SPLNĚNO

**Důkaz 1:** Komentář v `prices.ts:4`:
```
/**
 * Carmakler má vlastní smlouvy s dopravci a nabízí zákazníkovi FLAT ceny
 * (ne dynamické z API dopravce).
 */
```

**Důkaz 2:** Single source of truth — 1 soubor `lib/shipping/prices.ts` definuje všechny ceny. QA ověřil že duplicity (`DELIVERY_PRICES` v `orders/route.ts`, `deliveryPrices` v obou page.tsx) **byly smazány** (grep: žádný výskyt).

**Důkaz 3:** Žádná per-supplier logika:
- `getShippingPrice(method)` — jen method argument, žádný `supplierId`
- `CARMAKLER_SHIPPING_PRICES` — flat ceny, ne per-supplier
- Architektura odpovídá tomu, že Carmakler centrálně uzavírá smlouvy s dopravci, vrakoviště jen dostane PDF štítek (task #21 wire-uje)

Jediný centrální ceník → Carmakler řídí ceny → smlouvy drží Carmakler. ✅

### Bod 5 — Pouze v eshopu → ✅ SPLNĚNO (zero leak)

**Grep** `from.*"@/lib/shipping` napříč celým produkčním kódem:

| Soubor | Kontext | Eshop? |
|--------|---------|--------|
| `app/api/orders/route.ts:9` | eshop orders API | ✅ |
| `app/api/stripe/webhook/route.ts:5-6` | eshop Stripe webhook (task #17) | ✅ |
| `components/web/OrderForm.tsx:6,8` | eshop checkout komponenta | ✅ |
| `app/(web)/shop/objednavka/page.tsx:9-10` | eshop checkout page | ✅ |
| `app/(web)/dily/objednavka/page.tsx:9-10` | eshop checkout (alias /dily) | ✅ |
| `scripts/test-shipping.ts` | dev script mimo produkci | ✅ |

**Žádné importy v:**
- ❌ `app/(web)/marketplace/**` — ověřeno grep: 0
- ❌ `app/(web)/inzerce/**` — ověřeno grep: 0
- ❌ `app/(pwa)/makler/**` — ověřeno grep: 0
- ❌ `app/(pwa-parts)/parts/**` — ověřeno grep: 0
- ❌ `app/(admin)/**` — ověřeno grep: 0
- ❌ `app/(partner)/**` — ověřeno grep: 0

Zero leak. ✅

### Bod 6 — Dry-run mode pro absence API klíčů → ✅ SPLNĚNO (task #16, zachováno)

Tento bod přísluší task #16 (shipping carriers), který implementuje dry-run fallback v `BaseCarrierClient.dryRunResult()`. Task #18 se toho netýká — #18 používá jen flat ceny z `prices.ts`, neřeší API calls na dopravce.

Task #18 nijak neporušuje ani nerozbíjí dry-run mode z #16. Ověřeno v mém review #22. ✅

---

## 3. EXTRA NÁLEZY (mimo 6 bodů team-leada)

### ✅ Duplicity eliminovány

QA kontrolor ověřil že:
- Lokální `DELIVERY_PRICES` v `orders/route.ts` → smazán
- Lokální `deliveryPrices` v `shop/objednavka/page.tsx` → smazán
- Lokální `deliveryPrices` v `dily/objednavka/page.tsx` → smazán

Single source of truth je zachován. Ověřeno grep → žádná duplicita. ✅

### ✅ Typ consistency

TypeScript `DeliveryMethod` + Zod enum + Prisma `deliveryMethod` (String s komentářem `// ZASILKOVNA, DPD, PPL, GLS, CESKA_POSTA, PICKUP`) jsou všechny ve shodě. Přidání nového dopravce způsobí compile error pokud chybí v `CARMAKLER_SHIPPING_PRICES` (díky `Record<DeliveryMethod, number>`).

### 🟡 Drobnosti od QA kontrolora (neblokující)

1. **`/dily` vs `/shop` duplicita** — 2 identické page.tsx soubory (~280 řádků každý). **Pre-existing** z dřívějších sprintů, **NENÍ** způsobena task #18. Task #18 tuto duplicitu respektuje (mirror změny) ale neřeší. Mělo by být sjednoceno v budoucnu, ale je to mimo scope #18.

2. **PPL + DPD + GLS mají stejnou description + icon** — "Doručení kurýrem na uvedenou adresu" + 🚚. Plánováno nahradit SVG ikonami v budoucnu. Funkčně OK — uživatel rozliší podle label ("PPL" vs "DPD" vs "GLS") a ceny.

### 🟢 Architektonicky čisté

- Step 1 (Doručení) v `OrderForm.tsx` — izolovaná komponenta
- Step 2 (Platba) v `page.tsx` — inline, 3 payment karty
- Step 3 (Potvrzení) v `page.tsx` — shrnutí
- `handleSubmit` volá `/api/orders` s `paymentMethod` v body
- Stripe flow detekován přes `data.checkoutUrl` ve response

---

## 4. KŘÍŽOVÁ KONTROLA S QA REPORTEM

QA report (`qa-task-18-checkout-ui.md`) deklaruje **28/28 checks PASS**. Rozdělení:
- Simplify kontrola — čisté
- Build ✅ 309/309
- Lint ✅ 0 nových problémů
- Reverzní kontrola 28/28 ✅
- Scope audit — shipping pouze v eshopu ✅

**Evžen potvrzuje QA správně** — všech 28 kontrol je validních. Nenašel jsem rozpor mezi QA reportem a realitou v kódu.

---

## 5. FINÁLNÍ VERDIKT

| Team-lead bod | Stav | Zdůvodnění |
|---------------|------|------------|
| 1. Stripe integrace v eshop checkoutu | ✅ | CARD/COD/BANK_TRANSFER v step 2, Stripe Checkout redirect funguje |
| 2. 5 dopravců + PICKUP (6) | ✅ | `DeliveryMethod` type + Zod + ceník + UI = 6 consistent |
| 3. Přímé integrace, ne Balíkobot | ✅ | Task #18 neriff aggregator; #16 ověřen v review #22 |
| 4. Carmakler drží smlouvy, flat prices | ✅ | Single source of truth v `prices.ts`, žádná per-supplier logika |
| 5. Pouze v eshopu | ✅ | Grep ověřen — 5 eshop souborů, zero leak |
| 6. Dry-run mode | ✅ | Task #16 — nedotčeno task #18 |

## ✅ TASK #18 APPROVED

Všech 6 požadavků z team-leadova zadání splněno literal. Task #18 správně staví na task #16 (shipping library) a doplňuje UI + flat ceník, čímž dokončuje uživatelské zadání "stripe pay + Zásilkovna + DPD + další do ESHOPU".

### Doporučení pro deploy
- ✅ Task #18 neblokuje deploy
- ⚠️ Připomínka: `/dily` vs `/shop` duplicita pre-existing — sjednotit v budoucím refaktoringu (není blocker)
- ⚠️ Připomínka: PPL/DPD/GLS mají stejné SVG placeholdery — kosmetické, ne blocker
- ✅ Task #27 (marketplace gating API leaky) zůstává blokerem — **doplnit fix B+C z mého review #27 před produkcí**

---

**Evžen THE KING — review task #18 hotov, APPROVED.**
