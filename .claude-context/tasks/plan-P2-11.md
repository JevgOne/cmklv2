# Plan P2-11: Stripe Integrace (Faze 2)

**Priorita:** P2 (TOP 1 z 25 — Business Value 5/5, UX 4/5, Security 3/5 = 12/15)
**Slozitost:** M (3-4 hodiny)
**Zavislosti:** P0-07 (env vars), P0-08 (PostgreSQL)
**Batch:** 4+

---

## Zduvodneni vyberu

Stripe je jediny zdroj monetizace platformy. Bez funkcni integrace nelze:
- Inkovat kauce za rezervace (5 000 Kc)
- Prodavat TOP inzeraty (199 Kc/7d)
- Prodluzovat inzeraty (99 Kc/30d)
- Prodavat balicky (1 990 Kc/30 inzeratu)
- Provadet CEBIA proverky (499 Kc)
- Prijimat kartove platby za vozidla

**Kod jiz existuje a je plne implementovan** — chybi jen konfigurace, testovani a dopracovani drobnosti.

---

## Analyza aktualniho stavu

### Existujici implementace (HOTOVO)

| Soubor | Co dela | Stav |
|--------|---------|------|
| `lib/stripe.ts` | Lazy Stripe instance, getStripe(), commission calc, VS generator | HOTOVO |
| `app/api/payments/create-checkout/route.ts` | Stripe Checkout pro vozidla (CARD/BANK/FINANCING) | HOTOVO |
| `app/api/stripe/webhook/route.ts` | Webhook handler: promo, reservation, cebia | HOTOVO |
| `app/api/listings/[id]/reserve/route.ts` | Rezervace s Stripe Checkout (5000 Kc kauce) | HOTOVO |
| `app/api/listings/[id]/promote/route.ts` | TOP/EXTEND/BUNDLE s Stripe Checkout | HOTOVO |
| `app/api/listings/[id]/extend/route.ts` | Prodlouzeni inzeratu s Stripe | HOTOVO |
| `app/api/cebia/check/route.ts` | CEBIA proverka s Stripe platbou | HOTOVO |
| `app/api/payments/webhook/route.ts` | Payment webhook (vehicle payments) | HOTOVO |
| `app/api/payments/[id]/confirm/route.ts` | Manualni potvrzeni prevodu | HOTOVO |
| `app/api/reservations/[id]/cancel/route.ts` | Zruseni rezervace + refund | HOTOVO |

### Co CHYBI

1. **Env vars v produkci** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` nejsou nastaveny
2. **Stripe Dashboard setup** — produkcni klice, webhook endpoint registrace
3. **Test mode testovani** — overeni vsech flows s testovacimi kartami
4. **@stripe/stripe-js klientska integrace** — package je v dependencies ale NENI pouzivan (vsechny platby pres server-side Checkout redirect)
5. **Webhook endpoint URL** — success/cancel URL pouzivaji `NEXTAUTH_URL` — overit ze je spravne nastaveno
6. **Bundle promoType** — v handlePromoPayment jen loguje (`console.log`), nema kreditovy system

---

## Kroky implementace

### Krok 1: Stripe Dashboard konfigurace

**Manualni kroky (ne kod):**
1. Prihlasit se na [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vytvorit ucet "Carmakler s.r.o." (pokud neexistuje)
3. V **Test mode**:
   - Zkopirovat `sk_test_...` → `STRIPE_SECRET_KEY`
   - Jit do Developers → Webhooks → "Add endpoint"
   - URL: `https://staging.carmakler.cz/api/stripe/webhook`
   - Eventy: `checkout.session.completed`, `charge.refunded`
   - Zkopirovat `whsec_...` → `STRIPE_WEBHOOK_SECRET`
4. V **Live mode** (po testovani):
   - Opakovat bod 3 s produkcni URL
   - `sk_live_...` → produkci

### Krok 2: Env vars nastaveni

**Soubor:** `.env.local` (existuje od P0-07)

```
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Soubor:** `.env.example` — pridat (bez hodnot):
```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Krok 3: Opravit Bundle promo handler

**Soubor:** `app/api/stripe/webhook/route.ts` (radek 119-124)

Aktualni stav — jen log:
```ts
case "BUNDLE": {
  console.log(`Bundle purchased for user, listing: ${listingId}`);
  break;
}
```

**Oprava — implementovat kreditovy system:**

```diff
  case "BUNDLE": {
-   console.log(`Bundle purchased for user, listing: ${listingId}`);
+   // Najit vlastnika inzeratu
+   const bundleListing = await prisma.listing.findUnique({
+     where: { id: listingId },
+     select: { userId: true },
+   });
+   if (bundleListing?.userId) {
+     // Pridat 30 kreditu k uzivateli
+     await prisma.user.update({
+       where: { id: bundleListing.userId },
+       data: { listingCredits: { increment: 30 } },
+     });
+   }
    break;
  }
```

**Pozn.:** Vyzaduje pridani `listingCredits Int @default(0)` do User modelu v schema.prisma.

### Krok 4: Pridat listingCredits do User modelu

