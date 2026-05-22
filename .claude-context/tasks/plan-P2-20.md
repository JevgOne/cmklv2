# Plan P2-20: Zasilkovna widget + oprava delivery method

**Priorita:** P2 (TOP 5 pro launch)
**Slozitost:** M
**Zavislosti:** P0-08 (PostgreSQL — HOTOVO)
**Duvod vyberu:** UX + Business — Zasilkovna je nejpopularnejsi dorucovaci sluzba v CR (~8000 vydejnich mist). Integrace widgetu pro vyber vydejniho mista zlepsuje konverzi. Zaroven opravit chybejici ulozeni delivery method do DB.

---

## Cil

1. Integrace Zasilkovna (Packeta) widgetu pro vyber vydejniho mista
2. Opravit backend — delivery method se neuklada do DB
3. Opravit backend — shipping price se nepocita z delivery method

---

## Analyza aktualniho stavu

### Frontend — delivery options EXISTUJI

**Soubor:** `app/(web)/shop/objednavka/page.tsx` (radky 21-26)
```ts
const deliveryPrices: Record<string, number> = {
  ZASILKOVNA: 79,
  PPL: 129,
  CESKA_POSTA: 99,
  PICKUP: 0,
};
```

**Soubor:** `components/web/OrderForm.tsx` (radky 19-24)
```ts
const deliveryOptions = [
  { value: "ZASILKOVNA", label: "Zasilkovna — 79 Kc" },
  { value: "PPL", label: "PPL — 129 Kc" },
  { value: "CESKA_POSTA", label: "Ceska posta — 99 Kc" },
  { value: "PICKUP", label: "Osobni odber — Zdarma" },
];
```

### Backend — delivery method se NEUKLADA

**Soubor:** `app/api/orders/route.ts` (radky 71-72):
```ts
const shippingPrice = data.paymentMethod === "COD" ? 49 : 0;
```

**KRITICKE CHYBY:**
1. `shippingPrice` se pocita JEN z COD poplatku (49 Kc), NE z delivery method
2. `deliveryMethod` z requestu se IGNORUJE a NEUKLADA
3. Order model v schema NEMA `deliveryMethod` pole

### Schema — chybi deliveryMethod

**Soubor:** `prisma/schema.prisma` — Order model:
- Ma `deliveryAddress`, `deliveryCity`, `deliveryZip`, `deliveryName`
- Ma `shippingPrice Int @default(0)`
- **NEMA** `deliveryMethod` pole
- **NEMA** `zasilkovnaPointId` nebo podobne

### Zasilkovna — ZADNA integrace

- Zadny Zasilkovna/Packeta SDK v `package.json`
- Zadny widgetovy script
- Zadny API klip pro Zasilkovna

---

## Kroky implementace

### Krok 1: Pridat deliveryMethod do Order modelu

**Soubor:** `prisma/schema.prisma` — Order model

```diff
   deliveryAddress String
   deliveryCity    String
   deliveryZip     String
+
+  // Doruceni
+  deliveryMethod String @default("PPL") // ZASILKOVNA, PPL, CESKA_POSTA, PICKUP
+  zasilkovnaPointId   String?  // ID vydejniho mista Zasilkovny
+  zasilkovnaPointName String?  // Nazev vydejniho mista
```

Migrace: `npx prisma migrate dev --name add_delivery_method_to_order`

### Krok 2: Opravit POST /api/orders — delivery method a ceny

**Soubor:** `app/api/orders/route.ts`

```diff
+// Dopravne dle metody
+const DELIVERY_PRICES: Record<string, number> = {
+  ZASILKOVNA: 79,
+  PPL: 129,
+  CESKA_POSTA: 99,
+  PICKUP: 0,
+};

 // V POST handleru:
-const shippingPrice = data.paymentMethod === "COD" ? 49 : 0;
+const deliveryPrice = DELIVERY_PRICES[data.deliveryMethod] ?? 0;
+const codFee = data.paymentMethod === "COD" ? 49 : 0;
+const shippingPrice = deliveryPrice + codFee;
 totalPrice += shippingPrice;

 // V prisma.order.create:
 const created = await tx.order.create({
   data: {
     // ...
     shippingPrice,
+    deliveryMethod: data.deliveryMethod,
+    zasilkovnaPointId: data.zasilkovnaPointId ?? null,
+    zasilkovnaPointName: data.zasilkovnaPointName ?? null,
   },
 });
```

