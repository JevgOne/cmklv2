# Plán — Task #21: Vrakoviště PWA — UI pro tisk štítku + odeslání objednávky

**Autor:** planovac (agent team)
**Datum:** 2026-04-06
**Task ID:** #21
**Status:** Naplánováno — připraveno k implementaci

---

## 1. Cíl

Vrakoviště (PARTS_SUPPLIER role) musí v PWA vidět své objednávky čekající na fyzické odeslání, **stáhnout PDF přepravní štítek** vygenerovaný Stripe webhookem, a po zabalení + předání dopravci označit objednávku jako **odeslanou** jedním tlačítkem.

**Zkráceně:** webhook uloží štítek → supplier v PWA ho vidí → klikne "Stáhnout štítek" → přilepí na krabici → klikne "Označit jako odesláno" → `shippedAt = now`.

Plně využívá existující infrastrukturu task #15-#19 (DB fields + dispatcher + emaily). **Žádná nová Prisma migration.**

---

## 2. Discovery — co už existuje

### 2.1 Prisma schema — vše připraveno ✅
`prisma/schema.prisma:966-1021` (model `Order`) už má všechny potřebné sloupce:

```prisma
trackingNumber   String?
trackingCarrier  String?   // ZASILKOVNA / DPD / PPL / GLS / CESKA_POSTA
trackingUrl      String?   // link na veřejné trackování
shippingLabelUrl String?   // URL PDF štítku k tisku
shippedAt        DateTime?
deliveredAt      DateTime?
```

`OrderItem.supplierId` + `supplier` relace (`OrderItem @relation("SupplierOrderItems")`) existuje pro filtraci per vrakoviště.

**Závěr:** žádná migrace, žádné schema změny.

### 2.2 Shipping dispatcher — funguje ✅
`lib/shipping/dispatcher.ts:54-118` — `createShipmentForOrder(orderId)`:
- Volá carrier.createShipment() (reálné API nebo dry-run)
- **Ukládá `trackingNumber`, `trackingCarrier`, `trackingUrl`, `shippingLabelUrl` do `Order`**
- Idempotentní — pokud už má tracking, vrátí cached výsledek
- Vrací `null` pro `PICKUP` (žádná zásilka, osobní odběr)

### 2.3 Stripe webhook — volá dispatcher ✅
`app/api/stripe/webhook/route.ts:152-176` — `handleOrderPayment(orderId)`:
1. `paymentStatus = "PAID"`
2. `createShipmentForOrder(orderId)` → uloží label+tracking
3. `sendOrderNotificationEmails()` → odešle confirmation mail zákazníkovi + notifikace supplierovi (s PDF linkem)

**Důležité pozorování:** Webhook běží **pouze pro CARD** platby. Pro BANK_TRANSFER / COD **neběží žádný webhook** — tyto objednávky nemají automaticky vytvořený štítek. (Viz sekce 9.2 — edge case.)

### 2.4 Existující `/api/orders` endpointy

| Endpoint | Stav | Co dělá |
|----------|------|---------|
| `GET /api/orders?role=supplier` | ✅ existuje | Vrací objednávky kde `items.some(supplierId=current)`. **Chybí select shipping fields** (trackingNumber, trackingUrl, shippingLabelUrl, shippedAt, trackingCarrier). |
| `GET /api/orders/[id]` | ✅ existuje | Vrací detail. Přístup: buyer, supplier (přes items), admin, guest s tokenem. **Chybí select shipping fields.** |
| `PUT /api/orders/[id]/status` | ✅ existuje | Přijímá `{status, trackingNumber?}`. Už nastavuje `shippedAt=new Date()` když status="SHIPPED". Role check: supplier (přes items) nebo admin. **Reuse — nepotřebuje nový endpoint.** |

### 2.5 Existující PWA UI pro supplier
| Soubor | Co dělá |
|--------|---------|
| `app/(pwa-parts)/layout.tsx` | SupplierTopBar + SupplierBottomNav + OfflineBanner, mobile-first, zelený theme |
| `app/(pwa-parts)/parts/orders/page.tsx` | Seznam objednávek, tabs: Vše / Nové / Aktivní / Dokončené. Používá `OrderCard` komponentu. |
| `app/(pwa-parts)/parts/orders/[id]/page.tsx` | Detail objednávky. Zobrazí buyer, items, delivery, note. Dole `OrderActions` pro change status. |
| `components/pwa-parts/orders/OrderActions.tsx` | Status flow button: NEW→CONFIRMED→PACKING→SHIPPED. Má textový input pro tracking number manuálně (**nepotřebný — tracking je automatický z webhooku**). |
| `components/pwa-parts/dashboard/PendingOrders.tsx` | Widget na dashboardu (5 posledních pending). |
| `components/pwa-parts/SupplierBottomNav.tsx` | Bottom nav: Domů / Díly / Přidat / Objednávky / Profil |

