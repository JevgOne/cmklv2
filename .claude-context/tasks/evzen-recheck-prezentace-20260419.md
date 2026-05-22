# Evžen THE KING — Re-check: /prezentace po fixech E-1, E-2, E-3

**Datum:** 2026-04-19  
**Kontrolor:** Evžen THE KING  
**Podklad:** evzen-audit-fixes-20260419.md (původní verdikt)

---

## VÝSLEDEK: ✅ SCHVÁLENO — všechny 3 nálezy opraveny

---

## Detailní re-check

### [E-1] Sekce 6 "Naši partneři" — mapa
**Status: ✅ OPRAVENO**

- Řádky 89-104: `czRegions` — data pro 14 krajů ČR s počty partnerů a souřadnicemi
- Řádky 106-144: `CzechMap` komponenta — SVG mapa ČR s:
  - Zjednodušený obrys ČR (`<path>`, řádek 112)
  - 14 oranžových pinů (`<circle>` s `fill="#F97316"`) s počtem partnerů uvnitř
  - Velikost pinu proporční k počtu partnerů (`r` = 14/11/9 podle počtu)
  - Tooltip s názvem kraje a počtem (`<title>`)
  - ARIA label "Mapa partnerů v České republice"
- Řádek 400: `<CzechMap />` renderována v sekci 6
- Řádky 402-415: Statistiky pod mapou (70+ Partnerů, 14 Krajů, 98% Spokojenost)

**Shoda se spec:** Spec říká "mapa partnerů s piny + čísla". Implementace má SVG mapu ČR s 14 piny (oranžové kruhy s čísly) + souhrnné statistiky. ✅

---

### [E-2] Sekce 8 "Kontakt" — QR kód
**Status: ✅ OPRAVENO**

- Řádek 7: `import QRCode from "qrcode"` — knihovna importována
- Řádek 156: `const [qrDataUrl, setQrDataUrl] = useState<string>("")` — stav pro data URL
- Řádky 187-196: QR generování:
  - S managerem: `https://carmakler.cz/kontakt?ref=${managerSlug}`
  - Bez managera: `https://carmakler.cz/kontakt`
  - Bílý QR na průhledném pozadí (pro tmavé bg sekce 8)
- Řádky 545-551: QR vykreslení:
  - `<img src={qrDataUrl} alt="QR kód pro kontakt" className="w-32 h-32" />`
  - Popisek: "Naskenujte pro kontakt"
  - `eslint-disable` pro `no-img-element` — oprávněné, `next/image` nepodporuje data URL

**Shoda se spec:** Spec říká "QR kód (odkaz na registraci/kontakt)". Implementace generuje QR kód s odkazem na `/kontakt` (dynamicky s ref manažera pokud je v URL). ✅

---

### [E-3] Sekce 1 "Kdo jsme" — formulace
**Status: ✅ OPRAVENO**

- Řádek 215: `Síť certifikovaných`

**Shoda se spec:** Spec říká "Jsme síť certifikovaných automakléřů". Implementace: "Síť certifikovaných automakléřů". ✅

---

## Celkový stav /prezentace vs. TASK-031 spec

| Požadavek | Shoda |
|---|---|
| Fullscreen BEZ navbar/footer | ✅ |
| 8 sekcí, každá 100vh | ✅ |
| Scroll snap | ✅ |
| Framer Motion animace | ✅ |
| Sekce 1 — logo + "certifikovaných" + čísla | ✅ |
| Sekce 2 — 3 kroky (nabírání→inzerce→prodej) | ✅ |
| Sekce 3 — Pro autobazary benefity | ✅ |
| Sekce 4 — Pro vrakoviště benefity | ✅ |
| Sekce 5 — Provizní model transparentně | ✅ |
| Sekce 6 — Mapa s piny + čísla | ✅ |
| Sekce 7 — 3 kroky (smlouva→profil→online) | ✅ |
| Sekce 8 — Manager fetch + tel + email + QR kód | ✅ |
| Tečkový indikátor | ✅ |
| ?manager=slug dynamický kontakt | ✅ |
| robots noindex, nofollow | ✅ |
| Design (orange + bílá + gray-900) | ✅ |

---

## VERDIKT

| Položka | Verdikt |
|---|---|
| /sluzby/vykup | ✅ SCHVÁLENO (z předchozího re-checku) |
| /prezentace | ✅ **SCHVÁLENO** — 100% shoda s TASK-031 sekce 6 |

Obě položky jsou nyní v plné shodě s původním zadáním.

---

*Evžen THE KING, 2026-04-19*
