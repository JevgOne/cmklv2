# Produkční audit — carmakler.cz

**Datum:** 2026-04-26  
**Prostředí:** Produkce — https://carmakler.cz  
**Metoda:** WebFetch + Chrome JS automation  
**Scope:** Kompletní audit — hlavní web, shop, inzerce, marketplace, footer, auth, PWA, admin

---

## KRITICKÉ BUGY (P0) 🔴

### BUG-P0-1: Standard vehicle intake — VIN step error boundary
**URL:** `/makler/vehicles/new/vin?draft=...`  
**Symptom:** Zobrazuje `error.tsx` — "Nastala neočekávaná chyba"  
**Task:** Task #18 (VIN StepPageGuard) — IN_PROGRESS  
**Dopad:** Makléř nemůže zadat VIN ve standard flow

### BUG-P0-2: Standard vehicle intake — Details Internal Server Error
**URL:** `/makler/vehicles/new/details?draft=...`  
**Symptom:** "Internal Server Error" (prázdná stránka)  
**Dopad:** Makléř nemůže vyplnit technické detaily vozidla

### BUG-P0-3: Standard vehicle intake — Pricing chunk loading failed
**URL:** `/makler/vehicles/new/pricing?draft=...`  
**Symptom:** "Loading chunk 20271 failed" — stale JS chunk po deployment  
**Dopad:** Makléř nemůže nastavit cenu

### BUG-P0-4: Standard vehicle intake — Review chunk loading failed
**URL:** `/makler/vehicles/new/review?draft=...`  
**Symptom:** "Loading chunk 21899 failed" — stale JS chunk po deployment  
**Dopad:** Makléř nemůže odeslat vozidlo ke schválení

---

## ZÁVAŽNÉ BUGY (P1) 🟠

### BUG-P1-1: Admin manager sekce blokuje ADMIN roli
**URL:** `/admin/manager`, `/admin/manager/brokers`, `/admin/manager/approvals`, `/admin/manager/bonuses`  
**Symptom:** Redirect na `/` nebo `/admin/dashboard` pro ADMIN roli  
**Příčina:** `role !== "MANAGER"` check blokuje i ADMIN  
**Dopad:** ADMIN nemá přístup do manažerské sekce, ačkoliv sidebar link zobrazuje

### BUG-P1-2: `/cenik` — stránka neexistuje (404)
**URL:** `/cenik`  
**Symptom:** 404 "Stránka nenalezena"  
**Dopad:** Cenová stránka není implementována — zákazníci nemají kde najít ceník služeb

### BUG-P1-3: `/dily/katalog` — prázdný katalog (0 produktů)
**URL:** `/dily/katalog`  
**Symptom:** Stránka se načítá, filtry jsou funkční, ale zobrazuje 0 produktů  
**Dopad:** E-shop dílů je fakticky nefunkční — zákazník nemůže nakoupit žádný díl  
**Poznámka:** `/dily` (homepage eshopu) zobrazuje 6 featured produktů, takže data existují

---

## STŘEDNÍ BUGY (P2) 🟡

### BUG-P2-1: `/profil/[slug]` — nesoulad statistik a výpisů
**URL:** `/profil/jan-novak-praha`  
**Symptom:** Stats box zobrazuje "3 vozidla", záložka Vozidla zobrazuje "Žádné položky"  
**Dopad:** Zákazník nevidí makléřovy inzeráty na profilu

### BUG-P2-2: `/dily/kosik` — chybí H1 nadpis
**URL:** `/dily/kosik`  
**Symptom:** Stránka se načítá, prázdný košík zobrazen, ale H1 chybí  
**Dopad:** SEO + accessibility (WCAG)

### BUG-P2-3: `/pro-maklere` — 404, odkazuje z `/o-nas`
**URL:** `/pro-maklere`  
**Symptom:** CTA odkaz na `/o-nas` stránce vede na 404  
**Dopad:** Ztracená konverzní cesta pro zájemce o makléřství

### BUG-P2-4: Broker dashboard — Export tlačítko bez feedbacku
**URL:** `/admin/dashboard`  
**Symptom:** Kliknutí na Export → žádná reakce (placeholder)  
**Dopad:** Funkce není implementována

### BUG-P2-5: Admin search bar — placeholder
**URL:** `/admin/*` (AdminHeader)  
**Symptom:** Vyhledávací pole v admin hlavičce nefunguje  
**Dopad:** Funkce není implementována

---

## INFORMAČNÍ NÁLEZY (P3) ℹ️

### INFO-1: `/inzerce/pridat` — bez auth gate
Podání inzerátu je dostupné bez přihlášení. Ověřit, zda je záměrné (anonymní inzeráty povoleny).