**Pozorování #1:** `OrderActions.tsx` má 4-krokový UI (NEW→CONFIRMED→PACKING→SHIPPED) mapovaný na 3-krokový API enum. PACKING interně mapuje na CONFIRMED. Tento intermediate PACKING step **nemá přidanou hodnotu** a komplikuje UX — na MVP simplifikujeme na: **NEW → (label ready) → SHIPPED**.

**Pozorování #2:** Manuální tracking number input v PACKING state je **legacy** z před-#17 éry. Po #17 je tracking generován automaticky dispatcherem, supplier ho jen vidí. Input odstraníme.

### 2.6 Route protection ✅
`middleware.ts:206-225` — `protectedPartsPaths = ["/parts"]` s `PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"]`. **Per-page gate redundantní.** API endpointy dělají svůj vlastní role check (supplier přes items + admin allowlist).

---

## 3. Dotčené soubory

| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 1 | `app/api/orders/[id]/route.ts` | **Edit** | Rozšířit `select` o `trackingNumber, trackingCarrier, trackingUrl, shippingLabelUrl, shippedAt, zasilkovnaPointName, deliveryMethod` |
| 2 | `app/api/orders/route.ts` | **Edit** | Rozšířit `include`/`select` pro GET list — supplier potřebuje shipping fields v list view pro filtraci tab "K odeslání" |
| 3 | `components/pwa-parts/orders/ShippingLabelCard.tsx` | **Create** | Nová komponenta: badge dopravce + "Stáhnout PDF štítek" CTA + "Označit jako odesláno" CTA |
| 4 | `app/(pwa-parts)/parts/orders/[id]/page.tsx` | **Edit** | Přidat `ShippingLabelCard` sekci, rozšířit `OrderDetail` interface o shipping fields |
| 5 | `components/pwa-parts/orders/OrderActions.tsx` | **Edit** | Odstranit manuální tracking input + zjednodušit flow na 3 kroky (NEW→CONFIRMED→ShippingLabelCard→SHIPPED). Drop `PACKING` pseudo-state. |
| 6 | `app/(pwa-parts)/parts/orders/page.tsx` | **Edit** | Přidat nový tab `"to-ship"` — "K odeslání" — filtering `trackingNumber != null && shippedAt == null` |
| 7 | `components/pwa-parts/orders/OrderCard.tsx` | **Edit** | Přidat volitelný `shippingBadge` prop (zobrazí "Štítek připraven" nebo carrier jméno) pro list view |
| 8 | `components/pwa-parts/dashboard/PendingOrders.tsx` | **Edit (volitelné)** | Přidat counter "k odeslání" na dashboard, případně rozšířit filter na `status in (PENDING, CONFIRMED)` AND `shippingLabelUrl != null` |

**Žádná změna:**
- `app/api/orders/[id]/status/route.ts` — reuse existing PUT endpoint pro `status="SHIPPED"`
- `prisma/schema.prisma` — všechna pole už existují
- `middleware.ts` — `/parts` prefix chrání PARTS_SUPPLIER_ROLES, per-page gate není třeba
- `lib/shipping/**` — dispatcher je kompletní
- `app/api/stripe/webhook/route.ts` — webhook už labeluje správně

---

## 4. API změny

### 4.1 `GET /api/orders/[id]` — rozšířit select

**Současné chování:** select vrací `id, orderNumber, status, deliveryName, deliveryPhone, deliveryEmail, deliveryAddress, deliveryCity, deliveryZip, paymentMethod, totalPrice, shippingPrice, note, createdAt, items, buyer` — ale NEmá shipping fields.

**Změna:** defaultně Prisma `findFirst` bez `select` vrací VŠECHNY sloupce, takže `shippingLabelUrl`, `trackingNumber`, `trackingCarrier`, `trackingUrl`, `shippedAt`, `deliveredAt`, `deliveryMethod`, `zasilkovnaPointName` by měly jít ven. Potřeba ověřit aktuální implementaci:

```typescript
// app/api/orders/[id]/route.ts line 19-40
const order = await prisma.order.findFirst({
  where: { OR: [{ id }, { orderNumber: id }] },
  include: {
    items: { include: { part: {...}, supplier: {...} } },
    buyer: {...},
  },
});
```

`include` u `findFirst` **netlumí** základní sloupce Order — vrací vše. **Takže API už vrací shipping fields, jen frontend je nepoužívá.**

**Akce:** Žádná změna v API — jen frontend musí rozšířit TS interface `OrderDetail` o tyto fieldy + vykreslit je.

