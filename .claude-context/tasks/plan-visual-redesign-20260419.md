# Plán: Smazat vykup + redesign service pages + redesign prezentace

**Vytvořeno:** 2026-04-19
**Task:** #14
**Priorita:** Redesign prezentace je KRITICKÝ (uživatel nespokojený s vizuálem)

---

## ČÁST 1: Smazat /sluzby/vykup

*(Beze změny oproti plan-service-pages-redesign-20260419.md)*

### Co smazat

| # | Soubor |
|---|--------|
| 1 | `app/(web)/sluzby/vykup/page.tsx` |
| 2 | `components/web/VykupForm.tsx` |
| 3 | `e2e/chrome-test-final-vykup-prezentace.spec.ts` — smazat vykup testy, zachovat prezentace testy (přesunout do vlastního souboru nebo smazat celý pokud jsou jen vykup testy) |

### Co NESMAZAT
- `lib/broker-specializations.ts` — "Výkup vozů" jako makléřská specializace je OK
- `prisma/seed.ts` — seed tag "vykup-do-24h" je OK
- Navbar/Footer — nemají žádné odkazy na vykup ✅

### Acceptance Criteria
- [ ] `/sluzby/vykup` vrací 404
- [ ] Žádné broken importy
- [ ] `npm run build` projde

---

## ČÁST 2: Redesign service pages

*(Beze změny oproti plan-service-pages-redesign-20260419.md — viz ten soubor pro detaily 2A-2G)*

Shrnutí: Hero gradient + blur dekorace, step čísla orange-100, benefit ikony v kruhu, CTA sekce gradient pozadí, formuláře shadow-lg + ikony + drobná vylepšení.

---

## ČÁST 3: Redesign /prezentace — KRITICKÁ

### Diagnóza aktuálních problémů

Prezentace je sales pitch deck pro tablet schůzky s partnery. Musí být WOW, ne "holá stránka". Aktuální problémy:

| Sekce | Problém |
|-------|---------|
| **1. Kdo jsme** | OK — dark bg, velké čísla. Ale logo malé, subtitle nevýrazný |
| **2. Jak to funguje** | **HLAVNÍ PROBLÉM** — bílé pozadí, malé emoji v orange-50 kolečkách, hodně prázdného prostoru. Vypadá jako wireframe |
| **3. Pro autobazary** | OK — orange bg je výrazný. Ale checkmarky (✓) jsou malé a nevýrazné |
| **4. Pro vrakoviště** | Stejný pattern jako sekce 3, dark bg. Repetitivní |
| **5. Provizní model** | **PROBLÉM** — bílé pozadí, dvě karty vedle sebe, malé emoji. Nudné |
| **6. Partneři** | **PROBLÉM** — gray-50 bg, mapa je OK ale statistiky pod ní jsou malé a ploché |
| **7. Další kroky** | **PROBLÉM** — bílé pozadí (3. bílá sekce ze 4), malé boxy, šipky → nevýrazné |
| **8. Kontakt** | OK — dark bg, ale hodně elementů (manager box + kontakt box + CTA + QR + copyright) |

**Celkový pattern:** Sekce střídají dark/white, ale "white" sekce (2, 5, 7) jsou vizuálně prázdné a nudné. Emoji ikony jsou příliš malé. Chybí wow efekt.

### Designový koncept

**Inspirace:** Stripe pitch deck, Apple keynote, Pitch.com

**Pravidla:**
1. **Žádná bílá sekce** — každá sekce má výrazné pozadí (gradient, dark, colored)
2. **Velké vizuály** — emoji nahradit velkými ikonami v gradient kontejnerech nebo je výrazně zvětšit
3. **Gradient-heavy** — orange-to-amber, gray-900-to-gray-800, orange-500-to-rose-500
4. **Staggered animace** — prvky se objevují postupně (delay 0.1s per item)
5. **Kontrast** — velká čísla (text-7xl), tlusté nadpisy, tenké popisy
6. **Dekorativní prvky** — blur kruhy, gradient lines, glow efekty

### Konkrétní změny po sekcích

