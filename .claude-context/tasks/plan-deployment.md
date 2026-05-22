# Deployment plan — Carmakler do produkce

**Datum:** 2026-04-05
**Autor:** Planovac (agent team)
**Status:** Hotovo

---

## 1. PRIPRAVA KODU

### 1.1 Git cleanup — pred commitem
```bash
# Smazat debug soubory (KRITICKÉ!)
rm e2e/debug-login.spec.ts
rm e2e/debug-login2.spec.ts
rm e2e/debug-login3.spec.ts

# Smazat .claude-context/ (agent team working dir)
rm -rf .claude-context/
```

### 1.2 Uncommitted changes (~35 souboru)
Vsechny modifikovane soubory jsou legitimni zmeny z vyvoje:
- **Smazane:** `sluzby/vykup/` (zamerne odebrano), `VykupForm.tsx`
- **Modifikovane:** PWA stranky, marketplace, navbar/footer, konfigurace
- **Nove E2E testy:** `marketplace-flows.spec.ts`, `pwa-flows.spec.ts`, `registration-real.spec.ts`

**Akce:** Stage + commit vsech zmen KROME debug-login souboru a .claude-context/

### 1.3 Build check
```bash
npm run build          # Musi projit bez chyb
npm run lint           # ESLint check
npm run typecheck      # tsc --noEmit
```

### 1.4 CSP header — ZMENIT na enforce
V `next.config.ts:92` je CSP v **Report-Only** modu:
```typescript
// SOUCASNY STAV:
{ key: "Content-Security-Policy-Report-Only", value: cspDirectives }

// PRO PRODUKCI (az po overeni ze neni false-positive):
{ key: "Content-Security-Policy", value: cspDirectives }
```
**Doporuceni:** Nechat 1-2 tydny v Report-Only, sledovat /api/csp-report, pak prepnout na enforce.

---

## 2. INFRASTRUKTURA — VERCEL

### 2.1 Hosting platforma
Projekt je nakonfigurovany pro **Vercel**:
- ✅ `vercel.json` existuje (s cron konfiguraci)
- ✅ `next.config.ts` pouziva `withSentryConfig` (kompatibilni s Vercel)
- ✅ Next.js 16.1.7 — nativni podpora na Vercel
- ✅ Zadny Dockerfile — ciste serverless

### 2.2 Vercel setup
```bash
# 1. Napojit repo na Vercel
vercel link

# 2. Nastavit environment variables (viz sekce 7)
vercel env add DATABASE_URL production
# ... vsechny promenne

# 3. Deploy
vercel --prod
```

### 2.3 PostgreSQL — produkcni databaze
**Doporucene varianty:**
1. **Vercel Postgres** (Neon) — nejjednodussi integrace, managed
2. **Supabase** — alternativa, free tier pro zacatek
3. **Railway.app** — PostgreSQL jako service
4. **Vlastni VPS** — plna kontrola, ale potrebuje spravu

**Prisma adapter:** Projekt pouziva `@prisma/adapter-pg` s `pg` Pool — funguje s libovolnym PostgreSQL.

**Connection string format:**
```
DATABASE_URL=postgresql://user:password@host:5432/carmakler?sslmode=require
```

### 2.4 Domeny a DNS

**Hlavni domena:** `carmakler.cz`

| Domena | Typ | Smeruje na |
|--------|-----|-----------|
| `www.carmakler.cz` | CNAME | `cname.vercel-dns.com` |
| `carmakler.cz` | A | `76.76.21.21` (Vercel) |
| `inzerce.carmakler.cz` | CNAME | `cname.vercel-dns.com` |
| `shop.carmakler.cz` | CNAME | `cname.vercel-dns.com` |
| `marketplace.carmakler.cz` | CNAME | `cname.vercel-dns.com` |

**SSL:** Vercel zajistuje automaticky pres Let's Encrypt.

**Vercel domain setup:**
```bash
vercel domains add carmakler.cz
vercel domains add www.carmakler.cz
vercel domains add inzerce.carmakler.cz
vercel domains add shop.carmakler.cz
vercel domains add marketplace.carmakler.cz
```

