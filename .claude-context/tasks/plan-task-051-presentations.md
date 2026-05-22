# Plan: TASK-051 — HTML prezentace — design, diakritika, title slide

**Datum:** 2026-04-25
**Autor:** Planovac
**Priorita:** STREDNI
**Typ:** Vizualni vylepseni + oprava textu

---

## Shrnutí

8 HTML prezentací v `docs/presentations/` potřebuje:
1. **Diakritika** — VŠECH 8 souborů má texty kompletně bez háčků a čárek (stovky instancí)
2. **Title slide design** — vylepšit vizuální stránku úvodního slidu (sdílený CSS pattern)
3. **Zastaralý obsah** — `onboarding-makler.html` obsahuje starý systém úrovní (Nováček/Profesionál/Expert/Šampion) místo aktuálního STAR_1-5
4. **Drobné design vylepšení** — konzistence, čitelnost

---

## Soubory k úpravě

| # | Soubor | Řádky | Typ | Diakritika | Design |
|---|--------|-------|-----|------------|--------|
| 1 | `obchodni-prezentace.html` | 664 | 9 slidů | ANO | ANO |
| 2 | `carmakler-pro-autobazary.html` | 627 | 8 slidů | ANO | ANO |
| 3 | `carmakler-pro-vrakoviste.html` | 537 | 8 slidů | ANO | ANO |
| 4 | `cenik-sluzeb.html` | 522 | 6 slidů | ANO | ANO |
| 5 | `marketplace-investori.html` | 609 | 8 slidů | ANO | ANO |
| 6 | `onboarding-makler.html` | 669 | 9 slidů | ANO | ANO + OBSAH |
| 7 | `faktura-sablona.html` | 355 | A4 portrait | ANO | NE (jiný formát) |
| 8 | `landing-page-sablona.html` | 495 | 5 slidů | ANO | ANO |

---

## Fáze 1: Vylepšení title slide designu (sdílený CSS pattern)

### Stávající title slide

Všech 6 slide-based prezentací (1-6) + landing-page-sablona používá identický pattern:

```css
.slide-title {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.slide-title::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.08);
  top: -100px;
  right: -100px;
}

.slide-title::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.05);
  bottom: -50px;
  left: -50px;
}
```

Logo: `<img src="../../public/brand/logo-white.png" style="height: 80px;">`
Nadpis: `<h1>Text <span style="color: #F97316">zvýrazněný</span></h1>`
Podtitulek: `<p style="font-size: 1.3rem; color: rgba(255,255,255,0.7);">`
Patička: web vlevo + datum vpravo (absolute bottom)

### Navrhované vylepšení title slide

**A. Větší a výraznější logo:**
```css
/* Změna: 80px → 100px, přidat glow efekt */
.slide-title img {
  height: 100px;
  filter: drop-shadow(0 0 30px rgba(249, 115, 22, 0.3));
  margin-bottom: 2rem;
}
```

**B. Přidat subtle dot/grid pattern na pozadí:**
```css
.slide-title {
  background: 
    radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0) 0 0 / 40px 40px,
    linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
}
```

**C. Vylepšit dekorativní kruhy — přidat třetí, zvětšit:**
```css
.slide-title::before {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%);
  top: -150px;
  right: -150px;
}

.slide-title::after {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.07) 0%, transparent 70%);
  bottom: -100px;
  left: -100px;
}
```

**D. Přidat horizontální linku pod logo:**
```html
<div style="width: 60px; height: 3px; background: #F97316; margin: 0 auto 2rem; border-radius: 2px;"></div>
```

**E. Zvýraznit podtitulek — větší font, méně průhledný:**
```css
/* Změna: 1.3rem → 1.4rem, 0.7 → 0.8 */
font-size: 1.4rem;
color: rgba(255, 255, 255, 0.8);
letter-spacing: 0.02em;
```

**F. Přidat subtle animaci / gradient border dole:**
```css
.slide-title .bottom-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, #F97316, transparent);
}
```

**G. Patička — lepší typografie:**
```css
/* Stávající: font-size 0.9rem, opacity 0.5 */
/* Nové: */
font-size: 0.85rem;
color: rgba(255, 255, 255, 0.5);
letter-spacing: 0.05em;
text-transform: uppercase;
```

### Výsledný title slide (vizuální popis)

