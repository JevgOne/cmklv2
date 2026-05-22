# Deep Dive P0-3: Zásilkovna API — Real Implementace

**Datum:** 2026-04-13
**Autor:** Plánovač
**Pro:** Implementátor

---

## Shrnutí stávajícího stavu

Celá shipping architektura je hotová a funguje v dry-run módu. Potřeba: nahradit `throw new Error(...)` v `zasilkovna.ts` reálnými API voláními. **Žádné změny v ostatních souborech nejsou nutné** — dispatcher, base class, typy, weight, prices, UI (ShippingLabelCard, ZasilkovnaWidget) i Stripe webhook jsou připravené.

---

## Architektura (co se NESMÍ měnit)

```
Stripe webhook (platba přijata)
  → handleOrderPayment(orderId)
    → createShipmentForOrder(orderId)           ← lib/shipping/dispatcher.ts
      → getCarrierClient("ZASILKOVNA")          ← vrátí ZasilkovnaClient
      → client.createShipment(input)            ← ★ TADY IMPLEMENTOVAT
      → prisma.order.update({                   ← uloží tracking do DB
          trackingNumber, trackingCarrier,
          trackingUrl, shippingLabelUrl
        })
    → sendOrderNotificationEmails(orderId, shipment)  ← pošle email s tracking
```

**Idempotence:** Dispatcher kontroluje `order.trackingNumber` — pokud existuje, vrátí cached result bez API volání. Důležité pro Stripe webhook retries.

---

## Soubor k úpravě

### `lib/shipping/carriers/zasilkovna.ts`

**Aktuální stav:** 68 řádků, 3 metody s `throw new Error(...)` za `if (!this.isConfigured())` checkem.

**Cíl:** Nahradit `throw` reálnými API voláními. Zachovat `dryRunResult()` fallback.

---

## Zásilkovna API — technické detaily

### Autentizace
- **Typ:** API klíč (heslo) v XML body
- **Env:** `ZASILKOVNA_API_PASSWORD` — z admin.zasilkovna.cz → Nastavení → API
- **Env:** `ZASILKOVNA_SENDER_LABEL` — název odesílatele registrovaný v admin panelu
- **Env (frontend):** `NEXT_PUBLIC_ZASILKOVNA_API_KEY` — pro widget (již funguje, jiný klíč než API password!)

### Endpointy
- **Base URL:** `https://www.zasilkovna.cz/api/rest`
- **createPacket:** `POST /createPacket` — vytvoření zásilky
- **packetLabelPdf:** `GET /packetLabelPdf` — PDF štítek (A6 105×148mm)
- **packetStatus:** `GET /packetStatus` — stav zásilky

### Formát
- **Request:** XML body (Content-Type: `text/xml`)
- **Response:** XML

---

## Step-by-step implementace

### Krok 1: XML helper funkce

Na začátek souboru přidat helper pro XML request/response:

```typescript
/**
 * Odešle XML request na Zásilkovna REST API.
 * Zásilkovna API přijímá XML (ne JSON) — Content-Type: text/xml.
 */
private async apiCall(method: string, xmlBody: string): Promise<string> {
  const url = `https://www.zasilkovna.cz/api/rest`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: xmlBody,
  });

  if (!response.ok) {
    throw new Error(
      `[ZasilkovnaClient] API ${method} HTTP ${response.status}: ${await response.text()}`
    );
  }

  return response.text();
}
```

### Krok 2: createShipment — reálné API volání

**XML body pro createPacket:**

```xml
<createPacket>
  <apiPassword>{{ZASILKOVNA_API_PASSWORD}}</apiPassword>
  <packetAttributes>
    <number>{{orderNumber}}</number>
    <name>{{recipient.name}}</name>
    <surname></surname>
    <email>{{recipient.email}}</email>
    <phone>{{recipient.phone}}</phone>
    <addressId>{{zasilkovnaPointId}}</addressId>
    <value>{{priceCzk / 100 nebo celé Kč}}</value>
    <weight>{{weightKg}}</weight>
    <eshop>{{ZASILKOVNA_SENDER_LABEL}}</eshop>
    <cod>{{codAmountCzk ?? 0}}</cod>
    <currency>CZK</currency>
  </packetAttributes>
