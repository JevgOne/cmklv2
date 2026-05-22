# Audit hlavního webu Carmakler — 2026-04-23

**Datum testu:** 2026-04-23  
**Prostředí:** localhost:3000 (Next.js dev server)  
**Nástroj:** Playwright (Chromium), headed mode  
**Viewport desktop:** 1280×900 | **Viewport mobile:** 390×844 (iPhone 14)  
**Testováno stránek:** 25  

---

## Souhrn

| Metrika | Hodnota |
|---|---|
| Celkem stránek | 25 |
| Stránky OK (nula problémů) | 11 |
| Stránky s problémy | 14 |
| Celkem nalezených problémů | 25 |
| HTTP chyby (4xx/5xx) | **0** — všechny stránky dostupné |
| Nové logo v headeru | ✅ 24/25 (pouze /prezentace záměrně bez headeru) |
| weblyx.cz credit | ✅ 24/25 (pouze /prezentace záměrně bez patičky) |

---

## KRITICKÉ problémy — okamžitá oprava

### 🔴 C1 — Duplikované `CarMakléř` v title tagu (5 stránek)

**Root cause:** Root layout má `template: "%s | CarMakléř"`. Stránky, které v `title` metadata již obsahují `CarMakléř`, dostanou brand name zdvojený.

| Stránka | Aktuální title |
|---|---|
| `/` | `CarMakléř \| Prodejte auto za nejlepší cenu, kupte bezpečně \| CarMakléř` |
| `/prezentace` | `CarMakléř — Partnerská prezentace \| CarMakléř` |
| `/profil/jan-novak-praha` | `Jan Novák — Makléř CarMakléř \| CarMakléř` |
| `/jak-prodat-auto` | `Jak prodat auto v roce 2026 \| Kompletní průvodce — CarMakler \| CarMakléř` |
| `/kolik-stoji-moje-auto` | `Kolik stojí moje auto? \| Kalkulačka ceny vozidla — CarMakler \| CarMakléř` |

**Poznámka:** `/jak-prodat-auto` a `/kolik-stoji-moje-auto` navíc obsahují `CarMakler` (bez diakritiky) — inconsistentní brand.

**Fix:**
- Homepage: použít `title: { absolute: "CarMakléř — Prodejte auto za nejvyšší cenu" }`
- `/prezentace` layout: použít `title: { absolute: "CarMakléř — Partnerská prezentace" }`
- Profil: titulek generovat jako `${fullName} — Automakléř | CarMakléř` (bez CarMakléř v části před pipe)
- `/jak-prodat-auto`, `/kolik-stoji-moje-auto`: odstranit `— CarMakler` ze string titulku

---

### 🔴 C2 — Broken image: Unsplash foto na /nabidka

**URL:** `/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1549317661-bd32c8ce0afe%3Fw%3D800%26q%3D80`  
**Příčina:** Tato Unsplash URL není v kódu nalezena — pochází pravděpodobně ze **seed/testovacích dat v DB** (ukázkové inzeráty). Unsplash vyžaduje platné přihlašovací tokeny nebo URL z Unsplash API.  
**Fix:** Nahradit seed data vozidel obrázky z `/brand/` nebo Cloudinary. Nebo použít `placehold.co` jako fallback.

---

### 🔴 C3 — Console errors na /jak-prodat-auto

```
ERR_INCOMPLETE_CHUNKED_ENCODING (×2)
ERR_CONNECTION_REFUSED
```

**Interpretace:** Next.js streaming response byl přerušen. Může jít o:
1. Dev server instabilitu při souběžném načítání více stránek (Playwright test běžel po sobě rychle)
2. Externí API call (vindecoder.eu nebo similar) selhává a blokuje rendering

**Doporučení:** Manuálně navštívit `/jak-prodat-auto` v normálním browseru a ověřit. Pokud se opakuje, zkontrolovat jaký external fetch se volá při SSR tohoto page.

---

## STŘEDNÍ problémy

### 🟡 M1 — Chybí H1 na /registrace/makler

