# Test Report: LEAD-ENRICH-7 — VW Passat reference na produkci

**Datum:** 2026-05-20  
**Tester:** TEST-CHROME  
**Task:** #8  
**Lead:** VW Passat B8 Variant 2.0 TDI 110kW DSG — ID `cmpe4v31q0000n57reymt7rsp`  
**URL:** https://carmakler.cz/admin/scout-leads/cmpe4v31q0000n57reymt7rsp  
**Login:** radim@wikiporadce.cz ✅

---

## Výsledek vizuálního testu

### Sekce — přehled

| Sekce | Zobrazuje se | Hodnocení |
|-------|-------------|-----------|
| Hero banner | ✅ | ❌ Hero foto = logo Bazoše |
| Fotogalerie (Fotky 30) | ✅ | ❌ Obsahuje SVG ikony a thumbnaily |
| Popis prodejce | ✅ | ✅ Bohatý text, správně truncated |
| Výbava | ✅ | ⚠️ Jen "DSG" z titulku, ne plná výbava |
| Cenová distribuce | ✅ | ✅ Graf funguje, 34 vozů, AS24+Sauto |
| Cenový verdikt | ✅ | ✅ "V normálu / Odpovídá trhu" |
| Podobné nabídky | ✅ | ⚠️ Rok a Km chybí u Sauto nabídek |
| Kontakt a lokace | ✅ | ✅ Telefon, město |
| Spec chips | ⚠️ | Jen Převodovka + Výkon (chybí Rok, Km, Palivo, Karoserie) |

---

## BUGY — seřazeno dle závažnosti

### 🔴 KRITICKÉ

#### BUG #1 — Hero foto = Bazoš logo (VIDITELNÁ REGRESE)
**Screenshot:** Hrdina celé stránky zobrazuje velký text "Bazoš" místo fotky auta.  
**Příčina:** První URL v `vehiclePhotos` je `https://www.bazos.cz/obrazky/bazos.svg`  
**Fix:** Filtrovat SVG URL z pole fotek; přeskočit non-JPG/PNG URLs jako hero

#### BUG #2 — Fotogalerie obsahuje garbage (VIDITELNÁ REGRESE)  
**Screenshot:** Fotky (30) — z toho jsou SVG ikony Bazoše:
- `bazos.svg`, `next.svg`, `map.svg`, `user.svg`, `favourite.svg`
- `spam.svg`, `miscat.svg`, `print.svg`, `facebook.svg`

Scraper zachytí VŠECHNY `<img>` na stránce, ne jen fotky auta.  
**Fix:** Filtrovat pouze URL obsahující `/img/` a mající příponu JPG/JPEG/WEBP/PNG

### 🟡 IMPORTANT

#### BUG #3 — Výbava neúplná
**Zobrazuje se:** jen "DSG" (extrahováno z titulku přes `LeadEquipmentTags`)  
**Chybí:** plná výbava z popisu — "ACC adaptivní tempomat, App-Connect, Asistent dopravního značení, LED matrix světlomety..."  
**Příčina:** `vehicleEquipment = NULL` — scraper nevytáhl výbavu z textu popisu  
**Fix:** Parsovat text za "VÝBAVA:" v `vehicleDescription` → uložit do `vehicleEquipment`

### 🟠 MISSING DATA

#### BUG #4 — vehicleYear = NULL
**V popisu:** "Vyrobeno 3/2023" → rok 2023 tam je  
**Fix:** Regex na "Vyrobeno MM/YYYY" nebo "rok YYYY"

#### BUG #5 — vehicleMileage = NULL
**V popisu:** "Má najeto 157 618 km"  
**Kompletnost dat:** zobrazuje "✗ Nájezd"  
**Fix:** Regex na "najeto X km" nebo "X xxx km" v textu

#### BUG #6 — vehicleFuel = NULL
**Z titulku:** "TDI" = diesel  
**Fix:** Detekce TDI/TSI/HDI/elektro v titulku/popisu

#### BUG #7 — vehicleBodyType = NULL
**Z titulku:** "Variant" = Combi (Passat Variant = kombi)  
**Fix:** Mapování Variant→COMBI, Liftback→HATCHBACK atd.

---

## Co funguje správně

- ✅ Layout čistý, admin panel funkční
- ✅ Cenová analýza excelentní (34 vozů, AS24 + Sauto, verdikt OK)
- ✅ Cenový graf s orange bar (aktuální cena) funguje
- ✅ Popis prodejce kompletní, truncated s "Zobrazit celý popis"
- ✅ Kontakt (telefon, město) přítomen
- ✅ Zdroj: Bazoš, datum, source ID
- ✅ Kompletnost dat 80% (8/10) — správně označuje ✗Rok a ✗Nájezd
- ✅ Score 77, správné badge "Nový"
- ✅ Podobné nabídky tabulka (5 vozů)

---

## Porovnání s "VW Passat referencí"

Zadání říká: "musí vypadat STEJNĚ jako VW Passat reference".

Pokud reference = lead s čistými daty (fotka auta, výbava, rok, km), pak:
- **Hero foto** ❌ — zobrazuje logo, ne auto
- **Fotogalerie** ❌ — obsahuje ikonky místo fotek aut
- **Výbava** ⚠️ — chybí detailní seznam
- **Spec chips** ⚠️ — chybí rok, km, palivo

**Závěr:** Lead NEVYPADÁ jako referenční VW Passat s čistými daty. Bazoš enrichment má scraping bugy.

---

## Doporučení pro implementátora

1. **Priorita 1:** Filtr fotek — vyhodit SVG, zachovat jen real-photo URL
2. **Priorita 2:** Parser výbavy — text za "VÝBAVA:" v popisu
3. **Priorita 3:** Parser strukturovaných dat — rok, km, palivo z textu
