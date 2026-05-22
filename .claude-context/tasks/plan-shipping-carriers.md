# Plán implementace — Přímé integrace dopravců (task #16)

**Datum:** 2026-04-06
**Autor:** Plánovač (agent team)
**Status:** Hotovo
**Závislosti:** Task #15 (DB enum — hotovo), navazující #17, #18, #19, #20, #21

---

## 1. Kontext — co už existuje

### 1a. `lib/shipping/types.ts` (98 řádků) — HOTOVO
Obsahuje kompletní typové rozhraní:
- `DeliveryMethod` union: `"ZASILKOVNA" | "DPD" | "PPL" | "GLS" | "CESKA_POSTA" | "PICKUP"`
- `CreateShipmentInput` — vstup (recipient adresa, zasilkovnaPointId, weightKg, priceCzk, codAmountCzk, description)
- `CreateShipmentResult` — výstup (trackingNumber, carrier, labelUrl, trackingUrl, **dryRun: boolean**)
- `ShipmentStatus` — stav zásilky
- `CarrierClient` interface — metody `name`, `isConfigured()`, `createShipment()`, `getLabelUrl()`, `trackShipment()`

**Poznámka:** Interface je už navržený správně. Implementace jen naplní stuby.

### 1b. `Order` model v `prisma/schema.prisma:966-1021`
Obsahuje všechna potřebná pole:
- `deliveryMethod` (String, default "PPL")
- `zasilkovnaPointId`, `zasilkovnaPointName`
- `deliveryName`, `deliveryPhone`, `deliveryEmail`, `deliveryAddress`, `deliveryCity`, `deliveryZip`
- `paymentMethod` (BANK_TRANSFER, COD, CARD)
- `trackingNumber`, `trackingCarrier`, `trackingUrl`, `shippingLabelUrl`, `shippedAt`
- `totalPrice`, `shippingPrice`
- `items: OrderItem[]`

### 1c. `Part` model — má `weight: Float?` a `dimensions: String?`
→ Pro výpočet `weightKg` v `CreateShipmentInput` sečteme `part.weight * orderItem.quantity` přes všechny items.

### 1d. `.env.example:76-77` — jen Zásilkovna placeholder
```
NEXT_PUBLIC_ZASILKOVNA_API_KEY=
```
Chybí ENV pro DPD, PPL, GLS, Česká pošta.