### Krok 3: Aktualizovat Zod validator

**Soubor:** `lib/validators/order.ts` (nebo inline v route.ts)

```diff
 const orderSchema = z.object({
   // ...
+  deliveryMethod: z.enum(["ZASILKOVNA", "PPL", "CESKA_POSTA", "PICKUP"]),
+  zasilkovnaPointId: z.string().optional(),
+  zasilkovnaPointName: z.string().optional(),
 });
```

Pridat validaci: pokud `deliveryMethod === "ZASILKOVNA"`, `zasilkovnaPointId` je povinne:

```ts
.refine(
  (data) => data.deliveryMethod !== "ZASILKOVNA" || !!data.zasilkovnaPointId,
  { message: "Vyberte vydejni misto Zasilkovny", path: ["zasilkovnaPointId"] }
)
```

### Krok 4: Integrace Zasilkovna widgetu

**Zasilkovna widget:** Packeta dodava JavaScript widget pro vyber vydejnich mist. Nevyzaduje NPM balicek — pouze `<script>` tag.

**Soubor:** `components/web/ZasilkovnaWidget.tsx` (NOVY)

```tsx
"use client";

import { useEffect, useCallback } from "react";
import Script from "next/script";

// Packeta Widget API (v6)
declare global {
  interface Window {
    Packeta?: {
      Widget: {
        pick: (
          apiKey: string,
          callback: (point: PacketaPoint | null) => void,
          options?: Record<string, unknown>
        ) => void;
      };
    };
  }
}

interface PacketaPoint {
  id: number;
  name: string;
  zip: string;
  city: string;
  street: string;
  openingHours: string;
  photo?: string;
}

interface ZasilkovnaWidgetProps {
  onSelect: (point: { id: string; name: string; address: string }) => void;
  selectedPoint?: { id: string; name: string; address: string } | null;
}

export function ZasilkovnaWidget({ onSelect, selectedPoint }: ZasilkovnaWidgetProps) {
  const apiKey = process.env.NEXT_PUBLIC_ZASILKOVNA_API_KEY;

  const openPicker = useCallback(() => {
    if (!window.Packeta || !apiKey) return;

    window.Packeta.Widget.pick(
      apiKey,
      (point) => {
        if (point) {
          onSelect({
            id: String(point.id),
            name: point.name,
            address: `${point.street}, ${point.zip} ${point.city}`,
          });
        }
      },
      {
        country: "cz",
        language: "cs",
        appIdentity: "carmakler-eshop",
      }
    );
  }, [apiKey, onSelect]);

  return (
    <>
      <Script
        src="https://widget.packeta.com/v6/www/js/library.js"
        strategy="lazyOnload"
      />

      {selectedPoint ? (
        <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm text-gray-900">{selectedPoint.name}</p>
            <p className="text-sm text-gray-600">{selectedPoint.address}</p>
          </div>
          <button
            type="button"
            onClick={openPicker}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Zmenit
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
        >
          <span className="text-orange-600 font-semibold">Vybrat vydejni misto</span>
          <span className="block text-sm text-gray-500 mt-1">
            8 000+ mist po cele CR
          </span>
        </button>
      )}
    </>
  );
}
```

### Krok 5: Integrace widgetu do checkout stranek

**Soubor:** `app/(web)/shop/objednavka/page.tsx`

V kroku doruceni pridat ZasilkovnaWidget:

```tsx
import { ZasilkovnaWidget } from "@/components/web/ZasilkovnaWidget";

// Ve stavu:
const [zasilkovnaPoint, setZasilkovnaPoint] = useState<{
  id: string; name: string; address: string;
} | null>(null);

// V renderovani — pod delivery method selectem:
{deliveryMethod === "ZASILKOVNA" && (
  <div className="mt-3">
    <ZasilkovnaWidget
      onSelect={(point) => {
        setZasilkovnaPoint(point);
        // Predvyplnit adresu z vydejniho mista
        setDeliveryAddress(point.address);
      }}
      selectedPoint={zasilkovnaPoint}
    />
  </div>
)}
```

V submit handleru pridat zasilkovna data:

```diff
 const orderData = {
   items: cart.items,
   deliveryName,
   deliveryPhone,
   deliveryEmail,
   deliveryAddress,
   deliveryCity,
   deliveryZip,
+  deliveryMethod,
+  zasilkovnaPointId: zasilkovnaPoint?.id ?? undefined,
+  zasilkovnaPointName: zasilkovnaPoint?.name ?? undefined,
   paymentMethod,
   note,
 };
```