### INFO-2: `/o-nas` — veřejně zobrazuje "0 prodaných vozidel"
Statistika prodaných vozidel je 0 — pro MVP očekávané, ale veřejně viditelné.

### INFO-3: Standard vehicle intake `draft=undefined` bug (P2)
Přímá navigace na `/makler/vehicles/new/vin` bez draft param → po Pokračovat → `photos?draft=undefined` (prázdná stránka).

---

## HLAVNÍ WEB — Stav stránek

| URL | H1 | Stav |
|-----|----|------|
| `/` | "Prodejte auto za nejvyšší cenu. Kupte s jistotou." | ✅ |
| `/nabidka` | "Nabídka vozidel" | ✅ |
| `/nabidka/[slug]` (2× ověřeno) | Název vozu | ✅ |
| `/jak-to-funguje` | — | ✅ |
| `/makleri` | "Najděte makléře ve vašem městě" | ✅ |
| `/profil/[slug]` | Jméno makléře | ⚠️ stats mismatch |
| `/recenze` | — | ✅ |
| `/kontakt` | "Ozvěte se nám" | ✅ |
| `/blog` | "Blog & Magazín" | ✅ |
| `/blog/[slug]` (2× ověřeno) | Název článku | ✅ |
| `/o-nas` | "Pomáháme lidem prodat auto..." | ✅ |
| `/kariera` | "Staňte se automakléřem" | ✅ |
| `/sluzby/proverka` | "Kupte auto s jistotou" | ✅ |
| `/sluzby/financovani` | "Auto na splátky do 30 minut" | ✅ |
| `/sluzby/pojisteni` | "Povinné ručení i havarijní online" | ✅ |
| `/chci-prodat` | "Prodejte auto za nejvyšší cenu..." | ✅ |
| `/jak-prodat-auto` | "Jak prodat auto — kompletní průvodce 2026" | ✅ |
| `/kolik-stoji-moje-auto` | "Kolik stojí moje auto?" | ✅ |
| `/cenik` | — | 🔴 404 |
| `/pro-maklere` | — | 🔴 404 |

---

## SHOP (Autodíly) — Stav

| URL | H1 | Stav |
|-----|----|------|
| `/dily` | "Autodíly levněji, s zárukou" | ✅ |
| `/dily/katalog` | "Katalog dílů a příslušenství" | ⚠️ prázdný (0 produktů) |
| `/dily/kosik` | _(chybí H1)_ | ⚠️ chybí H1 |
| shop.carmakler.cz | "Autodíly a příslušenství" | ✅ |

---

## INZERCE — Stav

| URL | H1 | Stav |
|-----|----|------|
| `/inzerce` | "Prodejte své auto. Zdarma." | ✅ |
| `/inzerce/pridat` | "Vložit inzerát zdarma" | ⚠️ bez auth gate |
| inzerce.carmakler.cz | "Prodejte své auto. Zdarma." | ✅ |

---

## MARKETPLACE — Stav

| URL | H1 | Stav |
|-----|----|------|
| `/marketplace` | "Investujte do aut, vydělejte 15-25 % ročně" | ✅ |
| `/marketplace` (VIP detaily) | — | Správně gated (vyžaduje přihlášení jako INVESTOR/DEALER) |

---

## AUTH — Stav

| URL | H1 | Stav |
|-----|----|------|
| `/login` | "Přihlášení" | ✅ |
| `/registrace` | "Registrace" | ✅ |
| `/registrace/partner` | "Registrace partnera" | ✅ |

---

## PRÁVNÍ STRÁNKY — Stav

| URL | H1 | Stav |
|-----|----|------|
| `/ochrana-osobnich-udaju` | "Ochrana osobních údajů" | ✅ |
| `/obchodni-podminky` | "Obchodní podmínky" | ✅ |
| `/zasady-cookies` | "Zásady cookies" | ✅ |
| `/reklamacni-rad` | "Reklamační řád" | ✅ |

---

## FOOTER — Stav odkazů

| Sekce | Odkaz | Stav |
|-------|-------|------|
| Služby | `/nabidka`, `/chci-prodat`, `/sluzby/*`, `/kolik-stoji-moje-auto` | ✅ všechny |
| Pro vás | `/jak-to-funguje`, `/jak-prodat-auto`, `/makleri`, `/recenze`, `/blog`, `/kariera`, `/registrace/partner` | ✅ všechny |
| Podpora | `mailto:`, `/jak-to-funguje`, `/kontakt`, `/reklamacni-rad`, `/o-nas`, `/kariera` | ✅ všechny |
| Platformy | `inzerce.carmakler.cz`, `shop.carmakler.cz` | ✅ |
| Právní | `/ochrana-osobnich-udaju`, `/obchodni-podminky`, `/zasady-cookies` | ✅ všechny |
| Sociální | Facebook, Instagram, YouTube | Nelze ověřit (ext. weby) |

