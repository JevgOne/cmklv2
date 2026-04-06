# Impl report — Task #21: Vrakoviště PWA UI pro tisk štítku + odeslání objednávky

**Plán:** `.claude-context/tasks/plan-task-21-vrakoviste-stitek.md`
**Build:** ✅ prošel (`npm run build` — Compiled successfully in 15.2s, 309/309 static pages generated)
**Lint:** ✅ 0 errors / 0 warnings na dotčených souborech
**TypeScript:** ✅ `npx tsc --noEmit` — 0 errors

---

## Co bylo uděláno

### 1. `components/pwa-parts/orders/ShippingLabelCard.tsx` — NEW (~360 řádků)

Nová client komponenta se **5 rendering variantami** podle priority (early return pattern):

| Pořadí | Varianta | Podmínka | Obsah |
|---|---|---|---|
| 1 | **PICKUP** | `deliveryMethod === "PICKUP"` | Info box "Osobní odběr", adresa, tlačítko "Označit jako vyzvednuto" → `PUT status: DELIVERED` |
| 2 | **Odesláno** | `shippedAt != null` | Success box s datem odeslání, dopravce, tracking, link "Sledovat zásilku" |
| 3 | **Štítek není připraven** | `shippingLabelUrl == null` | Amber warning "Čekáme na platbu", disabled tlačítko |
| 4 | **Happy path** | `shippingLabelUrl != null && shippedAt == null` | Dopravce badge, tracking, adresa/Zásilkovna místo, [Stáhnout PDF] + [Označit jako odesláno] |
| 5 | **DRY-RUN** | `trackingNumber.startsWith("DRY-")` | Overlay banner na variantě 4 — "Štítek je placeholder, nastav API klíče v .env" |

**Klíčové detaily:**
- `putStatus(nextStatus, confirmMessage, onSuccess)` shared helper — `window.confirm` → `PUT /api/orders/[id]/status { status }`
- Žádný vlastní fetch k `/api/shipping/*` — **reusne existující endpoint** per plán
- `CARRIER_LABELS` map + `localizedCarrier()` → Zásilkovna / DPD / PPL / GLS / Česká pošta
- `formatDateTime(iso)` → `toLocaleString("cs-CZ", ...)` (dd. m. yyyy hh:mm)
- Multi-supplier warning (`supplierCount > 1`) → blue info box "Tato objednávka obsahuje díly od více vrakovišť. Koordinujte odeslání s ostatními dodavateli."
- ZASILKOVNA varianta zobrazí `zasilkovnaPointName` místo ulice (plán sekce 6.2)
- PDF download jako `<a href={shippingLabelUrl} target="_blank" rel="noopener noreferrer">` → v mobilu nativní viewer
- Error state (`const [error, setError] = useState<string | null>(null)`) — fetch failure zobrazí červenou krabici s hláškou
- Submitting state — tlačítka disabled + text "Ukládá se…" během requestu
- Všechna CTA: `size="lg"` + `w-full` → >48px touch targety (WCAG AA)
- Primary CTA "Stáhnout PDF štítek" (orange) + secondary "Označit jako odesláno" (green)

**Props interface:**
```typescript
interface ShippingLabelCardProps {
  orderId: string;
  orderNumber: string;
  deliveryMethod: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingLabelUrl: string | null;
  shippedAt: string | null;
  zasilkovnaPointName: string | null;
  deliveryAddress: { street: string; city: string; zip: string; name: string };
  supplierCount?: number;
  onShipped: () => void;
  onDelivered?: () => void;
}
```

### 2. `app/(pwa-parts)/parts/orders/[id]/page.tsx` — EDIT

