# Implementace P0-07: .env.example + .gitignore

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

1. Vytvoren `.env.example` se vsemi env promennymi z projektu (bez skutecnych hodnot/klicu)
2. Upraven `.gitignore` -- pridana vyjimka `!.env.example` aby sablona byla trackована v gitu

### Vytvorene/upravene soubory

| Soubor | Akce |
|--------|------|
| `.env.example` | NOVY -- kompletni sablona vsech env promennych |
| `.gitignore` | UPRAVEN -- pridano `!.env.example` za `.env*` |

### Obsah .env.example

Pokryva vsechny sekce:
- Databaze (DATABASE_URL)
- NextAuth (SECRET, URL, COOKIE_DOMAIN)
- Subdomeny (NEXT_PUBLIC_*_URL)
- Cloudinary (CLOUD_NAME, API_KEY, API_SECRET)
- Resend (API_KEY, FROM_EMAIL)
- Stripe (SECRET_KEY, WEBHOOK_SECRET)
- Carmakler bankovni udaje
- VIN dekoder
- Cebia
- Anthropic (AI)
- SMS (GoSMS / Twilio)
- CRON_SECRET
- LEADS_API_KEY
- SITE_PASSWORD (navazuje na P0-06)
- Sentry
- Analytics (Plausible / GA4)

### .gitignore zmena

```diff
 .env*
+!.env.example
```

## Overeni

- [x] `.env.example` vytvoreno s komentari
- [x] `.env.example` neobsahuje zadne skutecne API klice/hesla
- [x] `.gitignore` ma vyjimku pro `.env.example`
- [x] `.env.local` zustava ignorovano
- [x] SITE_PASSWORD zahrnut (navaznost na P0-06)
