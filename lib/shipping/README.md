# lib/shipping — Přímé integrace dopravců

Modul pro vytváření přepravních štítků přímo přes API dopravců (bez externí SaaS služby).

## Architektura

```
Order.deliveryMethod
       │
       ▼
createShipmentForOrder(orderId)    ← dispatcher.ts (entry point)
       │
       ▼
getCarrierClient(method)           ← dispatcher.ts (factory)
       │
       ▼
┌──────┴──────────────────────────────────────────┐
│                                                  │
ZasilkovnaClient  DpdClient  PplClient  GlsClient  CeskaPostaClient
       │             │           │          │              │
       └─────────────┴───────────┴──────────┴──────────────┘
                              │
                              ▼
                   BaseCarrierClient (abstract)
                              │
                              ▼
              isConfigured() ? real API : dry-run
```

Každý klient implementuje interface `CarrierClient` z `types.ts` a dědí `BaseCarrierClient` kvůli sdílené dry-run logice.

## Dry-run mód (výchozí)

Pokud chybí ENV credentials pro dopravce, `isConfigured()` vrátí `false` a `createShipment()` automaticky vrátí **dry-run result** bez jakéhokoli síťového volání.

**Dry-run výstup:**
- `trackingNumber` = `DRY-{CARRIER}-{orderNumber}-{timestamp}` (prefix `DRY-` detekuje dispatcher)
- `labelUrl` = placeholder PNG z `placehold.co`
- `dryRun: true` flag
- Všechny inputy se logují do console.log pro diagnostiku