**Ověření:** Implementator před úpravou frontendu curlne endpoint a ověří v odpovědi, že jsou. Pokud omylem (třeba kvůli `select`) nejsou, přidej je.

### 4.2 `GET /api/orders?role=supplier` — rozšířit include

**Současné chování:** vrací objednávky + items + part (slug, name, images). **Chybí shipping fields** na Order úrovni.

Stejně jako 4.1 — defaultně Prisma vrací všechny sloupce Order. **Akce:** Ověřit v implementaci. Pokud potřeba, explicitně přidat do response.

### 4.3 `PUT /api/orders/[id]/status` — reuse, drobná úprava

**Současné chování:**
```typescript
if (data.status === "SHIPPED") {
  updateData.shippedAt = new Date();
  if (data.trackingNumber) {
    updateData.trackingNumber = data.trackingNumber;
  }
}
```

**Změna:** Žádná. Tracking number už byl nastaven webhookem v `trackingNumber`, tak frontend jednoduše volá PUT bez tracking number:

```typescript
fetch(`/api/orders/${id}/status`, {
  method: "PUT",
  body: JSON.stringify({ status: "SHIPPED" }),
});
```

Reuse je clean, role check už existuje (line 36-41).

### 4.4 Email po "mark shipped" — **NE pro MVP** (team-lead rozhodnutí 2026-04-06)

