# Plan P1-06: Konfigurace Resend pro odchozi emaily

**Priorita:** P1
**Slozitost:** M
**Zavislosti:** P0-07 (env soubory)
**Batch:** 1 (env musi existovat, ale muze bezet paralelne pokud dev ma RESEND_API_KEY)

---

## Cil

Overit ze vsechny email send cesty pouzivaji Resend API spravne. Nakonfigurovat `RESEND_API_KEY` a `RESEND_FROM_EMAIL`. Otestovat klicove emaily.

---

## Analyza stavajicich email cest

Grep `Resend` v *.ts souborech ukazuje 8 souboru ktere pouzivaji Resend:

| Soubor | Ucel | Stav |
|--------|------|------|
| `app/api/emails/send/route.ts` | Broker emaily z PWA | KOD EXISTUJE, chybi jen API klic |
| `app/api/invitations/route.ts:120-126` | Pozvanka maklere | KOD EXISTUJE, chybi API klic |
| `app/api/cron/daily-summary/route.ts:246-249` | Denni souhrn pro maklere | KOD EXISTUJE |
| `app/api/contracts/[id]/send/route.ts` | Odeslani smlouvy | KOD EXISTUJE |
| `app/api/payments/[id]/confirm/route.ts:91` | Potvrzeni platby | KOD EXISTUJE |
| `app/api/payments/webhook/route.ts` | Stripe webhook | KOD EXISTUJE |
| `app/api/marketplace/apply/route.ts` | Prihlaska do marketplace | KOD EXISTUJE |
| `app/api/payouts/seller/[id]/process/route.ts` | Vyplata prodejci | KOD EXISTUJE |

**Zaverr:** Kod pro Resend je vsude implementovany. Jediny bloker je chybejici `RESEND_API_KEY` v env.

---

## Kroky implementace

### Krok 1: Ziskat Resend API klic

1. Registrace na https://resend.com
2. Overit domenu `carmakler.cz` (DNS zaznamy: SPF, DKIM, DMARC)
3. Vytvorit API klic
4. Nastavit `RESEND_FROM_EMAIL` — musi byt z overene domeny

### Krok 2: Pridat do .env.local

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=info@carmakler.cz
```

### Krok 3: Overit vsechny email cesty

Pro kazdy soubor zkontrolovat:

**a) `app/api/emails/send/route.ts`** (broker emaily)
- Radek 36: `const { templateType, recipientEmail, ... } = parsed.data;`
- Radek 100+: `const email = generateEmail(templateType, brokerData, {...});`
- Radek 120+: `await resend.emails.send({...})`
- **Chybi:** Overit ze Resend instance se vytvari s env klicem, ne hardcoded

**b) `app/api/invitations/route.ts`**
- Radek 120: `if (process.env.RESEND_API_KEY) {` — podminene odeslani
- **OK** — graceful skip pokud neni klic

**c) `app/api/cron/daily-summary/route.ts`**
- Radek 246: `const resend = new Resend(process.env.RESEND_API_KEY);`
- **Chybi:** Check na existenci klice pred vytvorenim instance

**d) `app/api/contacts/route.ts`** nebo `app/api/contact/route.ts`
- Overit zda kontaktni formular odesila email. Pokud ne — DOPLNIT.
- Kontaktni formular by mel odeslat email na info@carmakler.cz s kopii odesilatelovi

### Krok 4: Pridat graceful fallback vsude kde chybi

V kazdem souboru kde se pouziva Resend pridat check:

```ts
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn("RESEND_API_KEY not set, email not sent");
  // Pokracovat bez emailu — nezahazovat request
  return;
}
```

### Krok 5: Otestovat klicove emaily

Seznam emailu k testovani (v poradi priority):

1. **Kontaktni formular** (`/kontakt`) — email na info@
2. **Pozvanka maklere** (admin panel) — invitation email
3. **Broker emaily z PWA** — inquiry response, nabidka, cena
4. **Denni souhrn** (CRON) — daily summary pro maklere
5. **Potvrzeni platby** — payment confirmation
6. **Watchdog match** (po P1-01) — nove auto matching

### Krok 6: Pridat Resend error logging

V kazdem email send bloku overit ze errors se loguji:

```ts
const { data, error } = await resend.emails.send({...});
if (error) {
  console.error("Resend email error:", error);
  // Volitelne: poslat do Sentry (po P1-10)
}
```

---

## DNS konfigurace pro domenu

Pro overeni domeny `carmakler.cz` v Resend:

```
# SPF
TXT @ "v=spf1 include:_spf.resend.com ~all"

# DKIM
CNAME resend._domainkey.carmakler.cz → cnam-value-from-resend

# DMARC (doporuceno)
TXT _dmarc.carmakler.cz "v=DMARC1; p=quarantine; rua=mailto:dmarc@carmakler.cz"
```

---

## Soubory k uprave

| Soubor | Zmena |
|--------|-------|
| `.env.local` | Pridat RESEND_API_KEY + RESEND_FROM_EMAIL |
| `app/api/cron/daily-summary/route.ts` | Pridat check na RESEND_API_KEY |
| `app/api/contact/route.ts` | Overit/doplnit email odeslani |
| Ostatni API routes s Resend | Overit graceful error handling |

## Overeni

- [ ] RESEND_API_KEY je nastaveny v .env.local
- [ ] Domena carmakler.cz je overena v Resend (SPF, DKIM)
- [ ] Kontaktni formular odesila email
- [ ] Pozvanka maklere odesila email
- [ ] Denni souhrn CRON odesila email
- [ ] Chybejici API klic nevyhazuje 500 error (graceful skip)
- [ ] Email error logy fungují