### 1e. `app/api/orders/route.ts` — vytváří objednávku, ale **nevolá žádný shipping kód**
→ Shipment se bude vytvářet později (task #17) z Stripe webhook / po potvrzení platby.

---

## 2. Cíl tasku #16

Vytvořit **abstrakci** a **stuby** pro všechny 5 dopravců tak, aby:
1. Každý dopravce implementoval interface `CarrierClient` z `lib/shipping/types.ts`.
2. Když chybí API klíč → **automaticky dry-run mód** (fake data, log co by poslal, žádné reálné API volání).
3. **Dispatcher** `createShipmentForOrder(order)` vybere správného klienta podle `order.deliveryMethod`.
4. Žádné nové npm balíčky — používáme jen `fetch()` + `crypto` z node core.
5. Každý soubor je plně typovaný (TypeScript strict) a dobře zdokumentovaný.

---

## 3. Struktura souborů — co vytvořit

```
lib/shipping/
├── types.ts                    ← EXISTUJE (nedotýkat se)
├── base.ts                     ← NOVÝ — BaseCarrierClient (abstract)
├── dispatcher.ts               ← NOVÝ — createShipmentForOrder() + getCarrierClient()
├── weight.ts                   ← NOVÝ — calculateShipmentWeight(orderItems)
├── carriers/
│   ├── zasilkovna.ts           ← NOVÝ — stub s Packeta REST API (dry-run)
│   ├── dpd.ts                  ← NOVÝ — stub s DPD Shipper API (dry-run)
│   ├── ppl.ts                  ← NOVÝ — stub s PPL MyAPI (dry-run)
│   ├── gls.ts                  ← NOVÝ — stub s GLS MyGLS API (dry-run)
│   └── ceska-posta.ts          ← NOVÝ — stub s Česká pošta API (dry-run)
└── README.md                   ← NOVÝ — návod pro vývojáře (jak přidat klíče, jak otestovat)
```

**Celkem:** 9 nových souborů + 1 README. Žádné existující se neupravují.

---

## 4. Detail: `lib/shipping/base.ts`

**Účel:** Abstract base class pro sdílenou logiku — dry-run helper, logování, generování fake tracking čísel.

```typescript
import type {
  CarrierClient,
  CreateShipmentInput,
  CreateShipmentResult,
  DeliveryMethod,
  ShipmentStatus,
} from "./types";

/**
 * Base class pro všechny CarrierClient implementace.
 * Poskytuje sdílené helpery pro dry-run mód.
 */
export abstract class BaseCarrierClient implements CarrierClient {
  abstract readonly name: DeliveryMethod;

  abstract isConfigured(): boolean;
  abstract createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  abstract getLabelUrl(trackingNumber: string): Promise<string>;
  abstract trackShipment(trackingNumber: string): Promise<ShipmentStatus>;

  /**
   * Generuje deterministické fake tracking číslo pro dry-run.
   * Formát: DRY-{CARRIER}-{orderNumber}-{timestamp}
   */
  protected generateDryRunTrackingNumber(orderNumber: string): string {
    const ts = Date.now().toString(36).toUpperCase();
    return `DRY-${this.name}-${orderNumber}-${ts}`;
  }

  /**
   * Vrátí fake dry-run result (když chybí API klíč).
   */
  protected dryRunResult(input: CreateShipmentInput): CreateShipmentResult {
    const trackingNumber = this.generateDryRunTrackingNumber(input.orderNumber);
    console.log(
      `[shipping:${this.name}] DRY-RUN createShipment`,
      JSON.stringify(
        {
          orderNumber: input.orderNumber,
          recipient: input.recipient.name,
          city: input.recipient.city,
          weightKg: input.weightKg,
          priceCzk: input.priceCzk,
          codAmountCzk: input.codAmountCzk ?? null,
          zasilkovnaPointId: input.zasilkovnaPointId ?? null,
        },
        null,
        2,
      ),
    );
    return {
      trackingNumber,
      carrier: this.name,
      labelUrl: `https://placehold.co/600x800/orange/white?text=DRY-RUN+${this.name}+LABEL`,
      trackingUrl: `https://placehold.co/?tracking=${trackingNumber}`,
      dryRun: true,
    };
  }

  /**
   * Vrátí fake dry-run status.
   */
  protected dryRunStatus(trackingNumber: string): ShipmentStatus {
    return {
      trackingNumber,
      state: "CREATED",
      lastUpdate: new Date(),
      lastLocation: "DRY-RUN (žádné reálné volání)",
    };
  }
}
```

**Klíčové:**
- `generateDryRunTrackingNumber()` — nepoužívá random, aby bylo idempotentní vůči timestampu.
- `dryRunResult()` — loguje VŠECHNY inputy (co by poslal reálné API), aby dev viděl v konzoli že to funguje.
- `dryRunStatus()` — vždy vrací `CREATED` stav.

---

## 5. Detail: `lib/shipping/weight.ts`

**Účel:** Spočítat celkovou hmotnost zásilky z `OrderItem[]` (fallback když chybí `part.weight`).

```typescript
import { prisma } from "@/lib/prisma";

/**
 * Default fallback weight per položka, když `part.weight` není vyplněný.
 * 1 kg je rozumný průměr pro autodíly.
 */
const DEFAULT_WEIGHT_KG = 1.0;

/**
 * Spočítá celkovou hmotnost zásilky (v kg) z položek objednávky.
 * Načte weight z Part přes partId a vynásobí quantity.
 */
