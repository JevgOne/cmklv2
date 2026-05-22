# Implementace P0-05: Odkazy na pravni stranky v paticce

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Nahrazeny placeholder odkazy (`/kontakt`) v bottom barech vsech 5 footeru za spravne pravni odkazy:
- `/ochrana-osobnich-udaju` -- Ochrana osobnich udaju
- `/obchodni-podminky` -- Obchodni podminky
- `/reklamacni-rad` -- Reklamacni rad (NOVY odkaz)

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `components/main/Footer.tsx` | 2 odkazy `/kontakt` -> 3 spravne odkazy (Link) |
| `components/inzerce/Footer.tsx` | 2 odkazy `urls.main("/kontakt")` -> 3 spravne odkazy (urls.main) |
| `components/shop/Footer.tsx` | 2 odkazy `urls.main("/kontakt")` -> 3 spravne odkazy (urls.main) |
| `components/marketplace/Footer.tsx` | 2 odkazy `urls.main("/kontakt")` -> 3 spravne odkazy (urls.main) |
| `components/web/Footer.tsx` | 2 odkazy `/kontakt` -> 3 spravne odkazy (Link) -- BONUS: nebyl v planu, ale mel stejny problem |

## Poznamky

- `components/web/Footer.tsx` nebyl v originalnim planu, ale mel identicky problem (pravni odkazy na `/kontakt`). Opraven konzistentne.
- Pravni stranky (`/ochrana-osobnich-udaju`, `/obchodni-podminky`, `/reklamacni-rad`) musi existovat -- zavisi na P0-01, P0-02, P0-03.
- Inzerce/Shop/Marketplace footery pouzivaji `urls.main(...)` aby odkazy vedly na hlavni domenu.

## Overeni

- [x] MainFooter ma 3 spravne odkazy
- [x] InzerceFooter ma 3 spravne odkazy (urls.main)
- [x] ShopFooter ma 3 spravne odkazy (urls.main)
- [x] MarketplaceFooter ma 3 spravne odkazy (urls.main)
- [x] WebFooter ma 3 spravne odkazy (bonus fix)
- [x] Zadny footer nema pravni odkaz na `/kontakt`
