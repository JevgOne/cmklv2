# Plan P1-01: Watchdog email notifikace

**Priorita:** P1
**Slozitost:** S
**Zavislosti:** P1-06 (Resend konfigurace) — v Batch 1 protoze kod + sablona jiz existuji, staci propojit
**Batch:** 1

---

## Cil

Implementovat odeslani emailu pri watchdog match. Aktualne je v `lib/listing-sla.ts:213-215` jen TODO komentar — kupujici nedostane email kdyz se objevi auto odpovidajici jeho kriteriim. Email sablona `watchdog-match.ts` JIZ EXISTUJE a je plne funkcni.

---

## Analyza stavajiciho kodu

### Existujici soubory:
1. **`lib/listing-sla.ts:170-220`** — funkce `matchWatchdogs()` ktera:
   - Nacte vsechny aktivni watchdogy
   - Pro kazdy najde nove inserty matching kriteria
   - Aktualizuje `lastNotified`
   - **CHYBI:** Odeslani emailu (radky 213-215 jsou zakomentovane)

2. **`lib/email-templates/listing/watchdog-match.ts`** — kompletni email sablona:
   - `WatchdogMatchData` interface (userName, criteria, matches[], manageUrl)
   - `watchdogMatchSubject()` — generuje predmet emailu
   - `watchdogMatchHtml()` — HTML sablona s kartami aut
   - `watchdogMatchText()` — plain text verze

3. **`app/api/cron/watchdog-match/route.ts`** — CRON endpoint ktery vola `matchWatchdogs()`

4. **`app/api/emails/send/route.ts`** — existujici Resend integrace (pouziva se pro broker emaily)

### Chybejici propojeni:
Funkce `matchWatchdogs()` nenajde Resend import a neposila email. Staci doplnit ~20 radku kodu.

---

## Kroky implementace

### Krok 1: Upravit matchWatchdogs() v listing-sla.ts

**Soubor:** `lib/listing-sla.ts`

**Aktualni stav (radky 198-216):**
```ts
const newListings = await prisma.listing.findMany({
  where,
  select: { id: true, brand: true, model: true, price: true },
  take: 10,
});

if (newListings.length > 0) {
  matched++;

  await prisma.watchdog.update({
    where: { id: watchdog.id },
    data: { lastNotified: new Date() },
  });

  // TODO: Odeslat email notifikaci
  // const recipientEmail = watchdog.email || watchdog.user?.email;
  // if (recipientEmail) { ... }
}
```

**Zmena — rozsirit select a doplnit email logiku:**

```ts
const newListings = await prisma.listing.findMany({
  where,
  select: {
    id: true,
    brand: true,
    model: true,
    price: true,
    year: true,
    mileage: true,
    slug: true,
    images: { take: 1, select: { url: true } },
  },
  take: 10,
});

if (newListings.length > 0) {
  matched++;

  await prisma.watchdog.update({
    where: { id: watchdog.id },
    data: { lastNotified: new Date() },
  });

  // Odeslat email notifikaci
  const recipientEmail = watchdog.email || watchdog.user?.email;
  if (recipientEmail) {
    try {
      await sendWatchdogEmail(recipientEmail, watchdog, newListings);
    } catch (emailError) {
      console.error(`Watchdog email failed for ${watchdog.id}:`, emailError);
      // Nepropagovat chybu — watchdog match se zapise, email se zkusi znovu priste
    }
  }
}
```

### Krok 2: Pridat sendWatchdogEmail funkci

**Soubor:** `lib/listing-sla.ts` — pridat nad matchWatchdogs():

```ts
import { Resend } from "resend";
import {
  watchdogMatchSubject,
  watchdogMatchHtml,
  watchdogMatchText,
  type WatchdogMatchData,
} from "@/lib/email-templates/listing/watchdog-match";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz";

async function sendWatchdogEmail(
  recipientEmail: string,
  watchdog: { id: string; brand?: string | null; model?: string | null; city?: string | null },
  listings: Array<{
    id: string;
    brand: string;
    model: string;
    price: number;
    year: number | null;
    mileage: number | null;
    slug: string | null;
    images: { url: string }[];
  }>
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping watchdog email");
    return;
  }

  const resend = new Resend(apiKey);

  // Sestavit lidsky citelny popis kriterii
  const criteriaParts: string[] = [];
  if (watchdog.brand) criteriaParts.push(watchdog.brand);
  if (watchdog.model) criteriaParts.push(watchdog.model);
  if (watchdog.city) criteriaParts.push(watchdog.city);
  const criteria = criteriaParts.length > 0 ? criteriaParts.join(", ") : "Vsechna vozidla";

  const data: WatchdogMatchData = {
    userName: recipientEmail.split("@")[0], // fallback pokud nemame jmeno
    criteria,
    matches: listings.map((l) => ({
      title: `${l.brand} ${l.model}`,
      price: `${l.price.toLocaleString("cs-CZ")} Kc`,
      year: l.year || 0,
      mileage: l.mileage ? `${l.mileage.toLocaleString("cs-CZ")} km` : "neuvedeno",
      imageUrl: l.images[0]?.url,
      listingUrl: `${BASE_URL}/nabidka/${l.slug || l.id}`,
    })),
    manageUrl: `${BASE_URL}/muj-ucet/watchdogy`,
  };

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
    to: recipientEmail,
    subject: watchdogMatchSubject(data),
    html: watchdogMatchHtml(data),
    text: watchdogMatchText(data),
  });
}
```

### Krok 3: Overit Watchdog model ma user relaci

V Prisma schema zkontrolovat ze Watchdog model ma:
```prisma
model Watchdog {
  // ...
  email     String?
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  // ...
}
```

A ze `matchWatchdogs()` nacita `user: { select: { email: true } }` v prisma query (radek ~160).

---

## Soubory k uprave

| Soubor | Zmena |
|--------|-------|
| `lib/listing-sla.ts` | Pridat importy Resend + watchdog email sablony, pridat `sendWatchdogEmail()`, odkomentovat a rozsirit email logiku v `matchWatchdogs()` |

## Overeni

- [ ] RESEND_API_KEY v env — emaily se odesilaji
- [ ] Bez RESEND_API_KEY — graceful skip (console.warn, ne crash)
- [ ] Email obsahuje spravne nazvy aut, ceny, odkazy na detail
- [ ] Email ma subject ve formatu "Nasli jsme X aut podle Vasich kriterii"
- [ ] Kliknuti na "Zobrazit detail" vede na spravny listing URL
- [ ] Chyba pri odesilani emailu NEblokuje aktualizaci lastNotified
- [ ] CRON endpoint `/api/cron/watchdog-match` funguje end-to-end
