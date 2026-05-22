# TEST-CHROME: Finální retest Bazoš fix v2 — 3 různé leady

**Datum:** 2026-05-20  
**Tester:** TEST-CHROME agent  
**Prostředí:** Produkce (carmakler.cz)  
**Přihlášení:** radim@wikiporadce.cz  

---

## Výsledek: ✅ PASS — všechny 3 leady v pořádku

---

## Lead 1: Škoda Octavia 3 Facelift Combi, 1.6 TDI, DSG, 2017

**ID:** `cmpedbenp0001s47rps8dgj0f`  
**URL:** https://carmakler.cz/admin/scout-leads/cmpedbenp0001s47rps8dgj0f  

| Kritérium | Výsledek |
|-----------|----------|
| Hero foto | ✅ Reálná fotka auta (tmavé kombi) — bazos.cz/img/1/934/219109934.jpg |
| Fotogalerie | ✅ 11 fotek (4 zobrazeny + "+7 dalších fotek") — jen JPG, žádné SVG |
| Výbava | ✅ 9 položek (Přední zadní senzory parkování, Tempomat, Apple car play, Android auto, Navigace, Výhřev předních sedadel, Dešťový senzor, Tří zónová klimatizace, Bezkličové startování) |
| Metadata | ✅ Rok: 2017, Km: 210 000, Palivo: Diesel, Převodovka: Automatická, Karoserie: Kombi |
| Popis prodejce | ✅ Vyplněn |
| Cenová distribuce | ✅ Graf zobrazen (Tržní median 165 750 Kč, Průměr 207 755 Kč) |
| Kompletnost dat | ✅ 100% (10/10) |
| Score | 82 |

**Předchozí stav (před fix v2):** `vehiclePhotos[0]` = `bazos.svg` (SVG ikona)  
**Po fix v2:** Filtrováno 16→11 fotek, první = reálná JPG fotka auta

---

## Lead 2: Volvo v60

**ID:** `cmpedbenz0002s47r5avx444p`  
**URL:** https://carmakler.cz/admin/scout-leads/cmpedbenz0002s47r5avx444p  

| Kritérium | Výsledek |
|-----------|----------|
| Hero foto | ✅ Reálná fotka auta (tmavě modré Volvo) — bazos.sk/img/1/668/191936668.jpg |
| Fotogalerie | ✅ 7 fotek (4 zobrazeny + "+3 dalších fotek") — jen JPG, žádné SVG |
| Výbava | ✅ 8 položek (cúvacie senzory, tempomat, dažďový senzor, svetelný senzor, čítačka dopravných značiek, multifunkčný volant, virtual kokpit, elektrické otváranie kufra) |
| Metadata | ✅ Rok: 2020, Km: 190 000, Palivo: Diesel, Výkon: 110 kW, Karoserie: Kombi |
| Popis prodejce | ✅ Vyplněn |
| Cenová distribuce | ✅ Graf zobrazen |
| Kompletnost dat | ✅ 100% (10/10) |
| Score | 75 |

**Předchozí stav (před fix v2):** `vehiclePhotos[0]` = `bazos.sk/obrazky/bazos.svg`  
**Po fix v2:** Filtrováno 12→7 fotek, první = reálná JPG fotka auta

---

## Lead 3: Peugeot 2008 1.2 PureTech 130 GT Line

**ID:** `cmpedbene0000s47r5e6fvaum`  
**URL:** https://carmakler.cz/admin/scout-leads/cmpedbene0000s47r5e6fvaum  

| Kritérium | Výsledek |
|-----------|----------|
| Hero foto | ✅ Reálná fotka auta (oranžový Peugeot) — bazos.sk/img/1/891/190500891.jpg |
| Fotogalerie | ✅ 6 fotek (4 zobrazeny + "+2 dalších fotek") — jen JPG, žádné SVG |
| Výbava | ✅ 14 položek (Airbagy, Alarm, Brzdový asistent, Centrálne zamykanie, LED svetlomety, Parkovacia kamera, Android Auto, Apple CarPlay, Bluetooth handsfree, Tempomat, Elektrické zrkadlá, Multifunkčný volant, Navigačný systém, Natáčacie svetlomety) |
| Metadata | ✅ Rok: 2020, Km: 92 000, Palivo: Benzín, Převodovka: Automatická, Výkon: 96 kW, Karoserie: SUV, Farba: Oranžová |
| Popis prodejce | ✅ Vyplněn |
| Cenová distribuce | ✅ Graf zobrazen |
| Kompletnost dat | ✅ 100% (10/10) |
| Score | 82 |

**Předchozí stav (před fix v2):** `vehiclePhotos[0]` = `bazos.sk/obrazky/bazos.svg`  
**Po fix v2:** Filtrováno 11→6 fotek, první = reálná JPG fotka auta

---

## Shrnutí

| Lead | Hero | Galerie | Výbava | Metadata | Status |
|------|------|---------|--------|----------|--------|
| Škoda Octavia 3 Facelift | ✅ Real JPG | ✅ 11 fotek | ✅ 9 položek | ✅ rok/km/palivo/karoserie | **PASS** |
| Volvo v60 | ✅ Real JPG | ✅ 7 fotek | ✅ 8 položek | ✅ rok/km/palivo/výkon/karoserie | **PASS** |
| Peugeot 2008 | ✅ Real JPG | ✅ 6 fotek | ✅ 14 položek | ✅ rok/km/palivo/výkon/karoserie/barva | **PASS** |

**Fix v2 scraper (`_is_valid_photo_url()`) funguje správně:**
- SVG ikony Bazoše jsou odfiltrovány (bazos.svg, map.svg, user.svg, facebook.svg)
- Zůstávají pouze reálné fotky aut (.jpg, .jpeg, .png, .webp z domény /img/)
- Výbava je správně extrahována z textu inzerátu
- Metadata (rok, km, palivo, karoserie) jsou přítomna

**Žádné regrese nalezeny.** Bazoš fix v2 je v produkci ověřen.
