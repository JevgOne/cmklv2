# Implementace P0-10: Guest checkout

**Status:** HOTOVO (uz bylo implementovano jinym agentem)
**Datum:** 2026-04-05
**Implementoval:** implementator agent (overeni)

---

## Stav

Vsechny polozky z planu byly jiz implementovany:

### 1. Schema — `guestToken` uz v Order modelu
- `guestToken String? @unique` + `@@index([guestToken])`

### 2. `app/api/orders/route.ts` — guestToken generovani
- Importuje `crypto`, generuje 32-byte token pro guest
- Response vraci `trackingUrl` pro guest

### 3. `app/api/orders/[id]/route.ts` — pristup pres guestToken
- Podporuje `?token=` query parametr
- Overuje isOwner || isAdmin || isGuest

### 4. `app/api/orders/track/[token]/route.ts` — EXISTS
- Guest tracking endpoint, vraci bezpecna data

### 5. `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` — EXISTS
- Sledovaci stranka pro guest

### 6. Checkout pages — trackingUrl
- `shop/objednavka/page.tsx` — predava trackingUrl do potvrzeni
- `shop/objednavka/potvrzeni/page.tsx` — zobrazuje tracking odkaz + CTA registrace
- `dily/objednavka/page.tsx` — shodne zmeny

## Overeni

- [x] Guest checkout funguje (guestToken generovan)
- [x] Tracking stranka existuje
- [x] Potvrzovaci stranka zobrazuje tracking odkaz
- [x] Build prochazi