#### S1: Kdo jsme (VYLEPŠIT)
**Aktuální:** `bg-gray-900`, logo, h1, subtitle, 4 stat čísla.
**Nové:**
- Přidat gradient overlay: `bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800`
- Přidat dekorativní glow za logo: `<div className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />`
- Logo zvětšit: `h-20` → `h-24 sm:h-28`
- Stat čísla: `text-4xl sm:text-5xl` → `text-5xl sm:text-7xl` (dramaticky velké)
- Přidat stagger animaci na stat čísla:
  ```tsx
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ delay: 0.2 * i, duration: 0.5 }}
  >
  ```

#### S2: Jak to funguje (KOMPLETNÍ REDESIGN)
**Aktuální:** `bg-white`, 3 malé karty s emoji. NUDNÉ.
**Nové:** `bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900` (dark)

```tsx
<AnimatedSection id="how" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
  <div className="text-center">
    <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-16">
      Jak to funguje
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
      {steps.map((step, i) => (
        <motion.div
          key={step.title}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 * i, duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* Velký gradient kruh s číslem */}
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-5xl mb-6 shadow-lg shadow-orange-500/20">
            {step.icon}
          </div>
          {/* Číslo kroky */}
          <div className="text-orange-500 text-sm font-bold tracking-widest uppercase mb-2">
            Krok {i + 1}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
          <p className="text-gray-400 text-sm">{step.desc}</p>
        </motion.div>
      ))}
    </div>
    {/* Spojovací linka mezi kroky */}
    <div className="hidden sm:block absolute top-1/2 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
  </div>
</AnimatedSection>
```

**Klíčové změny:**
- Bílé pozadí → dark gradient
- Malé orange-50 kolečka → velké `w-24 h-24` gradient boxy s orange shadow glow
- Přidat "Krok 1/2/3" label
- Stagger animace
- Text barvy přizpůsobit dark pozadí

#### S3: Pro autobazary (VYLEPŠIT)
**Aktuální:** `bg-orange-500`, checkmark items. OK ale flat.
**Nové:**
- Gradient: `bg-gradient-to-br from-orange-500 to-orange-600`
- Checkmark: `✓` text → zelený kruhový check `bg-white/20 rounded-full w-8 h-8 flex items-center justify-center`
- Přidat velkou ikonu/číslo nad nadpis: `text-8xl mb-4` → `🚗`
- Stagger animace na items
- Přidat glow dekoraci: `absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl`

#### S4: Pro vrakoviště (VYLEPŠIT)
**Aktuální:** `bg-gray-900`. Repetitivní se sekcí 3.
**Nové:**
- Gradient: `bg-gradient-to-br from-gray-900 to-gray-800`
- Stejné vylepšení checkmarků jako S3
- Velká ikona `🔧` nad nadpis
- Dekorativní glow: `bg-orange-500/5 blur-3xl`

#### S5: Provizní model (KOMPLETNÍ REDESIGN)
**Aktuální:** `bg-white`, dvě karty. Nudné.
**Nové:** Split-screen design — levá polovina orange, pravá dark:

```tsx
<AnimatedSection id="commission" className="bg-gradient-to-br from-orange-50 via-white to-gray-100">
  <div className="text-center">
    <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
      Transparentní provize
    </h2>
    <p className="text-gray-500 mb-12 text-lg">Žádné skryté poplatky. Vydělávejte s námi.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Autobazary karta — orange gradient */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-10 text-white text-left shadow-xl shadow-orange-500/20"
      >
        <div className="text-5xl mb-6">🚗</div>
        <h3 className="text-2xl font-bold mb-2">Autobazary</h3>
        <div className="text-6xl font-extrabold my-6">0 Kč</div>
        <p className="text-orange-100 text-lg font-medium">vstupní náklady</p>
        <div className="h-px bg-white/20 my-6" />
        <ul className="space-y-3 text-orange-50">
          <li className="flex items-start gap-2">
            <span className="mt-1">✓</span>
            <span>Provizi platí kupující</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1">✓</span>
            <span>Bonus za financování</span>
          </li>
        </ul>
      </motion.div>
      {/* Vrakoviště karta — dark */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 text-white text-left shadow-xl"
      >
        <div className="text-5xl mb-6">🔧</div>
        <h3 className="text-2xl font-bold mb-2">Vrakoviště</h3>
        <div className="text-6xl font-extrabold text-orange-500 my-6">85 %</div>
        <p className="text-gray-400 text-lg font-medium">z každého prodeje pro vás</p>
        <div className="h-px bg-white/10 my-6" />
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="mt-1">✓</span>
            <span>Provize CarMakléř: 15 %</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1">✓</span>
            <span>Měsíční vyúčtování</span>
          </li>
        </ul>
      </motion.div>
    </div>
  </div>
</AnimatedSection>
```