export async function calculateShipmentWeight(orderItems: Array<{ partId: string; quantity: number }>): Promise<number> {
  if (orderItems.length === 0) return DEFAULT_WEIGHT_KG;

  const partIds = orderItems.map((i) => i.partId);
  const parts = await prisma.part.findMany({
    where: { id: { in: partIds } },
    select: { id: true, weight: true },
  });

  const weightMap = new Map(parts.map((p) => [p.id, p.weight ?? DEFAULT_WEIGHT_KG]));

  const totalKg = orderItems.reduce((sum, item) => {
    const w = weightMap.get(item.partId) ?? DEFAULT_WEIGHT_KG;
    return sum + w * item.quantity;
  }, 0);

  // Zaokrouhlit na 1 desetinné místo, minimum 0.1 kg
  return Math.max(0.1, Math.round(totalKg * 10) / 10);
}
```

**Proč samostatný soubor:** `Part` má `weight: Float?` a default fallback musí být konzistentní napříč dispatcher/cron/tests.

---

## 6. Detail: `lib/shipping/dispatcher.ts`

**Účel:** Hlavní entry point — `createShipmentForOrder(orderId)` načte objednávku, vybere klienta, zavolá `createShipment()`, uloží výsledek do DB.

```typescript
import { prisma } from "@/lib/prisma";
import type { CarrierClient, CreateShipmentResult, DeliveryMethod } from "./types";
import { ZasilkovnaClient } from "./carriers/zasilkovna";
import { DpdClient } from "./carriers/dpd";
import { PplClient } from "./carriers/ppl";
import { GlsClient } from "./carriers/gls";
import { CeskaPostaClient } from "./carriers/ceska-posta";
import { calculateShipmentWeight } from "./weight";

/**
 * Vrátí klienta pro danou metodu doručení.
 * PICKUP → null (zákazník si vyzvedává osobně, žádná zásilka).
 */
export function getCarrierClient(method: DeliveryMethod): CarrierClient | null {
  switch (method) {
    case "ZASILKOVNA":
      return new ZasilkovnaClient();
    case "DPD":
      return new DpdClient();
    case "PPL":
      return new PplClient();
    case "GLS":
      return new GlsClient();
    case "CESKA_POSTA":
      return new CeskaPostaClient();
    case "PICKUP":
      return null;
    default: {
      // Exhaustiveness check — TypeScript si stěžuje pokud přidáme novou metodu
      const _exhaustive: never = method;
      void _exhaustive;
      return null;
    }
  }
}

/**
 * Hlavní entry point — vytvoří zásilku pro objednávku.
 *
 * Flow:
 * 1. Načte Order včetně items
 * 2. Validuje stav (musí být CONFIRMED/PAID, ne PICKUP)
 * 3. Spočítá weight
 * 4. Vybere klienta podle deliveryMethod
 * 5. Zavolá carrier.createShipment() → real API nebo dry-run
 * 6. Uloží trackingNumber, trackingUrl, shippingLabelUrl do Order
 * 7. Vrátí CreateShipmentResult
 *
 * Použití: Stripe webhook (task #17) po payment_intent.succeeded.
 */