```
┌─────────────────────────────────────────────────┐
│  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · │ ← dot pattern
│             ○ (orange glow, top-right)          │
│                                                 │
│              [LOGO - 100px, glow]               │
│              ────── (orange line)                │
│                                                 │
│         Hlavní nadpis s oranžovým                │
│              zvýrazněním                         │
│                                                 │
│        Podtitulek — větší, čitelnější            │
│                                                 │
│           ○ (orange glow, bottom-left)           │
│  www.carmakler.cz              Duben 2026       │
│▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬│ ← gradient accent
└─────────────────────────────────────────────────┘
```

---

## Fáze 2: Oprava diakritiky — kompletní seznam

### Soubor 1: `obchodni-prezentace.html` (9 slidů)

**Title slide:**
- "Kompletni automobilova platforma" → "Kompletní automobilová platforma"
- "4 produkty. 1 ekosystem. Neomezene moznosti." → "4 produkty. 1 ekosystém. Neomezené možnosti."

**Slide 2 (Ekosystém):**
- "Nas ekosystem" → "Náš ekosystém"
- "Maklerska sit" → "Makléřská síť"
- "Zprostredkovani prodeje vozidel pres sit certifikovanych makleru" → "Zprostředkování prodeje vozidel přes síť certifikovaných makléřů"
- "Inzertni platforma" → "Inzertní platforma"
- "Digitalni inzerce aut pro soukrome prodejce, autobazary a dealery" → "Digitální inzerce aut pro soukromé prodejce, autobazary a dealery"
- "Eshop autodily" → "Eshop autodíly"
- "E-shop s pouzitymi dily z vrakovist + nove aftermarket dily" → "E-shop s použitými díly z vrakovišť + nové aftermarket díly"
- "Uzavrena investicni platforma pro flipping aut" → "Uzavřená investiční platforma pro flipping aut"

**Slide 3 (Makléřská síť):**
- "Maklerska sit" → "Makléřská síť"
- "Jak to funguje" → OK (bez diakritiky OK)
- "Makler nabere auto v terenu" → "Makléř nabere auto v terénu"
- "BackOffice schvali a vytvori inzerat" → "BackOffice schválí a vytvoří inzerát"
- "Auto se proda pres nasi platformu" → "Auto se prodá přes naši platformu"
- "Provize se rozdeli" → "Provize se rozdělí"
- "Provize: 5% z prodejni ceny" → "Provize: 5% z prodejní ceny"
- "Minimalne 25 000 Kc" → "Minimálně 25 000 Kč"
- "AI asistent pro maklere" → "AI asistent pro makléře"
- "PWA aplikace s offline rezimem" → "PWA aplikace s offline režimem"
- "Automaticke generovani popisu" → "Automatické generování popisů"
- "VIN dekoder pro overeni vozidel" → "VIN dekodér pro ověření vozidel"

**Slide 4 (Inzertní platforma):**
- "Inzertni platforma" → "Inzertní platforma"
- "Pro soukrome prodejce" → "Pro soukromé prodejce"
- "Jednoduche podani inzeratu" → "Jednoduché podání inzerátu"
- "Profesionalni sablony" → "Profesionální šablony"
- "Moznost vyuzit maklere" → "Možnost využít makléře"
- "Pro autobazary" → OK
- "Hromadny import vozidel" → "Hromadný import vozidel"
- "Sprava flotily" → "Správa flotily"
- "Statistiky a analyza" → "Statistiky a analýza"
- "Srovnani s konkurenci" → "Srovnání s konkurencí"
- "Kvalitnejsi inzerace nez Sauto/Bazos" → "Kvalitnější inzerace než Sauto/Bazoš"
- "Propojeni s maklerskou siti" → "Propojení s makléřskou sítí"
- "Moderni UX/UI" → "Moderní UX/UI"

**Slide 5 (Eshop autodíly):**
- "Eshop autodily" → "Eshop autodíly"
- "Pro zakazniky" → "Pro zákazníky"
- "Hledani dilu podle VIN/vozu" → "Hledání dílů podle VIN/vozu"
- "Pouzite i nove dily" → "Použité i nové díly"
- "Overeni dodavatele" → "Ověření dodavatelé"
- "Pro vrakoviste" → "Pro vrakoviště"
- "Jednoducha PWA aplikace" → "Jednoduchá PWA aplikace"
- "Pridavani dilu fotkou" → "Přidávání dílů fotkou"
- "Sprava objednavek" → "Správa objednávek"
- "Pouzite dily z vrakovist" → "Použité díly z vrakovišť"
- "Nove aftermarket dily" → "Nové aftermarket díly"
- "Wolt model — vrakoviste prodava zdarma, provize z prodeje" → "Wolt model — vrakoviště prodává zdarma, provize z prodeje"

