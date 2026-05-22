# Implementace P2-20: Zásilkovna widget + delivery fix

**Status:** DONE (již implementováno)
**Datum:** 2026-04-05

## Stav

Vše bylo již implementováno před tímto taskem (linter/jiný agent):

### Schéma — OK
- Order model: `deliveryMethod`, `zasilkovnaPointId`, `zasilkovnaPointName`
- Komentář `paymentMethod` opraven na `// BANK_TRANSFER, COD, CARD`

### Backend — OK
- `app/api/orders/route.ts`: DELIVERY_PRICES (ZASILKOVNA: 79, PPL: 129, CP: 99, PICKUP: 0), COD fee 39 Kč, shippingPrice správně počítáno
- Stripe Checkout session obsahuje shipping_options

### Frontend — OK
- `components/web/ZasilkovnaWidget.tsx`: Packeta Widget v6, Script lazy-load
- `components/web/OrderForm.tsx`: Integrace ZasilkovnaWidget, delivery options s cenami
- `app/(web)/shop/objednavka/page.tsx` + `app/(web)/dily/objednavka/page.tsx`: Plný checkout flow

### Validace — OK
- `lib/validators/parts.ts`: deliveryMethod enum + zasilkovnaPointId refine

### CSP — OK (součást P2-14)
- `widget.packeta.com` přidáno do script-src, style-src, img-src, connect-src, frame-src

## Build
- ✅ `next build` prošel bez chyb
