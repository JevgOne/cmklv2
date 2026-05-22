# Plán — Task #18: Checkout UI — všichni dopravci + ceny (flat Carmakler)

**Autor:** planovac (agent team)
**Datum:** 2026-04-06
**Task ID:** #18
**Status:** Naplánováno — připraveno k implementaci

---

## 1. Cíl

V checkout formuláři eshopu (`/shop/objednavka` + `/dily/objednavka`) nabídnout zákazníkovi **všech 6 dopravních metod**:

| Metoda | Cena | ETA | Popis |
|--------|-----:|-----|-------|
| ZASILKOVNA | 79 Kč | 1–2 prac. dny | Výdejní místo Zásilkovny (8 000+ míst v ČR) |
| DPD | 109 Kč | 1–2 prac. dny | Doručení na adresu |
| PPL | 99 Kč | 1–2 prac. dny | Doručení na adresu |
| GLS | 109 Kč | 1–2 prac. dny | Doručení na adresu |
| CESKA_POSTA | 129 Kč | 2–3 prac. dny | Doručení na adresu |
| PICKUP | 0 Kč | Ihned | Osobní odběr v sídle Carmakler (Praha) |

Cena se **centralizuje** do `lib/shipping/prices.ts` (single source of truth). Dnes je duplikovaná na 3 místech (OrderForm, checkout page state, API route).

---

## 2. Stav "dnes" (co už funguje)

- ✅ `components/web/OrderForm.tsx` — formulář s adresními poli + `Select` pro metodu (jen 4 hodnoty: ZASILKOVNA/PPL/CESKA_POSTA/PICKUP)
- ✅ `components/web/ZasilkovnaWidget.tsx` — funkční CDN Packeta Widget v6 (`https://widget.packeta.com/v6/www/js/library.js` přes Next.js `<Script>`)
- ✅ `NEXT_PUBLIC_ZASILKOVNA_API_KEY` — už se čte v ZasilkovnaWidget
- ✅ Parent checkout pages (`shop/objednavka/page.tsx`, `dily/objednavka/page.tsx`) — stepper Doručení → Platba → Potvrzení, summary sidebar, Stripe redirect pro CARD
- ✅ `app/api/orders/route.ts` — POST endpoint ukládá `deliveryMethod`, `zasilkovnaPointId/Name`, `shippingPrice`, `totalPrice`, napojení na Stripe
- ✅ `lib/validators/parts.ts` — `createOrderSchema` Zod validace vč. refine pro `ZASILKOVNA → zasilkovnaPointId required`
- ✅ Prisma `Order` model má všechny potřebné fieldy
- ✅ `lib/shipping/types.ts` — `DeliveryMethod` union (6 hodnot)
- ✅ npm package: **žádný Packeta npm balíček není** (ani nemá být — CDN je kanonická cesta pro widget v6)

**Co chybí:**
1. DPD a GLS **nejsou** v UI selectoru ani v Zod enumu ani v API route cenové mapě
2. Ceník je **3× duplikovaný** (OrderForm label, page state, API route)
3. Select nevypadá dobře pro 6 možností s popisy — chceme **radio buttons** (jako je to už u Payment stepu pár řádků vedle)
4. Chybí popisy, ETA, ikony pro jednotlivé dopravce
5. `createOrderSchema` Zod enum chybí `DPD` a `GLS`

---

## 3. Klíčová rozhodnutí

### 3.1 Single source of truth pro dopravu: `lib/shipping/prices.ts`
Nový modul exportuje:
- `CARMAKLER_SHIPPING_PRICES: Record<DeliveryMethod, number>` — jen cena (typ-safe)
- `SHIPPING_METHOD_INFO: Record<DeliveryMethod, ShippingMethodInfo>` — bohatší metadata (label, description, eta, icon, order)
- `getShippingMethods()` — helper vrátí array v zobrazovacím pořadí
- `getShippingPrice(method)` — helper s fallbackem na 0

**Proč samostatná `prices` mapa i `info` mapa:** Některé části backendu potřebují jen cenu (API route) a neměly by importovat emoji/ikony. Frontend UI naopak chce všechno najednou. Dvě mapy zabraňují zbytečnému importu frontend věcí do backendu.

