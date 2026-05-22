# Impl report — Task #18: Checkout UI — 6 dopravců + flat ceny

**Commit:** `a1e0985` — feat(shop): #18 checkout UI s 6 dopravci + flat ceny
**Plán:** `.claude-context/tasks/plan-task-18-checkout-ui.md`
**Build:** ✅ prošel (`npm run build`)
**Lint:** ✅ 0 errors na dotčených souborech

---

## Co bylo uděláno

### 1. `lib/shipping/prices.ts` — NEW

Single source of truth pro flat ceny Carmakler. Obsahuje:

- `CARMAKLER_SHIPPING_PRICES: Record<DeliveryMethod, number>` — ceník v Kč:
  - ZASILKOVNA: 79
  - DPD: 109
  - PPL: 99
  - GLS: 109
  - CESKA_POSTA: 129
  - PICKUP: 0
- `getShippingPrice(method)` — safe getter s fallbackem na 0
- `SHIPPING_METHOD_INFO` — display meta (label, description, eta, icon, order)
- `getShippingMethods()` — seřazené pole pro UI

### 2. `lib/validators/parts.ts` — MOD

Rozšířen Zod enum `deliveryMethod` z 4 hodnot (ZASILKOVNA/PPL/CESKA_POSTA/PICKUP) na 6
(přidáno DPD + GLS). `refine` pro `zasilkovnaPointId` zůstává beze změny.

### 3. `app/api/orders/route.ts` — MOD

- Přidán import `getShippingPrice` z `@/lib/shipping/prices`
- Smazán lokální `DELIVERY_PRICES` map (duplicita)
- `const deliveryPrice = getShippingPrice(data.deliveryMethod);`

### 4. `components/web/OrderForm.tsx` — REWRITTEN

Kompletně přepsáno ze Selectu na radio karty:

- Iteruje `getShippingMethods()` → 6 karet v pořadí ZASILKOVNA → PPL → DPD → GLS → CESKA_POSTA → PICKUP
- Selected karta: orange border + `bg-orange-50`
- Každá karta: emoji + label + description vlevo, cena + ETA vpravo
- PICKUP: zobrazí "Zdarma" místo "0 Kč"
- `ZasilkovnaWidget` embedded uvnitř selected ZASILKOVNA karty
- PICKUP info box (modrý) uvnitř selected PICKUP karty
- Typ `DeliveryFormData.deliveryMethod` zúžen na `DeliveryMethod | ""`

### 5. `app/(web)/shop/objednavka/page.tsx` — MOD

- Přidány importy `getShippingPrice` + `DeliveryMethod` type
- Smazán lokální `deliveryPrices` map (duplicita)
- `deliveryPrice` nyní přes `getShippingPrice()` s cast na `DeliveryMethod`

### 6. `app/(web)/dily/objednavka/page.tsx` — MOD

Identické změny jako bod 5 (mirror page pro `/dily/*` alias).

---

## Definition of Done — checklist

- [x] UI zobrazuje všech 6 dopravců (Zásilkovna, PPL, DPD, GLS, Česká pošta, PICKUP)
- [x] Single source of truth pro ceny — žádná duplicita v codebase
- [x] Zod enum pokrývá všech 6 metod
- [x] `POST /api/orders` neodmítne DPD ani GLS
- [x] Stripe + shipping zůstává ONLY v eshopu (`/shop/*` + `/dily/*`)
- [x] Žádné nové ENV, žádná DB migrace
- [x] `npm run build` prošel
- [x] `npm run lint` na dotčených souborech — 0 errors
- [x] Commit: `feat(shop): #18 checkout UI s 6 dopravci + flat ceny`

---

## Seznam souborů v commitu

```
A  lib/shipping/prices.ts
M  lib/validators/parts.ts
M  app/api/orders/route.ts
M  components/web/OrderForm.tsx
M  app/(web)/shop/objednavka/page.tsx
M  app/(web)/dily/objednavka/page.tsx
```

6 files changed, 210 insertions(+), 56 deletions(-)
