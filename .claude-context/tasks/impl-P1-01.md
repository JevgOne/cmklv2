# Implementace P1-01: Watchdog email notifikace

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Propojeno odeslani emailu pri watchdog match. Doplnena `sendWatchdogEmail()` funkce, rozsiren Prisma select a odkomentovana email logika v `matchWatchdogs()`.

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `lib/listing-sla.ts` | Pridany importy (Resend, watchdog-match sablona), pridana `sendWatchdogEmail()` funkce, rozsiren select v Prisma query (year, mileage, slug, images), odkomentovana a propojeny email logika |

### Detaily implementace

**Importy (radek 1-8):**
- `Resend` z "resend"
- `watchdogMatchSubject`, `watchdogMatchHtml`, `watchdogMatchText`, `WatchdogMatchData` z existujici sablony

**sendWatchdogEmail() funkce:**
- Kontroluje `RESEND_API_KEY` -- pokud neni, graceful skip s `console.warn`
- Sestavuje `WatchdogMatchData` z watchdog kriterii a nalezenych listingu
- Pouziva `recipientEmail.split("@")[0]` jako fallback pro userName
- Ceny formatovany `toLocaleString("cs-CZ")`
- URL sestaveny z `NEXT_PUBLIC_APP_URL` (fallback carmakler.cz)
- Manage URL: `/muj-ucet/watchdogy`

**Rozsireny Prisma select:**
Pridano `year`, `mileage`, `slug`, `images: { take: 1, select: { url: true } }` -- potrebne pro email sablonu (karta auta s fotkou, rokem, najezdem).

**Error handling:**
Email chyba je chycena v try/catch a logovana, ale NEblokuje aktualizaci `lastNotified`. Watchdog match se zapise i kdyz email selze.

## Overeni

- [x] Import Resend + email sablony
- [x] sendWatchdogEmail funkce s graceful RESEND_API_KEY check
- [x] Rozsireny select (year, mileage, slug, images)
- [x] Email propojeni v matchWatchdogs() (odkomentovano + rozsireno)
- [x] Error handling -- email chyba neblokuje aktualizaci lastNotified
- [ ] Runtime test -- vyzaduje RESEND_API_KEY a DB s watchdogy