**NextAuth cookie domain:** `.carmakler.cz` (tecka na zacatku = funguje na vsech subdomenach)

---

## 3. EXTERNI SLUZBY — produkcni klice

### 3.1 Stripe (platby)
- **Dashboard:** stripe.com/dashboard
- **Potreba:** STRIPE_SECRET_KEY (sk_live_...), STRIPE_PUBLISHABLE_KEY (pk_live_...), STRIPE_WEBHOOK_SECRET
- **Webhook URL:** `https://www.carmakler.cz/api/stripe/webhook`
- **Events pro webhook:** `checkout.session.completed`, `payment_intent.succeeded`
- **Druhy webhook:** `https://www.carmakler.cz/api/payments/webhook`
- **DULEZITE:** Prepnout ze test mode na live mode!

### 3.2 Resend (emaily)
- **Dashboard:** resend.com/overview
- **Potreba:** RESEND_API_KEY
- **DNS overeni:** Pridat SPF, DKIM, DMARC zaznamy pro carmakler.cz
- **FROM adresy:** `info@carmakler.cz`, `smlouvy@carmakler.cz`, `reklamace@carmakler.cz`
- **RESEND_FROM_EMAIL:** `info@carmakler.cz`

### 3.3 Cloudinary (obrazky)
- **Dashboard:** cloudinary.com/console
- **Potreba:** CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- **Slozky:** `carmakler/vehicles`, `carmakler/avatars`, `carmakler/onboarding`, `carmakler/parts`, `carmakler/listings`
- **Limity:** Free plan = 25 credits/mesic (cca 25K transformaci). Pro produkci zvazit Plus plan.

### 3.4 Sentry (error tracking)
- **Dashboard:** sentry.io
- **Potreba:** SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
- **Konfigurace v projektu:**
  - `sentry.client.config.ts` — tracesSampleRate 0.1 v produkci, replays on error
  - `sentry.server.config.ts` — tracesSampleRate 0.1 v produkci
  - `sentry.edge.config.ts` — edge runtime
  - Source maps upload automaticky pri build (pokud SENTRY_AUTH_TOKEN je nastaveny)

### 3.5 VIN Decoder (vindecoder.eu)
- **Web:** vindecoder.eu
- **Potreba:** VINDECODER_API_KEY, VINDECODER_API_SECRET
- **Fallback:** NHTSA vPIC API (free, bez klice) — automaticky pouzit pokud vindecoder selhz

### 3.6 Cebia (proverka vozidel)
- **Web:** cebia.cz
- **Potreba:** CEBIA_API_KEY
- **API URL:** `https://api.cebia.cz/b2b/v1` (default v kodu)

### 3.7 Claude API (AI asistent)
- **Dashboard:** console.anthropic.com
- **Potreba:** ANTHROPIC_API_KEY
- **Pouziti:** AI chat pro maklere (`/api/assistant/chat`), generovani popisu vozidel (`/api/assistant/generate-description`)
- **SDK:** `@anthropic-ai/sdk` — cte automaticky z `ANTHROPIC_API_KEY` env

### 3.8 SMS (volitelne)
- **GoSMS.cz** (preferovane pro CZ trh): GOSMS_API_KEY, GOSMS_CHANNEL_ID
- **NEBO Twilio:** TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- **Fallback:** Dev mode (log do konzole) pokud ani jeden provider neni nastaven

### 3.9 Plausible Analytics
- **Web:** plausible.io
- **Potreba:** NEXT_PUBLIC_PLAUSIBLE_DOMAIN=carmakler.cz
- **Integrace:** `<Analytics />` komponenta v layoutu s `<Script>` tagem
- **Privacy-friendly:** Zadne cookies, GDPR compliant

### 3.10 Zasilkovna (Packeta)
- **Web:** zasilkovna.cz
- **Potreba:** NEXT_PUBLIC_ZASILKOVNA_API_KEY
- **Widget:** `ZasilkovnaWidget.tsx` — vybrani vydejniho mista v objednavkovem procesu

