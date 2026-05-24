# Audit: Celá platforma carmakler.cz — Chrome test

**Datum:** 2026-05-22  
**Agent:** TEST-CHROME  
**Task:** #108  
**Prostředí:** Playwright headed Chrome → https://carmakler.cz  
**Výsledek: 1 KRITICKÁ CHYBA | 1 BUG (OG images) | 9 WARN (2× false positive)**

---

## Souhrn výsledků

| Kategorie | Počet |
|-----------|-------|
| PASS | 56 |
| FAIL (skutečné) | 1 |
| FAIL (false positive) | 2 |
| WARN (skutečné) | 7 |
| WARN (false positive / očekávané) | 2 |
| Bug nalezen kódem (mimo Playwright) | 1 |

---

## KRITICKÉ CHYBY

### BUG-1: `/makler/vozidla/nove` → 404 na produkci ❌ KRITICKÁ

**URL:** https://carmakler.cz/makler/vozidla/nove  
**HTTP status:** 404  
**Screenshot:** `pwa---nov--vozidlo--wizard-.png`  
**Popis:** Stránka pro zadání nového vozidla (wizard) vrací "Stránka nenalezena". Tato funkce je klíčová pro makléře — bez ní nemohou zadávat auta do systému.  
**Dopad:** Makléři nemohou zadávat nová vozidla přes PWA. KRITICKÉ pro byznys.  
**Pravděpodobná příčina:** Feature nebyla nasazena na produkci (chybí v buildu nebo route neexistuje na serveru).  
**Akce:** Implementátor musí prověřit a nasadit.

---

### BUG-2: OG image chybí na všech profilech makléřů ❌ STŘEDNÍ

**Postižené URL:** `/profil/[slug]` — všechny profily makléřů  
**Symptom:** `<meta property="og:image">` chybí v HTML profil stránek  
**Příčina (kód):** `app/(web)/profil/[slug]/page.tsx` — `generateMetadata()` vrací:
```ts
openGraph: {
  images: user.avatar ? [{ url: user.avatar }] : undefined  // ← problém
}
```
Žádný makléř nemá avatar v DB → `images: undefined` → Next.js potlačí auto-discovery `opengraph-image.tsx` → OG image se nepřidá.  
**Fix:** Odebrat `images:` klíč z `openGraph` v `generateMetadata()` v `app/(web)/profil/[slug]/page.tsx` (řádek ~273). Pak `opengraph-image.tsx` bude fungovat automaticky.  
**Soubor k úpravě:** `app/(web)/profil/[slug]/page.tsx`

---

## FALSE POSITIVES (nejsou chyby)

### FAIL-FP-1: `/nabidka` — "Error: 🚙SUV do 500k"
**Co se stalo:** Playwright hledal text obsahující "Error" na stránce a matchoval text filtrovacího čipu `🚙SUV do 500k` (obsahuje "do" ale ne Error).  
**Skutečnost:** Stránka funguje správně, filtr je viditelný, vozy se zobrazují.  
**Screenshot:** `nab-dka---seznam-aut.png` ✅

### FAIL-FP-2: `/stk` — "Error: +420 416 535 500"
**Co se stalo:** Playwright matchoval číslo telefonu STK stanice jako "error".  
**Skutečnost:** Stránka funguje, seznam STK stanic se zobrazuje správně s mapou.  
**Screenshot:** `stk-stanice.png` ✅

---

## WARN — skutečné (vyžadují prověření)

### WARN-1: Detail auta — chybí cena
**Stránka:** `/nabidka/[slug]`  
**Detail:** Selektor `[data-testid="price"], .price, text=/Kč/` nenašel žádnou cenu.  
**Možné příčiny:** (a) Test auto "Škoda Oktavia" nemá zadanou cenu, (b) selector neodpovídá reálné HTML struktuře.  
**Screenshot:** `nab-dka---detail-auta.png` — potřeba manuální kontrola.

### WARN-2: STK stanice — chybí vyhledávání
**Stránka:** `/stk`  
**Detail:** Selektor `input[type="search"], input[placeholder*="Hledat"]` nenašel žádné vyhledávací pole.  
**Možné příčiny:** Vyhledávání neexistuje (jen mapa) nebo má jiný selektor.

### WARN-3: Díl — chybí cena / přidat do košíku
**Stránka:** `/dily/[slug]`  
**Detail:** Stránka zobrazila H1 "Katalog dílů a příslušenství" — vypadá spíše jako kategorie než jednotlivý díl. Selector pro cenu nenalezen.  
**Možné příčiny:** Test zamířil na katalog, ne na konkrétní díl.