**Shodna zmena v:** `app/(web)/dily/objednavka/page.tsx`

### Krok 6: Pridat env promennou

**Soubor:** `.env.local`
```
NEXT_PUBLIC_ZASILKOVNA_API_KEY=...
```

**Soubor:** `.env.example`
```
NEXT_PUBLIC_ZASILKOVNA_API_KEY=  # Packeta Widget API key (z admin.zasilkovna.cz)
```

Zasilkovna API klip se ziska z [admin.zasilkovna.cz](https://admin.zasilkovna.cz) → Nastaveni → API.

### Krok 7: CSP update pro Zasilkovna widget

**Soubor:** `next.config.ts` — aktualizovat CSP (pokud P2-02 implementovano):

```diff
-"script-src 'self' 'unsafe-inline' https://plausible.io",
+"script-src 'self' 'unsafe-inline' https://plausible.io https://widget.packeta.com",
-"img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
+"img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://widget.packeta.com",
-"connect-src 'self' https://api.cloudinary.com https://plausible.io",
+"connect-src 'self' https://api.cloudinary.com https://plausible.io https://widget.packeta.com",
```

### Krok 8: Zobrazit delivery method ve sledovani objednavky

**Soubory k uprave:**
- `app/(web)/shop/moje-objednavky/page.tsx` — zobrazit dorucovaci metodu
- `app/api/orders/track/[token]/route.ts` — pridat deliveryMethod do response
- `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` — zobrazit

```tsx
<p className="text-sm text-gray-600">
  Doruceni: {order.deliveryMethod === "ZASILKOVNA" 
    ? `Zasilkovna — ${order.zasilkovnaPointName}` 
    : deliveryLabels[order.deliveryMethod]}
</p>
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `prisma/schema.prisma` | Pridat deliveryMethod, zasilkovnaPointId, zasilkovnaPointName do Order |
| `app/api/orders/route.ts` | Opravit shippingPrice kalkulaci, ulozit deliveryMethod |
| `lib/validators/order.ts` | Pridat deliveryMethod validaci s refine |
| `components/web/ZasilkovnaWidget.tsx` | NOVY — Packeta widget komponenta |
| `app/(web)/shop/objednavka/page.tsx` | Integrace widgetu, predani delivery dat |
| `app/(web)/dily/objednavka/page.tsx` | Shodne zmeny |
| `.env.local` | NEXT_PUBLIC_ZASILKOVNA_API_KEY |
| `.env.example` | Dokumentace Zasilkovna env var |
| `next.config.ts` | CSP update pro widget.packeta.com |
| `app/(web)/shop/moje-objednavky/page.tsx` | Zobrazit delivery method |
| `app/api/orders/track/[token]/route.ts` | Pridat deliveryMethod do response |

## Bezpecnostni opatreni

1. **API klip na frontendu:** `NEXT_PUBLIC_ZASILKOVNA_API_KEY` je verejny klip (widget ho vyzaduje). Omezit v Zasilkovna admin panelu na domenu `carmakler.cz`.
2. **Backend validace:** Vsechny ceny pocitat na backendu — nikdy neduverat frontend cene.
3. **zasilkovnaPointId validace:** Overit ze je string (ne SQL injection vector).

## Overeni

- [ ] Order model ma deliveryMethod, zasilkovnaPointId, zasilkovnaPointName
- [ ] Migrace projde
- [ ] POST /api/orders uklada deliveryMethod a pocita spravny shippingPrice
- [ ] ZASILKOVNA: 79 Kc, PPL: 129 Kc, CESKA_POSTA: 99 Kc, PICKUP: 0 Kc
- [ ] COD prirazka 49 Kc se PRICITA k dopravnemu (ne nahrazuje)
- [ ] Zasilkovna widget se otevre po vyberu ZASILKOVNA doruceni
- [ ] Vyber vydejniho mista ulozi ID a nazev
- [ ] Validace: ZASILKOVNA bez vybraneho mista → chyba
- [ ] Objednavkovy detail zobrazuje dorucovaci metodu + vydejni misto
- [ ] Guest tracking stranky zobrazuji dorucovaci info
- [ ] CSP povoluje widget.packeta.com
- [ ] Build prochazi
