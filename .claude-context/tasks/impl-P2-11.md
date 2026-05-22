# Implementace P2-11: Stripe platby (dokončení)

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedené změny

### 1. Env vars dokumentace — `.env.example`
- Přidáno `STRIPE_PUBLISHABLE_KEY=` (chybělo)

### 2. Bundle credit systém — `app/api/stripe/webhook/route.ts`
- Nahrazeno `console.log()` za plnou implementaci
- Po platbě BUNDLE: najde listing → najde userId → `prisma.user.update({ listingCredits: { increment: 30 } })`

### 3. listingCredits na User model — `prisma/schema.prisma`
- Přidáno `listingCredits Int @default(0)` za `quickModeEnabled`
- Komentář: "Počet předplacených inzerátů (Bundle 30ks)"

### 4. Fix broken reserve URL — `app/api/listings/[id]/reserve/route.ts`
- Přidáno `slug: true` do select query
- success_url: `/inzerat/${id}` → `/nabidka/${listing.slug}?reserved=true`
- cancel_url: `/inzerat/${id}` → `/nabidka/${listing.slug}`

### 5. Promote route — beze změn
- success/cancel URL `/moje-inzeraty/${id}` — korektní

## Poznámky
- Stripe Dashboard setup + klíče = manuální krok (není kód)
- E-shop CARD platba (Krok 7 plánu) — volitelné rozšíření, nebyl implementován (viz plán)
- `@stripe/stripe-js` klientský package — není potřeba (vše přes server-side Checkout redirect)

## Ověření
- [x] Build: PASS
- [x] Testy: 141/141 PASS
- [x] TypeCheck: PASS
- [x] Prisma generate: OK
- [x] Bundle handler implementuje kreditový systém
- [x] Reserve URL vede na /nabidka/ (ne /inzerat/)
- [x] STRIPE_PUBLISHABLE_KEY v .env.example