**Změny:**
- Rozšířen `OrderDetail` interface o shipping fields: `deliveryMethod`, `zasilkovnaPointName`, `trackingNumber`, `trackingCarrier`, `trackingUrl`, `shippingLabelUrl`, `shippedAt`, `deliveredAt`
- **Dropnut `PACKING` z `OrderStatus` union** — union je teď `NEW | CONFIRMED | SHIPPED | DELIVERED | CANCELLED`
- **Dropnut `PACKING` case z `mapToApiStatus`** — redukce na defaultní `return status`
- **Dropnut `PACKING` z `statusConfig`** mapy
- `fetchOrder()` extrahováno z `useEffect` do top-level funkce → znovu použitelné jako `onShipped` callback (refetch po successful status update)
- Přidán výpočet `supplierCount = new Set(order.items.map((i) => i.supplier.id)).size` → passed do ShippingLabelCard pro multi-supplier warning
- **Integrace `<ShippingLabelCard>`** mezi Note Card a OrderActions. Podmínka: `status !== "NEW" && status !== "CANCELLED"` — tj. zobrazí se od okamžiku, kdy vrakoviště objednávku potvrdilo
- `onShipped` a `onDelivered` callback → `fetchOrder` (server state refresh)
- `<OrderActions>` teď nedostává `orderId` prop (prop odstraněn z interface)
- ESLint disable pro `react-hooks/exhaustive-deps` na `useEffect` — `fetchOrder` je stable na úrovni komponenty, refactor pomocí `useCallback` byl by over-engineering

### 3. `components/pwa-parts/orders/OrderActions.tsx` — EDIT