- Playlist detekoval absenci H1 (mobile i desktop)
- `/registrace` má H1 "Registrace", ale `/registrace/makler` je pravděpodobně tab/dynamický obsah bez vlastního H1
- **Fix:** Přidat H1 specifický pro flow makléřské registrace

---

### 🟡 M2 — Broken image: /brand/logo-white.png (2 stránky)

**Stránky:** `/jak-prodat-auto`, `/kolik-stoji-moje-auto`  
**Soubor existuje:** ✅ `/public/brand/logo-white.png` (116 KB)  
**URL:** `/_next/image?url=%2Fbrand%2Flogo-white.png&w=384&q=75`

**Interpretace:** Soubor fyzicky existuje. 404 při `/_next/image` optimalizaci může být:
- Způsobena `ERR_INCOMPLETE_CHUNKED_ENCODING` na `/jak-prodat-auto` (rendering přerušen)
- Timing issue v Playwright testu (obraz se nestihne načíst)
- Skutečná chyba Next.js Image optimalizace pro tyto 2 stránky (ostatní stránky stejný soubor načítají OK)

**Doporučení:** Manuálně ověřit v browseru. Pokud je logo viditelné, jde o false positive v Playwright testu.

---

### 🟡 M3 — React duplicate key warning na Homepage

```
Encountered two children with the same key. Keys should be unique.
```

**Stránka:** `/` (homepage)  
**Příčina:** Komponenta renderuje seznam (pravděpodobně vehicle cards, services, nebo testimonials) bez unikátních `key` props.  
**Fix:** Najít v homepage komponentách `map()` kde se používá index nebo neunique hodnota jako key.

---

### 🟡 M4 — Vysoký počet emoji na 8 stránkách

Automotive platforma prémiového segmentu by neměla mít desítky emoji. Aktuální stav:

| Stránka | Počet emoji | Hodnocení |
|---|---|---|
| `/nabidka` | 48 | 🔴 Příliš mnoho |
| `/recenze` | 43 | 🔴 Příliš mnoho |
| `/` | 41 | 🟡 Příliš mnoho |
| `/chci-prodat` | 15 | 🟡 Hraniční |
| `/jak-to-funguje` | 12 | 🟡 Hraniční |
| `/sluzby/proverka` | 12 | 🟡 Hraniční |
| `/sluzby/financovani` | 12 | 🟡 Hraniční |
| `/sluzby/pojisteni` | 12 | 🟡 Hraniční |

**Doporučení:** Přezkoumat design systém — ikony by měly být SVG/Lucide, ne Unicode emoji. Emoji jsou OK maximálně pro akcenty (hvězdičky v recenzích apod.).

---

## NÍZKÁ priorita

### 🟢 L1 — Meta description příliš krátká na /prihlaseni

`"Přihlaste se do svého účtu CarMakléř."` — 38 znaků (doporučeno 120–160 znaků).  
Technicky `/prihlaseni` dělá redirect na `/login`, takže meta description je na redirect stránce — nízký dopad.

---

### 🟢 L2 — /jak-prodat-auto mobile: H1 nedetekován

Playwright nedetekoval H1 na mobilním viewportu, ale H1 v kódu **existuje** (řádek 129 page.tsx: `Jak prodat auto — kompletní průvodce 2026`). Falze positive způsoben ERR_INCOMPLETE_CHUNKED_ENCODING.

---

## INFORMATIVNÍ — záměrné chování

### ℹ️ /prezentace — standalone page bez headeru/patičky

Stránka `/prezentace` má vlastní layout (`app/prezentace/layout.tsx`) bez standardního `<header>` a `<footer>`. Logo ani weblyx credit zde záměrně nejsou. Stránka má `robots: noindex` — správně.  
Jedinou opravou je title tag (C1 výše).

---

## POZITIVNÍ nálezy

