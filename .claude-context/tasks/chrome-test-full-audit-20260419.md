# Chrome Test — Kompletní Audit Platformy
**Datum:** 2026-04-19  
**Agent:** test-chrome  
**Dev server:** localhost:3000  
**Playwright:** 40/41 testů prošlo

---

## Výsledky — přehled

| Sekce | Stránek | Status |
|-------|---------|--------|
| Veřejné stránky | 11 | ✅ Vše funguje |
| Služby | 4 | ✅ Vše funguje |
| Auth stránky | 5 | ✅ Vše funguje |
| Inzerce | 3 | ✅ Vše funguje |
| E-shop Autodíly | 3 | ✅ Vše funguje |
| Shop | 3 | ✅ Vše funguje |
| Marketplace | 2 | ✅ Vše funguje |
| Prezentace | 1 | ✅ Funguje |
| Právní stránky | 3 | ✅ Vše funguje |
| Chráněné routy (redirect) | 4 | ✅ Správně redirectují |
| Navigace / footer | 2 | ✅ Funguje |

---

## Detailní výsledky

### ✅ Veřejné stránky
| URL | HTTP | Title | Poznámka |
|-----|------|-------|----------|
| / | 200 | CarMakléř \| Prodej aut přes ověřené makléře | H1: "Vaše auto prodáme v průměru..." |
| /nabidka | 200 | Nabídka vozidel \| CarMakléř | H1: "Nabídka vozidel", DB dotazy OK |
| /makleri | 200 | Naši makléři \| CarMakléř | H1: "Naši makléři" |
| /o-nas | 200 | O nás \| CarMakléř | Header/footer OK |
| /kontakt | 200 | Kontakt \| CarMakléř | Header/footer OK |
| /jak-to-funguje | 200 | — | Header/footer OK |
| /jak-prodat-auto | 200 | — | Header/footer OK |
| /chci-prodat | 200 | — | Header/footer OK |
| /kolik-stoji-moje-auto | 200 | — | Header/footer OK |
| /kariera | 200 | — | Header/footer OK |
| /recenze | 200 | — | Header/footer OK |

### ✅ Služby
| URL | HTTP | Poznámka |
|-----|------|----------|
| /sluzby/vykup | 200 | H1: "Vykoupíme vaše auto", DB render 56ms |
| /sluzby/financovani | 200 | Header/footer OK |
| /sluzby/pojisteni | 200 | Header/footer OK |
| /sluzby/proverka | 200 | Header/footer OK |

### ✅ Auth stránky
| URL | HTTP | Poznámka |
|-----|------|----------|
| /prihlaseni | 200 | Email input přítomen (2x — desktop+mobile), form OK |
| /registrace | 200 | Title: "Registrace \| CarMakléř" |
| /registrace/makler | 200 | Makléřská registrace OK |
| /registrace/dodavatel | 200 | Dodavatelská registrace OK |
| /zapomenute-heslo | 200 | Formulář přítomen |
| /login | 200 | Title: "Přihlášení \| CarMakléř" (interní login) |

### ✅ Inzerce
| URL | HTTP | Poznámka |
|-----|------|----------|
| /inzerce | 200 | H1: "Prodejte své auto.", DB dotazy OK |
| /inzerce/katalog | 200 | Katalog inzerátů OK |
| /inzerce/pridat | 200 | Formulář pro přidání inzerátu OK |

### ✅ E-shop Autodíly
| URL | HTTP | Poznámka |
|-----|------|----------|
| /dily | 200 | H1: "Autodíly a příslušenství", DB dotazy OK |
| /dily/katalog | 200 | Katalog dílů OK |
| /dily/kosik | 200 | Košík OK |

### ✅ Shop
| URL | HTTP | Poznámka |
|-----|------|----------|
| /shop | 200 | H1: "Autodíly a příslušenství" |
| /shop/katalog | 200 | Katalog OK |
| /shop/kosik | 200 | Košík OK |

### ✅ Marketplace
| URL | HTTP | Poznámka |
|-----|------|----------|
| /marketplace | 200 | H1: "Investujte do aut,", DB dotazy OK |
| /marketplace/apply | 200 | Apply formulář OK |

### ✅ Prezentace
| URL | HTTP | Poznámka |
|-----|------|----------|
| /prezentace | 200 | H1: "Síť certifikovaných", sekce: Jak to funguje, Pro autobazary, Pro vrakoviště, Provizní model |

### ✅ Právní stránky
| URL | HTTP | Poznámka |
|-----|------|----------|
| /obchodni-podminky | 200 | H1 přítomen |
| /ochrana-osobnich-udaju | 200 | Header/footer OK |
| /zasady-cookies | 200 | Header/footer OK |

### ✅ Chráněné routy — správně redirectují na /login
| URL | Redirect |
|-----|----------|
| /makler/dashboard | → /login?callbackUrl=%2Fmakler%2Fdashboard |
| /admin/dashboard | → /login?callbackUrl=%2Fadmin%2Fdashboard |
| /partner/dashboard | → /login?callbackUrl=%2Fpartner%2Fdashboard |
| /muj-ucet | → /login?callbackUrl=%2Fmuj-ucet |

---

## 404 — Neexistující routy (očekávané)
| URL | Důvod |
|-----|-------|
| /katalog | Správná cesta je /nabidka |
| /sluzby | Žádná index stránka — jen sub-pages /sluzby/* |
| /blog | Neimplementováno |
| /inzerce/podat | Správná cesta je /inzerce/pridat |
| /prihlasit | Správná cesta je /prihlaseni |

---

## Drobné nálezy

### 1. /prihlaseni — duplikace email inputu v DOM
- **Závažnost:** INFO (není bug)
- **Popis:** Stránka /prihlaseni renderuje 2 email inputy v DOM (desktop + mobile responsive verze). Vizuálně se zobrazí jen jeden. Playwright strict mode to flaguje.
- **Doporučení:** Zvážit `hidden` třídu pro skrytou variantu, nebo použít jeden formulář s responzivním layoutem.

### 2. /makler/vozidla, /makler/smlouvy — 200 přes dynamic route
- **Závažnost:** INFO (očekávané chování)
- **Popis:** Neexistující PWA cesty se zachytí dynamickým routem `/makler/[slug]` (profil makléře) a zobrazí prázdný profil. Middleware nezachytí — správné chování, slug "vozidla" prostě nenajde makléře.

---

## Dev server — výkon
- Průměrný render: 56–103ms na stránku
- Prisma DB dotazy: OK (žádné errory)
- Žádné Next.js errory v konzoli
- Žádné hydration errory

---

## Playwright výsledky
```
41 testů | 40 prošlo | 1 selhalo
Selhání: /prihlaseni — strict mode (2x email input) — TEST ISSUE, ne bug
```

---

## Závěr
**Platforma je funkční.** Všechny klíčové sekce renderují správně, DB dotazy fungují, auth ochrana je na místě. Žádné kritické bugy nenalezeny.
