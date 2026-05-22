# Full Production Test — 2026-04-23

Testováno: carmakler.cz + 3 subdomény
Metoda: curl HTTP checks + Python content analysis (RSC payload parsing)

---

## Logo: OK ✅

| Check | Výsledek |
|-------|----------|
| `logo-dark.png` v Navbar (homepage) | OK — 6 výskytů |
| `logo-white.png` v Footer (homepage) | OK — 4 výskyty |
| `/brand/favicon.ico` existuje | OK — HTTP 200, multi-size ICO (16x16 + 32x32 PNG) |
| `<link rel="icon" href="/brand/favicon.ico">` v `<head>` | OK |

---

## Navigace: OK ✅

### Hlavní menu (Navbar)
| Položka | Stav |
|---------|------|
| Nabídka vozidel | OK |
| Prověrka (Služby dropdown) | OK |
| Financování | OK |
| Pojištění | OK |
| Jak prodat auto | OK |
| O nás dropdown | OK |
| Makléři | OK |
| Jak to funguje | OK |
| Recenze | OK |
| Kariéra | OK |
| Kontakt | OK |

### PlatformSwitcher
| Link | Stav |
|------|------|
| inzerce.carmakler.cz | OK |
| shop.carmakler.cz | OK |
| marketplace.carmakler.cz | ⚠️ CHYBÍ v switcheru (viz Menší problémy) |

### Footer (11 service links)
Všechny klíčové linky přítomny: /sluzby/proverka, /sluzby/financovani, /sluzby/pojisteni, /jak-prodat-auto, /chci-prodat, /jak-to-funguje, /kariera, /kontakt, /o-nas, /makleri, /recenze — **11/11 OK**

---

## Stránky — HTTP Status

| URL | Status | Poznámka |
|-----|--------|----------|
| https://carmakler.cz/ | 200 ✅ | Homepage |
| https://carmakler.cz/nabidka | 200 ✅ | |
| https://carmakler.cz/chci-prodat | 200 ✅ | |
| https://carmakler.cz/jak-to-funguje | 200 ✅ | |
| https://carmakler.cz/o-nas | 200 ✅ | |
| https://carmakler.cz/kariera | 200 ✅ | |
| https://carmakler.cz/recenze | 200 ✅ | |
| https://carmakler.cz/kontakt | 200 ✅ | |
| https://carmakler.cz/makleri | 200 ✅ | |
| https://carmakler.cz/registrace | 200 ✅ | |
| https://carmakler.cz/registrace/makler | 200 ✅ | |
| https://carmakler.cz/registrace/partner | 200 ✅ | |
| https://carmakler.cz/registrace/dodavatel | 200 ✅ | |
| https://carmakler.cz/sluzby/proverka | 200 ✅ | |
| https://carmakler.cz/sluzby/financovani | 200 ✅ | |
| https://carmakler.cz/sluzby/pojisteni | 200 ✅ | |
| https://carmakler.cz/jak-prodat-auto | 200 ✅ | |
| https://carmakler.cz/kolik-stoji-moje-auto | 200 ✅ | Stránka existuje, ale není odkazována (viz Menší problémy) |
| https://carmakler.cz/obchodni-podminky | 200 ✅ | |
| https://carmakler.cz/ochrana-osobnich-udaju | 200 ✅ | |
| https://carmakler.cz/zasady-cookies | 200 ✅ | |
| https://carmakler.cz/reklamacni-rad | 200 ✅ | |
| https://carmakler.cz/prihlaseni | 200 ✅ | |
| https://carmakler.cz/prezentace | 200 ✅ | title: CarMakléř — Partnerská prezentace |
| https://carmakler.cz/marketplace | 200 ✅ | VIP investiční platforma OK |

**Výsledek: 25/25 stránek vrací HTTP 200** ✅

---

## Subdomény: OK ✅

| Subdoména | Status | Title | Logo |
|-----------|--------|-------|------|
| inzerce.carmakler.cz | 200 ✅ | Inzerce — vložte inzerát zdarma \| CarMakléř | logo-dark ✅ |
| shop.carmakler.cz | 200 ✅ | Shop — autodíly a příslušenství \| CarMakléř | logo-dark ✅ |
| marketplace.carmakler.cz | 200 ✅ | Marketplace \| Investiční platforma pro flipping aut \| CarMakléř | logo-white ✅ |

---

## Texty: OK ✅