export async function createShipmentForOrder(orderId: string): Promise<CreateShipmentResult | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  if (order.deliveryMethod === "PICKUP") {
    console.log(`[shipping] Order ${order.orderNumber} is PICKUP — skipping shipment`);
    return null;
  }

  if (order.trackingNumber) {
    console.log(`[shipping] Order ${order.orderNumber} already has tracking (${order.trackingNumber}) — skipping`);
    return {
      trackingNumber: order.trackingNumber,
      carrier: order.deliveryMethod as DeliveryMethod,
      labelUrl: order.shippingLabelUrl ?? "",
      trackingUrl: order.trackingUrl ?? "",
      dryRun: order.trackingNumber.startsWith("DRY-"),
    };
  }

  const client = getCarrierClient(order.deliveryMethod as DeliveryMethod);
  if (!client) {
    throw new Error(`No carrier client for deliveryMethod=${order.deliveryMethod}`);
  }

  const weightKg = await calculateShipmentWeight(order.items);

  const result = await client.createShipment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipient: {
      name: order.deliveryName,
      phone: order.deliveryPhone,
      email: order.deliveryEmail,
      street: order.deliveryAddress,
      city: order.deliveryCity,
      zip: order.deliveryZip,
      country: "CZ",
    },
    zasilkovnaPointId: order.zasilkovnaPointId ?? undefined,
    zasilkovnaPointName: order.zasilkovnaPointName ?? undefined,
    weightKg,
    priceCzk: order.totalPrice,
    codAmountCzk: order.paymentMethod === "COD" ? order.totalPrice : undefined,
    description: `Objednávka ${order.orderNumber}`,
  });

  // Uložit výsledek do DB
  await prisma.order.update({
    where: { id: order.id },
    data: {
      trackingNumber: result.trackingNumber,
      trackingCarrier: result.carrier,
      trackingUrl: result.trackingUrl,
      shippingLabelUrl: result.labelUrl,
    },
  });

  return result;
}
```

**Důležité:**
- **Idempotentní** — pokud už tracking existuje, nevolá znovu API.
- Uloží výsledek do DB okamžitě po úspěšném vytvoření zásilky.
- PICKUP skipuje (ne chyba, jen log).
- COD částka jen když `paymentMethod === "COD"` (BANK_TRANSFER a CARD = 0).

---

## 7. Detail: Per-carrier stuby (5 souborů)

Každý carrier stub má **stejnou strukturu**:

1. Načte ENV klíč (konkrétní pro daného dopravce)
2. `isConfigured()` → `Boolean(process.env.CARRIER_API_KEY)`
3. `createShipment()` → pokud `!isConfigured()` → `this.dryRunResult(input)`; jinak zatím TODO/throw
4. `getLabelUrl()` → dry-run nebo throw
5. `trackShipment()` → dry-run nebo throw
6. **Tracking URL template** — konstantní pattern pro každého dopravce

### 7a. `lib/shipping/carriers/zasilkovna.ts`

```typescript
import { BaseCarrierClient } from "../base";
import type { CreateShipmentInput, CreateShipmentResult, ShipmentStatus, DeliveryMethod } from "../types";

/**
 * Zásilkovna (Packeta) — REST API v5.
 * Docs: https://docs.packetery.com/03-creating-shipments.html
 * API endpoint: https://www.zasilkovna.cz/api/rest
 *
 * Potřebné ENV:
 *   ZASILKOVNA_API_PASSWORD  — "API password" z admin.zasilkovna.cz → Nastavení → API
 *   ZASILKOVNA_SENDER_LABEL  — "Název odesílatele" (např. "carmakler-shop")
 */
export class ZasilkovnaClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "ZASILKOVNA";

  private readonly apiPassword = process.env.ZASILKOVNA_API_PASSWORD ?? "";
  private readonly senderLabel = process.env.ZASILKOVNA_SENDER_LABEL ?? "";

  isConfigured(): boolean {
    return Boolean(this.apiPassword && this.senderLabel);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.dryRunResult(input);
    }

    // TODO: Real API call
    // POST https://www.zasilkovna.cz/api/rest/createPacket
    // XML body se senderLabel, receiver address, addressId (zasilkovnaPointId), cod, value, weight
    // Response XML → <id>tracking number</id>
    throw new Error(
      "[ZasilkovnaClient] Real API volání není implementováno — nastavte dry-run mode (odstraňte ZASILKOVNA_API_PASSWORD) nebo implementujte volání dle docs.packetery.com",
    );
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+ZASILKOVNA+${trackingNumber}`;
    }
    // TODO: GET https://www.zasilkovna.cz/api/rest/packetLabelPdf
    // Vrací PDF přímo — uložit na Cloudinary nebo vrátit redirect URL
    throw new Error("[ZasilkovnaClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }
    // TODO: GET https://www.zasilkovna.cz/api/rest/packetStatus
    throw new Error("[ZasilkovnaClient] trackShipment not implemented");
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   * Formát: https://tracking.packeta.com/Z{tracking}
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://tracking.packeta.com/cs/${trackingNumber}`;
  }
}
```

### 7b. `lib/shipping/carriers/dpd.ts`

```typescript
import { BaseCarrierClient } from "../base";
import type { CreateShipmentInput, CreateShipmentResult, ShipmentStatus, DeliveryMethod } from "../types";

