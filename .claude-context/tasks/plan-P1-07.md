# Plan P1-07: Nahradit fiktivni kontaktni udaje — centralizace

**Priorita:** P1
**Slozitost:** S (az budou realne udaje k dispozici)
**Zavislosti:** ZADNE — ceka na business decision (realna adresa, telefon, ICO)
**Batch:** 1

---

## Cil

Nahradit vsechny hardcoded placeholder kontakty (Vinohradska 123, +420 800 123 456, fiktivni pobocky Brno/Ostrava) centralizovanou konfiguraci v `lib/company-info.ts`. Po zmene se realne udaje meni na JEDNOM miste.

**DULEZITE:** Formulare s `placeholder="+420 777 123 456"` se NEMENI — ty jsou vzorove formaty pro uzivatele, ne firemni kontakty.

---

## Kompletni audit — vsechna mista s fiktivnimi kontakty

Grep odhalil 14 souboru (bez form placeholderu). Rozdelene na 3 kategorie:

### A) Firemni kontakty (NAHRADIT companyInfo)

| # | Soubor | Radky | Co je fiktivni |
|---|--------|-------|----------------|
| 1 | `app/(web)/page.tsx` | 226, 233 | JSON-LD: telephone, streetAddress |
| 2 | `app/(web)/kontakt/page.tsx` | 10,14,18-40,42-47,53-73,96 | Metadata, branches, contactInfo, JSON-LD, map placeholder |
| 3 | `app/(web)/o-nas/page.tsx` | 104, 111 | JSON-LD: streetAddress, telephone |
| 4 | `app/prezentace/page.tsx` | 359-363 | Firemni telefon v prezentaci |
| 5 | `components/main/Footer.tsx` | 38 | tel:+420123456789 |
| 6 | `components/web/Footer.tsx` | 37 | tel:+420123456789 (EXTRA footer — legacy?) |
| 7 | `components/inzerce/Footer.tsx` | 83 | +420 123 456 789 |
| 8 | `components/shop/Footer.tsx` | 83 | +420 123 456 789 |
| 9 | `components/marketplace/Footer.tsx` | 78 | +420 123 456 789 |

### B) Fiktivni pobocky (ODEBRAT nebo nahradit realnymi)

| # | Soubor | Radky | Co je fiktivni |
|---|--------|-------|----------------|
| 1 | `app/(web)/kontakt/page.tsx` | 26-39 | Brno "Masarykova 45", Ostrava "Nadrazni 12" |

### C) Form placeholdery (NECHAVAME — vzorove formaty)

Nasledujici soubory maji `placeholder="+420 777 123 456"` nebo `"+420 123 456 789"` — to jsou vzorove formaty pro uzivatele, NE firemni kontakty:
- `components/web/SellerInfo.tsx:198`
- `components/web/VykupForm.tsx:145`
- `components/web/CareerForm.tsx:94`
- `components/web/SellCarForm.tsx:187`
- `components/web/OrderForm.tsx:75`
- `components/web/PojisteniForm.tsx:93`
- `components/web/FinancovaniCalc.tsx:105`
- `app/(web)/registrace/page.tsx:317`
- `app/(web)/registrace/makler/page.tsx:297`
- `app/(web)/registrace/partner/page.tsx:300`
- `app/(web)/registrace/dodavatel/page.tsx:264`
- `app/(web)/inzerce/registrace/page.tsx:272`
- `app/(web)/makler/[slug]/MaklerContactForm.tsx:86`
- `app/(pwa)/makler/contacts/new/page.tsx:86`

**Tyto se NEMENI.**

---

## Kroky implementace

### Krok 1: Vytvorit lib/company-info.ts

**Soubor:** `lib/company-info.ts` (NOVY)

