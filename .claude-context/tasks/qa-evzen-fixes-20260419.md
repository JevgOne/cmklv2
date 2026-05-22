# Re-QA — Evženovy fixy na /prezentace

**Datum:** 2026-04-19  
**Kontrolor:** kontrolor agent  
**Podklad:** předchozí QA reporty (qa-audit-fixes-20260419.md, qa-recheck-prezentace-20260419.md)

---

## VÝSLEDEK: ✅ VŠECHNY 3 EVŽENOVY FIXY IMPLEMENTOVÁNY SPRÁVNĚ

---

## Detailní re-check

### E-3 — "certifikovaných" místo "ověřených"
**Status: ✅ OPRAVENO**

- Řádek 215: `Síť certifikovaných` ✅
- Bylo: `Síť ověřených automakléřů`
- Je: `Síť certifikovaných` + `<br/><span class="text-orange-500">automakléřů</span>`

---

### E-2 — QR kód v sekci 8
**Status: ✅ IMPLEMENTOVÁNO**

**Balíček:**
- `package.json`: `"qrcode": "^1.5.4"` ✅ (nainstalován)
- Import: `import QRCode from "qrcode"` (řádek 7) ✅

**Generování (řádky 187-196):**
```ts
const url = managerSlug
  ? `https://carmakler.cz/kontakt?ref=${managerSlug}`
  : "https://carmakler.cz/kontakt";
QRCode.toDataURL(url, { width: 150, margin: 1, color: { dark: "#ffffff", light: "#00000000" } })
  .then(setQrDataUrl);
```
- ✅ Generuje se vždy (s i bez `?manager=`)
- ✅ S managerem: URL obsahuje `?ref=${slug}` pro tracking
- ✅ Bílý QR na průhledném pozadí (vhodné pro tmavou sekci 8)

**Zobrazení (řádky 545-551):**
```tsx
{qrDataUrl && (
  <div className="mt-6 flex flex-col items-center">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={qrDataUrl} alt="QR kód pro kontakt" className="w-32 h-32" />
    <p className="text-xs text-gray-500 mt-2">Naskenujte pro kontakt</p>
  </div>
)}
```
- ✅ Podmíněné zobrazení (zobrazí se až po vygenerování)
- ✅ `eslint-disable` komentář správně — data URL nelze zpracovat přes `next/image`
- ✅ `alt` text přítomen

---

### E-1 — SVG mapa ČR s piny
**Status: ✅ IMPLEMENTOVÁNO**

**Data (řádky 89-104):** `czRegions` — přesně **14 krajů** ✅

| Kraj | Partneři |
|---|---|
| Praha | 12 |
| Středočeský | 8 |
| Jihočeský | 3 |
| Plzeňský | 4 |
| Karlovarský | 2 |
| Ústecký | 3 |
| Liberecký | 2 |
| Královéhradecký | 3 |
| Pardubický | 2 |
| Vysočina | 3 |
| Jihomoravský | 5 |
| Olomoucký | 3 |
| Zlínský | 2 |
| Moravskoslezský | 4 |

**Komponenta `CzechMap` (řádky 106-144):**
- ✅ SVG obrys ČR (zjednodušená cesta)
- ✅ Oranžové piny (fill `#F97316`) s počtem partnerů uvnitř
- ✅ Velikost pinu závisí na počtu partnerů (3 velikosti)
- ✅ `<title>` tooltip na každém pinu pro accessibility
- ✅ `role="img" aria-label="Mapa partnerů v České republice"` ✅

**Použití v sekci 6 (řádek 400):** `<CzechMap />` + summary statistiky (70+ partnerů, 14 krajů, 98% spokojenost) ✅

---

## Debug kontrola

### npm run build
```
✅ BUILD PASSES
✓ Compiled successfully in 18.2s
○ /prezentace
```

### npm run lint (app/prezentace/page.tsx)
```
✅ 0 problems (0 errors, 0 warnings)
```

---

## ZÁVĚR

| Fix | Status |
|---|---|
| E-3: "certifikovaných" místo "ověřených" | ✅ OPRAVENO |
| E-2: QR kód v sekci 8 | ✅ IMPLEMENTOVÁNO (qrcode@1.5.4, s/bez manager ref) |
| E-1: SVG mapa ČR se 14 kraji | ✅ IMPLEMENTOVÁNO (CzechMap komponenta) |
| Build | ✅ PASS |
| Lint | ✅ 0 errors, 0 warnings |

**`/prezentace`: ✅ FULLY APPROVED — stránka je kompletní a připravena k nasazení.**
