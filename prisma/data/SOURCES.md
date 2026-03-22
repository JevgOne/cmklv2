# Partners Seed Data — Zdroje a přehled

## Celkové počty

| Typ | Počet |
|-----|-------|
| **Autobazary** | 214 |
| **Vrakoviště** | 75 |
| **Celkem** | **289** |

## Rozložení po krajích

| Kraj | Autobazary | Vrakoviště | Celkem |
|------|-----------|------------|--------|
| Praha | 25 | 7 | 32 |
| Středočeský | 22 | 9 | 31 |
| Jihočeský | 18 | 4 | 22 |
| Plzeňský | 17 | 4 | 21 |
| Karlovarský | 10 | 3 | 13 |
| Ústecký | 14 | 5 | 19 |
| Liberecký | 14 | 5 | 19 |
| Královéhradecký | 14 | 5 | 19 |
| Pardubický | 9 | 4 | 13 |
| Vysočina | 14 | 3 | 17 |
| Jihomoravský | 20 | 10 | 30 |
| Olomoucký | 12 | 3 | 15 |
| Zlínský | 10 | 3 | 13 |
| Moravskoslezský | 15 | 10 | 25 |
| **Celkem** | **214** | **75** | **289** |

## Použité zdroje

### Primární adresáře
- **firmy.cz** — hlavní český firemní katalog, nejvíce záznamů
- **ojeteauto.cz** — specializovaný portál na ojeté automobily
- **portalridice.cz** — databáze autobazarů a servisů
- **sauto.cz** — inzertní portál Seznamu pro auta
- **tipcars.com** — inzertní portál pro ojetá auta

### Obchodní rejstříky
- **kurzy.cz** — ověřování IČO a obchodní rejstřík
- **edb.cz** — ekonomická databáze firem
- **ARES (ares.gov.cz)** — Administrativní registr ekonomických subjektů

### Regionální zdroje
- **zlatestranky.cz** — Zlaté stránky
- **idatabaze.cz** — firemní databáze
- **info-plzen.cz**, **info-chomutov.cz**, **info-trebic.cz**, **info-morava.cz** — regionální informační portály
- **vysocinainfo.cz** — portál kraje Vysočina

### Webové stránky firem
- Individuální weby autobazarů a vrakovišť (cca 250+ stránek navštíveno)

## Kvalita dat

| Údaj | Vyplněno | Procento |
|------|----------|----------|
| Název | 289/289 | 100% |
| Město | 289/289 | 100% |
| Kraj | 289/289 | 100% |
| Adresa | ~280/289 | ~97% |
| IČO | ~210/289 | ~73% |
| Telefon | ~260/289 | ~90% |
| Email | ~200/289 | ~69% |
| Web | ~250/289 | ~86% |
| Velikost (odhad) | ~214/289 | ~74% |
| GPS souřadnice | ~75/289 | ~26% |
| Google hodnocení | 0/289 | 0% |

## Známé mezery a omezení

### Co se nepodařilo získat
- **GPS souřadnice** — většina záznamů nemá lat/lng, pouze západ+jih ČR měl přibližné souřadnice. Doporučení: doplnit přes geocoding API (Google Maps / Mapy.cz)
- **Google hodnocení** — nebylo možné získat z webového vyhledávání, vyžaduje Google Places API
- **Přesná velikost** — odhad na základě webové prezentace, ne přesný počet vozů

### Méně pokryté oblasti
- **Karlovarský kraj** — menší počet firem celkově (13), odpovídá reálně nižší hustotě
- **Pardubický kraj** — 13 záznamů, menší region
- **Zlínský kraj** — 13 záznamů

### Doporučení pro doplnění
1. **Geocoding** — prohnat adresy přes geocoding API pro doplnění GPS
2. **Google Places API** — doplnit hodnocení a počet recenzí
3. **ARES API** — ověřit a doplnit chybějící IČO
4. **Aktuálnost** — některé menší firmy mohou být zaniklé, doporučuje se periodická verifikace

## Datum sběru dat
- **22. března 2026**
- Metoda: automatizovaný web scraping z veřejných zdrojů