### 3.11 Pusher (real-time)
- **Stav:** Neni aktivne pouzivany v kodu (jen v dokumentaci)
- **Akce:** Preskocit, neni potreba pro launch

---

## 4. DATABAZE

### 4.1 Migrace
```bash
# Pripojit se k produkcni DB
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

**DULEZITE:** `migrate deploy` (NE `migrate dev`) — spusti pending migrace bez interaktivniho promptu.

### 4.2 Fulltext search indexy
Schema pouziva `Unsupported("tsvector")` pro fulltext search na Vehicle a Listing. Tyto indexy je potreba vytvorit rucne:

```sql
-- Vehicle fulltext search
CREATE INDEX IF NOT EXISTS vehicle_search_idx ON "Vehicle" USING gin("searchVector");

-- Listing fulltext search
CREATE INDEX IF NOT EXISTS listing_search_idx ON "Listing" USING gin("searchVector");

-- Part fulltext search  
CREATE INDEX IF NOT EXISTS part_search_idx ON "Part" USING gin("searchVector");

-- Triggery pro automatickou aktualizaci tsvector
CREATE OR REPLACE FUNCTION update_vehicle_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" = to_tsvector('simple',
    coalesce(NEW.brand, '') || ' ' ||
    coalesce(NEW.model, '') || ' ' ||
    coalesce(NEW.variant, '') || ' ' ||
    coalesce(NEW.city, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_search_update
  BEFORE INSERT OR UPDATE ON "Vehicle"
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_search_vector();
```

### 4.3 Seed data pro produkci
Produkcni seed by mel obsahovat POUZE:
1. **Admin ucet** (ADMIN role)
2. **Regiony** (Praha, Brno, Ostrava, atd.)
3. **Pripadne testovaci data NE** — seed.ts maze vsechna data!

**VAROVANI:** `prisma/seed.ts` zacina `deleteMany()` na VSECH tabulkach! NIKDY nespoustet v produkci s existujicimi daty!

**Produkcni seed (bezpecny):**
```bash
# Pouze prvni setup — vytvorit admin ucet rucne nebo pres API
# NIKDY: npx prisma db seed (smaze vsechna data!)
```

### 4.4 Backup strategie
- **Vercel Postgres (Neon):** Automaticke point-in-time recovery
- **Externi PostgreSQL:** Nastavit denni pg_dump + upload do S3/GCS
- **Doporuceni:** Backup pred kazdym `prisma migrate deploy`

---

## 5. PWA

### 5.1 Service Worker
- ✅ `app/sw.ts` — zdrojovy kod SW
- ✅ Serwist konfigurace v `next.config.ts` — kompiluje `app/sw.ts` → `public/sw.js`
- ✅ `disable: process.env.NODE_ENV === "development"` — SW je aktivni jen v produkci
- ✅ Precaching, runtime caching, background sync pro contacts

### 5.2 Manifest
- ✅ `public/manifest.json` — spravne nakonfigurovany
- ✅ Nazev: "CarMakler Pro", start_url: "/makler/dashboard"
- ✅ Ikony: 192x192 a 512x512 (normal + maskable) v `public/icons/`
- ✅ Theme color: #F97316 (orange)
- ✅ Display: standalone, orientation: portrait

### 5.3 Overeni PWA
Po deploy:
1. Otevrit Chrome DevTools → Application → Manifest (overit ze se nacita)
2. Application → Service Workers (overit registraci)
3. Lighthouse → PWA audit (melo byt 100%)
4. Testovat "Install app" prompt na mobilnim Chrome

---

## 6. CRON JOBY

### 6.1 Aktualni vercel.json konfigurace (4 joby)
```json
{
  "crons": [
    { "path": "/api/cron/daily-summary", "schedule": "0 5 * * *" },
    { "path": "/api/cron/stale-vehicles", "schedule": "0 6 * * *" },
    { "path": "/api/cron/quick-draft-expiry", "schedule": "0 7 * * *" },
    { "path": "/api/cron/exclusive-expiry", "schedule": "0 6 * * *" }
  ]
}
```

### 6.2 CHYBEJICICH 6 cron jobu!
**⚠️ KRITICKE:** V `vercel.json` je jen 4 z 10 cron jobu! Chybi:

| Cron job | Dulezitost | Doporuceny schedule |
|----------|-----------|-------------------|
| `/api/cron/feed-import` | VYSOKA — import inzeratu z externich fedu | `0 */4 * * *` (kazdych 4h) |
| `/api/cron/listing-expiry` | VYSOKA — expirace neaktivnich inzeratu | `0 3 * * *` (denne 3:00) |
| `/api/cron/reservation-expiry` | VYSOKA — expirace neuhrazenych rezervaci (48h) | `*/30 * * * *` (kazdych 30 min) |
| `/api/cron/sla-check` | STREDNI — kontrola SLA response time | `0 8 * * *` (denne 8:00) |
| `/api/cron/upsell-check` | STREDNI — upsell emaily (14d, 30d, 45d) | `0 9 * * *` (denne 9:00) |
| `/api/cron/watchdog-match` | STREDNI — hlidaci pes notifikace | `0 */2 * * *` (kazdych 2h) |

### 6.3 Opraveny vercel.json
```json
{
  "crons": [
    { "path": "/api/cron/daily-summary", "schedule": "0 5 * * *" },
    { "path": "/api/cron/stale-vehicles", "schedule": "0 6 * * *" },
    { "path": "/api/cron/quick-draft-expiry", "schedule": "0 7 * * *" },
    { "path": "/api/cron/exclusive-expiry", "schedule": "0 6 * * *" },
    { "path": "/api/cron/listing-expiry", "schedule": "0 3 * * *" },
    { "path": "/api/cron/feed-import", "schedule": "0 */4 * * *" },
    { "path": "/api/cron/reservation-expiry", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/sla-check", "schedule": "0 8 * * *" },
    { "path": "/api/cron/upsell-check", "schedule": "0 9 * * *" },
    { "path": "/api/cron/watchdog-match", "schedule": "0 */2 * * *" }
  ]
}
```

**POZNAMKA:** Vercel Free/Pro plan ma limit na pocet cronu. Pro 10 cronu je potreba minimalne Pro plan ($20/mesic). Hobby plan = max 2 crony.

### 6.4 CRON_SECRET
Vsechny cron routes overuji `Authorization: Bearer ${CRON_SECRET}`. Vercel automaticky posilsa tento header — staci nastavit `CRON_SECRET` v env.

---

## 7. ENVIRONMENT VARIABLES — kompletni seznam

### 7.1 POVINNE (bez nich aplikace nespadne)

| Promenna | Priklad | Poznamka |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/carmakler?sslmode=require` | Produkcni PostgreSQL |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | JWT signing key |
| `NEXTAUTH_URL` | `https://www.carmakler.cz` | Zakladni URL pro auth |
| `NEXTAUTH_COOKIE_DOMAIN` | `.carmakler.cz` | Cookies sdilene pres subdomeny |
| `NEXT_PUBLIC_APP_URL` | `https://www.carmakler.cz` | Verejne URL aplikace |

### 7.2 DULEZITE (funkcionalita degraduje bez nich)

| Promenna | Sluzba | Bez ni |
|----------|--------|--------|
| `STRIPE_SECRET_KEY` | Stripe | Platby nefunguji |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | Checkout nefunguje |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhooky ignorovany |
| `RESEND_API_KEY` | Resend | Emaily jen loguji do konzole |
| `RESEND_FROM_EMAIL` | Resend | Default: info@carmakler.cz |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | Upload obrazku nefunguje |
| `CLOUDINARY_API_KEY` | Cloudinary | Upload obrazku nefunguje |
| `CLOUDINARY_API_SECRET` | Cloudinary | Upload obrazku nefunguje |
| `CRON_SECRET` | Vercel Cron | Cron joby odmitnuti (401) |
| `ANTHROPIC_API_KEY` | Claude API | AI asistent nefunguje |

### 7.3 VOLITELNE (aplikace funguje bez nich)

| Promenna | Sluzba | Bez ni |
|----------|--------|--------|
| `VINDECODER_API_KEY` | vindecoder.eu | Pouzije NHTSA fallback |
| `VINDECODER_API_SECRET` | vindecoder.eu | Pouzije NHTSA fallback |
| `CEBIA_API_KEY` | Cebia | Proverka VIN nefunguje |
| `CEBIA_API_URL` | Cebia | Default: https://api.cebia.cz/b2b/v1 |
| `GOSMS_API_KEY` | GoSMS | SMS neodesle (loguje) |
| `GOSMS_CHANNEL_ID` | GoSMS | Default: 1 |
| `TWILIO_ACCOUNT_SID` | Twilio | Alternativa k GoSMS |
| `TWILIO_AUTH_TOKEN` | Twilio | Alternativa k GoSMS |
| `TWILIO_PHONE_NUMBER` | Twilio | Alternativa k GoSMS |
| `SENTRY_DSN` | Sentry (server) | Bez error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry (client) | Bez error tracking |
| `SENTRY_AUTH_TOKEN` | Sentry | Bez source maps |
| `SENTRY_ORG` | Sentry | Bez source maps |
| `SENTRY_PROJECT` | Sentry | Bez source maps |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible | Bez analytics |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Google Analytics 4 | Alternativa k Plausible |
| `NEXT_PUBLIC_ZASILKOVNA_API_KEY` | Zasilkovna | Widget nefunguje, jen PPL/CP |
| `LEADS_API_KEY` | External leads API | Externi import leadu nefunguje |
| `SITE_PASSWORD` | Site auth gate | Prazdne = verejny web (spravne pro produkci) |

### 7.4 SUBDOMENY (NEXT_PUBLIC)

| Promenna | Produkce |
|----------|----------|
| `NEXT_PUBLIC_MAIN_URL` | `https://www.carmakler.cz` |
| `NEXT_PUBLIC_INZERCE_URL` | `https://inzerce.carmakler.cz` |
| `NEXT_PUBLIC_SHOP_URL` | `https://shop.carmakler.cz` |
| `NEXT_PUBLIC_MARKETPLACE_URL` | `https://marketplace.carmakler.cz` |

### 7.5 BANKOVNI UDAJE

| Promenna | Popis |
|----------|-------|
| `CARMAKLER_BANK_ACCOUNT` | Cislo uctu (CZ format) |
| `CARMAKLER_IBAN` | IBAN |
| `CARMAKLER_BIC` | Default: KOMBCZPP |
| `CARMAKLER_BANK_NAME` | Default: Komercni banka |

---

## 8. BEZPECNOST

### 8.1 Security headers (next.config.ts) ✅
Vsechny spravne nastaveny:
- ✅ `X-Frame-Options: DENY` — prevence clickjacking
- ✅ `X-Content-Type-Options: nosniff` — prevence MIME sniffing
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Permissions-Policy: camera=(), microphone=()`
- ✅ `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — HSTS 2 roky
- ✅ `Content-Security-Policy-Report-Only` — CSP v report modu

### 8.2 CSP direktivy ✅
Spravne povoleny pouze:
- Stripe (js.stripe.com, api.stripe.com)
- Cloudinary (res.cloudinary.com)
- Google Fonts (fonts.googleapis.com, fonts.gstatic.com)
- Plausible (plausible.io)
- Sentry (*.sentry.io)
- Packeta/Zasilkovna (widget.packeta.com)

### 8.3 CORS
Next.js API routes defaultne nemaji CORS headers — spravne pro same-origin API. Pokud budou externi klienti (mobilni app), pridat CORS middleware.

### 8.4 Rate limiting
- ✅ `lib/rate-limit.ts` — in-memory rate limiter
- **⚠️ Omezeni:** In-memory store se resetuje pri kazdem cold start na Vercel (serverless)
- **Doporuceni:** Pro produkci nahradit Redis-based rate limiter (Upstash Redis)
- **Alternativa:** Vercel WAF / Cloudflare rate limiting

### 8.5 NextAuth
- ✅ JWT session strategie
- ✅ Cookie domain nastavitelne pres env
- ✅ Secure cookies v produkci
- ✅ CSRF token
- **DULEZITE:** Nastavit silny `NEXTAUTH_SECRET` (min. 32 znaku random)

### 8.6 Prisma
- ✅ Singleton pattern v `lib/prisma.ts`
- ✅ Connection pooling pres `pg` Pool + `@prisma/adapter-pg`
- **DULEZITE:** PostgreSQL connection string MUSI mit `sslmode=require` v produkci

### 8.7 XSS prevence
- ✅ `isomorphic-dompurify` v dependencies — pouzivany pro sanitizaci HTML
- ✅ React defaultne escapuje vsechny stringy

---

## 9. DEPLOYMENT CHECKLIST

### Pred deployem
- [ ] Smazat debug-login*.spec.ts a .claude-context/
- [ ] Commitnout vsechny zmeny
- [ ] `npm run build` projde bez chyb
- [ ] `npm run lint` projde bez chyb
- [ ] `npm run typecheck` projde bez chyb
- [ ] Overit ze SITE_PASSWORD je prazdne (verejny web)

### Databaze
- [ ] Vytvorit produkcni PostgreSQL
- [ ] `prisma migrate deploy`
- [ ] Vytvorit fulltext search indexy (SQL vyse)
- [ ] Vytvorit admin ucet (rucne pres SQL nebo API)
- [ ] Overit pripojeni

### Vercel
- [ ] Vytvorit Vercel projekt
- [ ] Napojit Git repo
- [ ] Pridat vsechny env variables (sekce 7)
- [ ] Pridat domeny (sekce 2.4)
- [ ] Nakonfigurovat DNS zaznamy
- [ ] Aktualizovat vercel.json (vsech 10 cronu)

### Externi sluzby
- [ ] Stripe: live mode klice + webhook URL
- [ ] Resend: API klic + DNS overeni domeny (SPF, DKIM, DMARC)
- [ ] Cloudinary: produkcni ucet
- [ ] Sentry: projekt + DSN
- [ ] VIN decoder: API klic
- [ ] Cebia: API klic
- [ ] Claude API: API klic
- [ ] Plausible: domena

### Po deployi
- [ ] Overit hlavni stranku carmakler.cz
- [ ] Overit subdomeny (inzerce, shop, marketplace)
- [ ] Overit prihlaseni/registraci
- [ ] Overit PWA (manifest, SW, install prompt)
- [ ] Overit Stripe platbu (testovaci kartou)
- [ ] Overit odeslani emailu
- [ ] Overit upload obrazku
- [ ] Overit AI asistenta
- [ ] Overit cron joby (trigger rucne)
- [ ] Overit CSP report (/api/csp-report)
- [ ] Overit Sentry error tracking (throw test error)
- [ ] SSL/HSTS audit (ssllabs.com)
- [ ] Lighthouse audit (performance, PWA, SEO, accessibility)

---

## 10. ODHADOVANE MESICNI NAKLADY

| Sluzba | Plan | Cena/mesic |
|--------|------|-----------|
| Vercel | Pro | $20 |
| PostgreSQL (Neon/Supabase) | Pro | $25 |
| Cloudinary | Plus | $89 |
| Resend | Pro | $20 |
| Stripe | Pay-as-you-go | 2.9% + $0.30/transakce |
| Sentry | Team | $26 |
| Plausible | Growth | €9 |
| vindecoder.eu | Basic | ~€30 |
| Cebia | B2B | Dle smlouvy |
| Claude API | Pay-as-you-go | ~$10-50 |
| GoSMS/Twilio | Pay-as-you-go | ~$5-20 |
| **Celkem (fixni)** | | **~$220-250/mesic** |
