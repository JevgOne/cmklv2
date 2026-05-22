# Audit PRODUKCE carmakler.cz — 2026-04-23

**Datum testu:** 2026-04-23  
**Prostředí:** PRODUKCE — https://carmakler.cz (IP 91.98.203.239)  
**Nástroj:** Playwright Chromium (headed) + curl verification  
**Viewport desktop:** 1280×900 | **Viewport mobile:** 390×844 (iPhone 14)  
**Testováno stránek:** 25  

---

## Souhrn

| Metrika | Hodnota |
|---|---|
| Celkem stránek | 25 |
| HTTP chyby (4xx/5xx) | **0** — všechny stránky dostupné |
| Stránky s potvrzenými problémy | **5** |
| Stránky OK | **20** |

---

## ⚠️ Poznámka k průběhu testu

Playwright audit byl spuštěn v době, kdy probíhal **deploy na produkci**. Pozdější stránky v sekvenci (recenze, kontakt, makleri, sluzby/*) načetly HTML s **starými chunk hashi** (`96942-2d7ec151c387a734.js`, `main-app-311dcdef7d657077.js`), které na serveru již neexistovaly.

**Aktuální stav po dokončení deploye** (ověřeno curl): všechny `/_next/static/` assety vrací HTTP 200 se správnými MIME typy. JS/CSS chyby z Playwright testu jsou **false positives způsobené mid-deploy snapshots**.

Curl ověření aktuálních chunků:
```
200 /_next/static/css/071a24c35de29c77.css         (text/css)
200 /_next/static/chunks/96942-d0617abdb48083a5.js
200 /_next/static/chunks/main-app-6a9001d473136277.js
200 /_next/static/media/7b0b24f36b1a6d0b-s.p.woff2 (font/woff2)
... 17 dalších chunks — všechny 200
```

---

## KRITICKÉ problémy (potvrzeny curl, stále aktivní)

### 🔴 P1 — Duplikovaný brand v `<title>` na 4+ stránkách

Potvrzeno curl na aktuální produkci:

| Stránka | Aktuální title v produkci |
|---|---|
| `/` | `CarMakléř \| Prodejte auto za nejlepší cenu, kupte bezpečně \| CarMakléř` |
| `/jak-prodat-auto` | `Jak prodat auto v roce 2026 \| Kompletní průvodce — CarMakler \| CarMakléř` |
| `/kolik-stoji-moje-auto` | `Kolik stojí moje auto? \| Kalkulačka ceny vozidla — CarMakler \| CarMakléř` |
| `/prezentace` | `CarMakléř — Partnerská prezentace \| CarMakléř` |
| `/profil/jan-novak-praha` | `Jan Novák — Makléř CarMakléř \| CarMakléř` (ověřeno Playwright) |

**Root cause:** root layout template `%s | CarMakléř` se aplikuje na pages, které již obsahují "CarMakléř" v title stringu.  
**Navíc:** `/jak-prodat-auto` a `/kolik-stoji-moje-auto` píší `CarMakler` (bez háčku) — inconsistentní brand.  

**Fix:**
```typescript
// app/(web)/page.tsx
export const metadata = {
  title: { absolute: "CarMakléř — Prodejte auto za nejvyšší cenu" }
}

// app/(web)/jak-prodat-auto/page.tsx — odstranit "— CarMakler" z title stringu
title: "Jak prodat auto v roce 2026 | Kompletní průvodce"

// app/(web)/kolik-stoji-moje-auto/page.tsx — odstranit "— CarMakler"
title: "Kolik stojí moje auto? | Kalkulačka ceny vozidla"

// app/prezentace/layout.tsx
export const metadata = {
  title: { absolute: "CarMakléř — Partnerská prezentace" }
}

// app/(web)/profil/[slug]/page.tsx line 211 — odstranit CarMakléř z části před pipe
title: `${fullName} — Automakléř`
```

---

### 🔴 P2 — Broken image: Unsplash foto na /nabidka

**URL:** `/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1549317661...`  
**Příčina:** Seed data v DB obsahují Unsplash URL jako placeholder vozidla. Tato URL není v kódu.  
**Dopad:** Rozbité vozidlo v nabídce, chybějící obrázek ruší dojem kvality.  
**Fix:** Nahradit seed data pro ukázkové inzeráty Cloudinary URL nebo `/brand/` placeholderem.

---

## STŘEDNÍ problémy

### 🟡 M1 — Chybí H1 na /registrace/makler

Playwright detekoval absenci H1 na `/registrace/makler`. Ostatní registrační flows mají H1:
- `/registrace` → "Registrace" ✅
- `/registrace/partner` → "Registrace partnera" ✅
- `/registrace/dodavatel` → "Registrace dodavatele dílů" ✅
- `/registrace/makler` → ❌ chybí

**Fix:** Přidat `<h1>Registrace makléře</h1>` do příslušné komponenty.

---

### 🟡 M2 — Vysoký počet emoji (potvrzen Playwright)

| Stránka | Emoji |
|---|---|
| `/nabidka` | 48 |
| `/recenze` | 43 |
| `/chci-prodat` | 15 |
| `/jak-to-funguje` | 12 |
| `/sluzby/*` (3 stránky) | 12 každá |
| `/prezentace` | 12 |
| `/profil/*` | 13 |

Prémiová automotive platforma by měla preferovat SVG ikony (Lucide) před Unicode emoji.  
**Fix:** Projít komponenty nabídky, recenzí a service stránek, nahradit emoji Lucide ikonami.

---

## FALSE POSITIVES (ověřeny curl — nejsou skutečné problémy)

| Problém z Playwright | Curl výsledek | Závěr |
|---|---|---|
| `logo-white.png` broken (naturalWidth=0) | HTTP 200 image/png ✅ | Lazy-load timing false positive |
| Font woff2 "Failed to load" | HTTP 200 font/woff2 ✅ | Timing false positive |
| JS chunks 404 + text/plain MIME | HTTP 200 (nové hashi) ✅ | Mid-deploy false positive |
| CSS 500 + wrong MIME | HTTP 200 text/css ✅ | Mid-deploy false positive |
| `?_rsc=` prefetch failures | Normal Next.js behavior ✅ | Router prefetch, ne chyba |

---

## POZITIVNÍ nálezy

- ✅ Všech **25 stránek HTTP 200**
- ✅ **Nové logo** (SVG/img v headeru) na 24/25 stránkách
- ✅ **weblyx.cz credit** v patičce na 24/25 stránkách
- ✅ **Žádné "undefined", "null", "TODO"** viditelné uživatelům
- ✅ **Žádný Lorem ipsum** ani placeholder text
- ✅ **Mobilní layout** bez horizontal scroll overflow
- ✅ **Meta descriptions** smysluplné na 24/25 stránkách
- ✅ **H1** přítomno na 24/25 stránkách (pouze /registrace/makler chybí)
- ✅ **Legal pages** (podmínky, GDPR, cookies, reklamační řád) — všechny OK
- ✅ **Registration flows** (partner, dodavatel) — OK
- ✅ **Static assets** — všechny `_next/static/` assety vrací HTTP 200 po deployi
- ✅ **/prezentace** — robots:noindex, standalone layout (intentional)

---

## Detail po stránkách

### 🔴 / — Homepage
- HTTP: 200
- Title: ❌ `CarMakléř | Prodejte auto za nejlepší cenu, kupte bezpečně | CarMakléř` (P1)
- H1: Prodejte auto za nejvyšší cenu. Kupte s jistotou.
- Logo ✅ | weblyx ✅ | Mobile ✅ | Emoji: 12–41 ⚠️

### 🔴 /nabidka — Nabídka vozů
- HTTP: 200 | Title ✅ | H1 ✅ | Logo ✅ | weblyx ✅ | Mobile ✅
- Emoji: 48 ⚠️
- ❌ Broken Unsplash image (P2)

### 🟢 /chci-prodat — HTTP 200, title ✅, H1 ✅, logo ✅, weblyx ✅, mobile ✅ — emoji 15 ⚠️
### 🟢 /jak-to-funguje — HTTP 200, title ✅, H1 ✅, logo ✅, weblyx ✅, mobile ✅ — emoji 12 ⚠️
### 🟢 /o-nas — **✅ Vše OK** — emoji 6 ✅
### 🟢 /kariera — **✅ Vše OK** — emoji 9 ✅
### 🟡 /recenze — HTTP 200, title ✅, H1 ✅, logo ✅, weblyx ✅ — emoji 43 ⚠️
### 🟢 /kontakt — **✅ Vše OK** — emoji 8 ✅
### 🟢 /makleri — **✅ Vše OK** — emoji 2 ✅
### 🟡 /sluzby/proverka — HTTP 200, vše OK — emoji 12 ⚠️
### 🟡 /sluzby/financovani — HTTP 200, vše OK — emoji 12 ⚠️
### 🟡 /sluzby/pojisteni — HTTP 200, vše OK — emoji 12 ⚠️

### 🔴 /jak-prodat-auto — Jak prodat auto
- HTTP: 200
- Title: ❌ `Jak prodat auto v roce 2026 | Kompletní průvodce — CarMakler | CarMakléř` (P1)
- H1: Jak prodat auto — kompletní průvodce 2026 ✅
- Logo ✅ | weblyx ✅ | Mobile ✅ | Emoji: 2 ✅

### 🔴 /kolik-stoji-moje-auto — Kolik stojí moje auto
- HTTP: 200
- Title: ❌ `Kolik stojí moje auto? | Kalkulačka ceny vozidla — CarMakler | CarMakléř` (P1)
- H1: Kolik stojí moje auto? ✅
- Logo ✅ | weblyx ✅ | Mobile ✅ | Emoji: 2 ✅

### 🟢 /registrace — **✅ Vše OK**
### 🟡 /registrace/makler — HTTP 200, **H1 ❌ chybí** (M1), Logo ✅, weblyx ✅
### 🟢 /registrace/partner — **✅ Vše OK**
### 🟢 /registrace/dodavatel — **✅ Vše OK**
### 🟢 /prihlaseni → /login — HTTP 200, H1 ✅, Logo ✅, meta description krátká (nízká priorita)
### 🟢 /obchodni-podminky — **✅ Vše OK**
### 🟢 /ochrana-osobnich-udaju — **✅ Vše OK**
### 🟢 /zasady-cookies — **✅ Vše OK**
### 🟢 /reklamacni-rad — **✅ Vše OK**

### 🔴 /prezentace — Partnerská prezentace
- HTTP: 200
- Title: ❌ `CarMakléř — Partnerská prezentace | CarMakléř` (P1)
- H1: Síť certifikovaných automakléřů ✅
- robots: noindex ✅ | Standalone layout (intentional) | Emoji: 12 ⚠️

### 🟡 /profil/jan-novak-praha — Profil makléře
- HTTP: 200
- Title: ❌ `Jan Novák — Makléř CarMakléř | CarMakléř` (P1)
- H1: Jan Novák ✅
- Logo ✅ | weblyx ✅ | Mobile ✅ | Emoji: 13 ⚠️

---

## Prioritní opravy

### Blok 1 — Okamžitě (SEO chyby na živé produkci)

| # | Soubor | Změna |
|---|---|---|
| 1 | `app/(web)/page.tsx:13` | `title: { absolute: "CarMakléř — Prodejte auto za nejvyšší cenu" }` |
| 2 | `app/prezentace/layout.tsx:3` | `title: { absolute: "CarMakléř — Partnerská prezentace" }` |
| 3 | `app/(web)/jak-prodat-auto/page.tsx:14` | Odstranit `— CarMakler` z title stringu |
| 4 | `app/(web)/kolik-stoji-moje-auto/page.tsx:9` | Odstranit `— CarMakler` z title stringu |
| 5 | `app/(web)/profil/[slug]/page.tsx:211` | Odstranit `CarMakléř` z title části před template |
| 6 | DB seed data | Nahradit Unsplash URL v ukázkových inzerátech |

### Blok 2 — Střední priorita

| # | Problém | Effort |
|---|---|---|
| 7 | H1 chybí na `/registrace/makler` | 10 min |
| 8 | Emoji → Lucide SVG ikony (nabídka, recenze, sluzby) | 30–60 min |

---

*Audit provedl: QA agent (claude-sonnet-4-6)*  
*Metoda: Playwright chromium headed + curl cross-verification*  
*Curl verifikace potvrdila: mid-deploy snapshot zachycen Playwright — produkce je po deployi funkční*
