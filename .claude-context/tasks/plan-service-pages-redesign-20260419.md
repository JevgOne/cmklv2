# Plán: Smazat /sluzby/vykup + vylepšit design service pages

**Vytvořeno:** 2026-04-19
**Task:** #14

---

## ČÁST 1: Smazat /sluzby/vykup

### Důvod
Carmakler NEVYKUPUJE auta — je to makléřská síť. Stránka `/chci-prodat` (prodej přes makléře) už existuje a je hlavní konverzní stránka. Výkup je chybný koncept, který byl vytvořen na základě špatné interpretace TASK-010.

### Co smazat

| # | Soubor | Důvod |
|---|--------|-------|
| 1 | `app/(web)/sluzby/vykup/page.tsx` | Celá stránka |
| 2 | `components/web/VykupForm.tsx` | CTA formulář pro výkup |
| 3 | `e2e/chrome-test-final-vykup-prezentace.spec.ts` | E2E testy odkazující na /sluzby/vykup — buď smazat vykup testy nebo celý soubor (zachovat prezentace testy) |

### Co NESMAZAT (kontextuální zmínky)
- `lib/broker-specializations.ts` — "Výkup vozů" jako makléřská specializace je OK (makléř může nabízet výkup jako osobní službu)
- `prisma/seed.ts` — seed tag "vykup-do-24h" pro makléře je OK
- `lib/landing-copy.ts` — zmínka o výkupu v FAQ je kontextuální

### Co ověřit (ale pravděpodobně není potřeba měnit)
- Navbar/Footer — grep ukázal **žádné odkazy** na /sluzby/vykup ✅
- Sitemap — pokud existuje `next-sitemap.config.js`, ověřit že se dynamicky generuje (Next.js App Router → automaticky odstraněno)

### Acceptance Criteria
- [ ] `/sluzby/vykup` vrací 404
- [ ] `components/web/VykupForm.tsx` neexistuje
- [ ] Žádné broken linky na /sluzby/vykup (grep codebase)
- [ ] `npm run build` projde bez chyb
- [ ] E2E testy pro prezentaci zachovány (pokud byly ve sdíleném souboru)

---

## ČÁST 2: Vylepšit design service pages

### Aktuální stav — analýza problémů

**Sdílená šablona `ServicePage.tsx`** renderuje 5 sekcí: hero, steps, benefits, CTA, FAQ. Layout je funkční ale vizuálně "plochý" oproti zbytku webu.

**Konkrétní problémy:**

1. **CTA formuláře (všechny 3)** — holé `<Card>` s plain inputy
   - Chybí vizuální hierarchie (žádný gradient/pozadí za formulářem)
   - Chybí trust signals vedle formuláře (social proof, garanci)
   - `FinancovaniCalc` — kalkulačka splátky je fajn, ale formulář je moc jednoduchý (2 pole)
   - `ProverkaForm` — OK, ale chybí vizuální kontext (co dostanu v reportu?)
   - `PojisteniForm` — lepší (2-col layout), ale stále holé

2. **Hero sekce** — orange-50 box s textem, žádná ilustrace/ikona
   - Porovnání: homepage `/chci-prodat` má emoji 🚗 v 8xl a stat čísla
   - Service pages mají jen nadpis + podnadpis

3. **Steps sekce** — karty se stepu čísly vypadají OK
   - Drobnost: číslo v pozadí (text-gray-100) je málo viditelné na bílém pozadí karty

4. **Benefits sekce** — emoji ikony v text-3xl, funguje
   - Mohl by být vizuálně zajímavější (icon v kruhu, gradient pozadí)

5. **Konzistence** — `SellCarForm` na homepage má lepší design (divider, 3-col grid, textarea), service forms jsou jednodušší

### Navrhované vylepšení

#### 2A. ServicePage.tsx — Hero upgrade

**Aktuální:** Jen orange-50 box s h1 + subtitle.
**Nové:** Přidat dekorativní element + stat řádek.

```tsx
{/* HERO — vylepšení */}
<section className="max-w-6xl mx-auto w-full px-4 pt-6 sm:pt-8 md:pt-12">
  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 sm:p-8 md:p-12 lg:p-16 text-center relative overflow-hidden">
    {/* Dekorativní kruh v pozadí */}
    <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-200/30 rounded-full blur-3xl" />
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-200/20 rounded-full blur-2xl" />
    
    <div className="relative">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
        {renderTitle()}
      </h1>
      <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
        {hero.subtitle}
      </p>
    </div>
  </div>
</section>
```

**Změny:**
- `bg-orange-50` → `bg-gradient-to-br from-orange-50 to-orange-100`
- Přidat 2 dekorativní blur kruhy (absolutní pozice, bez interakce)
- Content wrapper s `relative` pro z-index

#### 2B. ServicePage.tsx — Steps vizuální upgrade

**Aktuální:** Číslo pozadí je text-gray-100 (téměř neviditelné).
**Nové:** Přidat spojovací čáry mezi kroky + zvýraznit čísla.

```tsx
{/* Jen změnit barvu čísla pozadí */}
<div className="absolute top-4 left-4 text-6xl font-extrabold text-orange-100 select-none">
  {i + 1}
</div>
```

Změna: `text-gray-100` → `text-orange-100` (jemný oranžový nádech, konzistentní s branding).

#### 2C. ServicePage.tsx — Benefits ikony v kruhu

**Aktuální:** Emoji `text-3xl` volně vedle textu.
**Nové:** Emoji v oranžovém kruhu pro vizuální konzistenci.