```ts
/**
 * Centralni kontaktni a firemni udaje CarMakler.
 * Meni se na JEDNOM miste — vsude jinde importovat.
 *
 * TODO: Pred launchem nahradit vsechny [DOPLNIT] realnymi udaji.
 */

export const companyInfo = {
  name: "CarMakler",
  legalName: "CarMakler s.r.o.",
  ico: "[DOPLNIT]",
  dic: "[DOPLNIT]",

  address: {
    street: "[DOPLNIT ULICE A CISLO]",
    city: "Praha",
    zip: "[DOPLNIT PSC]",
    country: "CZ",
    /** Plna adresa pro zobrazeni */
    full: "[DOPLNIT ULICE], [DOPLNIT PSC] Praha",
  },

  contact: {
    /** Zobrazovany format telefonu */
    phone: "[DOPLNIT TELEFON]",
    /** Format pro href="tel:" */
    phoneHref: "tel:+420[DOPLNIT]",
    /** Zobrazovany format telefonu pro JSON-LD (s pomlckami) */
    phoneJsonLd: "+420-[DOPLNIT]",
    email: "info@carmakler.cz",
    emailHref: "mailto:info@carmakler.cz",
  },

  hours: "Po-Pa 8:00-18:00",
  hoursSpec: {
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "18:00",
  },

  web: {
    url: "https://www.carmakler.cz",
    logo: "https://www.carmakler.cz/brand/logo.svg",
  },

  social: {
    facebook: "https://facebook.com/carmakler",
    instagram: "https://instagram.com/carmakler",
    youtube: "https://youtube.com/@carmakler",
  },

  /**
   * Pobocky.
   * POZNAMKA: Odebrat fiktivni pobocky Brno a Ostrava.
   * Pridat realne pobocky az budou existovat.
   */
  branches: [
    {
      city: "Praha",
      type: "Centrala" as const,
      address: "[DOPLNIT ULICE], [DOPLNIT PSC] Praha",
      phone: "[DOPLNIT TELEFON]",
      hours: "Po-Pa 8:00-18:00",
    },
  ],
} as const;
```

### Krok 2: Nahradit v `app/(web)/page.tsx`

**Diff (radky 216-238):**
```diff
+import { companyInfo } from "@/lib/company-info";

 const jsonLd = {
   "@context": "https://schema.org",
   "@type": "Organization",
-  name: "CarMakléř",
-  url: "https://www.carmakler.cz",
-  logo: "https://www.carmakler.cz/brand/logo.svg",
+  name: companyInfo.name,
+  url: companyInfo.web.url,
+  logo: companyInfo.web.logo,
   description: "...",
   contactPoint: {
     "@type": "ContactPoint",
-    telephone: "+420-800-123-456",
+    telephone: companyInfo.contact.phoneJsonLd,
     contactType: "customer service",
     areaServed: "CZ",
     availableLanguage: "Czech",
   },
   address: {
     "@type": "PostalAddress",
-    streetAddress: "Vinohradská 123",
-    addressLocality: "Praha",
-    postalCode: "120 00",
+    streetAddress: companyInfo.address.street,
+    addressLocality: companyInfo.address.city,
+    postalCode: companyInfo.address.zip,
     addressCountry: "CZ",
   },
 };
```

### Krok 3: Nahradit v `app/(web)/kontakt/page.tsx`

Nejkomplexnejsi zmena — 6 mist v jednom souboru:

```diff
+import { companyInfo } from "@/lib/company-info";

 export const metadata: Metadata = {
   title: "Kontakt",
   description:
-    "Kontaktujte CarMakléř. Centrála Praha, pobočky Brno a Ostrava. Telefon +420 800 123 456, e-mail info@carmakler.cz.",
+    `Kontaktujte ${companyInfo.name}. ${companyInfo.address.city}. Telefon ${companyInfo.contact.phone}, e-mail ${companyInfo.contact.email}.`,
   openGraph: {
     title: "Kontakt | CarMakléř",
     description:
-      "Kontaktujte nás. Centrála Praha, pobočky Brno a Ostrava. Telefon +420 800 123 456.",
+      `Kontaktujte nás. ${companyInfo.address.city}. Telefon ${companyInfo.contact.phone}.`,
   },
 };

-const branches = [
-  { city: "Praha", type: "Centrála", address: "Vinohradská 123, 120 00 Praha 2", phone: "+420 800 123 456", hours: "Po-Pá 8:00-18:00" },
-  { city: "Brno", type: "Pobočka", address: "Masarykova 45, 602 00 Brno", phone: "+420 800 123 457", hours: "Po-Pá 9:00-17:00" },
-  { city: "Ostrava", type: "Pobočka", address: "Nádražní 12, 702 00 Ostrava", phone: "+420 800 123 458", hours: "Po-Pá 9:00-17:00" },
-];
+const branches = companyInfo.branches;

-const contactInfo = [
-  { icon: "📍", label: "Adresa", value: "Vinohradská 123, 120 00 Praha 2" },
-  { icon: "📞", label: "Telefon", value: "+420 800 123 456" },
-  { icon: "✉️", label: "E-mail", value: "info@carmakler.cz" },
-  { icon: "🕐", label: "Otevírací doba", value: "Po-Pá 8:00-18:00" },
-];
+const contactInfo = [
+  { icon: "📍", label: "Adresa", value: companyInfo.address.full },
+  { icon: "📞", label: "Telefon", value: companyInfo.contact.phone },
+  { icon: "✉️", label: "E-mail", value: companyInfo.contact.email },
+  { icon: "🕐", label: "Otevírací doba", value: companyInfo.hours },
+];

 const contactJsonLd = {
   // ... shodne jako homepage — nahradit companyInfo.*
-  telephone: "+420-800-123-456",
+  telephone: companyInfo.contact.phoneJsonLd,
   // address shodne
 };

 // Map placeholder (radek 93-98):
-  <p className="text-gray-400 text-sm mt-1">Vinohradská 123, Praha 2</p>
+  <p className="text-gray-400 text-sm mt-1">{companyInfo.address.full}</p>
```

