# Plán — Task #17: Stripe webhook + automatické vytvoření zásilky

**Autor:** planovac (agent team)
**Datum:** 2026-04-06
**Task ID:** #17
**Status:** Naplánováno — připraveno k implementaci
**Revize:** v2 (podle rozšířeného zadání team-leada z 2026-04-06)

---

## 1. Cíl

Po úspěšné **CARD** platbě přes Stripe Checkout:

1. Označit objednávku jako zaplacenou (`paymentStatus = "PAID"`, `paidAt = now()`)
2. Automaticky vytvořit zásilku u dopravce přes `createShipmentForOrder(orderId)` z `lib/shipping/dispatcher.ts`
3. Odeslat 2 placeholder emaily přes Resend:
   - **(A)** Zákazníkovi — potvrzení + tracking URL
   - **(B)** Vrakovišti (supplier dílu) — PDF štítek link + doručovací adresa zákazníka
4. Dry-run safe: když `shipment.dryRun === true`, prefix `[DRY-RUN]` v subjectu + banner v HTML
5. Idempotentní: opakovaný webhook nevytvoří duplicitní zásilku ani duplicitní maily
6. Při selhání shipmentu/mailu **neshodit** webhook — jen zalogovat + poslat admin notifikaci, webhook vrací 200

**BANK_TRANSFER + COD:** Tento task se jich **netýká**. Stripe webhook se pro ně nevolá (Checkout session je jen pro CARD). Shipment se u těchto metod vytváří až po manuálním potvrzení platby BackOffice adminem — samostatný task později (task #18/21 oblast).

Reálné email templates jsou out-of-scope (řeší task #19). V tomto tasku jen placeholder funkce v `lib/email/order-emails.ts` s inline HTML stringy.

---

## 2. Dotčené soubory

| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 1 | `app/api/stripe/webhook/route.ts` | **Edit** | Rozšířit `handleOrderPayment()` o volání dispatcheru + email orchestraci |
| 2 | `lib/email/order-emails.ts` | **Create** (nový) | 2 placeholder funkce: `sendOrderConfirmationToCustomer`, `sendOrderNotificationToSupplier` + `sendAdminFailureNotification` |
| 3 | `prisma/schema.prisma` | **Edit** | Přidat na `Order`: `paidAt`, `customerNotifiedAt`, `supplierNotifiedAt` (3 nullable DateTime pro idempotenci) |
| 4 | `prisma/migrations/<timestamp>_order_notification_fields/migration.sql` | **Create** (auto) | Prisma migrate dev to vygeneruje |
| 5 | `lib/shipping/dispatcher.ts` | — | Už hotové (task #16). Pouze se importuje. |
| 6 | `lib/resend.ts` | — | Už existuje `sendEmail()` helper. Pouze se importuje v novém `lib/email/order-emails.ts`. |

**Pro implementátora:**
```bash
npx prisma migrate dev --name order_notification_fields
```

---

## 3. Klíčová rozhodnutí

### 3.1 Kdy volat `createShipmentForOrder()`
Pouze po **`checkout.session.completed`** eventu s metadata `orderId`. Toto je jediný Stripe event pro objednávky z eshopu (POST `/api/orders` vytváří Checkout session s `metadata.orderId`). BANK_TRANSFER a COD nejdou přes Stripe → webhook je neuvidí.

Dispatcher sám skipne PICKUP (vrátí `null`) a idempotentně přeskočí orders, co už mají `trackingNumber`. Webhook handler nemusí nic z toho řešit.

### 3.2 Guard: skip pokud už PAID
Před jakoukoli akcí: `if (order.paymentStatus === "PAID") return;`. Stripe může doručit webhook víckrát (rare, ale specifikace to umožňuje). Bez tohoto guardu bychom riskovali druhou emailovou salvu i když `trackingNumber` check u dispatcheru sám zabrání duplikátní zásilce.

### 3.3 Pořadí operací v `handleOrderPayment()`
```
1. Načíst Order (transaction není potřeba, Stripe je async)
2. Guard: if already PAID → return (idempotence)
3. UPDATE Order SET paymentStatus="PAID", paidAt=now()
4. createShipmentForOrder(orderId)
   └─ může hodit → catch → admin notifikace → return (ale PAID zůstane!)
5. Pokud vrátí null (PICKUP) → return (není co posílat)
6. Customer email
   └─ pokud !customerNotifiedAt → pošli → UPDATE customerNotifiedAt
7. Supplier email(y) — loop per unikátní supplier
   └─ pokud !supplierNotifiedAt → pošli → UPDATE supplierNotifiedAt
8. return → webhook odpoví 200
```

**Proč ne UPDATE ship-fieldů až po PAID:**
Protože dispatcher sám ukládá `trackingNumber/trackingUrl/shippingLabelUrl` do DB v jedné separátní transakci. Rollback shipment-create fail nezpůsobí rollback `paymentStatus` — a to je **správné chování**. Platba se stala, objednávka je zaplacená; jen zásilka se nepodařila. Admin to pak dokončí ručně.

### 3.4 Idempotence emailů — 3 nové DB fieldy
```prisma
model Order {
  // ...existing fields...
  paidAt               DateTime? // Kdy byla označena jako zaplacená
  customerNotifiedAt   DateTime? // Kdy šel mail zákazníkovi
  supplierNotifiedAt   DateTime? // Kdy šel mail vrakovišti(m)
}
```

**Proč samostatné fieldy pro customer a supplier:** Pokud se customer mail povede, ale supplier mail spadne kvůli timeoutu, retry má poslat **jen** supplier mail (customer by dostal duplikát). Jeden kombinovaný flag toto nerozliší.

**Proč ne jen log check:** EmailLog je volitelný, a přečíst ho před každým mailem je overhead. Boolean na `Order` je rychlé a konzistentní.

**Design choice — single supplier field vs. per-supplier tracking:** Zjednodušení — předpokládáme, že buď všichni supplieři dostanou mail, nebo nikdo. Pokud jeden pošle OK a druhý selže, `supplierNotifiedAt` zůstane null a retry pošle všem znovu (duplikát u jednoho supplieru je akceptovatelný u MVP). Plnohodnotná per-supplier idempotence je mimo scope MVP.

### 3.5 Error handling — webhook MUSÍ vracet 200
Stripe retry loop opakuje webhook při non-2xx odpovědi. Pokud shipment API spadne (např. timeout), **nechceme** aby Stripe retry pořád tocil — jinak se objednávka „zasekne" v peklu retry.

Proto:
- `handleOrderPayment()` obalit `try/catch` — chyby uvnitř **logovat a spolknout**
- Při selhání shipmentu volat `sendAdminFailureNotification(orderId, error)` — admin email s popisem
- `paymentStatus: "PAID"` se nevrací zpět — platba proběhla, jen shipping workflow má problém
- Webhook vrací `200` i když email selhal

### 3.6 Admin notifikace při selhání
Nová funkce `sendAdminFailureNotification(orderId, errorMsg)`. Pošle mail na `ADMIN_NOTIFICATION_EMAIL` (ENV, fallback `info@carmakler.cz`) se subjectem `[ALERT] Order <orderNumber> shipment pipeline failed` a inline HTML s detaily (orderId, chyba, stack trace).

**Použití:**
- Shipment create fail
- Customer email fail (po několika `!success`)
- Supplier email fail
- Unhandled exception v handleru

### 3.7 Multi-supplier objednávka
`OrderItem.supplierId` ukazuje na `User` (role `PARTS_SUPPLIER` nebo `PARTNER_VRAKOVISTE`). **Jedna objednávka může obsahovat díly od víc vrakovišť.**

- **Jeden tracking štítek na celou objednávku** (dispatcher vrací jedno `labelUrl`)
- **Samostatný mail každému unikátnímu supplierovi** — loop přes Map<supplierId, items[]>
- **Warning v HTML:** Když `itemsBySupplier.size > 1`, přidat červený banner „Pozor: objednávka od více dodavatelů, koordinace přes BackOffice"
- Reálný workflow (samostatný label per supplier) = mimo MVP

### 3.8 Získání adresy vrakoviště pro mail
Dotazovací řetězec:
```
OrderItem.supplier (User)
  └─ user.partnerAccount (Partner)  // relation "PartnerUser"
     └─ partner.address, partner.city, partner.zip, partner.email
```

Fallback: Pokud `user.partnerAccount === null`, použít `user.email` a v mailu napsat „Adresa: viz Váš účet v CarMakler BackOffice".

Pokud user nemá ani email (neměl by nastat, ale...): `console.warn` + skip tohoto supplieru + admin notifikace.

---

## 4. Prisma migrace — `Order` model

**Diff v `prisma/schema.prisma` u `model Order`** (okolo řádku 1004-1007, za `deliveredAt`):

```diff
  // Tracking + přepravní štítek (generované naším systémem přes API dopravce)
  trackingNumber   String?
  trackingCarrier  String?
  trackingUrl      String?
  shippingLabelUrl String?
  shippedAt        DateTime?
  deliveredAt      DateTime?
+
+ // Idempotence + audit — kdy proběhlo označení jako zaplacené a odesílání notifikací
+ paidAt               DateTime?
+ customerNotifiedAt   DateTime?
+ supplierNotifiedAt   DateTime?
```

**Command pro implementátora:**
```bash
npx prisma migrate dev --name order_notification_fields
```

Migrace bude additive (nové nullable sloupce) → nulový dopad na existující data.

---

## 5. Nový soubor: `lib/email/order-emails.ts`

**Kompletní kód (placeholder implementace):**

```typescript
/**
 * Order emaily — placeholder HTML šablony pro notifikace po zaplacení objednávky.
 *
 * Reálné plnohodnotné templaty dodá task #19 (lib/email-templates/order-*.tsx).
 * Tento soubor exportuje funkce, které orchestrace ve webhook handleru volá.
 *
 * Všechny funkce jsou dry-run safe: když dispatcher vrátí result s dryRun=true,
 * subject obsahuje prefix [DRY-RUN] a HTML má výrazný banner.
 */

import { sendEmail } from "@/lib/resend";
import type { CreateShipmentResult } from "@/lib/shipping/types";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "info@carmakler.cz";

/* ------------------------------------------------------------------ */
/*  Pomocné typy                                                       */
/* ------------------------------------------------------------------ */

interface CustomerEmailOrder {
  orderNumber: string;
  deliveryName: string;
  deliveryEmail: string;
  totalPrice: number;
}

interface SupplierEmailOrder {
  orderNumber: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZip: string;
  deliveryMethod: string;
  zasilkovnaPointName: string | null;
}

interface SupplierEmailItem {
  quantity: number;
  part: { name: string; partNumber: string | null };
}

/* ------------------------------------------------------------------ */
/*  (A) Customer email                                                  */
/* ------------------------------------------------------------------ */

export async function sendOrderConfirmationToCustomer(
  order: CustomerEmailOrder,
  shipment: CreateShipmentResult,
): Promise<{ success: boolean; error?: string }> {
  const dryRunPrefix = shipment.dryRun ? "[DRY-RUN] " : "";
  const subject = `${dryRunPrefix}Objednávka ${order.orderNumber} byla odeslána`;

  const dryRunBanner = shipment.dryRun
    ? `<div style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;margin-bottom:16px;border-radius:4px;">
         <strong>DRY-RUN režim</strong> — tato zásilka nebyla skutečně vytvořena u dopravce.
         Pro produkční odeslání musí být nastaveny API klíče dopravců.
       </div>`
    : "";

  const priceCzk = order.totalPrice.toLocaleString("cs-CZ");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      ${dryRunBanner}
      <h1 style="color:#F97316;">Děkujeme za objednávku!</h1>
      <p>Dobrý den ${order.deliveryName},</p>
      <p>Vaše objednávka <strong>${order.orderNumber}</strong> byla zaplacena a odeslána přes
      <strong>${shipment.carrier}</strong>.</p>

      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr>
          <td style="padding:8px;border:1px solid #eee;"><strong>Číslo objednávky</strong></td>
          <td style="padding:8px;border:1px solid #eee;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #eee;"><strong>Celková cena</strong></td>
          <td style="padding:8px;border:1px solid #eee;">${priceCzk} Kč</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #eee;"><strong>Dopravce</strong></td>
          <td style="padding:8px;border:1px solid #eee;">${shipment.carrier}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #eee;"><strong>Tracking číslo</strong></td>
          <td style="padding:8px;border:1px solid #eee;"><code>${shipment.trackingNumber}</code></td>
        </tr>
      </table>

      <p style="margin:24px 0;">
        <a href="${shipment.trackingUrl}"
           style="background:#F97316;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">
           Sledovat zásilku
        </a>
      </p>

      <p style="color:#666;font-size:13px;margin-top:32px;">
        Tento email je automatický. Děkujeme, že nakupujete u CarMakleru.<br>
        V případě dotazů pište na <a href="mailto:info@carmakler.cz">info@carmakler.cz</a>.
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: order.deliveryEmail,
    subject,
    html,
  });

  return { success: result.success, error: result.error };
}

/* ------------------------------------------------------------------ */
/*  (B) Supplier email                                                  */
/* ------------------------------------------------------------------ */

export async function sendOrderNotificationToSupplier(
  recipientEmail: string,
  order: SupplierEmailOrder,
  items: SupplierEmailItem[],
  shipment: CreateShipmentResult,
  hasMultipleSuppliers: boolean,
): Promise<{ success: boolean; error?: string }> {
  const dryRunPrefix = shipment.dryRun ? "[DRY-RUN] " : "";
  const subject = `${dryRunPrefix}Nová objednávka k odeslání: ${order.orderNumber}`;

  const dryRunBanner = shipment.dryRun
    ? `<div style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;margin-bottom:16px;border-radius:4px;">
         <strong>DRY-RUN režim</strong> — toto je jen test, štítek není skutečný.
       </div>`
    : "";

  const multiSupplierWarning = hasMultipleSuppliers
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;padding:12px;margin:16px 0;border-radius:4px;">
         <strong>Pozor:</strong> Tato objednávka obsahuje položky od více dodavatelů.
         Kontaktujte prosím BackOffice CarMakler pro koordinaci balení a odeslání.
       </div>`
    : "";

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border:1px solid #eee;">${item.part.name}</td>
          <td style="padding:8px;border:1px solid #eee;">${item.part.partNumber ?? "—"}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:right;">${item.quantity}×</td>
        </tr>`,
    )
    .join("");

  const deliveryInfo =
    order.deliveryMethod === "ZASILKOVNA" && order.zasilkovnaPointName
      ? `<p><strong>Výdejní místo Zásilkovny:</strong> ${order.zasilkovnaPointName}</p>`
      : `<p><strong>Doručovací adresa:</strong><br>
         ${order.deliveryName}<br>
         ${order.deliveryAddress}<br>
         ${order.deliveryZip} ${order.deliveryCity}<br>
         Tel: ${order.deliveryPhone}</p>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      ${dryRunBanner}
      <h1 style="color:#F97316;">Nová objednávka k odeslání</h1>
      <p>Objednávka <strong>${order.orderNumber}</strong> byla zaplacena. Prosíme, zabalte níže uvedené
      položky a vytiskněte přepravní štítek.</p>

      ${multiSupplierWarning}

      <h2 style="font-size:16px;margin-top:24px;">Položky k odeslání</h2>
      <table style="border-collapse:collapse;width:100%;margin:8px 0;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px;border:1px solid #eee;text-align:left;">Díl</th>
            <th style="padding:8px;border:1px solid #eee;text-align:left;">Part Number</th>
            <th style="padding:8px;border:1px solid #eee;text-align:right;">Ks</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <h2 style="font-size:16px;margin-top:24px;">Doručení</h2>
      ${deliveryInfo}
      <p><strong>Dopravce:</strong> ${shipment.carrier}</p>
      <p><strong>Tracking:</strong> <code>${shipment.trackingNumber}</code></p>

      <p style="margin:24px 0;">
        <a href="${shipment.labelUrl}"
           style="background:#F97316;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">
           Stáhnout PDF štítek
        </a>
      </p>

      <p style="color:#666;font-size:13px;margin-top:32px;">
        Po zabalení nalepte štítek a předejte zásilku dopravci.<br>
        V případě problémů kontaktujte <a href="mailto:info@carmakler.cz">info@carmakler.cz</a>.
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: recipientEmail,
    subject,
    html,
  });

  return { success: result.success, error: result.error };
}