### 3.2 Radio buttons místo `Select`
Důvody:
- **UX:** 6 možností s popisy a cenami se špatně zobrazuje v dropdown
- **Konzistence:** Payment step (`shop/objednavka/page.tsx:214-241`) už používá radio karty s oranžovým border při select — chceme sjednotit
- **Mobile-first:** radio karty se lépe hit-testují na malém displeji

### 3.3 Ikony dopravců
Tuhle verzi: **emoji jako ikona** (📦 pro ZASILKOVNA, 🚚 pro DPD/PPL/GLS/ČP, 🏪 pro PICKUP). Nic se nemusí stahovat/hostovat, žádné licence, žádné image optimalizace.

Skutečné logo (PNG/SVG) můžeme přidat později přes `public/shipping/<carrier>.svg` — zvažit v design tasku. **V tomto tasku NE.**

### 3.4 PICKUP adresa
PICKUP nevyžaduje doručovací adresu — zákazník si vyzvedne v Praze. Ale checkout flow ji dnes stejně vyžaduje (pro fakturační údaje). **Řešení:**
- Nechat address fieldy povinné i pro PICKUP — fungují jako fakturační/kontaktní údaje
- Pod PICKUP radio přidat info box: „Objednávku si vyzvednete v sídle CarMakler, adresa bude v potvrzovacím emailu."
- Ušetří to refactor; adresa je dál potřeba pro fakturu

### 3.5 DPD/PPL/GLS/ČP — klasický adresní formulář
Tyto čtyři dopravci doručují na adresu, která se už bere z `street/city/zip` fieldů v OrderForm. **Žádné další UI** pro ně není potřeba — stejné fieldy jako dnes.

### 3.6 Dva duplikované checkout pages
Dnes existují:
- `app/(web)/shop/objednavka/page.tsx` (161 řádků — novější, používaný)
- `app/(web)/dily/objednavka/page.tsx` (nearly identical)