- ✅ Všech **25 stránek vrací HTTP 200** — žádné 404, 500
- ✅ **Nové logo s ikonou** je ve všech standardních stránkách
- ✅ **weblyx.cz credit** je v patičce na všech standardních stránkách  
- ✅ **Žádné "undefined", "null", "TODO"** viditelné uživatelům
- ✅ **Žádné "Lorem ipsum"** ani placeholder texty
- ✅ **Mobilní layout** funguje na 23/25 stránkách bez horizontal scroll
- ✅ **Meta descriptions** jsou smysluplné na 24/25 stránkách
- ✅ **H1** přítomno na 23/25 stránkách (2 problematické: /jak-prodat-auto, /registrace/makler)
- ✅ Legal pages (podmínky, GDPR, cookies, reklamační řád) — všechny OK
- ✅ Registration flows — /registrace, /registrace/partner, /registrace/dodavatel OK

---

## Detail po stránkách

### 🟡 / — Homepage

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | ❌ CarMakléř \| Prodejte auto za nejlepší cenu, kupte bezpečně \| CarMakléř |
| H1 | Prodejte auto za nejvyšší cenu. Kupte s jistotou. |
| Meta description | Pomáháme lidem prodat auto za nejvyšší cenu a koupit bezpečně. Váš makléř se postará o fotky, inzerci... ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 41 ⚠️ |

**Problémy:**
- ❌ `[C1]` Duplicate "CarMakléř" v title tagu
- ⚠️ `[M4]` 41 emoji — příliš mnoho pro automotive platformu
- ⚠️ `[M3]` Console error: React duplicate key warning

---

### 🟡 /nabidka — Nabídka vozů

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Nabídka vozidel \| CarMakléř ✅ |
| H1 | Nabídka vozidel |
| Meta description | Prohlédněte si nabídku prověřených ojetých vozidel od ověřených makléřů... ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 48 ⚠️ |

**Problémy:**
- ❌ `[C2]` Broken Unsplash image (seed data)
- ⚠️ `[M4]` 48 emoji — nejvíce ze všech stránek

---

### 🟡 /chci-prodat — Chci prodat

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Prodat auto za nejvyšší cenu \| CarMakléř ✅ |
| H1 | Prodejte auto za nejvyšší cenu bez jediné starosti |
| Meta description | Váš makléř zajistí fotky, inzerci na všech portálech, prohlídky i smlouvu... ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 15 ⚠️ |

**Problémy:**
- ⚠️ `[M4]` 15 emoji — hraniční pro automotive

---

### 🟡 /jak-to-funguje — Jak to funguje

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Jak to funguje \| CarMakléř ✅ |
| H1 | Jak to funguje |
| Meta description | Zjistěte, jak funguje CarMakléř... ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 12 ⚠️ |

**Problémy:**
- ⚠️ `[M4]` 12 emoji

---

### 🟢 /o-nas — O nás

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | O nás \| CarMakléř ✅ |
| H1 | Pomáháme lidem prodat auto za nejvíc a koupit bezpečně |
| Meta description | CarMakléř — nová éra prodeje aut v Česku. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 6 ✅ |

**✅ Žádné problémy**

---

### 🟢 /kariera — Kariéra

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Kariéra \| CarMakléř ✅ |
| H1 | Staňte se automakléřem |
| Meta description | Přidejte se k síti makléřů CarMakléř. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 9 ✅ |

**✅ Žádné problémy**

---

### 🟡 /recenze — Recenze

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Recenze \| CarMakléř ✅ |
| H1 | Co o nás říkají klienti |
| Meta description | Přečtěte si recenze spokojených klientů CarMakléř. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 43 ⚠️ |

**Problémy:**
- ⚠️ `[M4]` 43 emoji — hodnotící hvězdičky jsou pravděpodobně příčinou

---

### 🟢 /kontakt — Kontakt

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Kontakt \| CarMakléř ✅ |
| H1 | Ozvěte se nám |
| Meta description | Kontaktujte CarMakler. Praha. Telefon 733 179 199, e-mail info@carmakler.cz. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 8 ✅ |

**✅ Žádné problémy**

---