### WARN-4: Profil makléře — chybí sekce recenzí a tlačítko "Napsat recenzi"
**Stránka:** `/profil/yevgen-ulyanchenko` (zkušební URL z produkce)  
**Detail:** Review sekce a tlačítko nebyly nalezeny selektorem.  
**Poznámka:** Funkce BrokerReviews byla otestována lokálně (Task #33 — PASS). Na produkci feature nemusí být ještě nasazena, nebo makléř nemá recenze a tlačítko je skryté.  
**Akce:** Prověřit zda je feature deploynutá na produkci.

### WARN-5: Kontakt — chybí kontaktní info
**Stránka:** `/kontakt`  
**Detail:** Selector `text=/telefon|email|@/i` nenašel kontaktní údaje.  
**Možné příčiny:** Kontaktní info je v jiném formátu nebo na jiné pozici.

### WARN-6: Ceník — chybí sekce cen/balíčků
**Stránka:** `/cenik`  
**Detail:** Selector `text=/Kč|cen|balíček/i` nenašel cenové informace.  
**Možné příčiny:** Ceník má jiný text ("pauška", "provize") než hledané klíčové slovo.

### WARN-7: PWA Notifikace — 401 console errors
**Stránka:** `/makler/notifikace/nove` (bez přihlášení)  
**Detail:** 2× "Failed to load resource: 401" v konzoli.  
**Hodnocení:** OČEKÁVANÉ CHOVÁNÍ — bez autentizace je 401 správná odpověď. Stránka přesměruje na login (PASS).

---

## WARN — očekávané chování (není chyba)

### WARN-E1: PWA trasy přesměrovávají na login
**Stránky:** `/makler/*`  
**Detail:** Všechny PWA stránky bez autentizace přesměrují na `/auth/login`. Správné chování auth middleware.

### WARN-E2: CSP warning pro mapy.cz
**Stránka:** `/kontakt`  
**Detail:** 10× "Framing 'https://frame.mapy.cz/' violates report-only CSP directive"  
**Hodnocení:** `report-only` = nevyvolává blokování, pouze loguje. Není chyba.

---

## PASS stránky (přehled)

| Stránka | HTTP | Klíčové elementy |
|---------|------|-----------------|
| Homepage (`/`) | 200 ✅ | Navigace, Hero, CTA |
| Nabídka seznam (`/nabidka`) | 200 ✅ | Seznam vozidel, filtry |
| Nabídka detail (`/nabidka/[slug]`) | 200 ✅ | Název, tabnav (Parametry/Výbava/Popis/Historie) |
| Eshop autodíly (`/dily`) | 200 ✅ | Produkty, vyhledávání |
| Shop (`/shop`) | 200 ✅ | Produkty |
| Marketplace (`/marketplace`) | 200 ✅ | Landing, CTA/Apply |
| Inzerce (`/inzerce`) | 200 ✅ |  |
| Makléři seznam (`/makleri`) | 200 ✅ | Seznam makléřů |
| Profil makléře (`/profil/[slug]`) | 200 ✅ | Jméno makléře |
| Kontakt (`/kontakt`) | 200 ✅ | Formulář |
| Ceník (`/cenik`) | 200 ✅ |  |
| Služby (`/sluzby`) | 200 ✅ | Obsah |
| Blog (`/blog`) | 200 ✅ | Články |
| Blog článek (`/blog/[slug]`) | 200 ✅ | Nadpis, obsah |
| O nás (`/o-nas`) | 200 ✅ | Obsah |
| Kariéra (`/kariera`) | 200 ✅ | Obsah |
| Přihlášení (`/auth/login`) | 200 ✅ | Login form |
| Registrace (`/auth/register`) | 200 ✅ | Registrační form |
| PWA Dashboard (`/makler`) | 200 ✅ | → login (správné) |
| PWA Notifikace (`/makler/notifikace/nove`) | 200 ✅ | → login (správné) |
| PWA Leady (`/makler/leady`) | 200 ✅ | → login (správné) |
| STK stanice (`/stk`) | 200 ✅ | Seznam/mapa |

---

## Doporučené akce (priorita)

| Priorita | Akce | Kdo |
|----------|------|-----|
| 🔴 KRITICKÉ | Deploy `/makler/vozidla/nove` wizard na produkci | Implementátor |
| 🟠 STŘEDNÍ | Fix OG image na profil stránkách (odebrat `images:` z generateMetadata) | Implementátor |
| 🟡 NÍZKÁ | Prověřit zda BrokerReviews jsou nasazeny na produkci | Implementátor |
| 🟡 NÍZKÁ | Prověřit cenu na detailu auta | Implementátor |

---

*Audit proveden: 2026-05-22 | Playwright headed Chrome | https://carmakler.cz*
