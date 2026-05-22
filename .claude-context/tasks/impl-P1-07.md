# Implementace P1-07: Centralizace kontaktnich udaju

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Vytvorena centralni konfigurace `lib/company-info.ts` a nahrazeny vsechny fiktivni kontakty (Vinohradska 123, +420 800 123 456, fiktivni pobocky Brno/Ostrava) importem z jednoho mista.

### Vytvorene soubory

| Soubor | Popis |
|--------|-------|
| `lib/company-info.ts` | Centralni konfigurace: nazev, ICO, adresa, telefon, email, oteviraci doba, pobocky, social linky |

### Upravene soubory (9 souboru, 17 konkretnich zmen)

| Soubor | Zmena |
|--------|-------|
| `app/(web)/page.tsx` | Import + JSON-LD: name, url, logo, telephone, streetAddress, postalCode |
| `app/(web)/kontakt/page.tsx` | Import + metadata, branches (Brno/Ostrava odstraneny), contactInfo, JSON-LD, map placeholder |
| `app/(web)/o-nas/page.tsx` | Import + JSON-LD: name, url, logo, streetAddress, postalCode, telephone |
| `app/prezentace/page.tsx` | Import + telefon href + zobrazeny text |
| `components/main/Footer.tsx` | Import + telefon v links |
| `components/web/Footer.tsx` | Import + telefon v links |
| `components/inzerce/Footer.tsx` | Import + inline telefon href + text |
| `components/shop/Footer.tsx` | Import + inline telefon href + text |
| `components/marketplace/Footer.tsx` | Import + inline telefon href + text |

### Co NEBYLO zmeneno (dle planu)

Form placeholders (`+420 777 123 456`) v 14 souborech -- jsou vzorove formaty pro uzivatele, ne firemni kontakty.

### Verifikace

- `Vinohradsk` v .ts/.tsx: 0 vysledku (jen prisma/seed.ts -- seed data)
- `800.123.456`: 0 vysledku
- `420123456789`: 0 vysledku
- `Masarykova`: 0 vysledku (fiktivni pobocka Brno odstranena)

## Poznamky

- `companyInfo` obsahuje `[DOPLNIT]` placeholders -- pred launchem vyplnit realnymi udaji
- Fiktivni pobocky Brno a Ostrava ODSTRANENY -- zustavaj pouze Praha (centrala)
- Vsechny zmeny jsou na jednom miste v `lib/company-info.ts`