**Výhoda:** Lokální dev a staging fungují bez skutečných API klíčů. Email notifikace (task #19) by měly detekovat `trackingNumber.startsWith("DRY-")` a **neposílat** zákazníkovi fake tracking link.

## Jak aktivovat reálné API pro daného dopravce

Přidat ENV proměnné do `.env.local` (dev) nebo do prod prostředí. Jakmile všechny požadované klíče existují, klient se přepne do real-API módu.

### Zásilkovna (Packeta)
1. Registrace na [admin.zasilkovna.cz](https://admin.zasilkovna.cz)
2. Nastavení → API → zkopírovat **API password**
3. Nastavit **Název odesílatele** (sender label)
4. ENV:
   ```
   ZASILKOVNA_API_PASSWORD=xxx
   ZASILKOVNA_SENDER_LABEL=carmakler-shop
   ```
5. Docs: https://docs.packetery.com/03-creating-shipments.html

### DPD CZ
1. Kontaktovat obchodníka DPD → získat API přístup
2. DPD Online → API nastavení → stáhnout credentials
3. ENV:
   ```
   DPD_API_USERNAME=email@carmakler.cz
   DPD_API_PASSWORD=xxx
   DPD_CUSTOMER_NUMBER=123456
   ```
4. Docs: https://docs.dpd.cz/dpd-shipper-api/

### PPL CZ (MyAPI2)
1. Registrace [myapi.ppl.cz](https://myapi.ppl.cz)
2. Vygenerovat API přístup
3. ENV:
   ```
   PPL_API_USERNAME=xxx
   PPL_API_PASSWORD=xxx
   PPL_CUSTOMER_ID=123456
   ```
4. Docs: https://www.ppl.cz/myapi-dokumentace

### GLS CZ (MyGLS)
1. MyGLS portál → nastavení API
2. **POZOR:** Heslo MUSÍ být SHA-512 hash, ne plaintext!
   ```bash
   echo -n "mojeheslo" | shasum -a 512
   ```
3. ENV:
   ```
   GLS_API_USERNAME=email@carmakler.cz
   GLS_API_PASSWORD_SHA512=abc123...  # 128 hex znaků
   GLS_CLIENT_NUMBER=123456
   ```
4. Docs: https://mygls.gls-czech.cz/MyGLS/api

### Česká pošta (Podání Online)
1. Uzavřít smlouvu s ČP → dostanete přístup na B2B portál
2. B2B portál → API údaje
3. ENV:
   ```
   CESKA_POSTA_API_USERNAME=xxx
   CESKA_POSTA_API_PASSWORD=xxx
   CESKA_POSTA_CUSTOMER_ID=12345678  # IČO
   ```
4. Docs: https://www.ceskaposta.cz/sluzby/obchodni-psani/podani-online

## ENV proměnné — přehled

| Proměnná | Dopravce | Povinná | Popis |
|----------|----------|---------|-------|
| `ZASILKOVNA_API_PASSWORD` | Zásilkovna | pro real API | API password z adminu |
| `ZASILKOVNA_SENDER_LABEL` | Zásilkovna | pro real API | Label odesílatele |
| `NEXT_PUBLIC_ZASILKOVNA_API_KEY` | Zásilkovna | pro JS widget | Výběr pobočky ve frontendu |
| `DPD_API_USERNAME` | DPD | pro real API | Email/login |
| `DPD_API_PASSWORD` | DPD | pro real API | API heslo |
| `DPD_CUSTOMER_NUMBER` | DPD | pro real API | Zákaznické číslo |
| `PPL_API_USERNAME` | PPL | pro real API | MyAPI login |
| `PPL_API_PASSWORD` | PPL | pro real API | MyAPI heslo |
| `PPL_CUSTOMER_ID` | PPL | pro real API | Zákaznické ID |
| `GLS_API_USERNAME` | GLS | pro real API | MyGLS email |
| `GLS_API_PASSWORD_SHA512` | GLS | pro real API | **SHA-512 hash!** |
| `GLS_CLIENT_NUMBER` | GLS | pro real API | ClientNumber |
| `CESKA_POSTA_API_USERNAME` | ČP | pro real API | B2B login |
| `CESKA_POSTA_API_PASSWORD` | ČP | pro real API | B2B heslo |
| `CESKA_POSTA_CUSTOMER_ID` | ČP | pro real API | IČO |

**Bez těchto proměnných** celý modul funguje v dry-run módu. Task #20 přidá tyto klíče do `.env.example`.

## Jak otestovat dry-run

### Manuální test (nejjednodušší)

```bash
npx tsx scripts/test-shipping.ts
```

Očekávaný výstup:
```
[shipping:PPL] DRY-RUN createShipment
{
  orderNumber: "OBJ-260406-ABC12",
  recipient: "Jan Novák",
  city: "Praha",
  weightKg: 2.5,
  priceCzk: 1290,
  ...
}
Result: { trackingNumber: "DRY-PPL-OBJ-260406-ABC12-...", ..., dryRun: true }
```

### Programatický test

```typescript
import { createShipmentForOrder } from "@/lib/shipping/dispatcher";

const result = await createShipmentForOrder("order_id_here");
console.log(result?.dryRun);  // true (bez ENV) / false (s ENV)
console.log(result?.trackingNumber);  // DRY-PPL-... nebo reálné číslo
```

## Idempotence

`createShipmentForOrder()` je idempotentní:
- Pokud `Order.trackingNumber` už existuje → vrátí cached výsledek, **žádné API volání**
- Chrání proti Stripe webhook retry (task #17) a duplikaci zásilek

## Další kroky

| Task | Popis |
|------|-------|
| **#17** | Stripe webhook → volá `createShipmentForOrder()` po `payment_intent.succeeded` |
| **#18** | Checkout UI — výběr ze všech 5 dopravců s flat Carmakler cenami |
| **#19** | Email notifikace — pokud `!dryRun`, posílá tracking URL zákazníkovi |
| **#20** | Doplnit `.env.example` a root README o shipping klíče |
| **#21** | PWA vrakoviště — UI pro tisk PDF štítku po objednávce |

## Rizika

### 1. Dry-run v produkci (omylem)
Pokud nasadíte do prod bez ENV klíčů, všechny objednávky dostanou fake tracking. **Mitigace:** Task #19 detekuje `DRY-` prefix a neposílá tracking link.

### 2. GLS SHA-512 hash
Pokud omylem vložíte plaintext heslo do `GLS_API_PASSWORD_SHA512`, autentikace selže. **Mitigace:** Použijte `echo -n "heslo" | shasum -a 512`.

### 3. Part.weight je null
Většina dílů v DB nemá vyplněnou váhu. **Mitigace:** `weight.ts` má fallback `DEFAULT_WEIGHT_KG = 1.0` a minimum `0.1 kg`.

### 4. Zásilkovna XML API
Zásilkovna používá XML (ne JSON). Reálná implementace musí parsovat XML response. **Mitigace:** Poznámka v TODO komentáři v `zasilkovna.ts`.

### 5. Race condition — duplicitní zásilka
Stripe webhook retry může volat dispatcher vícekrát. **Mitigace:** Kontrola `order.trackingNumber` na začátku dispatcher. Task #17 by měl navíc kontrolovat Stripe idempotency key.
