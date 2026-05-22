# QA Report: Audit veřejného webu (web) — 2026-05-03

**Autor:** Kontrolor  
**Datum:** 2026-05-03  
**Rozsah:** Všechny stránky v `app/(web)/` dle plánu sekce 2.1  
**Nalezeno stránek:** 130 page.tsx souborů v (web) skupině

---

## PŘEHLED VÝSLEDKŮ

| Kategorie | Počet | Status |
|-----------|-------|--------|
| Stránky OK (plný obsah) | ~105 | ✅ |
| Redirecty (správné 301/302) | 9 | ✅ |
| Chybějící SEO metadata | 13 veřejných stránek | ⚠️ |
| Chybějící page-specific loading.tsx | ~40 | ⚠️ (parent pokrývá) |
| Chybějící page-specific error.tsx | ~60 | ⚠️ (parent pokrývá) |
| Chybějící stránky vs plán | 0 | ✅ |
| Skutečné stubs/placeholders | 0 | ✅ |

**Globální coverage:** `app/(web)/loading.tsx` ✅ a `app/(web)/error.tsx` ✅ existují — pokrývají všechny stránky bez vlastního loading/error.

---

## 1. HOMEPAGE & INFORMAČNÍ STRÁNKY

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/` | ✅ | ✅ (parent) | ✅ (parent) | ✅ | ✅ OK |
| `/o-nas` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/jak-to-funguje` | ✅ | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/jak-prodat-auto` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/chci-prodat` | ✅ | ✅ | ❌ (parent) | ✅ | ✅ OK |
| `/cenik` | ✅ | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/kontakt` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/kariera` | ✅ | ✅ | ❌ (parent) | ❌ NO META | ⚠️ Chybí metadata |
| `/recenze` | ✅ | ✅ | ❌ (parent) | ❌ NO META | ⚠️ Chybí metadata |
| `/pro-maklere` | ✅ | ❌ | ❌ | ❌ | ✅ REDIRECT → `/kariera` |
| `/kolik-stoji-moje-auto` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/obchodni-podminky` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/ochrana-osobnich-udaju` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/zasady-cookies` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/reklamacni-rad` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/prezentace` | ✅ (v `app/prezentace/`) | ❌ | ❌ | ❌ | ⚠️ Mimo (web) group |

> **Poznámka k /prezentace:** Stránka existuje v `app/prezentace/page.tsx` mimo route skupinu `(web)`. Build ji kompiluje správně jako `/prezentace`. Nemá metadata.

---

## 2. NABÍDKA VOZIDEL

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/nabidka` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/nabidka/[slug]` | ✅ 1205 řádků | ✅ | ❌ (parent) | ✅ generateMetadata | ✅ OK |
| `/nabidka/[slug]/platba` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/nabidka/[slug]/platba/uspech` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK (transakční, noindex OK) |
| `/nabidka/porovnani` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/bazar/[slug]` | ✅ | ✅ | ❌ (parent) | ✅ | ✅ OK |

---

## 3. SEO LANDING PAGES — NABÍDKA (~40 stránek)

Všechny SEO landing pages existují a mají správnou strukturu s generateMetadata + sdílenou komponentou.

**Vzor (zkontrolováno na nabidka/skoda/octavia):**
- ✅ Importuje `ModelLandingContent` nebo `BrandLandingContent`
- ✅ Má `generateMetadata` / `metadata` export
- ✅ Používá data z `@/lib/seo-data`
- ⚠️ Žádná page-specific loading/error (parent pokrývá)

| Skupina | Status |
|---------|--------|
| Značky: skoda, bmw, volkswagen, audi, ford, hyundai, kia, toyota, mercedes-benz, peugeot, renault, seat, opel, citroen, dacia, mazda | ✅ Všechny OK |
| Modely: skoda/octavia, skoda/fabia, skoda/superb, skoda/kodiaq, bmw/3-series, vw/golf, vw/passat, audi/a4, ford/focus, hyundai/i30, kia/ceed, toyota/yaris | ✅ Všechny OK |
| Města: praha, brno, ostrava, plzen, olomouc, liberec, hradec-kralove, ceske-budejovice | ✅ Všechny OK |
| Ceny: do-100000, do-200000, do-300000, do-500000, do-1000000 | ✅ Všechny OK |
| Karoserie: suv, sedan, kombi, hatchback, kabriolet | ✅ Všechny OK |
| Palivo: elektromobily, hybrid | ✅ Všechny OK |

---

## 4. MAKLÉŘI

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/makleri` | ✅ | ✅ | ❌ (parent) | ✅ | ✅ OK |
| `/makleri/[slug]` | ✅ 477 řádků | ✅ | ❌ (parent) | ✅ generateMetadata | ✅ OK |
| `/makler/[slug]` | ✅ | ❌ | ❌ | ❌ | ✅ REDIRECT 301 → `/profil/[slug]` |

---