**Slide 6 (Marketplace VIP):**
- "Investicni prilezitosti" → "Investiční příležitosti"
- "Pro investory" → OK
- "Overene prilezitosti" → "Ověřené příležitosti"
- "Transparentni kalkulace" → "Transparentní kalkulace"
- "Garantovany proces" → "Garantovaný proces"
- "Pro dealery" → OK
- "Pristup k financovani" → "Přístup k financování"
- "Sdilene naklady" → "Sdílené náklady"
- "Vetsi objem obchodu" → "Větší objem obchodů"
- "Deleni zisku" → "Dělení zisku"

**Slide 7 (Technologie):**
- "Technologicky stack" → "Technologický stack"
- "Moderni technologie" → "Moderní technologie"
- Zde jsou tech termíny (Next.js, TypeScript, Prisma) — ty se nemění

**Slide 8 (Čísla):**
- "Carmakler v cislech" → "Carmakler v číslech"
- "Registrovanych makleru" → "Registrovaných makléřů"
- "Vozidel v nabidce" → "Vozidel v nabídce"
- "Uspesnych prodej" → "Úspěšných prodejů"
- "Spokojenych zakazniku" → "Spokojených zákazníků"

**Slide 9 (CTA):**
- "Pripojte se k Carmakler" → "Připojte se k Carmakler"
- "Zacnete vydelavat jeste dnes" → "Začněte vydělávat ještě dnes"
- "Registrovat se jako makler" → "Registrovat se jako makléř"
- "Podat inzerat" → "Podat inzerát"
- "Investovat" → OK

### Soubor 2: `carmakler-pro-autobazary.html` (8 slidů)

**Title slide:**
- "Partnersky program pro autobazary" → "Partnerský program pro autobazary"
- "Prodejte vice aut s mene namahy" → "Prodejte více aut s méně námahy"

**Všechny další slidy** — desítky instancí bez diakritiky, principiálně stejný pattern:
- "nabidka" → "nabídka", "sluzby" → "služby", "zakaznik" → "zákazník"
- "vyhody" → "výhody", "moznosti" → "možnosti", "sprava" → "správa"
- "inzerce" → OK (nemá háček), "vozidel" → OK
- "cenik" → "ceník", "mesicne" → "měsíčně"
- "spolupraci" → "spolupráci", "registrace" → OK

### Soubor 3: `carmakler-pro-vrakoviste.html` (8 slidů)

**Title slide:**
- "Partnersky program pro vrakoviste" → "Partnerský program pro vrakoviště"
- "Prodejte sve dily tisicum zakazniku" → "Prodejte své díly tisícům zákazníků"

**Pattern:** Stejný jako výše — všechny české texty bez diakritiky.

### Soubor 4: `cenik-sluzeb.html` (6 slidů)

**Title slide:**
- "Cenik sluzeb" → "Ceník služeb"
- "Kompletni prehled cen a tarifu" → "Kompletní přehled cen a tarifů"

### Soubor 5: `marketplace-investori.html` (8 slidů)

**Title slide:**
- "Investicni prilezitosti" → "Investiční příležitosti"
- "Vydelavejte na flippingu aut s minimem rizika" → "Vydělávejte na flippingu aut s minimem rizika"

### Soubor 6: `onboarding-makler.html` (9 slidů)

**Title slide:**
- "Pruvodce pro nove maklere" → "Průvodce pro nové makléře"
- "Vse co potrebujete vedet pro uspesny start" → "Vše co potřebujete vědět pro úspěšný start"

**Slide 7 — ZASTARALÝ OBSAH (kariérní systém):**

Stávající text zobrazuje starý systém:
```
Nováček → Profesionál → Expert → Šampion
(0-5 prodejů) (6-20) (21-50) (50+)
```

Aktuální systém po TASK-044:
```
⭐ STAR_1 → ⭐⭐ STAR_2 → ⭐⭐⭐ STAR_3 → ⭐⭐⭐⭐ STAR_4 → ⭐⭐⭐⭐⭐ STAR_5
(regionální obratové prahy, ne počet prodejů)
```