</createPacket>
```

**⚠️ POZOR na formát cen:**
- Zásilkovna API pracuje s celými korunami (ne haléře, ne centy)
- `Order.totalPrice` v DB je v **celých Kč** (Int) — ověřeno v schema (žádný *100 konverz)
- Takže `priceCzk` z `CreateShipmentInput` jde přímo do `<value>`

**⚠️ POZOR na name/surname split:**
- Zásilkovna API vyžaduje `<name>` a `<surname>` zvlášť
- `input.recipient.name` je celé jméno (např. "Jan Novák")
- Split: `const parts = name.split(" "); const firstName = parts[0]; const surname = parts.slice(1).join(" ") || parts[0];`

**⚠️ POZOR na addressId vs adresa:**
- Zásilkovna výdejní místa: `<addressId>` = ID z widgetu (zasilkovnaPointId)
- Zásilkovna domů (HD): `<street>`, `<city>`, `<zip>`, `<houseNumber>` místo addressId
- V současné implementaci: widget vybírá VŽDY výdejní místo → addressId
- Pokud `zasilkovnaPointId` chybí → throw error (nemělo by nastat, widget je povinný)

**Response parsing:**

```xml
<response>
  <status>ok</status>
  <result>
    <id>Z1234567890</id>
    <barcode>Z1234567890</barcode>
  </result>
</response>
```

Nebo error:

```xml
<response>
  <status>fault</status>
  <fault>
    <faultString>Chybný formát telefonu</faultString>
  </fault>
</response>
```

**Implementace createShipment:**

```typescript
async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  if (!this.isConfigured()) {
    return this.dryRunResult(input);
  }

  // Zásilkovna vyžaduje addressId (ID výdejního místa z widgetu)
  if (!input.zasilkovnaPointId) {
    throw new Error(
      "[ZasilkovnaClient] zasilkovnaPointId is required — customer must select pickup point via widget"
    );
  }

  // Split name/surname (Zásilkovna API vyžaduje zvlášť)
  const nameParts = input.recipient.name.trim().split(/\s+/);
  const firstName = nameParts[0] || input.recipient.name;
  const surname = nameParts.slice(1).join(" ") || firstName;

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<createPacket>
  <apiPassword>${this.escapeXml(this.apiPassword)}</apiPassword>
  <packetAttributes>
    <number>${this.escapeXml(input.orderNumber)}</number>
    <name>${this.escapeXml(firstName)}</name>
    <surname>${this.escapeXml(surname)}</surname>
    <email>${this.escapeXml(input.recipient.email)}</email>
    <phone>${this.escapeXml(input.recipient.phone)}</phone>
    <addressId>${this.escapeXml(input.zasilkovnaPointId)}</addressId>
    <value>${input.priceCzk}</value>
    <weight>${input.weightKg}</weight>
    <eshop>${this.escapeXml(this.senderLabel)}</eshop>
    <cod>${input.codAmountCzk ?? 0}</cod>
    <currency>CZK</currency>
  </packetAttributes>
</createPacket>`;

  const responseXml = await this.apiCall("createPacket", xml);

  // Parse response
  const statusMatch = responseXml.match(/<status>(.*?)<\/status>/);
  if (statusMatch?.[1] !== "ok") {
    const faultMatch = responseXml.match(/<faultString>(.*?)<\/faultString>/);
    throw new Error(
      `[ZasilkovnaClient] createPacket failed: ${faultMatch?.[1] ?? responseXml}`
    );
  }

  const idMatch = responseXml.match(/<id>(.*?)<\/id>/);
  const trackingNumber = idMatch?.[1];
  if (!trackingNumber) {
    throw new Error("[ZasilkovnaClient] createPacket response missing <id>");
  }

  const trackingUrl = ZasilkovnaClient.trackingUrlFor(trackingNumber);
  const labelUrl = await this.getLabelUrl(trackingNumber);

  return {
    trackingNumber,
    carrier: this.name,
    labelUrl,
    trackingUrl,
    dryRun: false,
  };
}
```

