# Plan P0-07: Vytvoreni .env.example a .env.local

**Priorita:** P0 (bloker pro launch)
**Slozitost:** S
**Zavislosti:** ZADNE
**Batch:** 1

---

## Cil

Vytvorit `.env.example` se vsemi potrebnymi env promennymi (bez hodnot) a `.env.local` pro dev prostredi. Zajistit ze `.env*` je v `.gitignore` (JIZ JE — radek 34).

---

## Kroky implementace

### Krok 1: Vytvorit .env.example

**Soubor:** `.env.example` (NOVY)

Obsah ziskan z grepu `process.env` pres cely projekt:

```env
# ============================================
# CarMakler v2 — Environment Variables
# ============================================
# Zkopirujte do .env.local a vyplnte hodnoty

# --- Databaze ---
DATABASE_URL=postgresql://user:password@localhost:5432/carmakler

# --- NextAuth ---
NEXTAUTH_SECRET=       # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_COOKIE_DOMAIN=  # prazdne pro localhost, ".carmakler.cz" pro produkci

# --- Subdomeny (verejne URL) ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAIN_URL=http://localhost:3000
NEXT_PUBLIC_INZERCE_URL=http://inzerce.localhost:3000
NEXT_PUBLIC_SHOP_URL=http://shop.localhost:3000
NEXT_PUBLIC_MARKETPLACE_URL=http://marketplace.localhost:3000

# --- Cloudinary (obrazky) ---
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# --- Resend (emaily) ---
RESEND_API_KEY=
RESEND_FROM_EMAIL=info@carmakler.cz

# --- Stripe (platby — faze 2) ---
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# --- Carmakler bankovni udaje ---
CARMAKLER_BANK_ACCOUNT=
CARMAKLER_IBAN=
CARMAKLER_BIC=KOMBCZPP
CARMAKLER_BANK_NAME=Komercni banka

# --- VIN dekoder ---
VINDECODER_API_KEY=
VINDECODER_API_SECRET=

# --- Cebia (proverka vozidla) ---
CEBIA_API_URL=https://api.cebia.cz/b2b/v1
CEBIA_API_KEY=

# --- Anthropic (AI asistent) ---
ANTHROPIC_API_KEY=

# --- SMS (volitelne) ---
GOSMS_API_KEY=
GOSMS_CHANNEL_ID=1
# nebo Twilio:
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# --- CRON secret ---
CRON_SECRET=           # openssl rand -hex 16

# --- External API ---
LEADS_API_KEY=         # pro externi lead import

# --- Site password (prazdne = verejny web) ---
SITE_PASSWORD=

# --- Sentry (error tracking — volitelne) ---
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# --- Analytics (volitelne) ---
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
# nebo:
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
```

### Krok 2: Overit .gitignore

**Soubor:** `.gitignore`

Radek 34 jiz obsahuje `.env*` — takze `.env.local` a `.env.example` se chovaji takto:
- `.env.local` — IGNOROVANO (spravne)
- `.env.example` — TAKY IGNOROVANO — to je PROBLEM!

**Oprava:** Pridat vyjimku do `.gitignore`:
```gitignore
.env*
!.env.example
```

### Krok 3: Overit ze vsechny process.env pouziti maji fallback

Zkontrolovat ze zadny `process.env.X` nezpusobi pad pokud env neni nastavena:
- `lib/stripe.ts:12` — ma `if (!process.env.STRIPE_SECRET_KEY)` check ✓
- `lib/cebia.ts:25` — ma `if (!apiKey)` check ✓
- `lib/vin-decoder.ts:14` — ma check ✓
- `lib/prisma.ts` — po migraci na PG bude pouzivat DATABASE_URL ✓
- `middleware.ts` — po P0-06 bude `SITE_PASSWORD || null` ✓

---

## Soubory k vytvoreni/uprave

| Soubor | Akce |
|--------|------|
| `.env.example` | NOVY |
| `.gitignore` | UPRAVIT — pridat `!.env.example` |

## Overeni

- [ ] `.env.example` existuje a obsahuje vsechny env promenne z projektu
- [ ] `.env.example` NEOBSAHUJE zadne skutecne hodnoty (klice, hesla)
- [ ] `.env.example` je trackovan v gitu (neni ignorovan)
- [ ] `.env.local` je ignorovan gitem
- [ ] Komentare v .env.example vysvetluji co kazda promenna dela
- [ ] `npm run dev` funguje s kopirem .env.example do .env.local (po doplneni hodnot)
