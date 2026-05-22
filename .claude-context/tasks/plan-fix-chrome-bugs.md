# Plan oprav — 2 kriticke bugy + 2 drobnosti z Chrome testu

**Datum:** 2026-04-05
**Autor:** Planovac (agent team)
**Status:** Hotovo

---

## BUG #1 KRITICKY — /nabidka error: images.unsplash.com not configured

### Root cause
`next.config.ts:65-76` — `images.remotePatterns` obsahuje pouze:
- `res.cloudinary.com`
- `placehold.co`

Chybi `images.unsplash.com`.

### Kde se Unsplash pouziva
1. **`app/(web)/page.tsx:292`** — homepage hero obrazek (`<img>` tag, ne `<Image>`)
2. **`prisma/seed.ts:807-832`** — seed data pro VehicleImage (5 URL s Unsplash)
3. **Databaze** — seednute vozidla maji Unsplash URL ve `VehicleImage.url`

Error nastava na `/nabidka` pri renderovani `<Image>` komponent s vehicle images z DB, ktere maji Unsplash URL ze seedu.

### Oprava
**Soubor:** `next.config.ts`
**Radky:** 65-76

```typescript
// PRED:
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
    },
    {
      protocol: "https",
      hostname: "placehold.co",
    },
  ],
},

// PO:
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
    },
    {
      protocol: "https",
      hostname: "placehold.co",
    },
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
  ],
},
```

### Overeni
- `/nabidka` se nacte bez erroru
- Obrazky vozidel se zobrazi

### Poznamka pro produkci
V produkci budou obrazky na Cloudinary, ne Unsplash. Ale pro dev/staging je treba Unsplash povolit, protoze seed data ho pouzivaji.

---

## BUG #2 KRITICKY — /makler/messages nefunguje

### Root cause
Chybova hlaska "Nepodařilo se načíst zprávy. Zkuste to prosím znovu." pochazi z `app/(pwa)/makler/messages/error.tsx:21` — to je Next.js error boundary, ktera se zobrazi kdyz `page.tsx` hodi chybu.

**Analyza `messages/page.tsx`:**
Stranka na radku 18-30 dela Prisma query:
```typescript
const vehicles = await prisma.vehicle.findMany({
  where: {
    brokerId: userId,
    inquiries: { some: {} },
  },
  include: {
    images: { where: { isPrimary: true }, take: 1 },
    inquiries: {
      orderBy: { createdAt: "desc" },
    },
  },
  orderBy: { updatedAt: "desc" },
});
```

**Mozne priciny erroru:**
1. **Session nema `id` field** — radek 13: `if (!session?.user?.id) redirect("/login");` — pokud `session.user.id` je undefined ale session existuje, redirect nenastane ale `userId` bude undefined
2. **Prisma schema problem** — `inquiries` relace na Vehicle modelu je `VehicleInquiry[]`, ne `Inquiry[]`. Filter `inquiries: { some: {} }` by mel fungovat.
3. **Chyba autorizace** — middleware pusti BROKER, ale session callback mozna nedodava `id` field

**Nejpravdepodobnejsi pricina:**
Zkontrolovat `lib/auth.ts` callback — session callback musi mapovat `token.sub` na `session.user.id`:

```typescript
// lib/auth.ts, radek 79+
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.sub!;  // ← TOTO MUSI EXISTOVAT
    session.user.role = token.role;
    // ...
  }
}
```

### Oprava — krok 1: Overit session callback
**Soubor:** `lib/auth.ts`
Overit ze session callback obsahuje `session.user.id = token.sub` nebo `session.user.id = token.id`.

### Oprava — krok 2: Pridat lepsi error handling
**Soubor:** `app/(pwa)/makler/messages/page.tsx`

```typescript
// Pridat try-catch kolem Prisma query
export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  let vehiclesWithInquiries: { ... }[] = [];

  try {
    const vehicles = await prisma.vehicle.findMany({
      // ... existujici query
    });

    vehiclesWithInquiries = vehicles.map((vehicle) => {
      // ... existujici mapping
    });
  } catch (error) {
    console.error("[Messages] Failed to load:", error);
    // Nechat error boundary zachytit — ale s lepsi diagnostikou
    throw error;
  }

  return (/* ... */);
}
```

### Debugging postup
1. Otevrit `/makler/messages` v Chrome s otevrenymi DevTools → Network tab
2. Zkontrolovat server-side logy (Vercel logs / terminal)
3. Overit ze prihlaseny user ma roli BROKER a status ACTIVE
4. Overit ze `session.user.id` je definovany (pridat `console.log(session)`)
5. Zkontrolovat ze v DB existuji VehicleInquiry zaznamy pro vozidla tohoto maklere