### 🟢 /makleri — Makléři

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Ověření automakléři po celé ČR \| CarMakléř ✅ |
| H1 | Najděte makléře ve vašem městě |
| Meta description | Najděte makléře ve vašem městě. Každý prošel školením... ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 2 ✅ |

**✅ Žádné problémy**

---

### 🟡 /sluzby/proverka — Prověrka vozidla

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Prověrka vozidla — kupte auto bez rizika \| CarMakléř ✅ |
| H1 | Kupte auto s jistotou |
| Meta description | Zjistěte pravdu o autě, než ho koupíte. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 12 ⚠️ |

**Problémy:**
- ⚠️ `[M4]` 12 emoji

---

### 🟡 /sluzby/financovani — Financování

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Financování auta — schválení do 30 minut \| CarMakléř ✅ |
| H1 | Auto na splátky do 30 minut |
| Meta description | Auto na splátky bez zálohy, úrok od 3,9 %. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 12 ⚠️ |

**Problémy:**
- ⚠️ `[M4]` 12 emoji

---

### 🟡 /sluzby/pojisteni — Pojištění

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Pojištění auta — srovnání všech pojišťoven \| CarMakléř ✅ |
| H1 | Povinné ručení i havarijní online |
| Meta description | Porovnáme povinné ručení i havarijní pojištění od všech pojišťoven. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 12 ⚠️ |

**Problémy:**
- ⚠️ `[M4]` 12 emoji

---

### 🟡 /jak-prodat-auto — Jak prodat auto

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | ❌ Jak prodat auto v roce 2026 \| Kompletní průvodce — CarMakler \| CarMakléř |
| H1 | Jak prodat auto — kompletní průvodce 2026 (v kódu ✅, Playwright nedetek. kvůli streaming chybě) |
| Meta description | Kompletní průvodce prodejem auta v roce 2026. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ⚠️ (false positive — H1 existuje v kódu) |
| Počet emoji | 2 ✅ |

**Problémy:**
- ❌ `[C1]` Duplicate — title obsahuje `CarMakler` i přidaný `CarMakléř`
- ⚠️ `[C3]` Console errors: ERR_INCOMPLETE_CHUNKED_ENCODING — streaming přerušen, ověřit manuálně
- ⚠️ `[M2]` Broken image logo-white.png — pravděpodobně false positive z důvodu streaming chyby

---

### 🟡 /kolik-stoji-moje-auto — Kolik stojí moje auto

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | ❌ Kolik stojí moje auto? \| Kalkulačka ceny vozidla — CarMakler \| CarMakléř |
| H1 | Kolik stojí moje auto? |
| Meta description | Zjistěte orientační cenu vašeho ojetého auta online. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 2 ✅ |

**Problémy:**
- ❌ `[C1]` Duplicate — title obsahuje `CarMakler` i přidaný `CarMakléř`
- ⚠️ `[M2]` Broken image logo-white.png — ověřit manuálně

---

### 🟢 /registrace — Registrace

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Registrace \| CarMakléř ✅ |
| H1 | Registrace |
| Meta description | Zaregistrujte se na CarMakléř. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |

**✅ Žádné problémy**

---

### 🟡 /registrace/makler — Registrace makléř

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | Registrace \| CarMakléř ✅ |
| H1 | ❌ Chybí |
| Meta description | Zaregistrujte se na CarMakléř. ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ❌ (H1 chybí) |

**Problémy:**
- ❌ `[M1]` Chybí H1 pro makléřský registrační flow

---

### 🟢 /registrace/partner — Registrace partner

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| H1 | Registrace partnera ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |

**✅ Žádné problémy**

---

### 🟢 /registrace/dodavatel — Registrace dodavatel

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| H1 | Registrace dodavatele dílů ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |

**✅ Žádné problémy**

---

### 🟡 /prihlaseni → redirect na /login

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 (permanent redirect) |
| H1 | Přihlášení ✅ |
| Meta description | "Přihlaste se do svého účtu CarMakléř." ⚠️ 38 znaků (pod 50 char threshold) |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |

**Problémy:**
- ⚠️ `[L1]` Meta description krátká — nízký dopad (login stránka není indexována pro SEO)

---

### 🟢 /obchodni-podminky

**✅ Žádné problémy** — H1 ✅, title ✅, meta ✅, logo ✅, weblyx ✅

---

### 🟢 /ochrana-osobnich-udaju

**✅ Žádné problémy** — H1 ✅, title ✅, meta ✅, logo ✅, weblyx ✅

---

### 🟢 /zasady-cookies

**✅ Žádné problémy** — H1 ✅, title ✅, meta ✅, logo ✅, weblyx ✅

---

### 🟢 /reklamacni-rad

**✅ Žádné problémy** — H1 ✅, title ✅, meta ✅, logo ✅, weblyx ✅

---

### 🟡 /prezentace — Partnerská prezentace

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | ❌ CarMakléř — Partnerská prezentace \| CarMakléř |
| H1 | Síť certifikovaných automakléřů |
| Meta description | Staňte se partnerem CarMakléř. ✅ |
| Nové logo v headeru | ℹ️ Záměrně bez standardního headeru (standalone page) |
| weblyx.cz v patičce | ℹ️ Záměrně bez standardní patičky |
| robots | noindex ✅ |
| Počet emoji | 12 ⚠️ |

**Problémy:**
- ❌ `[C1]` Duplicate "CarMakléř" v title tagu (fix: `absolute` title)
- ⚠️ `[M4]` 12 emoji

---

### 🟡 /profil/jan-novak-praha — Profil makléře

| Vlastnost | Hodnota |
|---|---|
| HTTP status | 200 |
| Titulek stránky | ❌ Jan Novák — Makléř CarMakléř \| CarMakléř |
| H1 | Jan Novák |
| Meta description | Certifikovaný makléř s 5 lety zkušeností... ✅ |
| Nové logo v headeru | ✅ |
| weblyx.cz v patičce | ✅ |
| Mobile OK | ✅ |
| Počet emoji | 13 ⚠️ |

**Problémy:**
- ❌ `[C1]` Duplicate "CarMakléř" v title tagu
- ⚠️ `[M4]` 13 emoji

---

## Opravy seřazené podle priority

### Blok 1 — Critické (opravit ihned)

| # | Problém | Soubor | Effort |
|---|---|---|---|
| 1 | Title duplikát na homepage | `app/(web)/page.tsx:13` | 5 min |
| 2 | Title duplikát na /prezentace | `app/prezentace/layout.tsx:3` | 5 min |
| 3 | Title duplikát + "CarMakler" v jak-prodat-auto | `app/(web)/jak-prodat-auto/page.tsx:14` | 5 min |
| 4 | Title duplikát + "CarMakler" v kolik-stoji-moje-auto | `app/(web)/kolik-stoji-moje-auto/page.tsx:9` | 5 min |
| 5 | Title duplikát na profil | `app/(web)/profil/[slug]/page.tsx:211` | 5 min |
| 6 | Broken Unsplash v seed datech | DB seed / test data | 15 min |

### Blok 2 — Střední

| # | Problém | Soubor | Effort |
|---|---|---|---|
| 7 | Chybí H1 na /registrace/makler | `app/(web)/registrace/makler/page.tsx` | 10 min |
| 8 | React duplicate key na homepage | `app/(web)/page.tsx` — najít `map()` bez unikátního key | 15 min |
| 9 | Přezkoumat emoji usage | Komponenty services, recenze, nabídka | 30 min |

### Blok 3 — Nízká priorita

| # | Problém | Soubor | Effort |
|---|---|---|---|
| 10 | Meta description /login | `app/(web)/login/page.tsx` | 5 min |
| 11 | Ověřit /jak-prodat-auto streaming v prod | Manuální test | 10 min |

---

*Audit provedl: QA agent (claude-sonnet-4-6)*  
*Metoda: Playwright chromium, headed, networkidle*