### Krok 3: getLabelUrl — PDF štítek

**XML body pro packetLabelPdf:**

```xml
<packetLabelPdf>
  <apiPassword>{{ZASILKOVNA_API_PASSWORD}}</apiPassword>
  <packetId>{{trackingNumber}}</packetId>
  <format>A7 on A4</format>
  <offset>0</offset>
</packetLabelPdf>
```

**Response:** Binární PDF data (Content-Type: application/pdf)

**Strategie pro uložení PDF:**
- **Varianta A (doporučená):** Uložit PDF na vlastní server (UPLOAD_DIR/UPLOAD_BASE_URL z env)
- **Varianta B:** Vrátit URL endpoint, který on-demand stahuje z Zásilkovna API
- **Varianta C:** Base64 encode a uložit do DB (nedoporučeno — velké)

**Doporučená implementace (Varianta B — nejjednodušší):**

Vytvořit API route `/api/shipping/label/[trackingNumber]/route.ts` jako proxy:

```typescript
async getLabelUrl(trackingNumber: string): Promise<string> {
  if (!this.isConfigured()) {
    return `https://placehold.co/600x800/orange/white?text=DRY-RUN+ZASILKOVNA+${trackingNumber}`;
  }

  // Vrátit URL na náš proxy endpoint — PDF se stáhne on-demand
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/shipping/label/${trackingNumber}?carrier=ZASILKOVNA`;
}
```

**Nový soubor `app/api/shipping/label/[trackingNumber]/route.ts`:**

```typescript
// GET /api/shipping/label/[trackingNumber]?carrier=ZASILKOVNA
// Proxy: stáhne PDF z carrier API a vrátí klientovi
// Auth: ADMIN, BACKOFFICE, PARTS_SUPPLIER (must own the order)

export async function GET(req, { params }) {
  const { trackingNumber } = params;
  const carrier = req.nextUrl.searchParams.get("carrier");

  // Auth check...
  // Fetch PDF from Zásilkovna API...
  // Return as application/pdf response
}
```

### Krok 4: trackShipment — stav zásilky

**XML body pro packetStatus:**

```xml
<packetStatus>
  <apiPassword>{{ZASILKOVNA_API_PASSWORD}}</apiPassword>
  <packetId>{{trackingNumber}}</packetId>
</packetStatus>
```

**Response:**

```xml
<response>
  <status>ok</status>
  <result>
    <codeText>delivered to customer</codeText>
    <statusCode>6</statusCode>
    <dateTime>2026-04-13T14:30:00</dateTime>
  </result>
</response>
```

**Status mapping (Zásilkovna statusCode → interní ShipmentStatus.state):**

| Zásilkovna statusCode | Zásilkovna text | Interní state |
|----------------------|-----------------|---------------|
| 1 | received | CREATED |
| 2 | arrived at sorting center | IN_TRANSIT |
| 3 | dispatched | IN_TRANSIT |
| 4 | ready for pickup | IN_TRANSIT |
| 5 | en route to pickup point | IN_TRANSIT |
| 6 | delivered to customer | DELIVERED |
| 7 | returned to sender | RETURNED |
| 10 | cancelled | RETURNED |

```typescript
async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
  if (!this.isConfigured()) {
    return this.dryRunStatus(trackingNumber);
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<packetStatus>
  <apiPassword>${this.escapeXml(this.apiPassword)}</apiPassword>
  <packetId>${this.escapeXml(trackingNumber)}</packetId>
</packetStatus>`;

  const responseXml = await this.apiCall("packetStatus", xml);

  const statusCodeMatch = responseXml.match(/<statusCode>(.*?)<\/statusCode>/);
  const dateMatch = responseXml.match(/<dateTime>(.*?)<\/dateTime>/);
  const codeTextMatch = responseXml.match(/<codeText>(.*?)<\/codeText>/);

  const statusCode = parseInt(statusCodeMatch?.[1] ?? "0");

  const stateMap: Record<number, ShipmentStatus["state"]> = {
    1: "CREATED",
    2: "IN_TRANSIT",
    3: "IN_TRANSIT",
    4: "IN_TRANSIT",
    5: "IN_TRANSIT",
    6: "DELIVERED",
    7: "RETURNED",
    10: "RETURNED",
  };

  return {
    trackingNumber,
    state: stateMap[statusCode] ?? "UNKNOWN",
    lastUpdate: dateMatch?.[1] ? new Date(dateMatch[1]) : new Date(),
    lastLocation: codeTextMatch?.[1] ?? undefined,
  };
}
```

### Krok 5: XML escape helper

Přidat private helper do třídy:

```typescript
private escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