**Rozhodnuto:** Druhý email po `status="SHIPPED"` se pro MVP **neodesílá**. Customer už dostane email z webhooku po platbě (task #19 — `orderConfirmationCustomer` s tracking linkem). Druhý mail by byl duplicitní noise.

**Dopad na implementaci:** `PUT /api/orders/[id]/status` při transition `→ SHIPPED` **NESMÍ** volat `sendEmail()` ani žádný email side effect. Aktuální chování endpoint (line 43-50) je čistý DB update bez emailů — **nic neměnit**, jen explicitně zachovat.

**Follow-up #21d** (viz sekce 16): post-MVP multi-stage tracking emails pokud bude potřeba (např. "zásilka v skladu dopravce", "zásilka na trase", "zásilka doručena").

---

## 5. UI — Detail stránka `/parts/orders/[id]`

### 5.1 Rozšířit `OrderDetail` interface

```typescript
interface OrderDetail {
  // existing fields...
  deliveryMethod: string;
  zasilkovnaPointName: string | null;
  // New shipping fields:
  trackingNumber: string | null;
  trackingCarrier: string | null;   // e.g. "ZASILKOVNA"
  trackingUrl: string | null;
  shippingLabelUrl: string | null;
  shippedAt: string | null;         // ISO datetime
  deliveredAt: string | null;
}
```

### 5.2 Nová komponenta `ShippingLabelCard`

**Umístění:** `components/pwa-parts/orders/ShippingLabelCard.tsx`

**Props:**
```typescript
interface ShippingLabelCardProps {
  orderId: string;
  orderNumber: string;
  deliveryMethod: string;          // "ZASILKOVNA" | "DPD" | "PPL" | ...
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingLabelUrl: string | null;
  shippedAt: string | null;
  zasilkovnaPointName: string | null;
  deliveryAddress: {
    street: string;
    city: string;
    zip: string;
    name: string;
  };
  onShipped: () => void;           // callback to update parent state
}
```

**Rendering logic (priority order):**

1. **`deliveryMethod === "PICKUP"`** → zobraz info box:
   > 📦 Osobní odběr
   > Zákazník si díl vyzvedne osobně. Žádný štítek.

2. **`shippedAt != null`** → zobraz confirmation box:
   > ✅ Odesláno {formatDate(shippedAt)}
   > Tracking: [trackingNumber] [link "Sledovat zásilku" → trackingUrl]

3. **`shippingLabelUrl == null`** (BANK_TRANSFER/COD před payment, nebo chyba dispatcheru) → zobraz warning:
   > ⏳ Štítek zatím není připraven
   > *Čekáme na platbu. Po zaplacení se automaticky vygeneruje přepravní štítek.*
   > (disabled "Stáhnout štítek" button)

4. **`shippingLabelUrl != null && shippedAt == null`** (happy path — štítek připraven, čeká se na odeslání):
   ```
   ┌──────────────────────────────────────────┐
   │ 🏷️ K odeslání                              │
   │                                           │
   │ Dopravce: [DPD Badge]                     │
   │ Tracking: DRY-A1B2C3 (nebo skutečné číslo)│
   │                                           │
   │ 📍 Adresa doručení:                        │
   │    Jan Novák                              │
   │    Dlouhá 123, 110 00 Praha 1             │
   │   (nebo pro ZASILKOVNA: "Výdejní místo: Praha 5 - Anděl")│
   │                                           │
   │ [🖨️ Stáhnout PDF štítek]  ← primární CTA  │
   │ (otevře shippingLabelUrl v novém okně)    │
   │                                           │
   │ [✅ Označit jako odesláno]  ← secondary CTA│
   │ (po kliknutí PUT status + refetch)        │
   └──────────────────────────────────────────┘
   ```

5. **`shippingLabelUrl != null && trackingNumber.startsWith("DRY-")`** → přidej k bodu 4 banner:
   > ⚠️ DRY-RUN režim
   > API klíče dopravce nejsou nastaveny. Štítek je **placeholder**, ne skutečný. Pro produkční provoz nastav env proměnné dopravce v `.env`.
   > (CTA funguje normálně — staženo PDF bude placeholder obrázek, mark shipped funguje)

**Styling conventions:**
- Reuse `@/components/ui/Card`, `@/components/ui/Badge`, `@/components/ui/Button`
- Primary CTA: `variant="primary"`, `size="lg"`, `className="w-full"` (touch-friendly 48px min)
- Secondary CTA: `variant="success"` pro "Mark shipped" (green = done)
- Carrier badge: reuse stávající `Badge` komponent + mapping `{ZASILKOVNA: "Zásilkovna", DPD: "DPD", ...}` (helper funkce `localizedCarrier()`)
- Icons: inline SVG (jako stávající `SupplierBottomNav`) — ne externí knihovny
- `shippingLabelUrl`: render jako `<a href={url} target="_blank" rel="noopener">` — prohlížeč otevře PDF standard way (v Chrome browser built-in viewer)

### 5.3 Integrace do detail page

Umístit `ShippingLabelCard` **mezi sekci "Doručení a platba" a "Akce"** v `app/(pwa-parts)/parts/orders/[id]/page.tsx:188-229`:

```tsx
{/* Delivery & payment */}
<Card className="p-4">...</Card>

{/* Note */}
{order.note && <Card>...</Card>}

{/* NEW: Shipping label + mark shipped */}
<ShippingLabelCard
  orderId={order.id}
  orderNumber={order.orderNumber}
  deliveryMethod={order.deliveryMethod}
  trackingCarrier={order.trackingCarrier}
  trackingNumber={order.trackingNumber}
  trackingUrl={order.trackingUrl}
  shippingLabelUrl={order.shippingLabelUrl}
  shippedAt={order.shippedAt}
  zasilkovnaPointName={order.zasilkovnaPointName}
  deliveryAddress={{
    street: order.deliveryAddress,
    city: order.deliveryCity,
    zip: order.deliveryZip,
    name: order.deliveryName,
  }}
  onShipped={() => {
    setStatus("SHIPPED");
    // optionally: refetch order to update shippedAt
  }}
/>

{/* Actions — zjednodušené, nižší priorita */}
<OrderActions ... />
```

### 5.4 Zjednodušit `OrderActions`

**Současný flow:** NEW → CONFIRMED → PACKING → SHIPPED (4 kroky, pseudo-PACKING mapuje na CONFIRMED)

**Nový flow:** NEW → CONFIRMED → (action přesunuta do ShippingLabelCard) → SHIPPED

**Změny v `components/pwa-parts/orders/OrderActions.tsx`:**
- Odstranit `PACKING` ze state machine
- Odstranit `trackingNumber` input (řeší dispatcher)
- Odstranit `PACKING`/`SHIPPED` z `nextAction` dict
- Výsledný dict:
  ```typescript
  const nextAction = {
    NEW: { label: "Potvrdit objednávku", next: "CONFIRMED", variant: "success" },
  };
  ```
- Po `CONFIRMED` stavu komponenta renderuje jen info text: "Stáhni štítek výše a odešli."
- Po `SHIPPED` / `DELIVERED` / `CANCELLED` beze změny (stávající info texty)

**Drop PACKING mapping v `page.tsx`:**
- `mapStatus()`: nemění se (API nikdy neposílá PACKING)
- `mapToApiStatus()`: odstranit case `PACKING → CONFIRMED`, `OrderStatus` union odstranit `PACKING`

---

## 6. UI — List stránka `/parts/orders`

### 6.1 Nový tab "K odeslání"

**Umístění:** `app/(pwa-parts)/parts/orders/page.tsx:7-12` rozšířit pole `tabs`:

```typescript
const tabs = [
  { value: "all", label: "Vše" },
  { value: "PENDING", label: "Nové" },
  { value: "to-ship", label: "K odeslání" },  // NEW
  { value: "active", label: "Aktivní" },      // Odesláno, čeká se na doručení
  { value: "done", label: "Dokončené" },
];
```

### 6.2 Rozšířit `OrderResult` interface

```typescript
interface OrderResult {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  deliveryName: string;
  deliveryMethod: string;       // NEW
  trackingNumber: string | null; // NEW
  trackingCarrier: string | null; // NEW
  shippingLabelUrl: string | null; // NEW
  shippedAt: string | null;      // NEW
  items: { ... };
}
```

### 6.3 Filter logic

```typescript
const filtered = (() => {
  switch (activeTab) {
    case "PENDING":
      return orders.filter((o) => o.status === "PENDING");
    case "to-ship":
      // Label připravený, ještě neodesláno
      return orders.filter(
        (o) =>
          o.shippingLabelUrl !== null &&
          o.shippedAt === null &&
          o.status !== "CANCELLED"
      );
    case "active":
      // Odesláno, čeká na doručení
      return orders.filter(
        (o) => o.status === "SHIPPED" || o.shippedAt !== null
      );
    case "done":
      return orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));
    default:
      return orders;
  }
})();
```

### 6.4 Rozšířit `OrderCard` — shipping badge

`components/pwa-parts/orders/OrderCard.tsx` — přidat volitelný prop `shippingBadge`:

```typescript
interface OrderCardProps {
  // existing...
  shippingBadge?: "label-ready" | "shipped" | null;
  trackingCarrier?: string | null;
}
```

Render: pokud `shippingBadge === "label-ready"` → zobraz `<Badge variant="new">🏷️ Štítek připraven</Badge>` vpravo nahoru. Pokud `"shipped"` → `<Badge variant="verified">📦 Odesláno</Badge>`.

V list page předat per order:
```tsx
shippingBadge={
  order.shippedAt
    ? "shipped"
    : order.shippingLabelUrl
    ? "label-ready"
    : null
}
```

---

## 7. Flow: "Označit jako odesláno"

```
1. Supplier klikne [✅ Označit jako odesláno] v ShippingLabelCard
2. Frontend: fetch('/api/orders/{id}/status', { method: 'PUT', body: { status: 'SHIPPED' } })
3. Backend (route.ts:36-50):
   - getServerSession → ověří přihlášení
   - findUnique order s items.supplierId
   - ověří: session.user.id je v items.supplierId (nebo ADMIN)
   - update: { status: "SHIPPED", shippedAt: new Date() }
4. (volitelné, viz sekce 10) odeslat email "Vaše zásilka je na cestě"
5. Response: { order } s updated fields
6. Frontend: setStatus("SHIPPED") + refetch nebo optimistic update
7. ShippingLabelCard re-renders do "✅ Odesláno {date}" varianty
8. List view: při dalším navrácení se order přesune z tab "K odeslání" → "Aktivní"
```

**Confirmation prompt (optional UX hardening):**
Před PUT volat `confirm("Opravdu označit jako odesláno? Zákazník dostane notifikaci.")`. Zabrání nešťastným click-throughs. Pro MVP: **ANO**, přidat confirm.

---

## 8. Dry-run handling

### 8.1 Detekce dry-run
`trackingNumber.startsWith("DRY-")` (dispatcher vrací `DRY-A1B2C3` formát)

### 8.2 UI vizualizace
`ShippingLabelCard` přidá banner když dry-run:
```jsx
{isDryRun && (
  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
    <strong className="text-amber-800">⚠️ DRY-RUN režim</strong>
    <p className="text-amber-700 mt-1">
      Štítek je placeholder (není skutečná zásilka). Nastav API klíče dopravce v .env pro produkci.
    </p>
  </div>
)}
```

### 8.3 Mark shipped v dry-run
Funguje normálně — dry-run režim ovlivňuje jen vytvoření zásilky, ne status flow. Supplier může i v dry-run kliknout "Označit jako odesláno" pro test flow.

---

## 9. Edge cases

### 9.1 PICKUP delivery method
`createShipmentForOrder()` vrací `null` pro PICKUP → `shippingLabelUrl` zůstává null, `trackingNumber` null. **ShippingLabelCard zobrazuje variantu "Osobní odběr"** (viz sekce 5.2 bod 1). Žádná akce nepotřeba.

Stav flow: Order zůstává v `PENDING` / `CONFIRMED` dokud supplier nevytvoří manuální akci? Nebo může označit jako "DELIVERED" ručně? **Pro MVP:** zobraz button `✅ Označit jako vyzvednuto` → PUT status=DELIVERED + deliveredAt=now. Existující endpoint to podporuje.

### 9.2 BANK_TRANSFER / COD bez platby
Webhook neběží → dispatcher nebyl zavolán → `shippingLabelUrl` je null. Varianta z bodu 3 (sekce 5.2):
> ⏳ Štítek zatím není připraven
> Čekáme na platbu.

**Jak se dostane label?** Admin musí manuálně potvrdit platbu (BANK_TRANSFER) nebo se vygeneruje label za jiných okolností. **To je out of scope #21** (patří do následného tasku "manual payment confirmation flow"). Pro teď: UI jen informativně řekne supplierovi "čekej".

**Follow-up task #21a:** Admin UI pro manuální spuštění `createShipmentForOrder(orderId)` po BANK_TRANSFER confirmation, nebo button "Vygenerovat štítek" přímo v supplier PWA pro ne-CARD objednávky.

### 9.3 Multi-supplier order
Jedna objednávka může obsahovat items od více supplierů. Současný dispatcher **vytváří JEDEN label** za celou objednávku (jedna adresa zákazníka, jedna zásilka) — ne multi-shipment. Takže v PWA detail každý supplier vidí stejný label URL.

**Problém:** Kdo má fyzicky zásilku zabalit, když items jsou u 2 vrakovištích? **Out of scope #21** — ošetřeno v multi-supplier task #21b (post-MVP):
- Option 1: Hlavní supplier (první item) zabalí, menší vrakoviště pošle díly k němu (B2B inter-warehouse transfer)
- Option 2: Každý supplier tvoří vlastní sub-shipment

**Pro MVP #21:** pokud má objednávka více supplierů, všichni vidí stejný label card. Akce "Mark shipped" by mohla být rivalrous — první klik vítězí, další dostane idempotentní response. Zobrazit warning:
> ⚠️ Tato objednávka obsahuje díly od více vrakovišť. Koordinujte odeslání s ostatními.

Backend check (frontend): spočítat unique `items.supplierId` count, pokud >1 → warning.

### 9.4 Already shipped (race condition)
Supplier A klikne "Mark shipped" v 10:00:00. Supplier B (stejná objednávka, multi-supplier) klikne v 10:00:05. Druhý dostane updated order (už má `shippedAt`). Backend: nemá explicit guard, jen update. **Řešení:** frontend na 2. klik se zobrazí "Už bylo odesláno" místo chyby. Optimistic: refetch ihned po kliku.

### 9.5 Expired label (dopravce vyžaduje re-generate)
Některé dopravce štítky expirují po 14 dnech. **Out of scope #21** — pokud zákazník čeká 14+ dní na fyzické odeslání, je jiný problém. Follow-up task #21c (label re-generation).

---

## 10. Email "Zásilka je na cestě" — **ROZHODNUTO: NE pro MVP**

**Kontext:** webhook už odesílá customer email hned po platbě (z `sendOrderNotificationEmails()` v task #19 — commit c110f3a). Task #21 spec původně říkal "po kliknutí se pošle zákazníkovi email 'Vaše objednávka byla odeslána, tracking: X'", což by byl druhý email po fyzickém handoff.

**Rozhodnutí team-lead (2026-04-06):** Druhý email se **neposílá**. Důvod: duplikace s webhookem po platbě. Zákazník už má tracking link po platbě, druhý email by byl noise.

**Dopad na implementaci:**
- `PUT /api/orders/[id]/status` → žádný email side effect při SHIPPED transition
- Žádná nová email šablona v této iteraci
- `ShippingLabelCard` `onShipped()` callback jen refreshuje UI state, nic víc
- **Follow-up #21d** pro post-MVP multi-stage tracking emails (pokud bude někdy potřeba)

---

## 11. Co NEDĚLAT (out of scope)

- **Ne** vytvářet novou Prisma migration — všechna pole existují
- **Ne** měnit shipping dispatcher ani Stripe webhook
- **Ne** přepisovat `createShipmentForOrder()` pro BANK_TRANSFER/COD — to je follow-up #21a
- **Ne** implementovat multi-supplier split shipping — follow-up #21b
- **Ne** přidávat tracking status sync (webhook od dopravce) — out of scope, Carmakler jen vytváří zásilky, ne spravuje jejich lifecycle
- **Ne** řešit label expiration / re-generation — follow-up #21c
- **Ne** přidávat admin UI pro manuální label print — admin používá Prisma Studio nebo přímý DB query
- **Ne** přidávat print preview / print dialog invocation — prohlížeč otevře PDF standard way (supplier klikne print v PDF vieweru)
- **Ne** řešit bulk "mark all as shipped" — per-order flow stačí pro MVP
- **Ne** přidávat notification badge na bottom nav "nové k odeslání" — nice-to-have, post-MVP
- **Ne** přidávat i18n / multi-jazyk — jen čeština

---

## 12. Akceptační kritéria

### Funkční
- [ ] Supplier vidí v `/parts/orders/[id]` sekci "K odeslání" s dopravcem, tracking číslem, adresou
- [ ] Tlačítko "Stáhnout PDF štítek" otevře `shippingLabelUrl` v novém okně (`target="_blank"`)
- [ ] Tlačítko "Označit jako odesláno" po confirm prompt volá `PUT /api/orders/[id]/status` s `{status: "SHIPPED"}`
- [ ] Po úspěšném PUT se UI přepne do varianty "✅ Odesláno {datetime}"
- [ ] Pro PICKUP delivery method se zobrazí info box "Osobní odběr" (bez štítku)
- [ ] Pro objednávku bez `shippingLabelUrl` (BANK_TRANSFER/COD před platbou) se zobrazí "Čekáme na platbu"
- [ ] Pro dry-run objednávku (tracking začíná `DRY-`) se zobrazí amber banner "DRY-RUN režim"
- [ ] Pro ZASILKOVNA se zobrazí `zasilkovnaPointName` místo adresy zákazníka
- [ ] Multi-supplier objednávka zobrazí warning "více vrakovišť"

### List page
- [ ] Nový tab "K odeslání" na `/parts/orders` filtruje `shippingLabelUrl != null && shippedAt == null && status != CANCELLED`
- [ ] Tab "Aktivní" obsahuje objednávky s `shippedAt != null || status == SHIPPED`
- [ ] `OrderCard` zobrazuje badge "🏷️ Štítek připraven" nebo "📦 Odesláno" podle shipping state

### Role check
- [ ] Non-supplier user dostane redirect na `/` (middleware.ts)
- [ ] Supplier A nemůže zobrazit objednávku supplieru B — API `GET /api/orders/[id]` vrací 403 (už existuje)
- [ ] Supplier A nemůže mark shipped objednávku supplieru B — API `PUT /api/orders/[id]/status` vrací 403 (už existuje)

### Regression
- [ ] Existující flow "Potvrdit objednávku" (NEW → CONFIRMED) stále funguje
- [ ] `PUT /api/orders/[id]/status` nezmění semantiku ostatních statuses (DELIVERED, CANCELLED)
- [ ] Stripe webhook flow není dotčen
- [ ] `npm run build` projde bez TypeScript errorů
- [ ] `npm run lint` projde

### Mobile UX
- [ ] CTA tlačítka mají min-height 48px (touch-friendly)
- [ ] Text je čitelný bez zoom na 375px wide screen (iPhone SE)
- [ ] Badge a icons se nepřekrývají s horním SupplierTopBar / spodním SupplierBottomNav

---

## 13. Rozhodnutí team-leada 2026-04-06

Všech 5 otázek z původního plánu bylo rozhodnuto team-leadem. **Plán je final, připravený k implementaci.**

| # | Otázka | Rozhodnutí | Odůvodnění |
|---|--------|------------|------------|
| 1 | Email "Vaše zásilka je na cestě" po mark shipped? | ❌ **NE pro MVP** | Customer už dostane email z webhooku po platbě (#19). Druhý email = duplicitní noise. Follow-up #21d pro post-MVP multi-stage tracking. |
| 2 | Drop PACKING pseudo-state? | ✅ **ANO, drop** | API enum stejně PACKING nemá. UI artefakt z legacy. Zjednodušit na NEW→CONFIRMED→(ShippingLabelCard akce)→SHIPPED. |
| 3 | Confirm prompt před "Mark shipped"? | ✅ **ANO, `window.confirm`** | Jednodušší než undo toast, méně kódu, stačí pro destructive action. Undo toast je over-engineering. |
| 4 | "Označit jako vyzvednuto" button pro PICKUP (→ DELIVERED)? | ✅ **ANO, přidej** | Bez toho by pickup objednávky visely navždy. Dodavatel potřebuje way jak close cycle. |
| 5 | BANK_TRANSFER/COD cesta (bez webhooku, bez labelu)? | ⏭️ **Follow-up #21a** | Out of scope #21. MVP scope = Stripe-driven shipping flow (většina obchodu). Edge case řešíme post-MVP. |

**Další pokyn team-leada:** `PUT /api/orders/[id]/status` při transition `→ SHIPPED` **NESMÍ** volat žádný email side effect. Aktuální chování endpointu (čistý DB update) je **správně** — implementator nesmí přidávat `sendEmail()` do status route. Explicit guardrail proti duplicate mailům.

---

## 14. Risks

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| `GET /api/orders/[id]` nevrací shipping fields přes `include` → frontend null | Nízké | Medium | Implementator curlne endpoint před frontend úpravou, explicitně přidá select pokud chybí |
| Race condition na multi-supplier mark shipped | Nízké | Low | PUT endpoint je idempotentní (status=SHIPPED → shippedAt=now vždycky). 2. klik je no-op. Frontend refetch ukáže aktualizovaný stav. |
| PDF label URL z Cloudinary expire | Nízké | Medium | Dry-run placeholder je trvalý; reálné dopravce mají 14-30 dní platnost. Follow-up #21c |
| Drop PACKING state rozbije existující UI test | Nízké | Low | Grep pro `PACKING` string před refactorem, update/remove testy |
| Mark shipped bez fyzického odeslání (false positive) | Střední | Low | Confirm prompt pomáhá. Plus: po-mark undo timer je nice-to-have (post-MVP) |
| Email po mark shipped se pošle 2× (race condition dvou tabů) | Nízké | Low | Frontend disable button ihned po kliku, backend PUT je idempotentní ale email se může poslat 2× — acceptable pro MVP |
| `shippingLabelUrl` je placeholder (dry-run) a supplier ho omylem vytiskne a přilepí | Nízké | High | DRY-RUN banner je velký + amber color. Placeholder obrázek říká "DRY-RUN LABEL" text. Supplier by si měl všimnout. |

---

## 15. Priority v implementaci

1. **API ověření** — curl `/api/orders/[id]` a potvrdit že shipping fields jsou v response. Pokud ne, přidat.
2. **TS interface rozšíření** — `OrderDetail` + `OrderResult` types ve stranách.
3. **`ShippingLabelCard` komponenta** — nový soubor, všech 5 variant z sekce 5.2.
4. **Detail page integrace** — include card, remove PACKING z mapStatus/nextAction.
5. **`OrderActions` zjednodušení** — drop tracking input, drop PACKING case.
6. **List page tab "K odeslání"** — filter logic + OrderCard badge.
7. **Confirm dialog + onShipped callback** — funkční flow E2E.
8. **Dry-run banner + edge cases** — PICKUP, BANK_TRANSFER, multi-supplier warning.
9. **Build + lint + manual test** — testovací order (`npm run dev`, přes Stripe CLI trigger webhook nebo přímé DB insert s `shippingLabelUrl`).
10. ~~Email template pro shipped notification~~ — **rozhodnuto NE pro MVP** (team-lead 2026-04-06), odloženo do follow-up #21d.

---

## 16. Follow-up tasks

- **#21a** — BANK_TRANSFER/COD manual label generation (admin UI nebo supplier "Vygenerovat štítek" button)
- **#21b** — Multi-supplier split shipping (každý supplier tvoří vlastní sub-shipment)
- **#21c** — Label expiration / re-generation (dopravce vyžaduje refresh po 14 dnech)
- **#21d** — Email template `order-shipped-notification` — post-MVP multi-stage tracking emails (rozhodnuto ne pro MVP dne 2026-04-06, webhook už posílá customer mail po platbě)
- **#21e** — Undo toast po mark shipped (5s window pro revert)
- **#21f** — Bulk "Mark all shipped" — víc objednávek najednou pro velká vrakoviště
- **#21g** — Webhook od dopravce → sync `deliveredAt` automaticky (carrier-side tracking)

---

## 17. Poznámky pro implementátora

1. **ShippingLabelCard = "use client"** — má state transitions (fetch, setStatus). `onShipped` callback je trigger k parentu.
2. **PDF stažení = `<a href target="_blank">`** — NE `window.open()` / `fetch()` / `download` atribut. Prohlížeč otevře PDF v nativním vieweru, user tam má print button.
3. **Confirm prompt** — použij `window.confirm("Opravdu označit jako odesláno?")`. Nic fancy. **Pozn.:** bez věty "Zákazník dostane notifikaci" — druhý email se neposílá (team-lead rozhodl 2026-04-06).
4. **`localizedCarrier()` helper** — malá utility funkce v ShippingLabelCard nebo shared `lib/shipping/labels.ts`:
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
5. **Tailwind classes** — reuse stávajících patternů z `app/(pwa-parts)/**` (green-500 primary, rounded-2xl Cards, text-gray-900 headers).
6. **Testing** — manual E2E:
   1. `npm run dev`
   2. Vytvoř order přes `/shop/kosik` s CARD platbou + test Stripe webhook trigger (dry-run shipping)
   3. Login jako supplier (seed PARTS_SUPPLIER)
   4. `/parts/orders` → nový tab "K odeslání" → klik na order → ShippingLabelCard zobrazen s dry-run banner
   5. Klik "Stáhnout štítek" → placeholder PDF se otevře
   6. Klik "Označit jako odesláno" → confirm → API call → UI se přepne do "✅ Odesláno"
   7. Navigate back → list view → order v tab "Aktivní"

---

**Status:** Plán je **FINAL** (team-lead rozhodnutí 2026-04-06, viz sekce 13). Připraven k dispatchi implementátorovi.