/* ------------------------------------------------------------------ */
/*  (C) Admin failure notification                                      */
/* ------------------------------------------------------------------ */

export async function sendAdminFailureNotification(
  orderId: string,
  orderNumber: string | null,
  errorMessage: string,
  stage: "shipment" | "customer-email" | "supplier-email" | "unknown",
): Promise<void> {
  const subject = `[ALERT] Order ${orderNumber ?? orderId} — ${stage} failed`;
  const html = `
    <div style="font-family:monospace;max-width:700px;padding:16px;">
      <h2 style="color:#dc2626;">Stripe webhook pipeline failure</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Order number:</strong> ${orderNumber ?? "(not loaded)"}</p>
      <p><strong>Failed stage:</strong> ${stage}</p>
      <p><strong>Error:</strong></p>
      <pre style="background:#f3f4f6;padding:12px;border-radius:4px;white-space:pre-wrap;">${escapeHtml(
        errorMessage,
      )}</pre>
      <p><strong>Akce:</strong> Zkontrolujte stav objednávky v adminu a manuálně dokončete shipping workflow.</p>
      <p style="color:#666;font-size:12px;margin-top:24px;">
        Tato notifikace byla vygenerována automaticky Stripe webhook handlerem.
      </p>
    </div>
  `;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

---

## 6. Úprava `app/api/stripe/webhook/route.ts`

### 6.1 Přidané importy (nahoru)
```typescript
import { createShipmentForOrder } from "@/lib/shipping/dispatcher";
import {
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToSupplier,
  sendAdminFailureNotification,
} from "@/lib/email/order-emails";
```

### 6.2 Přepsaný `handleOrderPayment()`

```typescript
/* ------------------------------------------------------------------ */
/*  handleOrderPayment — volaný po Stripe checkout.session.completed   */
/* ------------------------------------------------------------------ */
async function handleOrderPayment(orderId: string) {
  // 1) Načti order včetně items + suppliers (pro email orchestraci)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          part: { select: { name: true, partNumber: true } },
          supplier: {
            select: {
              id: true,
              email: true,
              partnerAccount: {
                select: { email: true, name: true, address: true, city: true, zip: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    console.error(`[webhook] Order ${orderId} not found`);
    return;
  }

  // 2) Idempotence guard — pokud už je PAID, skipni (Stripe rare duplikát)
  if (order.paymentStatus === "PAID") {
    console.log(`[webhook] Order ${order.orderNumber} already PAID, skipping duplicate webhook`);
    return;
  }

  // 3) Označ jako zaplacené (musí se povést — kritický update)
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
    },
  });

  // 4) Shipment create — errors spolknuty, admin se dozví přes mail
  let shipment: Awaited<ReturnType<typeof createShipmentForOrder>> = null;
  try {
    shipment = await createShipmentForOrder(orderId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[webhook] createShipmentForOrder failed for ${order.orderNumber}:`, err);
    await sendAdminFailureNotification(orderId, order.orderNumber, msg, "shipment").catch(
      (e) => console.error("[webhook] Admin notification also failed:", e),
    );
    return; // PAID zůstává, admin dokončí manuálně
  }

  // 5) PICKUP → dispatcher vrátil null, nic neposíláme
  if (!shipment) {
    console.log(`[webhook] Order ${order.orderNumber}: PICKUP, no emails sent`);
    return;
  }

  // 6) Customer email — jen pokud ještě nebyl poslán
  if (!order.customerNotifiedAt) {
    try {
      const res = await sendOrderConfirmationToCustomer(
        {
          orderNumber: order.orderNumber,
          deliveryName: order.deliveryName,
          deliveryEmail: order.deliveryEmail,
          totalPrice: order.totalPrice,
        },
        shipment,
      );
      if (res.success) {
        await prisma.order.update({
          where: { id: orderId },
          data: { customerNotifiedAt: new Date() },
        });
      } else {
        console.error(`[webhook] Customer email failed: ${res.error}`);
        await sendAdminFailureNotification(
          orderId,
          order.orderNumber,
          res.error ?? "unknown",
          "customer-email",
        ).catch((e) => console.error("[webhook] Admin notification failed:", e));
      }
    } catch (err) {
      console.error(`[webhook] Customer email threw:`, err);
    }
  }

  // 7) Supplier email(y) — per unikátní supplierId
  if (!order.supplierNotifiedAt) {
    try {
      await sendSupplierEmails(order, shipment);
      await prisma.order.update({
        where: { id: orderId },
        data: { supplierNotifiedAt: new Date() },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[webhook] Supplier emails failed:`, err);
      await sendAdminFailureNotification(orderId, order.orderNumber, msg, "supplier-email").catch(
        (e) => console.error("[webhook] Admin notification failed:", e),
      );
    }
  }
}
```

### 6.3 Nová pomocná funkce `sendSupplierEmails()`

```typescript
/**
 * Iteruje přes unikátní supplierIds v objednávce a pošle každému mail
 * se seznamem jeho položek a společným shipping labelem.
 */
async function sendSupplierEmails(
  order: {
    orderNumber: string;
    deliveryName: string;
    deliveryPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryZip: string;
    deliveryMethod: string;
    zasilkovnaPointName: string | null;
    items: Array<{
      supplierId: string;
      quantity: number;
      part: { name: string; partNumber: string | null };
      supplier: {
        email: string;
        partnerAccount: { email: string | null } | null;
      };
    }>;
  },
  shipment: CreateShipmentResult,
) {
  // Seskupit items podle supplierId
  type SupplierBucket = {
    recipientEmail: string | null;
    items: Array<{ quantity: number; part: { name: string; partNumber: string | null } }>;
  };
  const bySupplier = new Map<string, SupplierBucket>();

  for (const item of order.items) {
    const existing = bySupplier.get(item.supplierId);
    const email = item.supplier.partnerAccount?.email ?? item.supplier.email;

    if (existing) {
      existing.items.push({ quantity: item.quantity, part: item.part });
    } else {
      bySupplier.set(item.supplierId, {
        recipientEmail: email || null,
        items: [{ quantity: item.quantity, part: item.part }],
      });
    }
  }

  const hasMultipleSuppliers = bySupplier.size > 1;

  for (const [supplierId, bucket] of bySupplier) {
    if (!bucket.recipientEmail) {
      console.warn(`[webhook] Supplier ${supplierId} has no email — skipping`);
      continue;
    }

    const res = await sendOrderNotificationToSupplier(
      bucket.recipientEmail,
      {
        orderNumber: order.orderNumber,
        deliveryName: order.deliveryName,
        deliveryPhone: order.deliveryPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryCity: order.deliveryCity,
        deliveryZip: order.deliveryZip,
        deliveryMethod: order.deliveryMethod,
        zasilkovnaPointName: order.zasilkovnaPointName,
      },
      bucket.items,
      shipment,
      hasMultipleSuppliers,
    );

    if (!res.success) {
      // Vyhodí — aby volající setnul flag pouze při úspěchu všech
      throw new Error(`Supplier email failed (${supplierId}): ${res.error}`);
    }
  }
}
```

### 6.4 `CreateShipmentResult` import
Přidat do importů na začátku souboru:
```typescript
import type { CreateShipmentResult } from "@/lib/shipping/types";
```

---

## 7. ENV proměnné

| ENV | Existuje? | Popis | Default |
|-----|-----------|-------|---------|
| `STRIPE_WEBHOOK_SECRET` | ✅ | Už používáno v `lib/stripe.ts` | — (povinný v prod) |
| `RESEND_API_KEY` | ✅ | Už používáno v `lib/resend.ts` | — (fallback `sendEmail` vrací `{success:false}` + log) |
| `RESEND_FROM_EMAIL` | ✅ | FROM adresa pro všechny maily | `info@carmakler.cz` |
| `ADMIN_NOTIFICATION_EMAIL` | ❌ **NOVÉ** | Kam posílat failure notifikace | `info@carmakler.cz` |

**Pro task #20 (.env.example):** Přidat jediný nový řádek:
```bash
# Email adresa pro admin failure notifikace (webhook errors, shipment failures)
ADMIN_NOTIFICATION_EMAIL="info@carmakler.cz"
```

---

## 8. Edge cases + jak je plán řeší

| # | Edge case | Řešení |
|---|-----------|--------|
| 1 | PICKUP objednávka | Dispatcher vrací `null` → handler nic neposílá, jen zaloguje |
| 2 | Duplikátní webhook (Stripe retry) | Guard na `paymentStatus === "PAID"` + `customerNotifiedAt` + `supplierNotifiedAt` check → skip |
| 3 | Shipment API (dopravce) spadne | try/catch → admin notifikace → PAID zůstává → webhook vrací 200 |
| 4 | Email Resend spadne | `sendEmail` vrací `{success: false}` → admin notifikace → flag se nesetne (retry je možný) |
| 5 | `RESEND_API_KEY` nenastavený | `sendEmail` warning + `{success:false}` → admin notifikace taky spadne (benign v dev) |
| 6 | Order nemá items | `bySupplier` zůstane prázdná Mapa → supplier loop nic neudělá, customer mail stále odchází |
| 7 | Dispatcher vrátí dryRun=true | `dryRunPrefix = "[DRY-RUN] "` + banner v HTML |
| 8 | Supplier bez `partnerAccount` | Fallback: `supplier.email` |
| 9 | Supplier bez jakéhokoli emailu | `console.warn` + skip + supplierNotifiedAt se NEsetne → retry pak zkusí znovu (admin musí doplnit email) |
| 10 | Více dodavatelů v objednávce | Loop přes unikátní supplierIds + červený warning banner v HTML |
| 11 | `paymentMethod === "COD"` objednávka | Stripe Checkout se pro COD nevytváří → webhook se na ní nevolá |
| 12 | `paymentMethod === "BANK_TRANSFER"` | Stejně — webhook se na ni nevolá, shipment vytvoří admin manuálně |
| 13 | Customer mail OK + supplier mail fail | `customerNotifiedAt` setnuto, `supplierNotifiedAt` NE → retry webhooku pošle jen supplier, customer dostane maximálně jeden mail |
| 14 | Jeden supplier v multi-supplier orderu OK, druhý fail | `throw` v `sendSupplierEmails` → `supplierNotifiedAt` NEsetnuto → retry pošle znovu všem (duplikát u jednoho akceptovatelný u MVP) |
| 15 | Admin notification sama selže | `.catch((e) => console.error(...))` — nekaskáduje, aspoň v logu vidíme |

---

## 9. Testování

### 9.1 Manuální (dry-run, žádné API klíče nutné)
1. `npm run dev`
2. `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI)
3. Přes `/dily/kosik` projít až ke Stripe checkoutu (test karta `4242 4242 4242 4242`)
4. Po úspěšné platbě zkontrolovat:
   - Log: `[shipping] Created dry-run shipment for order ...`
   - Log: `[Email:DEV] Would send to: <customer>, subject: "[DRY-RUN] Objednávka ... odeslána"`
   - Log: `[Email:DEV] Would send to: <supplier>, subject: "[DRY-RUN] Nová objednávka k odeslání ..."`
   - V DB: `paymentStatus="PAID"`, `paidAt`, `customerNotifiedAt`, `supplierNotifiedAt` jsou setnuté, `trackingNumber` začíná `DRY-RUN`

### 9.2 Idempotence test
Zavolat webhook **dvakrát** stejným event ID (nebo přes `stripe trigger` 2×):
- Druhé volání: log `Order ... already PAID, skipping`
- V DB: žádné zdvojení, flagy zůstávají stejné

### 9.3 Shipment failure test (fault injection)
Dočasně v `lib/shipping/dispatcher.ts` vyhodit chybu → webhook volání → ověřit:
- Log: `createShipmentForOrder failed for ...`
- Log: `[Email:DEV] Would send to: <admin>, subject: "[ALERT] Order ... shipment failed"`
- DB: `paymentStatus="PAID"` (ne rollbacknuté), `customerNotifiedAt` = null (protože shipment fail přerušil flow)

### 9.4 Unit testy (volitelné, task #19 nebo později)
- Mock `createShipmentForOrder` + `sendEmail`, invokovat `handleOrderPayment` přímo
- Ověřit: idempotence guard, `customerNotifiedAt` set at right place, error pipeline

---

## 10. Definition of Done

- [ ] Prisma migrace proběhla (`Order.paidAt`, `Order.customerNotifiedAt`, `Order.supplierNotifiedAt`)
- [ ] Nový soubor `lib/email/order-emails.ts` obsahuje 3 exportované funkce + helper `escapeHtml`
- [ ] `route.ts` obsahuje 4 nové importy (`createShipmentForOrder`, 3× z `order-emails`, `CreateShipmentResult`)
- [ ] `handleOrderPayment()` má guard na `paymentStatus === "PAID"` na začátku
- [ ] `handleOrderPayment()` nastavuje `paidAt` při přechodu na PAID
- [ ] `handleOrderPayment()` volá `createShipmentForOrder()` v try/catch s admin notifikací na error
- [ ] Customer mail se posílá pouze když `!order.customerNotifiedAt`
- [ ] Supplier mail se posílá pouze když `!order.supplierNotifiedAt`
- [ ] Fleky `customerNotifiedAt` a `supplierNotifiedAt` se setnou pouze při úspěchu
- [ ] Multi-supplier loop: `sendSupplierEmails` groupuje items podle supplierId do Mapy
- [ ] Multi-supplier warning: když `bySupplier.size > 1`, banner v HTML
- [ ] Admin notifikace: `sendAdminFailureNotification` se volá při shipment failu, customer email failu, supplier email failu
- [ ] DRY-RUN banner v obou HTML templatech
- [ ] DRY-RUN prefix v obou subjectech
- [ ] Webhook vrací `200` i při interním selhání shipmentu/mailu
- [ ] `npm run build` projde bez TS erroru
- [ ] `npm run lint` projde
- [ ] Manuální test se Stripe CLI ukáže všechny očekávané logy (sekce 9.1)
- [ ] Idempotence test (sekce 9.2) ověřen

---

## 11. Mimo scope (NEdělat v tomto tasku)

- **Plnohodnotné email templaty** — task #19 nahradí placeholder HTML v `lib/email/order-emails.ts` za `lib/email-templates/order-shipped.tsx` atd.
- **Retry neúspěšných emailů přes cron** — samostatný budoucí task
- **Per-supplier idempotence pro multi-supplier objednávky** — MVP: jeden flag pro všechny
- **Webhook pro `payment_intent.payment_failed`** — zatím neřešíme
- **Manuální shipping workflow pro BANK_TRANSFER/COD v adminu** — samostatný task (pravděpodobně #18 nebo #21 oblast)
- **Wrecker PWA UI pro tisk štítku** — task #21
- **.env.example update** — task #20

---

## 12. Pořadí implementace

1. **Prisma migrace** — přidat 3 fieldy, `npx prisma migrate dev --name order_notification_fields`
2. **Vytvořit `lib/email/order-emails.ts`** — 3 exportované funkce + helper
3. **Edit `app/api/stripe/webhook/route.ts`** — importy + přepsat `handleOrderPayment` + přidat `sendSupplierEmails`
4. **`npm run build` + `npm run lint`** — ověřit TS types
5. **Manuální test** se Stripe CLI — dry-run scenario
6. **Idempotence test** — dvojí webhook call
7. **Git commit** — `feat: stripe webhook auto-creates shipment + sends notifications`

**Odhadovaná složitost:** ~45 min implementace + 20 min testování.

---

## 13. Rizika

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Dispatcher v produkci selže kvůli chybějícím ENV dopravců | Vysoká (v MVP stage) | Low — dry-run fallback | Už vyřešeno v `BaseCarrierClient` |
| Resend není nakonfigurovaný v devu | Vysoká | Low — log warning, webhook 200 | `sendEmail` má fallback |
| Stripe duplicitní webhook | Nízká | Medium — bez guardu by poslal duplikátní maily | Guard na `paymentStatus` + `customerNotifiedAt`/`supplierNotifiedAt` |
| Race condition při paralelních webhookech (dva zároveň na stejný order) | Nízká | Medium — dvojí mail | Dispatcher `trackingNumber` check + Prisma atomic update částečně chrání, 100% ochrana by vyžadovala DB row lock (mimo MVP) |
| `partnerAccount.email` je null u všech supplierů a user email taky | Nízká | Medium — admin o tom neví | Admin notifikace přes `sendAdminFailureNotification` (stage "supplier-email") |
| Multi-supplier objednávka a jedno vrakoviště nespolupracuje | Medium | Low — warning v HTML pokrývá edge case | Warning banner + BackOffice koordinace manuálně |

---

## 14. Souhrn

- **3 dotčené soubory kódu** (route.ts edit, order-emails.ts create, schema.prisma edit)
- **1 Prisma migrace**
- **3 nové DB fieldy** na `Order` (`paidAt`, `customerNotifiedAt`, `supplierNotifiedAt`)
- **3 nové exportované funkce** v `lib/email/order-emails.ts`
- **1 nová ENV** (`ADMIN_NOTIFICATION_EMAIL`, s fallback, není blokátor)
- **Plně dry-run safe** díky `BaseCarrierClient` + `sendEmail` fallbackům
- **Idempotence ve 3 vrstvách:** webhook guard (`paymentStatus`), dispatcher (`trackingNumber`), email flagy (`customerNotifiedAt`, `supplierNotifiedAt`)
- **BANK_TRANSFER/COD** se tohoto taska **netýká** — ty řeší manuálně BackOffice admin později
