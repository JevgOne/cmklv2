# Plán: SEO Quick Fixes — sitemap + robots.txt + ceník OG

**Datum:** 2026-04-28
**Autor:** planovač
**Task:** #52

---

## PROBLÉM

3 drobné SEO mezery identifikované v auditu:
1. Sitemap chybí `/cenik` a `/sluzby`
2. Robots.txt neblokuje private partner/parts/account cesty
3. `/cenik` stránka nemá openGraph ani canonical

---

## IMPLEMENTACE

### Fix 1: Sitemap — přidat /cenik a /sluzby

**Soubor:** `app/sitemap.ts`

Přidat do pole `staticPages` (za `/kontakt`, před komentář `// Informační SEO stránky`):

```typescript
{
  url: `${BASE_URL}/cenik`,
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.7,
},
{
  url: `${BASE_URL}/sluzby`,
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.7,
},
```

### Fix 2: Robots.txt — přidat disallow pro private cesty

**Soubor:** `app/robots.ts`

Přidat do `disallow` pole:

```typescript
disallow: [
  "/api/",
  "/admin/",
  "/makler/",
  "/marketplace/dashboard",
  "/marketplace/investor",
  "/marketplace/dealer",
  "/login",
  "/prihlaseni",
  "/registrace",
  // ↓ PŘIDAT ↓
  "/partner/",
  "/parts/",
  "/muj-ucet/",
  "/moje-inzeraty/",
  "/shop/moje-objednavky/",
  "/dily/moje-objednavky/",
  "/shop/kosik/",
  "/dily/kosik/",
  "/zapomenute-heslo",
  "/reset-hesla/",
  "/overeni-emailu/",
],
```

### Fix 3: /cenik — přidat openGraph + canonical

**Soubor:** `app/(web)/cenik/page.tsx`

Přidat importy a rozšířit metadata:

```typescript
import { Metadata } from "next";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Ceník | Carmakler",
  description:
    "Prodej vozu přes Carmakler za jednoduchou provizi 5 % z prodejní ceny. Žádné skryté poplatky, vše v ceně.",
  openGraph: {
    title: "Ceník služeb | CarMakléř",
    description:
      "Jednoduchá provize 5 % z prodejní ceny. Fotky, inzerce, prohlídky, smlouvy — vše v ceně.",
  },
  alternates: pageCanonical("/cenik"),
};
```

---

## SOUBORY

| Soubor | Akce | Řádky |
|--------|------|-------|
| `app/sitemap.ts` | +2 statické stránky | za řádek ~93 |
| `app/robots.ts` | +9 disallow cest | rozšířit pole řádek 11-20 |
| `app/(web)/cenik/page.tsx` | +openGraph, +canonical import | řádky 1-8 |

**Celkem:** 0 nových + 3 upravené soubory. ~15 minut effort.

---

## STOP PRAVIDLA

1. **STOP** — NEpřidávat private stránky do sitemap (admin, partner, makler, muj-ucet)
2. **STOP** — robots.txt disallow NEZABRÁNÍ indexaci pokud Google najde URL jinou cestou. Pro úplné blokování by byl potřeba `noindex` meta tag — ale robots.txt je dostatečný pro většinu případů.
3. **STOP** — canonical na /cenik: `pageCanonical("/cenik")` — použít existující helper, NE hardcoded URL
