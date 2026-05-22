# Chrome Test — TASK-046: Instagram profil + BrokerCard

**Datum:** 2026-04-25  
**Target:** https://carmakler.cz (commit `fd5cb8e`)  
**Tester:** test-chrome (Playwright headed, viditelný Chrome)

> ⚠️ **Slug oprava:** Task specifikoval `/profil/petra-mala` — na produkci neexistuje (404).  
> Správný slug je **`/profil/petra-mala-brno`**. Všechny testy provedeny s tímto URL.

---

## Celkový výsledek: ✅ PASS (vizuálně ověřeno screenshoty)

| Test | Status |
|------|--------|
| 1. Desktop profil — Instagram layout | ✅ PASS |
| 2. Desktop profil — bez citlivých údajů | ✅ PASS |
| 3. BrokerCard na /makleri | ✅ PASS |
| 4. Homepage TOP makléři | ✅ PASS |
| 5. Mobilní responzivita 375px | ✅ PASS |

*Automatické testy hlásily 2 false positives: (a) "404" v JS bundle textu na jinak funkční stránce, (b) slovo "regionální" ve standardním textu footeru — ne jako threshold tabulka. Obojí ověřeno vizuálně ze screenshotů.*

---

## TEST 1+2 — `/profil/petra-mala-brno` Desktop ✅

![profil-desktop](../screenshots/t046-profil-desktop.png)
![profil-scroll](../screenshots/t046-profil-desktop-scroll.png)

**Instagram layout — vizuálně ověřeno:**
- Avatar (PM) **centrovaný** nad jménem ✅
- Jméno **"Petra Malá"** centrovaně ✅
- LevelBadge **"⭐⭐⭐ Makléř"** — zlatý pill badge (STAR_3) ✅
- Badge "Ověřená identita" ✅
- **Stats row** s oddělovači: `0 Prodejů | 2 Vozidla | 0 Lajky` ✅
- CTA **"Chcete prodat auto?"** full-width ✅
- Sekce "O makléři" + vozidla tabs ✅

**Zakázané prvky — NENALEZENY:**
- BEZ progress baru s obratem v Kč ✅
- BEZ provize % ✅
- BEZ tabulky regionálních prahů ✅
- BEZ celkového obratu ✅

---

## TEST 5 — Mobile 375px ✅

![profil-mobile](../screenshots/t046-profil-mobile.png)

- Centered layout na mobile perfektní ✅
- ⭐⭐⭐ Makléř badge viditelný ✅
- Stats row funkční ✅
- Bez horizontálního overflow ✅

---

## TEST 3 — `/makleri` BrokerCard ✅

![makleri-cards](../screenshots/t046-makleri-cards.png)

- Jan Novák (Praha) — "TOP Makléř" badge ✅
- Karel Dvořák (ČR) ✅
- Petra Malá (ČR) — **⭐⭐⭐ hvězdičky** viditelné v kartě ✅
- BEZ bio textu (odstraněno) ✅
- BEZ TagPill tagů (odstraněny) ✅
- Kompaktnější design ✅

---

## TEST 4 — Homepage ✅

![homepage](../screenshots/t046-homepage-makleri.png)

- Homepage bez chyby ✅
- Hvězdičky na kartách makléřů ✅

---

## Screenshots

- `t046-profil-desktop.png` — Instagram hero (centered, ⭐⭐⭐, stats)
- `t046-profil-desktop-scroll.png` — CTA + O makléři + vozidla
- `t046-profil-mobile.png` — mobile 375px
- `t046-makleri-cards.png` — BrokerCard (bez bio/tagů, ⭐⭐⭐ u Petry)
- `t046-homepage-makleri.png` — homepage