### Krok 4: Nahradit v `app/(web)/o-nas/page.tsx`

```diff
+import { companyInfo } from "@/lib/company-info";

 // JSON-LD (radky 102-115):
-  streetAddress: "Vinohradská 123",
+  streetAddress: companyInfo.address.street,
-  telephone: "+420-800-123-456",
+  telephone: companyInfo.contact.phoneJsonLd,
```

### Krok 5: Nahradit v `app/prezentace/page.tsx`

```diff
+import { companyInfo } from "@/lib/company-info";

 // Radky 359-363:
-  <a href="tel:+420800123456" ...>
-    <span className="font-semibold">+420 800 123 456</span>
+  <a href={companyInfo.contact.phoneHref} ...>
+    <span className="font-semibold">{companyInfo.contact.phone}</span>
```

### Krok 6: Nahradit ve vsech 5 footerech

**`components/main/Footer.tsx:38`:**
```diff
-  { href: "tel:+420123456789", label: "+420 123 456 789", external: true },
+  { href: companyInfo.contact.phoneHref, label: companyInfo.contact.phone, external: true },
```
Pridat import `companyInfo` na zacatek souboru.

**Shodne pro:**
- `components/web/Footer.tsx:37`
- `components/inzerce/Footer.tsx:82-83`
- `components/shop/Footer.tsx:82-83`
- `components/marketplace/Footer.tsx:78-79`

Pro subdomenove footery (inzerce/shop/marketplace) je telefon inline text, ne objekt — nahradit:
```diff
-  +420 123 456 789
+  {companyInfo.contact.phone}
```
A pridat `import { companyInfo } from "@/lib/company-info";`

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `lib/company-info.ts` | NOVY — centralni konfigurace |
| `app/(web)/page.tsx` | Import + nahradit JSON-LD (3 mista) |
| `app/(web)/kontakt/page.tsx` | Import + nahradit metadata, branches, contactInfo, JSON-LD, map (6 mist) |
| `app/(web)/o-nas/page.tsx` | Import + nahradit JSON-LD (2 mista) |
| `app/prezentace/page.tsx` | Import + nahradit telefon (1 misto) |
| `components/main/Footer.tsx` | Import + nahradit telefon v links (1 misto) |
| `components/web/Footer.tsx` | Import + nahradit telefon (1 misto) |
| `components/inzerce/Footer.tsx` | Import + nahradit inline telefon (1 misto) |
| `components/shop/Footer.tsx` | Import + nahradit inline telefon (1 misto) |
| `components/marketplace/Footer.tsx` | Import + nahradit inline telefon (1 misto) |

**Celkem: 1 novy soubor + 9 upravenych (17 konkretnich zmen)**

## Overeni

- [ ] Grep `"Vinohradsk"` ve zdrojovem kodu (mimo company-info.ts) vraci 0 vysledku
- [ ] Grep `"800.123.456"` ve zdrojovem kodu (mimo company-info.ts) vraci 0 vysledku
- [ ] Grep `"420123456789"` ve zdrojovem kodu (mimo company-info.ts) vraci 0 vysledku
- [ ] Grep `"Masarykova"` ve zdrojovem kodu vraci 0 vysledku (fiktivni pobocka odstranena)
- [ ] Grep `"Nadrazni 12"` ve zdrojovem kodu vraci 0 vysledku
- [ ] Homepage JSON-LD pouziva companyInfo
- [ ] Kontaktni stranka zobrazuje branches z companyInfo (bez Brna a Ostravy)
- [ ] Vsech 5 footeru zobrazuje spravny telefon
- [ ] Prezentacni stranka zobrazuje spravny telefon
- [ ] Build prochazi bez TypeScript chyb
- [ ] Form placeholdery (+420 777 123 456) jsou NEZMENENE