**Obě** potřebují update. Nebudeme je konsolidovat do jedné v tomto tasku (to je samostatný cleanup task mimo scope #18). Jen obě upravíme, aby importovaly z nového `lib/shipping/prices.ts`.

### 3.7 Migrace API route na stejný source
`app/api/orders/route.ts:73-78` má vlastní `DELIVERY_PRICES` mapu — **smažeme a importujeme** z `lib/shipping/prices.ts`. Jinak za měsíc zapomeneme aktualizovat jednu z kopií.

### 3.8 Rozšíření Zod validace
`createOrderSchema` má `deliveryMethod: z.enum(["ZASILKOVNA", "PPL", "CESKA_POSTA", "PICKUP"])` — přidat `"DPD"` a `"GLS"`. Refine na `zasilkovnaPointId` zůstává.

---

## 4. Dotčené soubory

| # | Soubor | Akce | Rozsah |
|---|--------|------|--------|
| 1 | `lib/shipping/prices.ts` | **Create** | ~70 řádků — ceny + info mapa |
| 2 | `components/web/OrderForm.tsx` | **Edit** | Nahradit `<Select>` radio buttony, importovat z `prices.ts`, přidat DPD+GLS, PICKUP info box |
| 3 | `app/(web)/shop/objednavka/page.tsx` | **Edit** | Smazat lokální `deliveryPrices` mapu, importovat `getShippingPrice` z `prices.ts` |
| 4 | `app/(web)/dily/objednavka/page.tsx` | **Edit** | To samé jako #3 |
| 5 | `app/api/orders/route.ts` | **Edit** | Smazat `DELIVERY_PRICES` mapu, importovat `getShippingPrice` |
| 6 | `lib/validators/parts.ts` | **Edit** | Rozšířit `deliveryMethod` enum o `DPD` + `GLS` |

**Žádné nové ENV, žádná DB migrace.** Vše ostatní už existuje.

---

## 5. Kód nového souboru — `lib/shipping/prices.ts`

```typescript
/**
 * Carmakler flat shipping prices — single source of truth.
 *
 * Carmakler má vlastní smlouvy s dopravci a nabízí zákazníkovi FLAT ceny
 * (ne dynamické z API dopravce). Všechny ceny jsou v Kč včetně DPH.
 *
 * Reálné ceny zadá product owner později, dokud to platí, jsou to
 * přibližné tržní hodnoty (MVP fallback).
 *
 * Import:
 *   - Frontend UI: `getShippingMethods()` nebo `SHIPPING_METHOD_INFO`
 *   - API / backend: `getShippingPrice(method)` nebo `CARMAKLER_SHIPPING_PRICES`
 */

import type { DeliveryMethod } from "./types";

/* ------------------------------------------------------------------ */
/*  Ceník — pouze čísla, typ-safe, pro backend                          */
/* ------------------------------------------------------------------ */

export const CARMAKLER_SHIPPING_PRICES: Record<DeliveryMethod, number> = {
  ZASILKOVNA: 79,
  DPD: 109,
  PPL: 99,
  GLS: 109,
  CESKA_POSTA: 129,
  PICKUP: 0,
};

/**
 * Bezpečný getter s fallbackem na 0 (nebylo by se však mělo stát — enum guarded).
 */
export function getShippingPrice(method: DeliveryMethod): number {
  return CARMAKLER_SHIPPING_PRICES[method] ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Display info — pro frontend UI                                      */
/* ------------------------------------------------------------------ */

export interface ShippingMethodInfo {
  method: DeliveryMethod;
  label: string;       // Zobrazované jméno ("Zásilkovna", "Osobní odběr")
  description: string; // Krátký popis pod labelem
  eta: string;         // Odhad doručení ("1–2 prac. dny")
  icon: string;        // Emoji ikona (dočasně; později SVG z /public/shipping/)
  price: number;       // Cena v Kč (kopie z CARMAKLER_SHIPPING_PRICES pro pohodlí)
  order: number;       // Sort order (menší = výše)
}

export const SHIPPING_METHOD_INFO: Record<DeliveryMethod, ShippingMethodInfo> = {
  ZASILKOVNA: {
    method: "ZASILKOVNA",
    label: "Zásilkovna",
    description: "Vyzvednutí na jednom z 8 000+ výdejních míst",
    eta: "1–2 prac. dny",
    icon: "📦",
    price: CARMAKLER_SHIPPING_PRICES.ZASILKOVNA,
    order: 1,
  },
  PPL: {
    method: "PPL",
    label: "PPL",
    description: "Doručení kurýrem na uvedenou adresu",
    eta: "1–2 prac. dny",
    icon: "🚚",
    price: CARMAKLER_SHIPPING_PRICES.PPL,
    order: 2,
  },
  DPD: {
    method: "DPD",
    label: "DPD",
    description: "Doručení kurýrem na uvedenou adresu",
    eta: "1–2 prac. dny",
    icon: "🚚",
    price: CARMAKLER_SHIPPING_PRICES.DPD,
    order: 3,
  },
  GLS: {
    method: "GLS",
    label: "GLS",
    description: "Doručení kurýrem na uvedenou adresu",
    eta: "1–2 prac. dny",
    icon: "🚚",
    price: CARMAKLER_SHIPPING_PRICES.GLS,
    order: 4,
  },
  CESKA_POSTA: {
    method: "CESKA_POSTA",
    label: "Česká pošta",
    description: "Doručení balík do ruky, případně do schránky",
    eta: "2–3 prac. dny",
    icon: "🚚",
    price: CARMAKLER_SHIPPING_PRICES.CESKA_POSTA,
    order: 5,
  },
  PICKUP: {
    method: "PICKUP",
    label: "Osobní odběr",
    description: "Vyzvednutí v sídle CarMakler, Praha — adresa v potvrzovacím emailu",
    eta: "Ihned po potvrzení",
    icon: "🏪",
    price: CARMAKLER_SHIPPING_PRICES.PICKUP,
    order: 6,
  },
};

/**
 * Vrátí všechny dopravní metody v zobrazovacím pořadí.
 */
export function getShippingMethods(): ShippingMethodInfo[] {
  return Object.values(SHIPPING_METHOD_INFO).sort((a, b) => a.order - b.order);
}
```

---

## 6. Přepsaný `components/web/OrderForm.tsx`

### 6.1 Nové importy
```typescript
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ZasilkovnaWidget } from "@/components/web/ZasilkovnaWidget";
import { getShippingMethods } from "@/lib/shipping/prices";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DeliveryMethod } from "@/lib/shipping/types";
```

Odstranit: `import { Select }` (už ho nepoužíváme).

### 6.2 Typy (upravit)
```typescript
export interface ZasilkovnaPoint {
  id: string;
  name: string;
  address: string;
}

export interface DeliveryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  note: string;
  deliveryMethod: DeliveryMethod | ""; // Prázdný string = ještě nevybráno
  zasilkovnaPoint?: ZasilkovnaPoint | null;
}
```

### 6.3 Kompletní komponenta (replace celý soubor)

```tsx
"use client";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ZasilkovnaWidget } from "@/components/web/ZasilkovnaWidget";
import { getShippingMethods } from "@/lib/shipping/prices";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DeliveryMethod } from "@/lib/shipping/types";

export interface ZasilkovnaPoint {
  id: string;
  name: string;
  address: string;
}

export interface DeliveryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  note: string;
  deliveryMethod: DeliveryMethod | "";
  zasilkovnaPoint?: ZasilkovnaPoint | null;
}

export function OrderForm({
  data,
  onChange,
  errors,
}: {
  data: DeliveryFormData;
  onChange: (data: DeliveryFormData) => void;
  errors?: Partial<Record<keyof DeliveryFormData, string>>;
}) {
  const update = (field: keyof DeliveryFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const shippingMethods = getShippingMethods();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Doručovací údaje</h3>

      {/* Jméno + Příjmení */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Jméno *"
          value={data.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          error={errors?.firstName}
          placeholder="Jan"
        />
        <Input
          label="Příjmení *"
          value={data.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          error={errors?.lastName}
          placeholder="Novák"
        />
      </div>

      {/* Email + Telefon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email *"
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors?.email}
          placeholder="jan@email.cz"
        />
        <Input
          label="Telefon *"
          type="tel"
          value={data.phone}
          onChange={(e) => update("phone", e.target.value)}
          error={errors?.phone}
          placeholder="+420 777 123 456"
        />
      </div>

      {/* Adresa */}
      <Input
        label="Ulice a číslo *"
        value={data.street}
        onChange={(e) => update("street", e.target.value)}
        error={errors?.street}
        placeholder="Hlavní 123"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Město *"
          value={data.city}
          onChange={(e) => update("city", e.target.value)}
          error={errors?.city}
          placeholder="Praha"
        />
        <Input
          label="PSČ *"
          value={data.zip}
          onChange={(e) => update("zip", e.target.value)}
          error={errors?.zip}
          placeholder="110 00"
        />
      </div>

      {/* Způsob doručení — radio karty */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Způsob doručení *
        </label>

        {shippingMethods.map((m) => {
          const isSelected = data.deliveryMethod === m.method;
          return (
            <label
              key={m.method}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <input
                type="radio"
                name="deliveryMethod"
                value={m.method}
                checked={isSelected}
                onChange={(e) => update("deliveryMethod", e.target.value)}
                className="mt-1 w-5 h-5 accent-orange-500 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden>
                      {m.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{m.label}</div>
                      <div className="text-sm text-gray-500">{m.description}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-gray-900">
                      {m.price === 0 ? "Zdarma" : formatPrice(m.price)}
                    </div>
                    <div className="text-xs text-gray-400">{m.eta}</div>
                  </div>
                </div>

                {/* Zásilkovna widget — jen když je vybraná */}
                {isSelected && m.method === "ZASILKOVNA" && (
                  <div className="mt-3">
                    <ZasilkovnaWidget
                      onSelect={(point) => {
                        onChange({ ...data, zasilkovnaPoint: point });
                      }}
                      selectedPoint={data.zasilkovnaPoint}
                    />
                  </div>
                )}

                {/* PICKUP info box */}
                {isSelected && m.method === "PICKUP" && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                    Objednávku si vyzvednete v sídle CarMakler v Praze.
                    Přesnou adresu a otevírací dobu najdete v potvrzovacím emailu.
                  </div>
                )}
              </div>
            </label>
          );
        })}

        {errors?.deliveryMethod && (
          <p className="text-sm text-red-500 mt-1">{errors.deliveryMethod}</p>
        )}
      </div>

      {/* Poznámka */}
      <Textarea
        label="Poznámka k objednávce"
        value={data.note}
        onChange={(e) => update("note", e.target.value)}
        placeholder="Volitelná poznámka..."
        className="min-h-[80px]"
      />
    </div>
  );
}
```

**Klíčové UX detaily:**
- Radio karty mají stejný styl jako Payment step (oranžový border + pozadí)
- Emoji ikona + název + popis vlevo, cena + ETA vpravo (classic price-comparison layout)
- „Zdarma" místo „0 Kč" pro PICKUP (lepší psychologie)
- ZasilkovnaWidget se zobrazí **uvnitř** vybrané karty (ne odděleně pod radio listem)
- PICKUP info box taky uvnitř karty
- `errors.deliveryMethod` zobrazuje se pod celým listem (jediný error)

---

## 7. Úpravy parent checkout pages

### 7.1 `app/(web)/shop/objednavka/page.tsx`

**Smazat** lokální mapu (řádky 22-27):
```diff
- const deliveryPrices: Record<string, number> = {
-   ZASILKOVNA: 79,
-   PPL: 129,
-   CESKA_POSTA: 99,
-   PICKUP: 0,
- };
```

**Přidat import** nahoru:
```typescript
import { getShippingPrice } from "@/lib/shipping/prices";
import type { DeliveryMethod } from "@/lib/shipping/types";
```

**Upravit výpočet `deliveryPrice`** (řádek 60):
```diff
- const deliveryPrice = deliveryPrices[delivery.deliveryMethod] ?? 0;
+ const deliveryPrice = delivery.deliveryMethod
+   ? getShippingPrice(delivery.deliveryMethod as DeliveryMethod)
+   : 0;
```

Žádné další změny (zbytek logiky je správně).

### 7.2 `app/(web)/dily/objednavka/page.tsx`
**Přesně stejné úpravy** jako 7.1 — je to skoro 1:1 duplikát.

### 7.3 `app/api/orders/route.ts`

**Smazat** lokální mapu (řádky 73-78):
```diff
- // Dopravné dle metody doručení
- const DELIVERY_PRICES: Record<string, number> = {
-   ZASILKOVNA: 79,
-   PPL: 129,
-   CESKA_POSTA: 99,
-   PICKUP: 0,
- };
- const deliveryPrice = DELIVERY_PRICES[data.deliveryMethod] ?? 0;
+ const deliveryPrice = getShippingPrice(data.deliveryMethod);
```

**Přidat import** nahoru:
```typescript
import { getShippingPrice } from "@/lib/shipping/prices";
```

Zbytek logiky (codFee, shippingPrice, Stripe line_items) beze změn.

### 7.4 `lib/validators/parts.ts`

**Rozšířit enum** (řádek 74):
```diff
- deliveryMethod: z.enum(["ZASILKOVNA", "PPL", "CESKA_POSTA", "PICKUP"]),
+ deliveryMethod: z.enum(["ZASILKOVNA", "DPD", "PPL", "GLS", "CESKA_POSTA", "PICKUP"]),
```

Refine pro `zasilkovnaPointId` zůstává beze změn.

---

## 8. ENV proměnné

| ENV | Existuje? | Popis |
|-----|-----------|-------|
| `NEXT_PUBLIC_ZASILKOVNA_API_KEY` | ✅ | API key pro Packeta Widget (frontend). Bez něj widget neotevře picker. V `.env.example` už je (task #20). |

**Žádné nové ENV** pro task #18.

**Poznámka:** `NEXT_PUBLIC_*` klíče jsou exponovány do bundle — je to v pořádku, Packeta widget API key je explicitně určený pro browser context (to není secret, to je veřejný identifikátor aplikace).

---

## 9. Edge cases + řešení

| # | Edge case | Řešení |
|---|-----------|--------|
| 1 | Zákazník nevybere dopravu | `errors.deliveryMethod = "Vyberte způsob doručení"` (validace už je v parent page) |
| 2 | Vybere ZASILKOVNA ale neklikne „Vybrat výdejní místo" | `errors.deliveryMethod = "Vyberte výdejní místo Zásilkovny"` (validace v parent page řádek 74-76) |
| 3 | Packeta Widget JS ještě nenačtený a user klikne | `ZasilkovnaWidget.openPicker()` early-returns při `!window.Packeta` — žádný crash. User klikne znovu za 1 sec. |
| 4 | `NEXT_PUBLIC_ZASILKOVNA_API_KEY` chybí v `.env.local` | Widget má `return` při chybějícím apiKey → picker se neotevře. Mělo by být v `.env.example` (task #20) |
| 5 | User přepne z ZASILKOVNA na DPD s již vybraným výdejním místem | `zasilkovnaPoint` zůstane ve state, ale není zobrazen ani poslán na API (parent passes `zasilkovnaPointId: undefined` když `deliveryMethod !== "ZASILKOVNA"`). **TODO:** parent page checkout může explicitně vyčistit `zasilkovnaPoint` při změně metody — nice-to-have, není blokátor. |
| 6 | PICKUP vybráno ale user vyplnil `street/city/zip` | OK — použije se jako fakturační adresa. Nic se nemění. |
| 7 | User má prázdný košík a otevře checkout | Už ošetřeno v parent page (`items.length === 0 && step !== 3` → info screen) |
| 8 | API vrátí 400 (neplatná data) | Parent page už má `res.ok` check + fallback na demo mode. Chyba z enumu (DPD/GLS) se nestane po rozšíření. |

---

## 10. Testování

### 10.1 Manuální test — happy path
1. `npm run dev`
2. `/shop/katalog` → přidat díl do košíku
3. `/shop/kosik` → „K pokladně"
4. Krok 1 (Doručení):
   - Vyplnit adresní údaje
   - Ověřit že radio list obsahuje **6 metod** v pořadí: Zásilkovna, PPL, DPD, GLS, Česká pošta, Osobní odběr
   - Vybrat **Zásilkovna** → klik na „Vybrat výdejní místo" → Packeta Widget popup → vybrat pobočku → ověřit že se název pobočky zobrazí v kartě
   - Změnit na **DPD** → ověřit že Packeta widget zmizí, cena se změní na 109 Kč, ETA zůstává
   - Změnit na **Osobní odběr** → ověřit že se objeví modrý info box, cena se změní na „Zdarma"
5. Pokračovat na Krok 2 (Platba) → vybrat CARD
6. Krok 3 (Potvrzení) → zkontrolovat summary sidebar vpravo (Mezisoučet + Doprava + Celkem)
7. Odeslat → redirect na Stripe Checkout → test karta 4242 4242 4242 4242 → success

### 10.2 Manuální test — validace
1. Step 1 bez vyplnění ničeho → „Pokračovat" → ověřit všechny error hlášky
2. Vybrat ZASILKOVNA bez klik na widget → „Pokračovat" → error „Vyberte výdejní místo Zásilkovny"
3. DPD → „Pokračovat" → OK (adresa už vyplněná)

### 10.3 Visual QA (mobile)
- Radio karty se zobrazují správně na 375px width (iPhone SE)
- Cena + ETA vpravo se neulomuje pod label
- Packeta Widget se otevře jako modal (Packeta ho renderuje sama)

### 10.4 TypeScript + lint
```bash
npm run build   # ověří TS types
npm run lint    # ESLint
```

### 10.5 Backend kontrola
Po vytvoření objednávky zkontrolovat v DB:
```sql
SELECT orderNumber, deliveryMethod, shippingPrice, zasilkovnaPointId, zasilkovnaPointName
FROM "Order" ORDER BY createdAt DESC LIMIT 5;
```
Očekáváno: `shippingPrice` odpovídá `CARMAKLER_SHIPPING_PRICES[deliveryMethod]`.

---

## 11. Definition of Done

- [ ] Nový soubor `lib/shipping/prices.ts` obsahuje: `CARMAKLER_SHIPPING_PRICES`, `SHIPPING_METHOD_INFO`, `getShippingPrice`, `getShippingMethods`, typ `ShippingMethodInfo`
- [ ] `OrderForm.tsx` rendruje **6 radio karet** v pořadí dle `order` field
- [ ] Každá karta obsahuje: emoji ikonu, label, description, price, eta
- [ ] Vybraná karta má oranžový border + pozadí
- [ ] PICKUP karta ukazuje modrý info box s adresou CarMakler Prahy
- [ ] ZASILKOVNA karta embeduje `ZasilkovnaWidget` pouze když je vybraná
- [ ] `DeliveryFormData.deliveryMethod` typ je `DeliveryMethod | ""`
- [ ] `shop/objednavka/page.tsx` importuje `getShippingPrice` místo lokální mapy
- [ ] `dily/objednavka/page.tsx` importuje `getShippingPrice` místo lokální mapy
- [ ] `app/api/orders/route.ts` importuje `getShippingPrice` místo lokální mapy
- [ ] `lib/validators/parts.ts` `createOrderSchema` enum obsahuje `["ZASILKOVNA", "DPD", "PPL", "GLS", "CESKA_POSTA", "PICKUP"]`
- [ ] Zásilkovna flow funguje end-to-end (vybrat pobočku → odeslat → uloží `zasilkovnaPointId` + `zasilkovnaPointName`)
- [ ] DPD a GLS projdou backend validací bez 400 erroru
- [ ] `npm run build` projde bez TS erroru
- [ ] `npm run lint` projde
- [ ] Manuální happy-path test (sekce 10.1) funguje

---

## 12. Mimo scope (NEdělat v tomto tasku)

- **Konsolidace `shop/objednavka` + `dily/objednavka`** — samostatný cleanup task (dnes jsou to duplikáty)
- **SVG logos dopravců** — emoji jsou MVP fallback; realné logo v task design/#19 epoše
- **Dynamické ceny dle hmotnosti/velikosti** — team-lead řekl **flat** ceny
- **Shipping discount při velkém nákupu** — out-of-scope
- **Multi-language (EN/CZ)** — jen CZ
- **Admin UI pro úpravu cen** — flat hodnoty se mění v kódu (jedno místo)
- **.env.example update** — task #20 to pokryje (nic nového tady není)
- **Stripe Shipping Rates sync** — dnes shippingPrice jde do Stripe přes `shipping_options` inline (viz `app/api/orders/route.ts:161-169`), to funguje, není potřeba sync

---

## 13. Pořadí implementace

1. **Vytvořit `lib/shipping/prices.ts`** — nejdřív fundament
2. **Rozšířit Zod enum** v `lib/validators/parts.ts` — jinak backend odmítne DPD/GLS
3. **Upravit API route** `app/api/orders/route.ts` — import + smazat lokální mapu
4. **Přepsat `components/web/OrderForm.tsx`** — radio UI, import `getShippingMethods`
5. **Upravit `shop/objednavka/page.tsx`** — import + smazat lokální mapu
6. **Upravit `dily/objednavka/page.tsx`** — to samé (copy-paste ze #5)
7. **`npm run build` + `npm run lint`** — ověřit TS types všude
8. **Manuální test** — happy path přes Stripe
9. **Git commit** — `feat: unified shipping prices + 6 carriers in checkout (task #18)`

**Odhadovaná složitost:** ~40 min implementace + 15 min manuální test.

---

## 14. Rizika

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| Zapomenutí aktualizovat jednu z duplikovaných map | Medium (3 místa dnes) | High — inconsistentní ceny | Po refaktoru je jediné místo; grep po `DELIVERY_PRICES\|deliveryPrices\|ZASILKOVNA: 79` v závěru |
| Packeta Widget v6 změní API breaking change | Low | High — checkout rozbitý | CDN URL je fixní na `v6`, major version se nemění; navíc `ZasilkovnaWidget` má `early return` při `!window.Packeta` |
| Typ `DeliveryMethod \| ""` způsobí TS errory v parent pages | Medium | Low — trivial fix | Parent pages už dnes používají `string`, rozšíření na union je safe |
| Radio karty na mobilu vypadají špatně | Low | Medium — UX | Test na 375px width v sekci 10.3 |
| Zod validace selže kvůli starým `ORDER`s v DB | Low | — | Žádný migrační dopad, enum jen pro nový insert |
| Ceny se později změní a zapomene se aktualizovat | Medium | Medium | Plán sekce 1 explicitně říká, že hodnoty jsou MVP fallback; comment v `prices.ts` to opakuje |

---

## 15. Souhrn

- **1 nový soubor** (`lib/shipping/prices.ts` ~120 řádků)
- **5 edit souborů** (OrderForm, 2× checkout page, API route, Zod validator)
- **6 dopravních metod** v UI (přidaly se DPD + GLS)
- **Radio karty** místo dropdown
- **Centralizovaný ceník** (smazané 3× duplikáty)
- **Žádné nové ENV, žádná DB migrace**
- **Plně kompatibilní s už hotovými task #16 (shipping carriers) a #17 (Stripe webhook)** — dispatcher bere `DeliveryMethod` z Order, přidané DPD+GLS už mají implementované klienty