| Stránka | Očekávaný text | Stav |
|---------|----------------|------|
| Homepage | "Prodejte auto za nejvyšší cenu. Kupte s jistotou." | OK ✅ (v RSC payload) |
| Chci prodat | "Prodejte auto za nejvyšší cenu bez jediné starosti" | OK ✅ |
| Jak to funguje | "Pomáháme lidem prodat auto za nejvyšší cenu" | OK ✅ |
| O nás | "Pomáháme lidem prodat auto za nejvíc a koupit bezpečně" | OK ✅ |
| Kariéra | "Staňte se automakléřem" | OK ✅ |
| Recenze | breadcrumb + cross-links | OK ✅ |

Poznámka: Texty jsou servírované přes React Server Components (RSC JSON payload) — curl vidí escaped JSON, texty jsou správně přítomné.

---

## Cross-linking: OK ✅

| Check | Stav |
|-------|------|
| Homepage → sekce "Jste autobazar nebo vrakoviště?" | OK (2x výskyt) |
| Homepage → /registrace/partner link | OK (4x výskyt) |
| Kariéra → cross-link karty (/o-nas, /makleri, /kontakt) | OK |
| Recenze → 4 cross-link karty (kontakt, chci-prodat, nabidka, makleri) | OK (11 odkazů celkem) |
| Registrace → karta pro partnery (autobazar/vrakoviště) | OK |

---

## Formuláře: OK ✅

| Stránka | Formulář | Stav |
|---------|----------|------|
| /chci-prodat | SellCarForm | OK — form nalezen |
| /kariera | CareerForm | OK — Jméno a příjmení input přítomen |
| /kontakt | ContactPageForm | OK — form nalezen |
| /sluzby/proverka | ProverkaForm | OK — VIN input přítomen |
| /sluzby/financovani | FinancovaniCalc | OK — input přítomen |
| /sluzby/pojisteni | PojisteniForm | OK — pojisteni sekce přítomna |

---

## Responsivita: OK ✅

| Check | Stav |
|-------|------|
| `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">` | OK |
| `MainMobileMenu` komponenta přítomna v page bundle | OK |
| Responsive třídy (`lg:hidden`, `xl:hidden`) | OK |

Poznámka: Vizuální renderování mobile menu (375px viewport) vyžaduje prohlížeč — není ověřitelné přes curl. Komponenta je přítomna a bundlována.

---

## KRITICKÉ PROBLÉMY:
_Žádné_ — všechny stránky vrací 200, loga jsou správná, texty jsou na místě.

---

## MENŠÍ PROBLÉMY:

### 1. PlatformSwitcher — chybí marketplace.carmakler.cz ⚠️
- **Popis:** Navbar PlatformSwitcher obsahuje pouze 2 odkazové položky: `inzerce.carmakler.cz` a `shop.carmakler.cz`. Chybí odkaz na `marketplace.carmakler.cz`.
- **Možná příčina:** Záměrné vypuštění kvůli VIP gating (marketplace je uzavřená platforma pro INVESTOR/VERIFIED_DEALER/ADMIN). Ale test-kritérium říká, že switcher má mít 4 produkty.
- **Dopad:** Uživatel nemá přímý přístup do marketplace z globální navigace.
- **Doporučení:** Potvrdit s product ownerem — záměrné, nebo přidat odkaz na /marketplace jako veřejnou landing page.

### 2. /kolik-stoji-moje-auto — stránka existuje, ale není odkazována ⚠️
- **Popis:** Stránka `https://carmakler.cz/kolik-stoji-moje-auto` vrací 200 a má obsah ("Kolik stojí moje auto? | Kalkulačka ceny vozidla"), ale není přítomna v footer ani navigaci.
- **Dopad:** Stránka je "orphaned" — uživatel se na ni dostane jen přímým URL.
- **Doporučení:** Přidat odkaz do footer sekce Služby nebo do Navbar Služby dropdownu.

---

## Shrnutí

| Oblast | Status |
|--------|--------|
| HTTP Status (25/25) | ✅ OK |
| Logo (dark/white/favicon) | ✅ OK |
| Navigace (11 položek) | ✅ OK |
| Subdomény (3/3) | ✅ OK |
| Texty (6 stránek) | ✅ OK |
| Cross-linking | ✅ OK |
| Formuláře (6 formulářů) | ✅ OK |
| Responsivita | ✅ OK (komponentně) |
| Menší problémy | 2 |
| Kritické problémy | 0 |