**Klíčové změny:**
- Bílé pozadí → jemný gradient `from-orange-50 via-white to-gray-100`
- Karty: flat → gradient + shadow-xl + glow
- Malé emoji → `text-5xl`
- Hlavní číslo: `text-3xl` → `text-6xl` (dramaticky velké "0 Kč" / "85 %")
- Border → gradient pozadí na kartě
- Rounded-2xl → rounded-3xl
- Přidat divider čáru a checkmark list

#### S6: Naši partneři (VYLEPŠIT)
**Aktuální:** `bg-gray-50`, mapa + statistiky. Flat.
**Nové:**
- Pozadí: `bg-gradient-to-b from-gray-900 to-gray-800` (dark — mapa lépe vynikne)
- Mapa SVG: fill `#374151` (gray-700) místo `#e5e7eb`, stroke `#4b5563`
- Stat čísla: větší `text-4xl sm:text-5xl`
- Text barvy: white/gray-400
- Glow za mapou: `bg-orange-500/5 blur-[80px]`

#### S7: Další kroky (KOMPLETNÍ REDESIGN)
**Aktuální:** `bg-white`, malé boxy se šipkami. Nudné.
**Nové:** `bg-gradient-to-br from-orange-500 to-amber-500` (barevný background)

```tsx
<AnimatedSection id="steps" className="bg-gradient-to-br from-orange-500 to-amber-500">
  <div className="text-center text-white">
    <h2 className="text-3xl sm:text-5xl font-extrabold mb-16">
      3 kroky k partnerství
    </h2>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 max-w-4xl mx-auto">
      {steps.map((step, i) => (
        <motion.div
          key={step.num}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2 * i, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl font-extrabold mb-4">
            {step.num}
          </div>
          <span className="text-xl font-bold mb-2">{step.label}</span>
          <span className="text-sm text-orange-100 text-center max-w-[200px]">{step.desc}</span>
        </motion.div>
      ))}
    </div>
  </div>
</AnimatedSection>
```

**Klíčové změny:**
- Bílé pozadí → orange gradient (WOW)
- Malé gray-50 boxy → velké `w-20 h-20` glassmorphism (`bg-white/20 backdrop-blur-sm`) kontejnery
- Šipky `→` → odstraněny (vertikální flow na mobilu, horizontální na desktopu — implicitní)
- Čísla v bílé: `bg-orange-500 text-white` → `bg-white/20` (glassmorphism)
- Scale entrance animace

#### S8: Kontakt (VYLEPŠIT)
**Aktuální:** `bg-gray-900`, hodně elementů. Funkčně OK.
**Nové:**
- Gradient: `bg-gradient-to-b from-gray-900 to-black`
- CTA tlačítko: gradient `bg-gradient-to-r from-orange-500 to-amber-500` + shadow-lg + větší (`py-4 px-10 text-lg rounded-2xl`)
- Manager card: border `border border-orange-500/30` pro vizuální důraz
- QR: větší `w-36 h-36`
- Přidat glow za CTA: `bg-orange-500/10 blur-[60px] absolute`

### AnimatedSection upgrade

Aktuální animace: fade + slide up (y: 40 → 0). Upgrade:

```tsx
function AnimatedSection({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "min-h-screen snap-start flex items-center justify-center px-6 sm:px-12 relative overflow-hidden",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl relative z-10"
      >
        {children}
      </motion.div>
    </section>
  );
}
```

**Změny:**
- Přidat `relative overflow-hidden` na section (pro absolutní dekorativní prvky)
- Přidat `scale: 0.98 → 1` (jemný zoom-in efekt)
- Custom easing `[0.16, 1, 0.3, 1]` (Apple-style ease-out)
- Přidat `relative z-10` na content wrapper (nad dekorace)