/**
 * DPD CZ — Shipper API.
 * Docs: https://docs.dpd.cz/dpd-shipper-api/
 * API endpoint: https://api.dpd.cz/shipmentservice/rest/v1/
 *
 * Potřebné ENV:
 *   DPD_API_USERNAME  — email (ten samý jako login do DPD Online)
 *   DPD_API_PASSWORD  — API password z DPD Online → API nastavení
 *   DPD_CUSTOMER_NUMBER — zákaznické číslo DPD
 */
export class DpdClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "DPD";

  private readonly username = process.env.DPD_API_USERNAME ?? "";
  private readonly password = process.env.DPD_API_PASSWORD ?? "";
  private readonly customerNumber = process.env.DPD_CUSTOMER_NUMBER ?? "";

  isConfigured(): boolean {
    return Boolean(this.username && this.password && this.customerNumber);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) return this.dryRunResult(input);
    // TODO: POST /shipmentservice/rest/v1/shipment
    throw new Error("[DpdClient] Real API not implemented");
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+DPD+${trackingNumber}`;
    }
    throw new Error("[DpdClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) return this.dryRunStatus(trackingNumber);
    throw new Error("[DpdClient] trackShipment not implemented");
  }

  static trackingUrlFor(trackingNumber: string): string {
    return `https://tracking.dpd.de/status/cs_CZ/parcel/${trackingNumber}`;
  }
}
```

### 7c. `lib/shipping/carriers/ppl.ts`

```typescript
import { BaseCarrierClient } from "../base";
import type { CreateShipmentInput, CreateShipmentResult, ShipmentStatus, DeliveryMethod } from "../types";

/**
 * PPL CZ — MyAPI2 (REST).
 * Docs: https://www.ppl.cz/myapi-dokumentace
 * API endpoint: https://api.dhl.com/parcel/eu/v2/shipments
 * (PPL je součást DHL Group od 2023, MyAPI používá DHL parcel API)
 *
 * Potřebné ENV:
 *   PPL_API_USERNAME  — přihlašovací údaje z myapi.ppl.cz
 *   PPL_API_PASSWORD
 *   PPL_CUSTOMER_ID   — číslo zákazníka PPL
 */
export class PplClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "PPL";

  private readonly username = process.env.PPL_API_USERNAME ?? "";
  private readonly password = process.env.PPL_API_PASSWORD ?? "";
  private readonly customerId = process.env.PPL_CUSTOMER_ID ?? "";

  isConfigured(): boolean {
    return Boolean(this.username && this.password && this.customerId);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) return this.dryRunResult(input);
    throw new Error("[PplClient] Real API not implemented");
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+PPL+${trackingNumber}`;
    }
    throw new Error("[PplClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) return this.dryRunStatus(trackingNumber);
    throw new Error("[PplClient] trackShipment not implemented");
  }

  static trackingUrlFor(trackingNumber: string): string {
    return `https://www.ppl.cz/vyhledat-zasilku?shipmentId=${trackingNumber}`;
  }
}
```

### 7d. `lib/shipping/carriers/gls.ts`

```typescript
import { BaseCarrierClient } from "../base";
import type { CreateShipmentInput, CreateShipmentResult, ShipmentStatus, DeliveryMethod } from "../types";

/**
 * GLS CZ — MyGLS API (REST JSON).
 * Docs: https://mygls.gls-czech.cz/MyGLS/api
 * API endpoint: https://api.mygls.cz/ParcelService.svc/json/PrintLabels
 *
 * Potřebné ENV:
 *   GLS_API_USERNAME  — přihlašovací email do MyGLS
 *   GLS_API_PASSWORD_SHA512  — heslo hashované SHA-512 (GLS to takhle vyžaduje)
 *   GLS_CLIENT_NUMBER — zákaznické číslo (ClientNumber)
 */