### Overeni
- Prihlasit se jako BROKER
- `/makler/messages` zobrazi seznam dotazu (nebo prazdny stav)
- Zadny error boundary se neobjevi

---

## DROBNOST #1 — Footer obsahuje "[DOPLNIT TELEFON]"

### Root cause
`lib/company-info.ts:25-28`:
```typescript
contact: {
  phone: "[DOPLNIT TELEFON]",
  phoneHref: "tel:+420[DOPLNIT]",
  phoneJsonLd: "+420-[DOPLNIT]",
  email: "info@carmakler.cz",
},
```

Oba Footer komponenty (`components/web/Footer.tsx:38` a `components/main/Footer.tsx:38`) ctou `companyInfo.contact.phone` — zobrazuji tedy placeholder.

### Dalsi [DOPLNIT] v company-info.ts
| Pole | Aktualni hodnota |
|------|-----------------|
| `ico` | `[DOPLNIT]` |
| `dic` | `[DOPLNIT]` |
| `address.street` | `[DOPLNIT ULICE A CISLO]` |
| `address.zip` | `[DOPLNIT PSC]` |
| `address.full` | `[DOPLNIT ULICE], [DOPLNIT PSC] Praha` |
| `contact.phone` | `[DOPLNIT TELEFON]` |
| `contact.phoneHref` | `tel:+420[DOPLNIT]` |
| `contact.phoneJsonLd` | `+420-[DOPLNIT]` |
| `branches[0].address` | `[DOPLNIT ULICE], [DOPLNIT PSC] Praha` |
| `branches[0].phone` | `[DOPLNIT TELEFON]` |

### Oprava
**Soubor:** `lib/company-info.ts`

**Varianta A — Doplnit realne udaje:**
```typescript
contact: {
  phone: "+420 XXX XXX XXX",   // Realne cislo
  phoneHref: "tel:+420XXXXXXXXX",
  phoneJsonLd: "+420-XXX-XXX-XXX",
  email: "info@carmakler.cz",
},
```

**Varianta B — Docasne skryt telefon (pokud cislo jeste neni):**
Upravit Footer aby nezobrazoval polozky s "[DOPLNIT":
```typescript
// V obou Footer komponentach — filtrovat linky:
links: footerSections[3].links.filter(l => !l.label.includes("[DOPLNIT"))
```

**Doporuceni:** Varianta A je preferovana. Uzivatel musi dodat realne firemni udaje.

---

## DROBNOST #2 — /notifikace → 404

### Root cause
Stranka `/notifikace` **neexistuje jako index page**. Existuje pouze:
- `app/(web)/notifikace/[token]/page.tsx` — nastaveni notifikaci prodejce (vyzaduje token)

Cesta `/notifikace` BEZ tokenu → 404 je **spravne chovani** — neni to bug.

### Odkud se tam uzivatel dostal?
Grep ukazuje ze `/notifikace` se v zadnem JSX odkazu neobjevuje. Jedine misto je `middleware.ts:38` kde `/notifikace` je v SKIP_REWRITE_PREFIXES (aby se nepresmerovalo pres subdomenu).

**Mozne vysvetleni:**
- Chrome tester zadal URL rucne
- Nebo existoval odkaz ktery byl odstranen

### Oprava
**Zadna akce nutna** — /notifikace/[token] funguje spravne. Adresa /notifikace bez tokenu spravne vraci 404.

**Volitelne:** Pridat `app/(web)/notifikace/page.tsx` s redirectem na homepage nebo info strankou "Pro spravni notifikaci pouzijte odkaz z emailu."

---

## Souhrn — poradi implementace

| # | Typ | Oprava | Soubor | Slozitost |
|---|-----|--------|--------|-----------|
| 1 | KRITICKY | Pridat images.unsplash.com do remotePatterns | `next.config.ts:65-76` | Trivial (3 radky) |
| 2 | KRITICKY | Debug + fix messages page | `app/(pwa)/makler/messages/page.tsx` + `lib/auth.ts` | Stredni (debugging) |
| 3 | DROBNOST | Doplnit telefon a dalsi udaje | `lib/company-info.ts` | Trivial (ziskani udaju od uzivatele) |
| 4 | DROBNOST | /notifikace 404 | Zadna akce (spravne chovani) | — |

### Zavislosti
- Bug #1 a #2 jsou nezavisle
- Bug #1 je trivialni fix
- Bug #2 vyzaduje debugging — nejdrive overit session callback, pak Prisma query
