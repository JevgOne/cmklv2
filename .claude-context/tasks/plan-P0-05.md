# Plan P0-05: Odkazy na pravni stranky v paticce

**Priorita:** P0 (bloker pro launch)
**Slozitost:** S
**Zavislosti:** P0-01 (Obchodni podminky), P0-02 (GDPR), P0-03 (Reklamacni rad)
**Batch:** 2

---

## STAV: HOTOVO (implementovano)

Implementator tento task jiz dokoncil v ramci prace na P0-05/06/07. Vsechny 4 footery obsahuji spravne odkazy:

- **MainFooter** (`components/main/Footer.tsx:99-107`) — `<Link href="/ochrana-osobnich-udaju">`, `<Link href="/obchodni-podminky">`, `<Link href="/reklamacni-rad">`
- **InzerceFooter** (`components/inzerce/Footer.tsx:95-103`) — `urls.main("/ochrana-osobnich-udaju")`, `urls.main("/obchodni-podminky")`, `urls.main("/reklamacni-rad")`
- **ShopFooter** (`components/shop/Footer.tsx:95-103`) — shodne s InzerceFooter
- **MarketplaceFooter** (`components/marketplace/Footer.tsx:90-98`) — shodne s InzerceFooter

**Overeni:**
- [x] MainFooter ma 3 spravne odkazy (radky 99-107)
- [x] InzerceFooter ma 3 spravne odkazy pres urls.main() (radky 95-103)
- [x] ShopFooter ma 3 spravne odkazy pres urls.main() (radky 95-103)
- [x] MarketplaceFooter ma 3 spravne odkazy pres urls.main() (radky 90-98)
- [x] Zadny link nevede na /kontakt jako placeholder

**Poznamka:** Odkazy vedou na stranky ktere jeste neexistuji (P0-01/02/03). Po vytvoreni pravnich stranek budou funkce automaticky.

Zadna dalsi akce neni potreba.