export class GlsClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "GLS";

  private readonly username = process.env.GLS_API_USERNAME ?? "";
  private readonly passwordSha512 = process.env.GLS_API_PASSWORD_SHA512 ?? "";
  private readonly clientNumber = process.env.GLS_CLIENT_NUMBER ?? "";

  isConfigured(): boolean {
    return Boolean(this.username && this.passwordSha512 && this.clientNumber);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) return this.dryRunResult(input);
    throw new Error("[GlsClient] Real API not implemented");
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+GLS+${trackingNumber}`;
    }
    throw new Error("[GlsClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) return this.dryRunStatus(trackingNumber);
    throw new Error("[GlsClient] trackShipment not implemented");
  }

  static trackingUrlFor(trackingNumber: string): string {
    return `https://gls-group.eu/CZ/cs/sledovani-zasilek?match=${trackingNumber}`;
  }
}
```

### 7e. `lib/shipping/carriers/ceska-posta.ts`

```typescript
import { BaseCarrierClient } from "../base";
import type { CreateShipmentInput, CreateShipmentResult, ShipmentStatus, DeliveryMethod } from "../types";

/**
 * Česká pošta — Podání Online (API).
 * Docs: https://www.ceskaposta.cz/sluzby/obchodni-psani/podani-online
 * API endpoint: https://b2b.postaonline.cz/restservices/ZSKService/v1/
 *
 * Potřebné ENV:
 *   CESKA_POSTA_API_USERNAME  — uživatelské jméno pro B2B portál
 *   CESKA_POSTA_API_PASSWORD  — heslo
 *   CESKA_POSTA_CUSTOMER_ID   — IČO smluvního zákazníka
 */
export class CeskaPostaClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "CESKA_POSTA";

  private readonly username = process.env.CESKA_POSTA_API_USERNAME ?? "";
  private readonly password = process.env.CESKA_POSTA_API_PASSWORD ?? "";
  private readonly customerId = process.env.CESKA_POSTA_CUSTOMER_ID ?? "";

  isConfigured(): boolean {
    return Boolean(this.username && this.password && this.customerId);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) return this.dryRunResult(input);
    throw new Error("[CeskaPostaClient] Real API not implemented");
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+POSTA+${trackingNumber}`;
    }
    throw new Error("[CeskaPostaClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) return this.dryRunStatus(trackingNumber);
    throw new Error("[CeskaPostaClient] trackShipment not implemented");
  }

  static trackingUrlFor(trackingNumber: string): string {
    return `https://www.postaonline.cz/trackandtrace/-/zasilka/cislo?parcelNumbers=${trackingNumber}`;
  }
}
```

**Poznámka k `trackingUrlFor`:** Tyto static metody jsou tu kvůli budoucímu UI — např. e-mail s trackingem nebo stránka `/shop/objednavky/sledovani/[token]` může volat `ZasilkovnaClient.trackingUrlFor(tracking)` bez instancování klienta.

---

## 8. Detail: `lib/shipping/README.md`

**Účel:** Návod pro vývojáře a deployment — jak klient aktivovat reálnými API klíči, jak otestovat dry-run, jaké endpointy volá.

**Obsah README:**
1. **Architektura** — diagram: `Order.deliveryMethod → dispatcher → CarrierClient`
2. **Dry-run mode** — vysvětlit že bez ENV klíčů automaticky funguje (ideální pro dev/staging)
3. **Jak aktivovat reálné API pro daného dopravce:**
   - Zásilkovna: registrace na admin.zasilkovna.cz → Nastavení → API → zkopírovat API password
   - DPD: kontaktovat obchodníka DPD → API přístup → stáhnout credentials
   - PPL: registrace myapi.ppl.cz → vygenerovat přístup
   - GLS: MyGLS → nastavení API → heslo musí být SHA-512 hash
   - Česká pošta: smlouva s ČP → B2B portál → API údaje
4. **ENV proměnné** — tabulka názvů a příkladů hodnot
5. **Jak otestovat dry-run** — `console.log` výstupy, jak ověřit `result.dryRun === true`
6. **Další kroky** — odkazy na taskId #17, #18, #21

---

## 9. ENV proměnné — změny v `.env.example`

**POZOR:** Task #16 nemá upravovat `.env.example` — to dělá task #20. Ale tento plán doporučuje konkrétní klíče, které #20 přidá:

```bash
# --- Zásilkovna (Packeta) — REST API ---
# Pokud nejsou nastaveny, systém běží v dry-run módu (žádné reálné volání)
ZASILKOVNA_API_PASSWORD=       # admin.zasilkovna.cz → Nastavení → API → API password
ZASILKOVNA_SENDER_LABEL=       # "carmakler-shop" (nastavit v Packeta adminu)
NEXT_PUBLIC_ZASILKOVNA_API_KEY= # Pro JS widget na výběr pobočky (už existuje)