---

## Soubory k vytvoření/úpravě — kompletní seznam

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `lib/shipping/carriers/zasilkovna.ts` | ÚPRAVA | Hlavní implementace — nahradit 3× `throw` reálným API |
| 2 | `app/api/shipping/label/[trackingNumber]/route.ts` | NOVÝ | Proxy endpoint pro stahování PDF štítků |

**NESMÍŠ měnit:**
- `lib/shipping/base.ts` — BaseCarrierClient je finální
- `lib/shipping/dispatcher.ts` — orchestrace je hotová
- `lib/shipping/types.ts` — interface je stabilní
- `lib/shipping/prices.ts` — flat pricing, beze změny
- `components/web/ZasilkovnaWidget.tsx` — widget funguje
- `components/pwa-parts/orders/ShippingLabelCard.tsx` — UI hotové
- `app/api/stripe/webhook/route.ts` — webhook volá `createShipmentForOrder()` správně

---

## Env variables potřebné

```env
# Již v .env.example — jen vyplnit hodnoty:
ZASILKOVNA_API_PASSWORD=       # z admin.zasilkovna.cz → Nastavení → API
ZASILKOVNA_SENDER_LABEL=       # název odesílatele (např. "carmakler")
NEXT_PUBLIC_ZASILKOVNA_API_KEY= # pro frontend widget (již nastaveno)
```

---

## Testovací scénáře

### Dry-run (bez API klíčů)
1. Odstraň `ZASILKOVNA_API_PASSWORD` z `.env.local`
2. Vytvoř objednávku s ZASILKOVNA delivery → `isConfigured()` = false → dry-run
3. Verify: tracking = `DRY-ZASILKOVNA-OBJ-...`, label = placehold.co
4. ShippingLabelCard zobrazí žlutý "DRY-RUN" banner

### Real API (s klíči)
1. Nastav `ZASILKOVNA_API_PASSWORD` a `ZASILKOVNA_SENDER_LABEL`
2. Vytvoř objednávku → zaplatí přes Stripe → webhook trigger
3. Verify: reálné tracking number (Z...), PDF štítek funkční
4. ShippingLabelCard zobrazí "Stáhnout PDF štítek" bez DRY-RUN banneru

### Error handling
1. Neplatný API klíč → `createPacket` vrátí `<status>fault</status>` → Error logged, webhook returns 200
2. Neexistující addressId → fault → Error logged
3. Chybějící zasilkovnaPointId → throw PŘED API voláním → catched ve webhook handleru

---

## STOP & ESCALATE

| Situace | Akce |
|---------|------|
| Zásilkovna API vrací `<status>fault</status>` s neznámou chybou | STOP — zobrazit celý XML response v logu, eskalovat |
| XML parsing selhává (neočekávaný formát) | STOP — Zásilkovna mohla změnit API verzi |
| `ZASILKOVNA_API_PASSWORD` je nastaveno ale widget klíč ne | Upozornit — backend bude real, frontend widget nefunkční |
| Label PDF je prázdný/korruptní | Zkusit jiný `<format>` (A7 on A4, A7 on A7, 105x148) |

---

## Referenční materiály

- Zásilkovna API docs: https://docs.packetery.com/03-creating-shipments.html
- Widget v6 docs: https://docs.packetery.com/01-pick-up-point-selection/02-widget-v6.html
- Stávající kód widgetu: `components/web/ZasilkovnaWidget.tsx` (řádky 1-97)
- Stripe webhook flow: `app/api/stripe/webhook/route.ts` (řádky 159-191)