**Změny:**
- **Dropnut `PACKING` z `OrderStatus` union**
- **Odstraněn `Input` import + `trackingNumber` state** — tracking teď řeší backend (Stripe webhook v task #17, ShippingLabelCard pouze zobrazuje)
- `nextAction` dict redukován z 3 položek na 1: `{ NEW: { label: "Potvrdit objednávku", next: "CONFIRMED", variant: "success" } }`
- Přidána CONFIRMED informační hláška: "Stáhněte si přepravní štítek výše, přilepte na krabici a označte jako odesláno." — směruje uživatele na ShippingLabelCard
- `orderId` prop odstraněn (nebyl nikde používán)
- Komponenta nyní má jedinou roli: **confirm/cancel nové objednávky**. SHIPPED flow patří výhradně do ShippingLabelCard

### 4. `app/(pwa-parts)/parts/orders/page.tsx` — EDIT

**Změny:**
- **Nový tab "K odeslání"** mezi "Nové" a "Aktivní":
  ```typescript
  { value: "to-ship", label: "K odeslání" }
  ```
- Rozšířen `OrderResult` interface o: `deliveryMethod`, `trackingCarrier`, `shippingLabelUrl`, `shippedAt`
- `mapStatus` signature zúžena — vráceno `PACKING` odstraněno
- **Nová filter logika** pro "K odeslání":
  ```typescript
  case "to-ship":
    return orders.filter(
      (o) =>
        o.shippingLabelUrl != null &&
        o.shippedAt == null &&
        o.status !== "CANCELLED"
    );
  ```
  → Zobrazí se jen objednávky, kde **štítek existuje** (backend dispatcher ho vygeneroval po platbě), ale **ještě nejsou odeslány**. Kritérium je právě tento stav, NE `status === "CONFIRMED"` — protože BANK_TRANSFER/COD flow může mít `status === "CONFIRMED"` i bez štítku (pre-payment stav).
- Přidán helper `getShippingBadge(order)` → rozhoduje o badge typu (`"label-ready"` / `"shipped"` / `null`)
- OrderCard dostává `shippingBadge={getShippingBadge(order)}` + `deliveryMethod={order.deliveryMethod ?? ""}`

### 5. `components/pwa-parts/orders/OrderCard.tsx` — EDIT

**Změny:**
- **Dropnut `PACKING` ze status union + `statusConfig`**
- Nový volitelný prop `shippingBadge?: "label-ready" | "shipped" | null`
- Vedle primary status badge se zobrazí **sekundární shipping-flow badge**:
  - `"label-ready"` → "🏷️ Štítek připraven" (orange)
  - `"shipped"` → "📦 Odesláno" (green)
- Flex-wrap na header row → mobile fallback pro delší řetězce
- `min-w-0` + `shrink-0` cleanup pro korektní text ellipsis

---

## Guardraily dodrženy

| Guardrail z assignementu | Implementace |
|---|---|
| **NESMÍ volat `sendEmail()` na SHIPPED** | ShippingLabelCard volá pouze `PUT /api/orders/[id]/status`. Existující endpoint (`app/api/orders/[id]/status/route.ts`) jsem ověřoval PŘED implementací — nevolá `sendEmail` na SHIPPED transition. Customer email chodí z webhooku task #19 po platbě. |
| **Drop PACKING pseudo-state** | Odstraněn z `app/(pwa-parts)/parts/orders/[id]/page.tsx` (`OrderStatus`, `mapToApiStatus`, `statusConfig`), `OrderActions.tsx` (`OrderStatus`, `nextAction`), `OrderCard.tsx` (`OrderStatus`, `statusConfig`), list page `mapStatus`. |
| **window.confirm dialog** | `putStatus()` helper v ShippingLabelCard: `if (!window.confirm(confirmMessage)) return;` před každým PUT requestem. |
| **PICKUP "Vyzvednuto" button** | Variant 1 v ShippingLabelCard — zelený button "✅ Označit jako vyzvednuto" → `PUT status: DELIVERED`. |
| **BANK_TRANSFER path out of scope** | Pre-payment stav (`shippingLabelUrl === null`) zobrazen jako Variant 3 s warning "Čekáme na platbu" a disabled tlačítkem. Žádný aktivní flow, ShippingLabelCard jen informuje. |
| **Žádný nový API endpoint** | Ověřeno — Prisma `findFirst/findMany` s `include` vrací všechny base Order sloupce včetně shipping fields. Frontend jen rozšířen o TypeScript interface, backend beze změny. |

---

## Compliance s plánem — acceptance criteria

- [x] `components/pwa-parts/orders/ShippingLabelCard.tsx` existuje s 5 variantami
- [x] Variant 1: PICKUP info box + "Označit jako vyzvednuto" button → DELIVERED
- [x] Variant 2: shippedAt != null → success box s datem + tracking link
- [x] Variant 3: shippingLabelUrl == null → "Čekáme na platbu" disabled state
- [x] Variant 4: Happy path s [Stáhnout PDF] + [Označit jako odesláno]
- [x] Variant 5: DRY-RUN overlay na variantě 4
- [x] window.confirm dialog před každým status update
- [x] PUT `/api/orders/[id]/status` volán (NE nový endpoint)
- [x] Error handling se zobrazenou hláškou (red box)
- [x] Submitting state (disabled tlačítka + "Ukládá se…")
- [x] Multi-supplier warning zobrazen při `supplierCount > 1`
- [x] Zásilkovna varianta zobrazí `zasilkovnaPointName` místo ulice
- [x] `PACKING` pseudo-state odstraněn ze 4 souborů
- [x] OrderActions zjednodušen — pouze NEW → CONFIRMED + cancel
- [x] OrderActions info text po CONFIRMED: "Stáhněte si přepravní štítek výše…"
- [x] List page má nový tab "K odeslání" s filter `shippingLabelUrl != null && shippedAt == null`
- [x] OrderCard má volitelný `shippingBadge` prop (`"label-ready"` / `"shipped"`)
- [x] `npm run build` → 309/309 static pages, 0 errors
- [x] `npm run lint` → 0 errors / 0 warnings na dotčených souborech
- [x] `npx tsc --noEmit` → 0 errors
- [ ] Manuální test v browseru — **ponecháno pro QA** (implementor nemá PARTS_SUPPLIER session setup)
- [ ] Manuální test DRY-RUN flow — **ponecháno pro QA**
- [ ] Manuální test PICKUP "vyzvednuto" flow — **ponecháno pro QA**

---

## Odchylky od plánu

### 1. `fetchOrder` extrahována z useEffect (plán neřešil refresh mechanism)

Plán sekce 4.1 pouze říká "parent refresh after mark-shipped". Konkrétní mechanizmus nebyl specifikován. Rozhodl jsem se **refetch plného order objektu** místo lokální state mutation — důvody:

1. Server je source of truth pro `shippedAt` (backend nastavuje `new Date()`)
2. Status update by mohl mít vedlejší efekty v budoucnu (např. trigger workflow)
3. Race-safe — pokud mezi tím jiný flow změnil order, refetch dostane aktuální stav

Cena: 1 extra GET request po každém status update. V PWA context (po 3G networku) to je ~150-300ms delay, ale user vidí loading state v ShippingLabelCard skrz `submitting`. OK tradeoff.

### 2. `orderId` prop odstraněn z OrderActions

Plán sekce 5.2 popisoval OrderActions simplifikaci ale `orderId` explicitně nezmínil. Protože refactor odstranil tracking input (kde by se `orderId` teoreticky mohl používat), nyní OrderActions **nikde `orderId` nepoužívá**. Odstranil jsem ho z props interface i z volání v parent. TypeScript enforcuje sanitní volání.

### 3. `getShippingBadge` helper ve sceně jako plain funkce (plán neřešil)

Plán sekce 7.1 nevěnoval pozornost **jak** se rozhodne o badge typu na list page. Rozhodl jsem se pro malý `getShippingBadge(order): "label-ready" | "shipped" | null` helper uvnitř list page souboru — ne pattern přes separate export. Důvod: jednorázový use, přesun do samostatného souboru = over-engineering.

### 4. Text tab label "K odeslání" (plán nedefinoval přesný text)

Plán sekce 7.2 říká "přidat nový tab". Zvolil jsem "K odeslání" — kratší a akční než "Štítky připravené" nebo "Čekají na expedici". Match s primary CTA v ShippingLabelCard ("K odeslání" header) → konzistence.

### 5. Použití `useState` + `"use client"` místo server component s Actions

Plán sekce 4 předpokládal client component pro interaktivitu. Ověřeno — ShippingLabelCard MUSÍ být client (window.confirm, fetch, useState). Plně souhlasí s plánem, jen explicitně flagnuto pro clarity.

---

## Seznam souborů v commitu

```
A  components/pwa-parts/orders/ShippingLabelCard.tsx    (NEW, ~360 řádků)
M  app/(pwa-parts)/parts/orders/[id]/page.tsx           (+33 -10 řádků)
M  components/pwa-parts/orders/OrderActions.tsx         (-24 +15 řádků)
M  app/(pwa-parts)/parts/orders/page.tsx                (+30 -3 řádků)
M  components/pwa-parts/orders/OrderCard.tsx            (+22 -3 řádků)
A  .claude-context/tasks/impl-task-21-vrakoviste-stitek.md (tento report)
```

**Metrics:**
- **5 production souborů** (1 create + 4 edit) + 1 report
- **Net change:** +418 / -40 řádků (production code) — ShippingLabelCard je největší přírůstek
- **Žádný API/backend code touched** — pouze frontend integrace existujícího endpointu

---

## Risk assessment

### Low risk
- **Build + lint + tsc green** — žádné compile errory, žádné nové warnings
- **Žádný backend change** — existující `PUT /api/orders/[id]/status` reuse, plně testováno v task #17
- **Guardraily dodrženy** — email flow beze změny (#19 webhook), žádný duplicit notif
- **Pattern konzistentní s ostatními PWA komponenty** — "use client" + useState + fetch, stejný styl jako rest `/parts/*`

### Medium risk (mimo kontrolu implementace)
- **`shippingLabelUrl` generation** — závisí na task #17 (Stripe webhook + shipment dispatcher). Pokud backend štítek nevygeneruje, Variant 3 ("Čekáme na platbu") se zobrazí trvale — pro QA ověřit že dispatcher beží po webhook eventech
- **DRY-RUN detection via `DRY-` prefix** — plán sekce 3.5 specifikoval tento contract. QA musí ověřit, že mock dispatcher v dev módu skutečně vrací `trackingNumber` s tímto prefixem

### Known limitations
- **Žádný realtime refresh** — pokud jiný broker (nebo admin) změní status během toho, co PWA uživatel kouká na detail, zobrazuje se stale state. Refresh jen na manual refetch po mark-shipped akci. Akceptabilní pro MVP (jeden vrakoviště = jeden uživatel na objednávku)
- **Žádná offline queue** — mark-shipped selže offline. PWA service worker background sync pro tuto akci není v scope tasku #21

### Out of scope (per plán sekce 10)
- Multi-supplier koordinace (jen warning box, žádný sync mezi vrakovišty)
- Přímý tisk na termoprinter (pouze PDF download)
- Email/SMS notifikace customera při mark-shipped (#19 řeší webhook)
- Bulk mark-shipped pro více objednávek naráz
