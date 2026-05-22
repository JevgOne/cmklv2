# Plán — Task #19: Email notifikace objednávky (reálné šablony)

**Autor:** planovac (agent team)
**Datum:** 2026-04-06
**Task ID:** #19
**Status:** Naplánováno — připraveno k implementaci

---

## 1. Cíl

Nahradit placeholder HTML šablony ve Stripe webhooku (z tasku #17) reálnými, brandovanými, mobile-first email šablonami pro eshop objednávky.

**2 šablony:**
- **(A) `orderConfirmationCustomer`** — potvrzení zákazníkovi po `checkout.session.completed`, obsahuje tracking link
- **(B) `orderNotificationSupplier`** — notifikace vrakovišti (supplier dílu) s PDF štítkem + doručovací adresou zákazníka

**Výstup:** Funkce `xxxHtml(data) / xxxText(data) / xxxSubject(data)` se stejnou konvencí jako existující šablony v `lib/email-templates/`. Webhook je bude importovat a nahradí inline `buildCustomerEmailHtml()` / `buildSupplierEmailHtml()` (soubor `app/api/stripe/webhook/route.ts` line 255-400).

---

## 2. Discovery — existující infrastruktura

**NALEZENO v projektu (opraveno proti zadání — cesta je `lib/email-templates/`, ne `lib/email/templates/`):**

| Soubor | Co tam je |
|--------|-----------|
| `lib/email-templates/layout.ts` | `emailLayout(content, signatureHtml)`, `escapeHtml()`, `formatCzk()` |
| `lib/email-templates/index.ts` | `generateEmail(templateType, broker, params)` factory + `TEMPLATE_LIST` |
| `lib/email-templates/contract-offer.ts` | Reference vzor — `contractOfferHtml/Text/Subject(data)` |
| `lib/email-templates/signature.ts` | `generateSignatureHtml(broker)` / `generateSignatureText(broker)` — **BROKER** signature, NEpoužitelné pro order |
| `lib/email-templates/vehicle-sold.ts` | Další reference vzor |
| `lib/email-templates/{daily-summary,financing,followup,insurance,presentation,price-change}.ts` | Další broker šablony |
| `lib/brand-styles.ts` | `emailLayoutHTML(content, signatureHtml)` — core wrapper (orange header, Outfit font, responsive 600px) |
| `lib/resend.ts` | `sendEmail({from, to, subject, html, text, attachments})` s dry-run fallbackem |
| `lib/company-info.ts` | `companyInfo` — jméno, IČO, adresa, kontakty → zdroj pro "company signature" v order mailech |
| `app/api/stripe/webhook/route.ts` line 255-400 | **Současné placeholder šablony** — inline `buildCustomerEmailHtml()` a `buildSupplierEmailHtml()` k nahrazení |

**Klíčové rozhodnutí:** Order šablony **NEpoužívají** `generateSignatureHtml(broker)` — order není broker flow, zákazník nemá přiděleného makléře. Místo toho vytvořím nový helper `companySignatureHtml()` / `companySignatureText()` v `lib/email-templates/company-signature.ts` který generuje signature z `companyInfo` (email, telefon, web).

**Vzor funkčního souboru** (z `contract-offer.ts`):
```typescript
import { emailLayout, escapeHtml, formatCzk } from "./layout";
import { generateSignatureHtml, generateSignatureText, BrokerSignatureData } from "./signature";

export interface ContractOfferData { ... }
export function contractOfferHtml(data: ContractOfferData): string {
  const content = `<p>...</p>`;
  return emailLayout(content, generateSignatureHtml(data.broker));
}
export function contractOfferText(data: ContractOfferData): string { ... }
export function contractOfferSubject(data: ContractOfferData): string {
  return `Návrh smlouvy — ${data.vehicleName} | Carmakler`;
}
```

---

## 3. Dotčené soubory

| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 1 | `lib/email-templates/order-confirmation-customer.ts` | **Create** | Šablona (A) — potvrzení zákazníkovi |
| 2 | `lib/email-templates/order-notification-supplier.ts` | **Create** | Šablona (B) — notifikace vrakovišti |
| 3 | `lib/email-templates/company-signature.ts` | **Create** | Helper pro company signature (NE broker) |
| 4 | `app/api/stripe/webhook/route.ts` | **Edit** | Odstranit `buildCustomerEmailHtml()` a `buildSupplierEmailHtml()` (line 255-400), importovat nové funkce a volat je v `sendOrderNotificationEmails()` (line 217-248) |
| 5 | `lib/email-templates/index.ts` | Edit (**volitelné**) | přeskočit — factory zůstává beze změny, order webhook importuje šablony přímo |

---

## 4. Design šablony

### Společný layout (přes `emailLayout()`)
- Šířka: 600px (mobile-first, responsive)
- Header: orange (#F97316) stripe s logem CarMakleru (z `emailLayoutHTML` v `lib/brand-styles`)
- Font: Outfit (fallback Arial, sans-serif)
- Padding: 20px vnější, 16-24px vnitřní sekce
- Primary CTA button: bg `#F97316`, text `#ffffff`, padding `12px 24px`, border-radius `4px`
- Šedá sekce pro shrnutí objednávky: bg `#f9fafb`, border-radius `8px`, padding `16px`
- Footer: company signature (kontakt + web) — přes `companySignatureHtml()`

### Dry-run banner
Pokud `shipment.dryRun === true`:
- Předsadit banner nad hlavní obsah:
  ```html
  <div style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px 16px;
       margin:0 0 16px;border-radius:6px;font-size:14px;color:#78350f;">
    <strong>TEST REŽIM (DRY-RUN)</strong> — zásilka nebyla skutečně vytvořena u dopravce.
    Pro produkční odeslání musí být nastaveny API klíče dopravců.
  </div>
  ```
- Prefix v subjectu: `[DRY-RUN] Objednávka C-00123 byla odeslána`

---

## 5. Šablona (A) — `order-confirmation-customer.ts`

### Interface
```typescript
export interface OrderConfirmationCustomerData {
  orderNumber: string;          // "C-00123"
  customerName: string;         // "Jan Novák" → deliveryName
  totalPrice: number;           // 1299 (bude formatCzk)
  deliveryMethod: string;       // "ZASILKOVNA" | "DPD" | ...
  carrier: string;              // shipment.carrier
  trackingNumber: string;       // "DRY-A1B2C3" nebo "Z12345678"
  trackingUrl: string;          // link na dopravce
  zasilkovnaPointName: string | null;  // "Praha 5 - Anděl" pokud ZASILKOVNA
  deliveryAddress: {
    name: string;
    street: string;
    city: string;
    zip: string;
  } | null;                     // null pokud ZASILKOVNA (adresa není relevantní)
  items: Array<{
    name: string;               // "Přední brzdové destičky"
    quantity: number;
    price: number;              // unit price v Kč
  }>;
  dryRun: boolean;
}
```

### HTML obsah (uvnitř `emailLayout`)

```
[dry-run banner if applicable]

<h1 style="margin:0 0 16px;font-size:24px;color:#111827;">
  Děkujeme za objednávku!
</h1>

<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Dobrý den {customerName},
</p>

<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Vaše objednávka <strong>{orderNumber}</strong> byla zaplacena a předána dopravci.
  Tady je shrnutí:
</p>

[Sekce: Shrnutí objednávky]  ← tabulka s bg #f9fafb
  Číslo objednávky: {orderNumber}
  Celková cena: {formatCzk(totalPrice)}
  Způsob dopravy: {localizedDeliveryMethod(deliveryMethod)}
  Tracking číslo: <code>{trackingNumber}</code>

[Sekce: Položky]  ← tabulka
  Každá položka: název, ks, cena za kus, cena celkem

[Sekce: Doručení]
  Pokud ZASILKOVNA: "Výdejní místo: {zasilkovnaPointName}"
  Jinak: formátovaná {deliveryAddress}

[CTA Button]
  "Sledovat zásilku" → odkaz na {trackingUrl}

<p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
  O doručení vás budeme informovat. V případě dotazů pište na
  <a href="mailto:info@carmakler.cz" style="color:#F97316;">info@carmakler.cz</a>.
</p>
```

### Text verze
Stejný obsah bez HTML, s oddělovači `---`:
```
Dobrý den {customerName},

Vaše objednávka {orderNumber} byla zaplacena a předána dopravci.

--- SHRNUTÍ OBJEDNÁVKY ---
Číslo: {orderNumber}
Celková cena: {formatCzk(totalPrice)}
Doprava: {deliveryMethod}
Tracking: {trackingNumber}

--- POLOŽKY ---
{items.map: `{quantity}× {name} — {formatCzk(price * quantity)}`}

--- DORUČENÍ ---
{ZASILKOVNA ? `Výdejní místo: ${zasilkovnaPointName}` : `${deliveryAddress.name}\n${deliveryAddress.street}\n${deliveryAddress.zip} ${deliveryAddress.city}`}

Sledovat zásilku: {trackingUrl}

V případě dotazů pište na info@carmakler.cz.

---
CarMakler s.r.o.
www.carmakler.cz
info@carmakler.cz
```

### Subject
```typescript
export function orderConfirmationCustomerSubject(data: OrderConfirmationCustomerData): string {
  const prefix = data.dryRun ? "[DRY-RUN] " : "";
  return `${prefix}Objednávka ${data.orderNumber} byla odeslána | Carmakler`;
}
```

### Localized delivery method
Helper uvnitř souboru (nebo v `lib/email-templates/layout.ts`):
```typescript
function localizedDeliveryMethod(method: string): string {
  const map: Record<string, string> = {
    ZASILKOVNA: "Zásilkovna",
    DPD: "DPD",
    PPL: "PPL",
    GLS: "GLS",
    CESKA_POSTA: "Česká pošta",
    PICKUP: "Osobní odběr",
  };
  return map[method] ?? method;
}
```

---

## 6. Šablona (B) — `order-notification-supplier.ts`

### Interface
```typescript
export interface OrderNotificationSupplierData {
  orderNumber: string;
  supplierName: string;          // "Vrakoviště Praha" (partnerAccount.name nebo supplier.companyName)
  items: Array<{
    name: string;
    partNumber: string | null;
    quantity: number;
  }>;
  delivery: {
    method: string;
    carrier: string;
    trackingNumber: string;
    labelUrl: string;            // PDF štítek → primary CTA
    // Pokud ZASILKOVNA → pointName, jinak fyzická adresa
    zasilkovnaPointName: string | null;
    address: {
      name: string;
      phone: string;
      street: string;
      city: string;
      zip: string;
    } | null;
  };
  hasMultipleSuppliers: boolean; // warning banner pokud true
  dryRun: boolean;
}
```

### HTML obsah

```
[dry-run banner if applicable]

<h1 style="margin:0 0 16px;font-size:24px;color:#111827;">
  Nová objednávka k odeslání
</h1>

<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Dobrý den {supplierName},
</p>

<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Objednávka <strong>{orderNumber}</strong> byla zaplacena. Prosíme:
  <ol>
    <li>Zabalte níže uvedené položky</li>
    <li>Vytiskněte přepravní štítek (PDF níže)</li>
    <li>Nalepte štítek a předejte zásilku dopravci</li>
  </ol>
</p>

[Multi-supplier warning banner if applicable]
<div style="background:#fef2f2;border:1px solid #fecaca;padding:12px 16px;margin:16px 0;border-radius:6px;">
  <strong>Pozor:</strong> Tato objednávka obsahuje položky od více dodavatelů.
  Kontaktujte prosím BackOffice pro koordinaci balení.
</div>

[Sekce: Položky k zabalení]  ← tabulka
  <thead> Díl | Part Number | Ks </thead>
  <tbody> {itemRows} </tbody>

[Sekce: Doručení]
  Pokud ZASILKOVNA: "Výdejní místo: {zasilkovnaPointName}"
  Jinak: adresa zákazníka (jméno, ulice, PSČ město, telefon)
  Dopravce: {carrier}
  Tracking: <code>{trackingNumber}</code>

[CTA Button]
  "Stáhnout PDF štítek" → odkaz na {labelUrl}  (orange primary)

<p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
  V případě problémů kontaktujte
  <a href="mailto:info@carmakler.cz" style="color:#F97316;">info@carmakler.cz</a>.
</p>
```

### Text verze
Obdobně jako customer, ale s item listem a adresou zákazníka. Vždy include tracking + labelUrl na konci.

### Subject
```typescript
export function orderNotificationSupplierSubject(data: OrderNotificationSupplierData): string {
  const prefix = data.dryRun ? "[DRY-RUN] " : "";
  return `${prefix}Objednávka ${data.orderNumber} k odeslání | Carmakler`;
}
```

---

## 7. Helper — `lib/email-templates/company-signature.ts`

**Důvod:** Existující `signature.ts` vyžaduje `BrokerSignatureData` (broker jméno, telefon, email, foto). Pro order email tam není broker → nelze použít. Vytvořit paralelní helper z `companyInfo`.

```typescript
import { companyInfo } from "@/lib/company-info";

/**
 * Company signature pro automatizované emaily (objednávky, faktury, ...)
 * — tam kde není přidělen broker.
 */
export function companySignatureHtml(): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
      <tr>
        <td style="padding:0;font-size:14px;color:#374151;">
          <p style="margin:0 0 4px;font-weight:600;color:#111827;">
            ${companyInfo.legalName}
          </p>
          <p style="margin:0 0 2px;color:#6b7280;">
            ${companyInfo.address.full}
          </p>
          <p style="margin:0 0 2px;">
            <a href="${companyInfo.contact.emailHref}"
               style="color:#F97316;text-decoration:none;">
              ${companyInfo.contact.email}
            </a>
            &nbsp;·&nbsp;
            <a href="${companyInfo.web.url}"
               style="color:#F97316;text-decoration:none;">
              ${companyInfo.web.url.replace("https://", "")}
            </a>
          </p>
        </td>
      </tr>
    </table>
  `;
}

export function companySignatureText(): string {
  return [
    "---",
    companyInfo.legalName,
    companyInfo.address.full,
    companyInfo.contact.email,
    companyInfo.web.url,
  ].join("\n");
}
```

Obě order šablony budou volat `emailLayout(content, companySignatureHtml())` místo broker signature.

---

## 8. Napojení do webhooku — `app/api/stripe/webhook/route.ts`

### Odstranit (line 255-400)
Celé helpery `buildCustomerEmailHtml()` a `buildSupplierEmailHtml()` — jsou nahrazeny importy.

### Přidat imports na vrch souboru
```typescript
import {
  orderConfirmationCustomerHtml,
  orderConfirmationCustomerText,
  orderConfirmationCustomerSubject,
  type OrderConfirmationCustomerData,
} from "@/lib/email-templates/order-confirmation-customer";
import {
  orderNotificationSupplierHtml,
  orderNotificationSupplierText,
  orderNotificationSupplierSubject,
  type OrderNotificationSupplierData,
} from "@/lib/email-templates/order-notification-supplier";
```

### Upravit `sendOrderNotificationEmails()` (line 184-250)

Uvnitř funkce se načte `order` včetně items+supplier — **zůstane stejné**.

**(A) Zákaznický email** — nahradit:
```typescript
// STARÉ:
await sendEmail({
  to: order.deliveryEmail,
  subject: `${dryRunPrefix}Objednávka ${order.orderNumber} byla odeslána`,
  html: buildCustomerEmailHtml(order, shipment),
});

// NOVÉ:
const customerData: OrderConfirmationCustomerData = {
  orderNumber: order.orderNumber,
  customerName: order.deliveryName,
  totalPrice: order.totalPrice,
  deliveryMethod: order.deliveryMethod,
  carrier: shipment.carrier,
  trackingNumber: shipment.trackingNumber,
  trackingUrl: shipment.trackingUrl,
  zasilkovnaPointName: order.zasilkovnaPointName,
  deliveryAddress: order.deliveryMethod === "ZASILKOVNA" ? null : {
    name: order.deliveryName,
    street: order.deliveryAddress,
    city: order.deliveryCity,
    zip: order.deliveryZip,
  },
  items: order.items.map((it) => ({
    name: it.part.name,
    quantity: it.quantity,
    price: it.price,
  })),
  dryRun: shipment.dryRun,
};
await sendEmail({
  to: order.deliveryEmail,
  subject: orderConfirmationCustomerSubject(customerData),
  html: orderConfirmationCustomerHtml(customerData),
  text: orderConfirmationCustomerText(customerData),
});
```

**(B) Supplier email** — nahradit volání v loopu `for (const [supplierId, supplierItems] of itemsBySupplier)`:
```typescript
const supplierData: OrderNotificationSupplierData = {
  orderNumber: order.orderNumber,
  supplierName:
    supplier.partnerAccount?.name ??
    supplier.companyName ??
    `${supplier.firstName ?? ""} ${supplier.lastName ?? ""}`.trim() ??
    "Dodavatel",
  items: supplierItems.map((it) => ({
    name: it.part.name,
    partNumber: it.part.partNumber,
    quantity: it.quantity,
  })),
  delivery: {
    method: order.deliveryMethod,
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    labelUrl: shipment.labelUrl,
    zasilkovnaPointName: order.zasilkovnaPointName,
    address: order.deliveryMethod === "ZASILKOVNA" ? null : {
      name: order.deliveryName,
      phone: order.deliveryPhone,
      street: order.deliveryAddress,
      city: order.deliveryCity,
      zip: order.deliveryZip,
    },
  },
  hasMultipleSuppliers: itemsBySupplier.size > 1,
  dryRun: shipment.dryRun,
};
await sendEmail({
  to: recipientEmail,
  subject: orderNotificationSupplierSubject(supplierData),
  html: orderNotificationSupplierHtml(supplierData),
  text: orderNotificationSupplierText(supplierData),
});
```

### Odstranit nepoužívaný import
`dryRunPrefix` proměnná v současné funkci se už nepoužívá (subject si to řeší uvnitř šablony). Odstranit řádek `const dryRunPrefix = shipment.dryRun ? "[DRY-RUN] " : "";`.

### Existující order include (line 189-210)
Je už dostatečný — obsahuje `items.part.name/partNumber` a `items.supplier.{firstName,lastName,companyName,partnerAccount}`. **Není třeba přidávat dalších selectů.**

**Přidat ale:** `items.price` (unit price) a `items.quantity` nejsou v include — jsou to direct columns na `OrderItem`, takže už defaultně jsou.

---

## 9. Klíčová rozhodnutí

### 9.1 Proč 3 oddělené funkce Html/Text/Subject?
Konvence celého `lib/email-templates/`. Text verze je důležitá pro doručitelnost (spam filtry preferují multipart emails). Resend `sendEmail()` podporuje `text` field — nyní se nepředává (placeholder byl jen HTML), po refactoru bude.

### 9.2 Proč přeskočit factory `generateEmail()`?
Factory čeká `BrokerSignatureData`. Order flow nemá přiděleného brokera. Mohl bych rozšířit factory, ale to znamená měnit existující API pro 11 broker šablon. Jednodušší: webhook importuje order šablony přímo.

### 9.3 Proč samostatný `company-signature.ts`, ne inline v šablonách?
- DRY — 2 order šablony + potenciálně další budoucí šablony (faktura, refund confirmation, ...) ji budou sdílet
- Centrální `companyInfo` changes se propagují automaticky

### 9.4 Proč neměnit existující `signature.ts`?
`signature.ts` má BrokerSignatureData s foto/brokerId — specifické pro broker flow. Roztáhnout ho na "union type Broker | Company" by znamenalo touch do 11 broker šablon. Rizikový refactor mimo scope této úlohy.

### 9.5 Co s `index.ts` factory a `TEMPLATE_LIST`?
Neměnit. Order šablony nejsou "broker emails" které admin odesílá skrz interní UI — to je use case pro factory. Order emails jsou automatické, volané webhookem.

### 9.6 Proč webhook importuje přímo, ne přes `lib/email/order-emails.ts`?
Task #17 plán navrhoval `lib/email/order-emails.ts` jako layer, ale implementace šla inline do webhooku. Neměním directory strukturu — místo toho webhook volá `lib/email-templates/*` přímo. Méně souborů, méně indirekce.

**Pokud team-lead chce layer** (funkce `sendOrderConfirmationToCustomer(order, shipment)` která uvnitř zavolá šablonu + resend): napíšu followup plán. Pro MVP stačí webhook → šablona přímo.

### 9.7 Localized delivery method názvy
Jsou duplicitní mezi `lib/shipping/prices.ts` (SHIPPING_METHOD_INFO z plánu #18) a budoucí localizedDeliveryMethod helper v šabloně. **Řešení:** Šablona bude importovat `SHIPPING_METHOD_INFO[method]?.label` z plánu #18, pokud už bude implementován. Pokud ne, lokální helper uvnitř order-confirmation-customer.ts jako fallback.

---

## 10. Co NEDĚLAT (out of scope)

- **Ne** vytvářet `lib/email/templates/` — existuje konvence `lib/email-templates/`
- **Ne** vytvářet admin UI pro správu šablon — order emails jsou 100% automatizované
- **Ne** řešit i18n (jen čeština). Multi-jazyk je out of scope MVP.
- **Ne** přepisovat `signature.ts` ani `lib/email-templates/index.ts` factory — order šablony jdou bokem
- **Ne** přidat attachment s PDF štítkem do (B) emailu — label je link, ne attachment. Attachement by vyžadoval fetch PDF z Cloudinary/dopravce → timeout risk ve webhooku. Post-MVP.
- **Ne** řešit retry/queue pro emaily — `sendEmail()` v `lib/resend.ts` má graceful fallback, error je logován, webhook pokračuje. Dead letter queue je post-MVP.
- **Ne** měnit Stripe webhook handling flow — jen nahradit HTML builder funkce
- **Ne** řešit BANK_TRANSFER / COD emaily — tam Stripe webhook vůbec neběží (task #17 plán line 22-24). BANK_TRANSFER/COD emaily po manuálním potvrzení adminem jsou samostatný task (budoucí).

---

## 11. Akceptační kritéria

Hotovo, když:

- [ ] `lib/email-templates/order-confirmation-customer.ts` existuje a exportuje `orderConfirmationCustomerHtml/Text/Subject(data)`
- [ ] `lib/email-templates/order-notification-supplier.ts` existuje a exportuje `orderNotificationSupplierHtml/Text/Subject(data)`
- [ ] `lib/email-templates/company-signature.ts` existuje a exportuje `companySignatureHtml()` / `companySignatureText()`
- [ ] `app/api/stripe/webhook/route.ts` odstraní `buildCustomerEmailHtml()` a `buildSupplierEmailHtml()` (line 255-400) a importuje nové šablony
- [ ] `sendOrderNotificationEmails()` volá nové `xxxHtml/Text/Subject` funkce a předává `text:` field do `sendEmail()`
- [ ] Šablony používají `emailLayout()` z `lib/email-templates/layout.ts` (orange brand, Outfit font)
- [ ] Dry-run banner se zobrazí pouze když `shipment.dryRun === true`
- [ ] Subject prefix `[DRY-RUN] ` pouze při dry-run
- [ ] Adresa zákazníka se zobrazí pouze pokud `deliveryMethod !== "ZASILKOVNA"`, jinak se zobrazí pointName
- [ ] Multi-supplier warning se zobrazí pouze pokud objednávka má položky od >1 supplierů
- [ ] CTA tlačítka (customer: "Sledovat zásilku", supplier: "Stáhnout PDF štítek") vedou na `shipment.trackingUrl` a `shipment.labelUrl`
- [ ] `escapeHtml()` aplikováno na všechny user-supplied stringy (customerName, supplierName, partName, adresa, ...)
- [ ] `formatCzk()` použit pro `totalPrice` a všechny item prices
- [ ] Text verze je plain text bez HTML tagů, s oddělovači `---`
- [ ] `npm run build` projde bez TypeScript errorů
- [ ] Manuální test: vyrobit testovací order s `paymentMethod=CARD`, trigger webhooku přes Stripe CLI, ověřit maily v Resend dashboardu / logu

---

## 12. Poznámky pro implementátora

1. **Vzor: `lib/email-templates/contract-offer.ts`** je nejjednodušší reference. Kopíruj strukturu, přepiš interface a content.

2. **HTML v šablonách musí být inline-CSS** — email klienti (Outlook, Gmail) nepodporují external CSS ani `<style>` bloky ve většině případů. `emailLayoutHTML` to řeší pro wrapper, ale uvnitř `content` musí být všechno inline.

3. **Testování šablon:** Nejlepší je udělat malý `scripts/preview-order-emails.ts` který vygeneruje HTML + uloží do souboru → otevřít v prohlížeči. Není to required ale ušetří čas. NENÍ v scope plán (pouze hint).

4. **Pozor na `escapeHtml()`:** Všechny user-provided fields musí být escapované (customerName, adresa, jména dílů). `orderNumber`, `trackingNumber`, `trackingUrl`, `labelUrl` pocházejí z interního systému → escapování volitelné, ale doporučené pro defense in depth.

5. **`formatCzk()`** vrací string s `Kc` (bez diakritiky — `escapeHtml` bezpečný). Pokud chceš `Kč`, uprav v `layout.ts`, ale vyhraje se to ve více šablonách.

6. **Stripe webhook se musí rebuildovat** (restart dev serveru) — Next.js někdy nechytne imports z nových souborů bez restartu.

