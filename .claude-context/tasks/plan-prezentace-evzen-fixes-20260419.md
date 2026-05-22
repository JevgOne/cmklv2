# Fix plán: 3 Evženovy nálezy na /prezentace

**Vytvořeno:** 2026-04-19
**Zdroj:** Evžen — kontrola shody se zadáním (task #10)
**Soubor:** `app/prezentace/page.tsx`

---

## E-1 (❌ střední): Sekce 6 — chybí mapa partnerů s piny

### Problém
Sekce 6 "Naši partneři" (řádky 320-351) obsahuje jen grid se statistickými čísly. Spec TASK-031 (řádek 4157) vyžaduje: "mapa partnerů s piny + čísla (X partnerů v Y krajích)".

### Aktuální kód (řádky 320-351)
Jen `<AnimatedSection>` s 6 stat kartami v gridu. Žádná mapa.

### Analýza problému
1. **Není k dispozici veřejné API pro partnery** — `GET /api/partners` vyžaduje admin auth. Prezentace je veřejná "use client" stránka.
2. **Není žádná existující mapa ČR** v projektu (žádný SVG, žádný Leaflet/Mapbox).
3. Partner model má `latitude`, `longitude`, `region`, `city` — ale data jsou dostupná jen přes admin API.

### Řešení

**Inline SVG mapa 14 krajů ČR** se statickými piny — nejlepší poměr effort/impact pro prezentaci na tabletu.

**Proč statická a ne dynamická:**
- Prezentace je sales materiál, ne realtime dashboard
- Počty partnerů se mění pomalu (týdny/měsíce)
- Veřejné API pro partnery neexistuje a vytvářet ho jen pro prezentaci je overhead
- SVG mapa s hardcoded čísly vypadá profesionálně a je 100% offline-capable (tablet na schůzce)

#### Krok 1: Vytvořit komponentu `CzechMapSVG`

Vytvořit novou komponentu (přímo v `app/prezentace/page.tsx` jako lokální funkci, nebo jako `components/web/CzechMapSVG.tsx` pokud chceme reuse):

```tsx
function CzechMap() {
  // Zjednodušená SVG mapa ČR s 14 kraji jako <path> elementy
  // Každý kraj má oranžový pin/tečku pokud tam je partner
  // Hover na kraj zobrazí název + počet partnerů (tooltip)
  
  const regions = [
    { name: "Praha", partners: 12, cx: 280, cy: 160 },
    { name: "Středočeský", partners: 8, cx: 260, cy: 180 },
    { name: "Jihočeský", partners: 3, cx: 220, cy: 280 },
    { name: "Plzeňský", partners: 4, cx: 140, cy: 200 },
    { name: "Karlovarský", partners: 2, cx: 80, cy: 140 },
    { name: "Ústecký", partners: 3, cx: 180, cy: 100 },
    { name: "Liberecký", partners: 2, cx: 300, cy: 80 },
    { name: "Královéhradecký", partners: 3, cx: 370, cy: 110 },
    { name: "Pardubický", partners: 2, cx: 370, cy: 160 },
    { name: "Vysočina", partners: 3, cx: 320, cy: 230 },
    { name: "Jihomoravský", partners: 5, cx: 400, cy: 280 },
    { name: "Olomoucký", partners: 3, cx: 420, cy: 180 },
    { name: "Zlínský", partners: 2, cx: 460, cy: 230 },
    { name: "Moravskoslezský", partners: 4, cx: 480, cy: 140 },
  ];
  
  return (
    <div className="relative max-w-2xl mx-auto mb-10">
      <svg viewBox="0 0 550 360" className="w-full">
        {/* Obrys ČR - zjednodušený path */}
        <path d="M60,120 L80,80 L140,60 ..." fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
        
        {/* Piny partnerů */}
        {regions.map((r) => (
          <g key={r.name}>
            <circle cx={r.cx} cy={r.cy} r={r.partners > 5 ? 12 : 8} fill="#F97316" opacity={0.8} />
            <text x={r.cx} y={r.cy + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
              {r.partners}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
```

**DŮLEŽITÉ:** Implementátor musí najít/vytvořit skutečný SVG path pro obrys ČR. Zdroje:
- https://simplemaps.com/resources/svg-cz (free SVG, MIT licence)
- Nebo vytvořit zjednodušený obrys ručně (~20 bodů stačí pro prezentaci)
- Nebo použít existující open-source SVG mapa krajů ČR

#### Krok 2: Integrovat do sekce 6

Nahradit aktuální obsah sekce 6 (řádky 320-351):

```tsx
{/* 6. Naši partneři */}
<AnimatedSection id="partners" className="bg-gray-50">
  <div className="text-center">
    <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
      Naši partneři
    </h2>
    <p className="text-lg text-gray-500 mb-8">
      Partneři po celé České republice
    </p>
    
    {/* Mapa ČR s piny */}
    <CzechMap />
    
    {/* Statistiky pod mapou — zmenšit na 1 řádek */}
    <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
      {[
        { value: "70+", label: "Partnerů celkem" },
        { value: "14", label: "Krajů" },
        { value: "98 %", label: "Spokojenost" },
      ].map((stat) => (
        <div key={stat.label}>
          <div className="text-3xl sm:text-4xl font-extrabold text-orange-500">
            {stat.value}
          </div>
          <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  </div>
</AnimatedSection>
```

### Úpravy
- **Soubor:** `app/prezentace/page.tsx`
- **Nová funkce:** `CzechMap` (~60-80 řádků)
- **Řádky 320-351:** nahradit integrací mapy + zmenšenými statistikami

### STOP pravidla
- **STOP-1:** Pokud implementátor nemůže najít vhodný SVG path pro ČR obrys → použít **zjednodušenou alternativu**: grid 14 regionálních karet s pinem (bez grafické mapy). Stále lepší než jen čísla.
- **STOP-2:** Pokud SVG mapa je příliš velká (>50KB inline) → přesunout do `public/maps/czech-regions.svg` a načítat jako Image.

### Acceptance Criteria
- [ ] Sekce 6 obsahuje vizuální mapu ČR (SVG) s piny na pozicích krajů
- [ ] Každý pin ukazuje počet partnerů v daném kraji
- [ ] Statistiky (celkem partnerů, krajů, spokojenost) jsou pod mapou
- [ ] Mapa je responzivní (škáluje se na tabletu i desktopu)
- [ ] Žádné externí API volání (vše statické/inline)

---

## E-2 (❌ střední): Sekce 8 — chybí QR kód

### Problém
Sekce 8 "Kontakt" (řádky 404-484) má CTA tlačítko "Registrovat se jako partner →" (přidáno v předchozím fixu), ale spec TASK-031 (řádek 4159) explicitně vyžaduje: "QR kód (odkaz na registraci/kontakt)".

### Aktuální stav
- CTA odkaz na `/kontakt` existuje (řádky 472-477) ✅
- QR kód chybí ❌
- Knihovna `qrcode` je v `package.json` a funguje (používá se v `BankTransferDetails.tsx`)

### Řešení

Použít existující `qrcode` balíček (stejný pattern jako `BankTransferDetails.tsx`):

#### Přidat QR generování do `PrezentaceContent`:

```tsx
// Přidat state pro QR (u ostatních useState, ~řádek 92):
const [qrDataUrl, setQrDataUrl] = useState<string>("");

// Přidat import na řádek 1-8:
import QRCode from "qrcode";

// Přidat useEffect pro QR generování (~řádek 127):
useEffect(() => {
  const url = managerSlug
    ? `https://carmakler.cz/kontakt?ref=${managerSlug}`
    : "https://carmakler.cz/kontakt";
  QRCode.toDataURL(url, {
    width: 150,
    margin: 1,
    color: { dark: "#ffffff", light: "#00000000" },  // bílý QR na průhledném pozadí (tmavá sekce)
  }).then(setQrDataUrl);
}, [managerSlug]);
```

#### Přidat QR do sekce 8 (za CTA tlačítko, před copyright):

```tsx
{qrDataUrl && (
  <div className="mt-6 flex flex-col items-center">
    <img src={qrDataUrl} alt="QR kód pro kontakt" className="w-32 h-32" />
    <p className="text-xs text-gray-500 mt-2">Naskenujte pro kontakt</p>
  </div>
)}
```

**Poznámka:** QR `<img>` je zde OK (data URL, ne network resource) — `next/image` `<Image>` nepodporuje data URLs bez extra konfigurace. ESLint `@next/next/no-img-element` lze potlačit `{/* eslint-disable-next-line @next/next/no-img-element */}` s komentářem proč.

### Úpravy
- **Soubor:** `app/prezentace/page.tsx`
- **Import:** přidat `import QRCode from "qrcode";`
- **State:** přidat `qrDataUrl` useState
- **useEffect:** přidat QR generování
- **Řádek ~477:** přidat QR zobrazení za CTA tlačítko

### STOP pravidla
- **STOP-3:** Pokud `qrcode` import způsobí build error v "use client" komponentě (SSR issue) → obalit `QRCode.toDataURL` do `typeof window !== "undefined"` checku, nebo dynamický import: `const QRCode = await import("qrcode")`.
- **STOP-4:** Pokud QR na tmavém pozadí je nečitelný → změnit barvy na `dark: "#F97316", light: "#1f293700"` (oranžový QR).

### Acceptance Criteria
- [ ] QR kód se zobrazuje v sekci 8 pod CTA tlačítkem
- [ ] QR kód odkazuje na `https://carmakler.cz/kontakt` (nebo s `?ref=slug` pokud je manager)
- [ ] QR kód je skenovatelný (ověřit mobilem)
- [ ] QR je viditelný na tmavém pozadí (bílý nebo oranžový)
- [ ] `npm run build` projde bez chyb