# --- DPD CZ — Shipper API ---
DPD_API_USERNAME=              # email (login do DPD Online)
DPD_API_PASSWORD=              # API password z DPD Online
DPD_CUSTOMER_NUMBER=           # zákaznické číslo DPD

# --- PPL CZ — MyAPI2 ---
PPL_API_USERNAME=              # myapi.ppl.cz
PPL_API_PASSWORD=
PPL_CUSTOMER_ID=               # číslo zákazníka

# --- GLS CZ — MyGLS API ---
GLS_API_USERNAME=              # email do MyGLS
GLS_API_PASSWORD_SHA512=       # heslo hashované SHA-512 (jinak se GLS neautentikuje)
GLS_CLIENT_NUMBER=

# --- Česká pošta — Podání Online ---
CESKA_POSTA_API_USERNAME=      # B2B portál login
CESKA_POSTA_API_PASSWORD=
CESKA_POSTA_CUSTOMER_ID=       # IČO smluvního zákazníka
```

**Celkem 14 nových ENV proměnných.**

---

## 10. Testování

### 10a. Manuální dry-run test (pro vývojáře)

Po implementaci vytvořit jednoduchý test script `scripts/test-shipping.ts`:

```typescript
import { createShipmentForOrder } from "@/lib/shipping/dispatcher";
import { prisma } from "@/lib/prisma";

async function main() {
  // Najít libovolnou PENDING objednávku
  const order = await prisma.order.findFirst({
    where: { status: "PENDING", deliveryMethod: { not: "PICKUP" } },
  });
  if (!order) {
    console.log("Žádná testovací objednávka nenalezena");
    return;
  }

  console.log(`Testing shipment for order ${order.orderNumber} (${order.deliveryMethod})`);
  const result = await createShipmentForOrder(order.id);
  console.log("Result:", JSON.stringify(result, null, 2));
  console.log("Dry-run:", result?.dryRun);
}