## 5. SLUŽBY

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/sluzby` | ✅ | ❌ (parent) | ✅ | ✅ | ✅ OK |
| `/sluzby/proverka` | ✅ | ✅ | ❌ (sluzby/error.tsx) | ✅ | ✅ OK |
| `/sluzby/financovani` | ✅ | ✅ | ❌ (sluzby/error.tsx) | ✅ | ✅ OK |
| `/sluzby/pojisteni` | ✅ | ✅ | ❌ (sluzby/error.tsx) | ✅ | ✅ OK |

---

## 6. AUTH & ÚČET

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/prihlaseni` | ✅ | ❌ | ❌ | ❌ | ✅ REDIRECT 301 → `/login` |
| `/login` | ✅ plná impl. | ✅ | ✅ | ❌ (noindex OK) | ✅ OK |
| `/registrace` | ✅ | ✅ | ❌ (parent) | ❌ | ✅ OK |
| `/registrace/makler` | ✅ | ✅ | ✅ | ❌ | ✅ OK |
| `/registrace/dodavatel` | ✅ | ✅ | ✅ | ❌ | ✅ OK |
| `/registrace/partner` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/zapomenute-heslo` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/reset-hesla/[token]` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/overeni-emailu/[token]` | ✅ 42 řádků | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/overeni-emailu/uspech` | ✅ | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/overeni-emailu/chyba` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |

---

## 7. MUJ ÚČET (přihlášený uživatel)

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/muj-ucet` | ✅ | ✅ | ✅ | ❌ (noindex OK) | ✅ OK |
| `/muj-ucet/profil` | ✅ 573 řádků | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/muj-ucet/profil/setup` | ✅ 779 řádků | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/muj-ucet/oblibene` | ✅ | ✅ | ✅ | ❌ | ✅ OK |
| `/muj-ucet/dotazy` | ✅ | ✅ | ✅ | ❌ | ✅ OK |
| `/muj-ucet/garaz` | ✅ 258 řádků | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/muj-ucet/hlidaci-pes` | ✅ 357 řádků | ✅ | ✅ | ❌ | ✅ OK |
| `/muj-ucet/poptavky` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/profil/[slug]` | ✅ 310 řádků | ✅ | ❌ (parent) | ✅ | ✅ OK |
| `/notifikace/[token]` | ✅ | ✅ | ✅ | ✅ | ✅ OK |

---

## 8. BLOG / MAGAZÍN

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/blog` | ✅ | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/blog/[slug]` | ✅ | ❌ (parent) | ❌ (parent) | ✅ generateMetadata | ✅ OK |
| `/blog/kategorie/[slug]` | ✅ | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/tag/[slug]` | ✅ | ❌ | ❌ | ❌ | ✅ REDIRECT 301 → `/makleri/[slug]` |
| `/h/[slug]` | ✅ | ❌ | ❌ | ❌ | ✅ REDIRECT 301 → `/makleri/[slug]` |

> **Poznámka:** Blog nemá page-specific loading/error — u dynamických článků by bylo vhodné.

---

## 9. INZERTNÍ PLATFORMA

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/inzerce` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/inzerce/katalog` | ✅ | ✅ | ✅ | ❌ | ✅ REDIRECT → `/nabidka` |
| `/inzerce/pridat` | ✅ 36 řádků | ✅ | ✅ | ❌ | ⚠️ Chybí metadata (veřejná stránka) |
| `/inzerce/registrace` | ✅ | ✅ | ✅ | ❌ | ✅ OK (form page) |
| `/moje-inzeraty` | ✅ | ✅ | ✅ | ❌ (noindex OK) | ✅ OK |
| `/moje-inzeraty/[id]` | ✅ 417 řádků | ✅ | ✅ | ❌ (noindex OK) | ✅ OK |
| `/dodavatel/[slug]` | ✅ | ❌ | ❌ | ❌ | ✅ REDIRECT 301 → `/dily/vrakoviste/[slug]` |

---

## 10. ESHOP AUTODÍLY

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/shop` | ✅ | ✅ | ❌ (parent) | ✅ | ✅ OK |
| `/shop/katalog` | ✅ | ✅ | ✅ | ❌ | ⚠️ Chybí metadata (veřejná stránka) |
| `/shop/produkt/[slug]` | ✅ | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/shop/kosik` | ✅ | ✅ | ✅ | ❌ | ✅ OK (noindex OK) |
| `/shop/objednavka` | ✅ | ✅ | ✅ | ❌ | ✅ OK |
| `/shop/objednavka/potvrzeni` | ✅ | ✅ | ✅ | ❌ | ✅ OK |
| `/shop/moje-objednavky` | ✅ | ✅ | ✅ | ❌ | ✅ OK |
| `/shop/moje-objednavky/[id]/reklamace` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/shop/moje-objednavky/[id]/vraceni` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/shop/objednavky/sledovani/[token]` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/shop/reklamace` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/shop/vraceni-zbozi` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/dily` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/dily/[slug]` | ✅ | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/dily/katalog` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ⚠️ Chybí metadata (veřejný katalog) |
| `/dily/kategorie/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/dily/kosik` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK (noindex OK) |
| `/dily/objednavka` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/dily/objednavka/potvrzeni` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/dily/moje-objednavky` | ✅ | ❌ (parent) | ❌ (parent) | ❌ | ✅ OK |
| `/dily/vrakoviste/[slug]` | ✅ 408 řádků | ❌ (parent) | ❌ (parent) | ✅ | ✅ OK |
| `/dily/znacka/[brand]` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/dily/znacka/[brand]/[model]` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/dily/znacka/[brand]/[model]/[rok]` | ✅ | ✅ | ✅ | ✅ | ✅ OK |