**Soubor:** `prisma/schema.prisma` (User model, za `quickModeEnabled`)

```diff
  quickModeEnabled    Boolean  @default(false)
+
+ // Kreditovy system pro inzeraty
+ listingCredits      Int      @default(0)  // Pocet predplacenych inzeratu (Bundle 30ks)
```

**Migrace:**
```bash
npx prisma migrate dev --name add_listing_credits
```

### Krok 5: Overit success/cancel URL

**Soubory k proverit:**

| Soubor | Aktualni URL | Spravne? |
|--------|-------------|----------|
| `create-checkout/route.ts:74` | `/nabidka/${slug}/platba/uspech?session_id={CHECKOUT_SESSION_ID}` | Overit ze stranka existuje |
| `create-checkout/route.ts:75` | `/nabidka/${slug}/platba?cancelled=true` | OK |
| `reserve/route.ts:109` | `/inzerat/${id}?reserved=true` | **CHYBA** — `/inzerat/` neexistuje, spravne je `/nabidka/` nebo `/inzerce/` |
| `promote/route.ts` | Overit | Overit |

**Oprava reserve URL:**

```diff
- success_url: `${process.env.NEXTAUTH_URL}/inzerat/${id}?reserved=true`,
- cancel_url: `${process.env.NEXTAUTH_URL}/inzerat/${id}`,
+ success_url: `${process.env.NEXTAUTH_URL}/nabidka?reserved=${id}`,
+ cancel_url: `${process.env.NEXTAUTH_URL}/nabidka?reservation_cancelled=true`,
```

**Pozn.:** Presna URL zavisi na tom, zda rezervace je na Listing (inzerce) nebo Vehicle (nabidka). Overit business logiku.

### Krok 6: Stripe CLI testovani

**Lokalni testovani s Stripe CLI:**
```bash
# Nainstalovat Stripe CLI
brew install stripe/stripe-cli/stripe

# Prihlasit se
stripe login

# Forward webhooks na localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Testovaci platba
stripe trigger checkout.session.completed
```

**Testovaci kartove cisla:**
- Uspesna platba: `4242 4242 4242 4242`
- Odmitnuta: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Krok 7: E-shop platby kartou (volitelne rozsireni)

Aktualne e-shop podporuje jen `BANK_TRANSFER` a `COD`. Pro pridani kartove platby:

**Soubor:** `app/api/orders/route.ts`

V POST handleru pridat vetev pro `paymentMethod === "CARD"`:
```ts
if (paymentMethod === "CARD") {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map(item => ({
      price_data: {
        currency: "czk",
        product_data: { name: item.name },
        unit_amount: item.unitPrice * 100,
      },
      quantity: item.quantity,
    })),
    metadata: { orderId: order.id },
    customer_email: deliveryEmail,
    success_url: `${process.env.NEXTAUTH_URL}/shop/objednavka/potvrzeni?order=${order.orderNumber}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/shop/kosik`,
  });
  return NextResponse.json({ checkoutUrl: session.url }, { status: 201 });
}
```

**Aktualizovat paymentMethod enum v Zod schema:**
```diff
- paymentMethod: z.enum(["BANK_TRANSFER", "COD"]),
+ paymentMethod: z.enum(["BANK_TRANSFER", "COD", "CARD"]),
```

**Pridat do Stripe webhook:**
```ts
if (metadata.orderId) {
  await handleOrderPayment(metadata.orderId);
}
// ...
async function handleOrderPayment(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID" },
  });
}
```

---

## Soubory k uprave

| Soubor | Zmena | Narocnost |
|--------|-------|-----------|
| `.env.local` | Stripe klice | XS |
| `.env.example` | Stripe vars dokumentace | XS |
| `prisma/schema.prisma` | listingCredits na User | XS |
| `app/api/stripe/webhook/route.ts` | Bundle handler + order payment handler | S |
| `app/api/listings/[id]/reserve/route.ts` | Opravit success/cancel URL | XS |
| `app/api/orders/route.ts` | Pridat CARD payment method (volitelne) | M |
| Zod validacni schema pro orders | Pridat "CARD" do enum | XS |

---

## Overeni

- [ ] Stripe Test mode: Rezervace 5000 Kc — testovaci karta 4242 → Checkout → success
- [ ] Stripe Test mode: TOP inzerat 199 Kc → Checkout → webhook → listing.isPremium = true
- [ ] Stripe Test mode: EXTEND → webhook → listing.expiresAt prodlouzeno o 30 dni
- [ ] Stripe Test mode: BUNDLE → webhook → user.listingCredits = 30
- [ ] Stripe Test mode: CEBIA 499 Kc → Checkout → webhook → cebiaReport.status = PENDING
- [ ] Stripe Test mode: Zruseni rezervace → refund
- [ ] Stripe CLI: `stripe listen` zachyti vsechny eventy
- [ ] Success/cancel URL vedou na existujici stranky
- [ ] Bez STRIPE_SECRET_KEY build prochazi (lazy init)
- [ ] E-shop kartova platba funguje (pokud implementovano)