```tsx
<Card key={benefit.title} hover className="p-5 sm:p-8 flex gap-4 sm:gap-5">
  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
    {benefit.icon}
  </div>
  <div>
    <h3 className="text-lg font-bold text-gray-900 mb-1">{benefit.title}</h3>
    <p className="text-[15px] text-gray-500 leading-relaxed">{benefit.description}</p>
  </div>
</Card>
```

Změna: Wrap emoji do `w-12 h-12 bg-orange-50 rounded-xl` kontejneru.

#### 2D. CTA sekce — gradient pozadí za formulářem

**Aktuální:** Formulář v plain `<Card>` na bílém pozadí. CTA sekce nemá žádné pozadí.
**Nové:** Přidat pozadí gradient sekci + trust badge vedle formuláře.

```tsx
{/* CTA — vylepšení v ServicePage.tsx */}
{cta && (
  <section className="w-full bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 md:py-16">
    <div className="max-w-2xl mx-auto px-4">{cta}</div>
  </section>
)}
```

Změna: CTA section dostane `bg-gradient-to-b from-gray-50 to-white` + vertikální padding. Jemný přechod oddělí formulář od okolního obsahu a dodá mu vizuální důraz.

#### 2E. FinancovaniCalc.tsx — vylepšení formuláře

**Aktuální problémy:**
- Pouze 2 input pole (cena + telefon) — vypadá prázdně
- Kalkulačka splátky je fajn, ale formulář je příliš minimální

**Vylepšení:**
1. Přidat shadow-lg na Card pro vizuální prominenci:
   ```tsx
   <Card className="p-5 sm:p-8 md:p-10 shadow-lg">
   ```
2. Přidat ikonu 🧮 nad nadpis:
   ```tsx
   <div className="text-4xl text-center mb-3">🧮</div>
   ```
3. Přidat jméno input vedle telefonu (2-col grid) — konzistence se SellCarForm:
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
     <Input label="Vaše jméno" placeholder="Jan Novák" ... />
     <Input label="Telefon" type="tel" ... />
   </div>
   ```
4. Kalkulačka box: přidat border pro vizuální oddělení:
   ```tsx
   <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 text-center">
   ```

#### 2F. ProverkaForm.tsx — vylepšení formuláře

**Vylepšení:**
1. Shadow-lg na Card
2. Ikona 🔍 nad nadpis
3. Přidat "Co obsahuje report" mini-seznam pod formulář:
   ```tsx
   <div className="grid grid-cols-2 gap-2 mt-4 text-[13px] text-gray-500">
     <span className="flex items-center gap-1.5">
       <span className="text-orange-500">●</span> Původ vozidla
     </span>
     <span className="flex items-center gap-1.5">
       <span className="text-orange-500">●</span> Historie havárií
     </span>
     <span className="flex items-center gap-1.5">
       <span className="text-orange-500">●</span> Servisní záznamy
     </span>
     <span className="flex items-center gap-1.5">
       <span className="text-orange-500">●</span> Stav tachometru
     </span>
   </div>
   ```

#### 2G. PojisteniForm.tsx — vylepšení formuláře

**Vylepšení:**
1. Shadow-lg na Card
2. Ikona 🛡️ nad nadpis
3. Pojisteni form je z formulářů nejlepší (má 2-col grid) — jen shadow + ikona stačí

### Souhrn změn

| Soubor | Typ změny | Rozsah |
|--------|-----------|--------|
| `components/web/ServicePage.tsx` | Hero gradient + blur dekorace, step číslo barva, benefit ikona v kruhu, CTA sekce pozadí | ~20 řádků |
| `components/web/FinancovaniCalc.tsx` | Shadow-lg, ikona, jméno field, border na kalkulačce | ~10 řádků |
| `components/web/ProverkaForm.tsx` | Shadow-lg, ikona, "co obsahuje report" seznam | ~15 řádků |
| `components/web/PojisteniForm.tsx` | Shadow-lg, ikona | ~3 řádky |

### STOP pravidla
- **STOP-1:** ServicePage.tsx je sdílená šablona — každá změna ovlivní VŠECHNY 3 stránky. Testovat na všech po každé úpravě.
- **STOP-2:** Nepřidávat Framer Motion do ServicePage (server component). Dekorace musí být čistě CSS.
- **STOP-3:** Nepřidávat "use client" do ServicePage.tsx. CTA komponenty jsou už "use client", ServicePage zůstává server component.

### Acceptance Criteria
- [ ] Všechny 3 service pages (/sluzby/proverka, /financovani, /pojisteni) mají vylepšený design
- [ ] Hero má gradient + dekorativní prvky
- [ ] Step čísla jsou viditelná (oranžový nádech)
- [ ] Benefit ikony jsou v kruhovém kontejneru
- [ ] CTA formuláře mají shadow-lg + ikon
- [ ] FinancovaniCalc má jméno field
- [ ] ProverkaForm má "co obsahuje report" seznam
- [ ] Design je konzistentní mezi všemi 3 stránkami
- [ ] Responzivní na mobilu (testovat ≤640px)
- [ ] `npm run build` projde bez chyb

---

## Pořadí implementace

1. **Smazat vykup** (3 soubory) — 1 min, zero risk
2. **ServicePage.tsx** — hero, steps, benefits, CTA úpravy — 5 min
3. **Formuláře** (FinancovaniCalc, ProverkaForm, PojisteniForm) — 5 min
4. **Vizuální kontrola** — proklikat všechny 3 stránky

Celkový rozsah: 6 souborů, ~50 řádků změn + 3 soubory smazány. Jeden commit.