---

## 11. MARKETPLACE VIP

| Stránka | page.tsx | loading | error | Metadata | Stav |
|---------|----------|---------|-------|----------|------|
| `/marketplace` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/marketplace/apply` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/marketplace/dealer` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/marketplace/dealer/[id]` | ✅ 10 řádků | ✅ | ✅ | ❌ | ✅ REDIRECT → `/marketplace/deals/[id]` |
| `/marketplace/dealer/nova` | ✅ 41 řádků | ✅ | ✅ | ✅ | ✅ OK |
| `/marketplace/investor` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `/marketplace/investor/[id]` | ✅ 10 řádků | ✅ | ✅ | ❌ | ✅ REDIRECT → `/marketplace/deals/[id]` |
| `/marketplace/deals/[id]` | ✅ | ✅ | ❌ (parent) | ✅ | ✅ OK |

---

## 12. REDIRECTY (správné chování)

Všechny redirecty jsou **záměrné a správné** — nikoliv stubs:

| Od | Na | Typ |
|----|-----|-----|
| `/prihlaseni` | `/login` | 301 permanentRedirect |
| `/pro-maklere` | `/kariera` | redirect |
| `/inzerce/katalog` | `/nabidka` | redirect (subdomain rewrite) |
| `/dodavatel/[slug]` | `/dily/vrakoviste/[slug]` | 301 permanentRedirect |
| `/makler/[slug]` | `/profil/[slug]` | 301 permanentRedirect |
| `/marketplace/dealer/[id]` | `/marketplace/deals/[id]` | redirect |
| `/marketplace/investor/[id]` | `/marketplace/deals/[id]` | redirect |
| `/h/[slug]` | `/makleri/[slug]` | 301 permanentRedirect (SEO alias) |
| `/tag/[slug]` | `/makleri/[slug]` | 301 permanentRedirect (SEO alias) |

---

## 13. SOUHRN PROBLÉMŮ

### 🟠 Střední priorita — chybějící SEO metadata na veřejných stránkách

| Stránka | Problém |
|---------|---------|
| `/kariera` | Veřejná stránka bez title/description/OG |
| `/recenze` | Veřejná stránka bez title/description/OG |
| `/inzerce/pridat` | Formulář bez title/description |
| `/shop/katalog` | Veřejný katalog bez metadata |
| `/dily/katalog` | Veřejný katalog bez metadata |

### ⚠️ Nízká priorita — chybějící page-specific loading/error

Počet stránek bez vlastního `loading.tsx`: ~40  
Počet stránek bez vlastního `error.tsx`: ~60  

**Dopad:** Nulový — parent `app/(web)/loading.tsx` a `app/(web)/error.tsx` pokrývají vše. Nicméně pro komplexní stránky (shop checkout, detail vozu, blog article) by bylo vhodné přidat granulární fallback.

**Nejvyšší priority pro přidání:**
- `/nabidka/[slug]` — chybí error.tsx (detail vozu je klíčová stránka)
- `/blog/[slug]` — chybí loading + error
- `/dily/vrakoviste/[slug]` — chybí loading + error
- `/shop/produkt/[slug]` — chybí loading + error

### ✅ Žádné stránky navíc / žádné skutečné stubs

- Žádná stránka neobsahuje "Coming soon", "Under construction" ani lorem ipsum
- Všechny "krátké" stránky jsou záměrné redirecty nebo thin wrappers s komponentami
- HTML `placeholder=""` atributy ve formulářích jsou správné (ne stuby)

---

## 14. ZÁVĚR

| Kritérium | Výsledek |
|-----------|----------|
| Všechny stránky z plánu existují | ✅ ANO (`/prezentace` mimo (web) group, ale builduje) |
| Global loading.tsx + error.tsx | ✅ EXISTUJÍ |
| Žádné stubs/placeholders | ✅ ČISTÉ |
| SEO metadata na klíčových stránkách | ✅ OK (5 veřejných stránek bez meta) |
| Redirecty jsou správné | ✅ 9 záměrných redirectů |

**Celkový verdikt: ✅ Web sekce je kompletní. Bez blokovacích problémů.**  
Doporučení: doplnit metadata na `/kariera`, `/recenze`, `/shop/katalog`, `/dily/katalog`, `/inzerce/pridat`.