**FIX:** Přepsat slide 7 s aktuálním hvězdičkovým systémem. Neuvádět konkrétní obratové prahy (jsou regionální a interní) — jen vizuálně hvězdičky a obecný popis ("Vaše úroveň roste s obratem").

### Soubor 7: `faktura-sablona.html` (A4 portrait)

Menší množství textu, ale také bez diakritiky:
- "Faktura - danovy doklad" → "Faktura - daňový doklad"
- "Dodavatel" → OK, "Odberatel" → "Odběratel"
- "Datum vystaveni" → "Datum vystavení"
- "Datum splatnosti" → OK
- "Zpusob uhrady" → "Způsob úhrady"
- "Bankovni prevod" → "Bankovní převod"
- "Nazev polozky" → "Název položky"
- "Mnozstvi" → "Množství"
- "Jednotkova cena" → "Jednotková cena"
- "Celkem bez DPH" → OK
- "DPH 21%" → OK
- "Celkem s DPH" → OK
- "Vystavil" → OK

### Soubor 8: `landing-page-sablona.html` (5 slidů)

**Title slide:**
- Závisí na konkrétním textu — obecně všechny české texty bez diakritiky

---

## Fáze 3: Drobná design vylepšení (volitelné)

### 3.1 Konzistentnější slide-footer

Některé soubory mají `slide-footer` s gradient `linear-gradient(90deg, #F97316, #fb923c)`, jiné mají solid color. **Sjednotit na gradient.**

### 3.2 Content slide — lepší readability

Přidat do sdíleného CSS:
```css
.slide li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.slide h2 {
  margin-bottom: 1.5rem;
  position: relative;
  padding-bottom: 0.75rem;
}

.slide h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: #F97316;
  border-radius: 2px;
}
```

### 3.3 CTA slide — výraznější tlačítka

Stávající CTA tlačítka mají `background: #F97316`, ale chybí hover efekt a box-shadow:
```css
.cta-button {
  background: #F97316;
  color: white;
  padding: 1rem 2.5rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  display: inline-block;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}
```

---

## Implementační pokyny

### Pořadí práce

1. **Title slide CSS** — upravit v JEDNOM souboru, pak zkopírovat pattern do ostatních (7 souborů sdílí identický CSS)
2. **Diakritika** — soubor po souboru, hledat české texty a opravit háčky/čárky
3. **Onboarding slide 7** — přepsat obsah kariérního systému na STAR_1-5
4. **Drobné design vylepšení** — pokud zbude čas

### STOP pravidla

| # | Podmínka | Akce |
|---|----------|------|
| STOP-1 | Nejistota u konkrétního českého slova (háčky/čárky) | Ověřit ve slovníku, raději přeskočit než napsat špatně |
| STOP-2 | Logo soubory neexistují na uvedených cestách | Ponechat stávající cesty, poznamenat |
| STOP-3 | Prezentace se po úpravě rozpadne vizuálně | Vrátit CSS změny, opravit jen diakritiku |

### Rozsah změn

| Fáze | Soubory | Odhadovaný rozsah |
|------|---------|-------------------|
| 1 (Title slide) | 7 souborů | ~20 řádků CSS v každém |
| 2 (Diakritika) | 8 souborů | Stovky textových oprav |
| 3 (Onboarding obsah) | 1 soubor | ~30 řádků HTML |
| 4 (Design vylepšení) | 7 souborů | ~10 řádků CSS v každém |

**Celkový rozsah:** VELKÝ (mnoho drobných textových změn ve stovkách řádků)

---

## Acceptance criteria

1. ✅ Všech 8 souborů má správnou českou diakritiku (háčky, čárky)
2. ✅ Title slide má vylepšený design (větší logo, dot pattern, accent line, glow efekt)
3. ✅ `onboarding-makler.html` slide 7 zobrazuje aktuální STAR_1-5 systém
4. ✅ Prezentace se správně renderují v prohlížeči
5. ✅ Design systém je konzistentní napříč všemi prezentacemi (sdílený CSS pattern)
6. ✅ Zachována A4 landscape orientace a print-friendly layout
7. ✅ Logo cesty fungují (`../../public/brand/logo-white.png`, `logo-color.png`)
