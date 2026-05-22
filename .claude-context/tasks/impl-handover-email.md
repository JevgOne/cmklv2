# Implementace — Handover follow-up email

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** Task #30 — team lead + TODO v route.ts:219  
**Status:** ČEKÁ NA IMPLEMENTACI

---

## Analýza existujícího stavu

### Handover endpoint: `app/api/vehicles/[id]/handover/route.ts`

**Co dělá po předání:**
1. Nastaví vehicle.status = "SOLD", soldPrice, soldAt, commission
2. Vytvoří Commission záznam
3. Přidá brokerRevenue (career system)
4. Notifikace: makléři (provize), manažerovi, BackOffice
5. Recalculate Trust Score
6. **TODO řádek 219:** "TASK-026 — automatický email kupujícímu po 7 dnech" — jen notifikace makléři "Zavolej kupujícímu za 7 dní"

### Kde jsou buyer data:

Vehicle model má:
- `sellerName`, `sellerPhone`, `sellerEmail` — kontakt na prodávajícího (lead info)

Payment model (`prisma/schema.prisma:1412`) má:
- `buyerName`, `buyerEmail`, `buyerPhone` — kontakt na kupujícího

Contract model (`prisma/schema.prisma:520`) má:
- `sellerName`, `sellerPhone`, `sellerEmail` — prodávající ze smlouvy

**Problém:** Vehicle nemá přímo `buyerEmail`. Buyer data jsou v Payment tabulce.

### Existující email vzory:

1. **`app/api/payments/[id]/confirm/route.ts:90-95`** — email kupujícímu po potvrzení platby:
   ```typescript
   await sendEmail({
     to: payment.buyerEmail,
     subject: "Potvrzení platby | Carmakler",
     html: `<p>Vaše platba ... byla přijata.</p>`,
   });
   ```

2. **`app/api/contracts/[id]/send/route.ts:91-116`** — email s přílohou smlouvy (HTML šablona se styly)

3. **`lib/resend.ts`** — `sendEmail({ to, subject, html, text })`, graceful fallback na console.warn

---

## Implementační plán

### KROK 1: Přidat sendEmail do handover route

**Soubor:** `app/api/vehicles/[id]/handover/route.ts` — ÚPRAVA

**Přidat import na řádek 9:**

```typescript
import { sendEmail } from "@/lib/resend";
```

**NAHRADIT řádky 218-228** (celý follow-up blok):

```typescript
    // --- Emaily po předání ---

    // Načíst Payment pro buyer data
    const payment = await prisma.payment.findFirst({
      where: { vehicleId: vehicle.id, status: "PAID" },
      select: { buyerName: true, buyerEmail: true },
    });

    const vehicleName = `${vehicle.brand} ${vehicle.model}`;
    const brokerName = result.vehicle.broker
      ? `${result.vehicle.broker.firstName} ${result.vehicle.broker.lastName}`
      : "Váš makléř";

    // 1. Email kupujícímu — potvrzení předání
    if (payment?.buyerEmail) {
      await sendEmail({
        to: payment.buyerEmail,
        subject: `Předání vozidla ${vehicleName} | Carmakler`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">Carmakler</h2>
            <p>Dobrý den${payment.buyerName ? ` ${payment.buyerName}` : ""},</p>
            <p>potvrzujeme, že vozidlo <strong>${vehicleName}</strong> Vám bylo úspěšně předáno.</p>
            <h3 style="margin-top: 24px;">Co dále?</h3>
            <ul>
              <li>Přepište vozidlo na sebe do 10 pracovních dnů</li>
              <li>Uzavřete povinné ručení na nového vlastníka</li>
              <li>Zkontrolujte platnost STK</li>
            </ul>
            <p>Pokud budete mít jakékoliv dotazy, neváhejte kontaktovat makléře <strong>${brokerName}</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #999;">Tento email byl odeslán automaticky ze systému Carmakler.</p>
          </div>
        `,
        text: `Potvrzení předání vozidla ${vehicleName}. Přepište vozidlo do 10 pracovních dnů a uzavřete povinné ručení.`,
      });
    }

    // 2. Email prodávajícímu — potvrzení prodeje
    if (vehicle.sellerEmail) {
      await sendEmail({
        to: vehicle.sellerEmail,
        subject: `Vaše vozidlo ${vehicleName} bylo prodáno | Carmakler`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">Carmakler</h2>
            <p>Dobrý den${vehicle.sellerName ? ` ${vehicle.sellerName}` : ""},</p>
            <p>Vaše vozidlo <strong>${vehicleName}</strong> bylo úspěšně prodáno za <strong>${new Intl.NumberFormat("cs-CZ").format(data.soldPrice)} Kč</strong>.</p>
            <p>Předání proběhlo v pořádku. Makléř ${brokerName} zajistil celý proces.</p>
            <h3 style="margin-top: 24px;">Co dále?</h3>
            <ul>
              <li>Odhlaste vozidlo z pojistky starého vlastníka</li>
              <li>Výplata provize bude zpracována dle smlouvy</li>
            </ul>
            <p>Děkujeme, že jste využili služeb Carmakler!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #999;">Tento email byl odeslán automaticky ze systému Carmakler.</p>
          </div>
        `,
        text: `Vaše vozidlo ${vehicleName} bylo prodáno za ${data.soldPrice} Kč. Odhlaste pojistku starého vlastníka.`,
      });
    }

    // 3. Notifikace makléři — follow-up za 7 dní
    if (vehicle.brokerId) {
      await createNotification({
        userId: vehicle.brokerId,
        type: "SYSTEM",
        title: "Zavolej kupujícímu za 7 dní",
        body: `Follow-up po prodeji ${vehicleName}`,
        link: `/makler/vehicles/${vehicle.id}`,
      });
    }
```

### KROK 2: Přidat sellerName/sellerEmail do vehicle include

Na **řádku 35** rozšířit vehicle select o seller data:

```typescript
    // NAHRADIT řádky 32-39:
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        broker: {
          select: { id: true, firstName: true, lastName: true, managerId: true, level: true },
        },
      },
      // Přidat select pro seller data — NE, vehicle.sellerName je přímo na modelu, include stačí
    });
```

**Poznámka:** `vehicle.sellerName` a `vehicle.sellerEmail` jsou přímo na Vehicle modelu (řádky 299-301 schema), takže stávající `findFirst` je vrací bez dalších změn.

---

## Soubory k úpravě (1):

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `app/api/vehicles/[id]/handover/route.ts` | Přidat import sendEmail, nahradit TODO blok za reálné emaily kupujícímu + prodávajícímu |

## Soubory k vytvoření (0):

Žádné nové soubory — vše je úprava existujícího route.

---

## STOP kritéria

1. Po handover → kupující dostane email s potvrzením předání + checklist co dál
2. Po handover → prodávající dostane email s potvrzením prodeje + částkou
3. Makléř stále dostane notifikaci "Zavolej kupujícímu za 7 dní"
4. Emaily mají Carmakler branding (oranžová, font, footer)
5. Pokud buyerEmail/sellerEmail neexistuje → graceful skip (žádná chyba)
6. `sendEmail` graceful fallback v dev mode (console.warn)
7. TODO komentář na řádku 219 je ODSTRANĚN
8. `npm run build` projde bez chyb

---

## Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| Vehicle nemá Payment (bankovní převod mimo systém) | Střední | Buyer email je optional — skip pokud Payment neexistuje |
| sellerEmail je null | Střední | Graceful skip — if (vehicle.sellerEmail) |
| Resend API key není v dev | Jistá | sendEmail už má graceful fallback (console.warn) |

---

*Plán připraven: 2026-04-26*