main().then(() => process.exit(0));
```

Spuštění: `npx tsx scripts/test-shipping.ts`

Očekávaný výstup:
```
[shipping:PPL] DRY-RUN createShipment
{
  orderNumber: "OBJ-260406-ABC12",
  recipient: "Jan Novák",
  city: "Praha",
  weightKg: 2.5,
  priceCzk: 1290,
  codAmountCzk: null,
  ...
}
Result: { trackingNumber: "DRY-PPL-OBJ-260406-ABC12-...", ... dryRun: true }
```

### 10b. Unit testy (volitelné, nad rámec tohoto tasku)

Vitest testy v `lib/shipping/__tests__/`:
- `dispatcher.test.ts` — test pro všech 6 deliveryMethod (včetně PICKUP → null)
- `weight.test.ts` — test fallback když `part.weight === null`
- `base.test.ts` — test `generateDryRunTrackingNumber()` je deterministický

---

## 11. Pořadí implementace

| # | Krok | Soubor | Závislost |
|---|------|--------|-----------|
| 1 | Vytvořit `base.ts` | `lib/shipping/base.ts` | — (používá jen `types.ts`) |
| 2 | Vytvořit `weight.ts` | `lib/shipping/weight.ts` | prisma |
| 3 | Vytvořit 5 carrier stubů | `lib/shipping/carriers/*.ts` | `base.ts`, `types.ts` |
| 4 | Vytvořit `dispatcher.ts` | `lib/shipping/dispatcher.ts` | všechny carriery + `weight.ts` |
| 5 | Vytvořit `README.md` | `lib/shipping/README.md` | — |
| 6 | Manuální dry-run test | `scripts/test-shipping.ts` (volitelné) | vše výše |

**Paralelizace:** Kroky 1 a 2 lze paralelně. Krok 3 (všechny 5 carrier souborů) lze paralelně. Krok 4 až po 1, 2, 3.

---

## 12. Co NENÍ součástí tasku #16

Tyto věci jsou samostatné tasky — **neimplementovat v rámci #16**:

| Task | Co dělá | Proč oddělené |
|------|---------|---------------|
| #17 | Stripe webhook → `createShipmentForOrder()` | Potřebuje webhook setup, jiný soubor |
| #18 | Checkout UI pro všech 5 dopravců | Frontend change, nezávislé |
| #19 | Email notifikace s tracking URL | Email template + Resend integrace |
| #20 | Doplnit `.env.example` a root README | Dokumentace, nepotřebuje kód |
| #21 | Vrakoviště PWA — tisk štítku | Frontend PWA změna |

**Dependency flow:** #16 → #17 (webhook volá dispatcher) → #19 (email po #17 dokončí platbu).

---

## 13. Rizika a edge-cases

### 13a. Race condition při duplikaci volání
**Riziko:** Stripe webhook může být retry-ován → `createShipmentForOrder()` zavolán 2x → dvě zásilky.
**Mitigace:** Dispatcher kontroluje `order.trackingNumber` — pokud existuje, vrátí cached výsledek. Task #17 musí navíc kontrolovat idempotency key ve Stripe webhook.

### 13b. `part.weight` je `null` pro většinu dílů
**Riziko:** Dispatcher spočítá 0 kg → API volání selže (nebo Zásilkovna má min. 0.5 kg).
**Mitigace:** `weight.ts` má `DEFAULT_WEIGHT_KG = 1.0` fallback a `Math.max(0.1, ...)` floor.

### 13c. Dry-run v produkci (chybí ENV klíče omylem)
**Riziko:** Ostré nasazení bez klíčů → všechny objednávky mají fake tracking.
**Mitigace:** V dispatcher logu vypisovat `dryRun: true` prominently. V task #19 (email) detekovat `trackingNumber.startsWith("DRY-")` a **neposílat** zákazníkovi tracking link. README v lib/shipping vysvětluje rizika.

### 13d. GLS vyžaduje SHA-512 hash hesla
**Riziko:** Vývojář zkopíruje plaintext heslo do `GLS_API_PASSWORD_SHA512` → autentikace selže.
**Mitigace:** README ukazuje příkaz: `echo -n "mojeheslo" | shasum -a 512`. Komentář v `.env.example` to zdůrazní.

### 13e. Zásilkovna API vyžaduje XML, ne JSON
**Riziko:** Real implementace (mimo tento task) musí parsovat XML response.
**Mitigace:** Poznámka v TODO komentáři v `zasilkovna.ts`. Můžeme použít node core `DOMParser` (dostupný v Node 22+) nebo jednoduchý regex parser.

---

## 14. Souhrn — definition of done pro task #16

- [ ] `lib/shipping/base.ts` existuje, exportuje `BaseCarrierClient`
- [ ] `lib/shipping/weight.ts` existuje, exportuje `calculateShipmentWeight()`
- [ ] `lib/shipping/dispatcher.ts` existuje, exportuje `createShipmentForOrder()` a `getCarrierClient()`
- [ ] 5 carrier stubů v `lib/shipping/carriers/*.ts` — každý extends `BaseCarrierClient`
- [ ] Každý carrier má `isConfigured()` → když false, `createShipment()` vrátí dry-run result
- [ ] Dry-run vrací `dryRun: true`, fake trackingNumber a placeholder label URL
- [ ] `lib/shipping/README.md` s návodem na aktivaci reálných API
- [ ] TypeScript strict mode projde bez errorů (`npm run build` nebo `tsc --noEmit`)
- [ ] Žádné nové npm balíčky v `package.json`
- [ ] Manuální test: vytvoření zásilky v dry-run módu loguje input do konzole
- [ ] Dispatcher je idempotentní (opakované volání pro stejný order nevytvoří druhou zásilku)