---

## E-3 (⚠️ nízká): Sekce 1 — "ověřených" místo "certifikovaných"

### Problém
Řádek 145: `Síť ověřených` — spec TASK-031 (řádek 4152) říká: "Jsme síť **certifikovaných** automakléřů".

### Aktuální kód (řádky 144-147)
```tsx
<h1 className="text-4xl sm:text-6xl font-extrabold mb-6">
  Síť ověřených
  <br />
  <span className="text-orange-500">automakléřů</span>
</h1>
```

### Řešení
Změnit `ověřených` na `certifikovaných`:

```tsx
<h1 className="text-4xl sm:text-6xl font-extrabold mb-6">
  Síť certifikovaných
  <br />
  <span className="text-orange-500">automakléřů</span>
</h1>
```

### Úpravy
- **Soubor:** `app/prezentace/page.tsx`
- **Řádek 145:** `Síť ověřených` → `Síť certifikovaných`

### STOP pravidla
- Žádný — jednoznačný text fix.

### Acceptance Criteria
- [ ] H1 v sekci 1 říká "Síť certifikovaných automakléřů"

---

## Pořadí implementace

1. **E-3** (text fix) — 10 sekund, zero risk
2. **E-2** (QR kód) — 5 min, existující pattern z BankTransferDetails.tsx
3. **E-1** (mapa ČR) — 15-20 min, potřeba SVG path + komponenta

Všechny 3 fixy v jednom souboru (`app/prezentace/page.tsx`), jeden commit.