**Závěr:** Všechny footer linky jsou funkční.

---

## PWA (Makléř) — Stav

| Komponenta | Stav | Poznámka |
|-----------|------|---------|
| Broker login (jan.novak@carmakler.cz) | ✅ | heslo123 funguje |
| Broker dashboard | ✅ | Stats, follow-up, kariérní progress, CTA |
| Standard flow — Kontakt (1/7) | ✅ | Formulář funkční |
| Standard flow — Prohlídka (2/7) | ✅ | 26 checkboxů |
| Standard flow — VIN (3/7) | 🔴 | error.tsx — Task #18 in progress |
| Standard flow — Fotky (4/7) | ✅ | 13+4+1+3 sloty |
| Standard flow — Detaily (5/7) | 🔴 | Internal Server Error |
| Standard flow — Cena (6/7) | 🔴 | Chunk loading failed |
| Standard flow — Review (7/7) | 🔴 | Chunk loading failed |
| Quick flow (3/3 kroků) | ✅ | Kompletně funkční |
| AI popis feature | 🔴 | Nelze testovat (Details step nefunguje) |
| Moje vozy seznam | ✅ | Filtry, 3 aktivní vozy |

---

## ADMIN PANEL — Stav

| Kategorie | Stav |
|-----------|------|
| Dashboard | ✅ |
| Makléři (list + detail + edit) | ✅ (P0 opravy ověřeny) |
| Vozidla (list + detail + edit) | ✅ |
| Inzerce | ✅ |
| Blog (list + new + edit) | ✅ |
| Notifikace (zvoneček) | ✅ |
| Sidebar (16/20 stránek) | ✅ |
| Manager sekce (4 stránky) | 🔴 ADMIN blokován |
| Export tlačítko | ⚠️ placeholder |
| Search bar | ⚠️ placeholder |

---

## RESPONZIVITA

Nelze ověřit automatizovaně — WebFetch nezobrazuje layout. Doporučeno manuální testování v Chrome DevTools (Cmd+Shift+M) na šířkách 375px (iPhone), 768px (tablet), 1280px (desktop).

Z kódu: projekt používá Tailwind mobile-first přístup, všechny stránky mají breakpointy.

---

## SOUHRNNÁ TABULKA PRIORIT

| ID | Popis | Priorita |
|----|-------|---------|
| P0-1 | Standard flow VIN error.tsx | 🔴 P0 |
| P0-2 | Standard flow Details Internal Server Error | 🔴 P0 |
| P0-3 | Standard flow Pricing chunk loading failed | 🔴 P0 |
| P0-4 | Standard flow Review chunk loading failed | 🔴 P0 |
| P1-1 | Admin ADMIN role blokován v manager sekci | 🟠 P1 |
| P1-2 | `/cenik` — 404 | 🟠 P1 |
| P1-3 | `/dily/katalog` — 0 produktů | 🟠 P1 |
| P2-1 | Broker profil — stats vs. listing mismatch | 🟡 P2 |
| P2-2 | `/dily/kosik` — chybí H1 | 🟡 P2 |
| P2-3 | `/pro-maklere` — 404 (odkaz z /o-nas) | 🟡 P2 |
| P2-4 | Admin export — placeholder | 🟡 P2 |
| P2-5 | Admin search — placeholder | 🟡 P2 |
| P3-1 | `/inzerce/pridat` — bez auth gate (ověřit záměr) | ℹ️ P3 |
| P3-2 | `/o-nas` — veřejné "0 prodaných vozidel" | ℹ️ P3 |
| P3-3 | `draft=undefined` při přímé navigaci na VIN step | ℹ️ P3 |

---

## DOPORUČENÍ

1. **Urgentní (P0):** Zkontrolovat deployment — `ls /app/.next/static/chunks` — pricing a review chunky; rebuildit na serveru
2. **Urgentní (P0):** Dokončit Task #18 (VIN StepPageGuard), opravit Details step (server logs)
3. **Brzy (P1):** Opravit admin manager role check — přidat `ADMIN` do povolených rolí
4. **Brzy (P1):** Implementovat `/cenik` nebo přidat redirect
5. **Brzy (P1):** Zkontrolovat proč `/dily/katalog` nezobrazuje produkty (API/filter bug vs. prázdná DB)
6. **Střední (P2):** Opravit broker profil listing query, přidat H1 do košíku, opravit `/pro-maklere` link

---

*Audit dokončen: 2026-04-26 | Metoda: WebFetch + Chrome JS automation*