### DotNav upgrade

```tsx
function DotNav({ activeSection }: { activeSection: string }) {
  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50" aria-label="Navigace sekcí">
      {sectionIds.map((id) => (
        <a
          key={id}
          href={`#${id}`}
          title={sectionLabels[id]}
          className={cn(
            "block rounded-full transition-all duration-300",
            activeSection === id
              ? "w-3 h-3 bg-orange-500 shadow-lg shadow-orange-500/50"
              : "w-2 h-2 bg-white/20 hover:bg-white/50"
          )}
        />
      ))}
    </nav>
  );
}
```

**Změny:**
- Aktivní tečka: přidat `shadow-lg shadow-orange-500/50` glow
- Neaktivní: menší `w-2 h-2` (větší kontrast s aktivní)
- Větší gap `gap-3`

### Souhrn sekcí — barevný řetězec

| # | Sekce | Pozadí — aktuální | Pozadí — nové |
|---|-------|-------------------|---------------|
| 1 | Kdo jsme | gray-900 | gradient gray-900 → gray-800 + orange glow |
| 2 | Jak to funguje | **white** | **gradient gray-900 → gray-800** (dark!) |
| 3 | Pro autobazary | orange-500 | gradient orange-500 → orange-600 + glow |
| 4 | Pro vrakoviště | gray-900 | gradient gray-900 → gray-800 + orange glow |
| 5 | Provizní model | **white** | **gradient orange-50 → white → gray-100** |
| 6 | Naši partneři | **gray-50** | **gradient gray-900 → gray-800** (dark!) |
| 7 | Další kroky | **white** | **gradient orange-500 → amber-500** |
| 8 | Kontakt | gray-900 | gradient gray-900 → black |

**Nový řetězec:** dark → dark → orange → dark → light → dark → orange → dark
**Pravidlo:** Žádné dvě sousední sekce se stejným typem pozadí. Silné střídání.

### Soubor a rozsah

- **Soubor:** `app/prezentace/page.tsx`
- **Odhadovaný rozsah:** Kompletní přepis renderovacího JSX (~350 řádků). Logika (state, effects, handlers) zůstává beze změny.
- **Žádné nové závislosti** — Framer Motion už je v projektu.

### STOP pravidla

- **STOP-1:** Stagger animace — pokud `isInView` z AnimatedSection nefunguje pro child elementy (protože `once: true` a parent), implementátor může potřebovat separátní `useInView` per-child nebo `motion.div` s `whileInView` na children.
- **STOP-2:** Mapa CzechMap na dark pozadí — SVG fill/stroke barvy musí být aktualizovány. Pokud mapa zmizí → zkontrolovat kontrast.
- **STOP-3:** Glassmorphism `backdrop-blur-sm` — testovat na Safari/iOS (historically buggy). Fallback: `bg-white/20` bez blur.
- **STOP-4:** `shadow-orange-500/20` — ověřit že Tailwind 4 tuto syntaxi podporuje. Alternativa: `shadow-[0_10px_40px_rgba(249,115,22,0.2)]`.

### Acceptance Criteria

- [ ] Žádná sekce nemá plain `bg-white` pozadí
- [ ] Všechny sekce mají gradient pozadí
- [ ] Emoji/ikony jsou minimálně `text-5xl` nebo v gradient kontejnerech `w-20+`
- [ ] Stat čísla jsou dramaticky velká (`text-5xl+`)
- [ ] Stagger animace na lists (items appear 0.1-0.2s apart)
- [ ] Dekorativní glow prvky v min. 3 sekcích
- [ ] Provizní karty mají gradient backgrounds + shadow-xl
- [ ] DotNav má glow na aktivní tečce
- [ ] Celkový wow faktor — vizuálně srovnatelné s Stripe/Pitch.com
- [ ] Responzivní na tabletu (primární use case)
- [ ] `npm run build` projde bez chyb

---

## Pořadí implementace

1. **Smazat vykup** — 1 min
2. **Redesign prezentace** — 20-30 min (nejvyšší priorita, uživatel nespokojený)
3. **Redesign service pages** — 10 min

Prezentace a service pages jsou nezávislé soubory → mohou jít paralelně pokud jsou 2 implementátoři.
