# Plán: Cross-linking fixy (P0 + P1)

**Vytvořeno:** 2026-04-20
**Task:** #24
**Zdroj:** Audit cross-linkingu (`audit-crosslinking-20260420.md`)

---

## P0-1: Detail vozu — sekce "Doplňkové služby"

### Problém
`app/(web)/nabidka/[slug]/page.tsx` nemá ŽÁDNÉ cross-linky na `/sluzby/*`. Uživatel si prohlíží konkrétní auto, ale nemá cestu k prověrce, financování nebo pojištění.

### Aktuální struktura stránky

Stránka renderuje dva typy detailů — `renderVehicleDetail()` (broker/private) a `renderListingDetail()` (inzerce). Obě mají stejný layout:
1. Breadcrumb
2. Gallery + Info Panel (cena, badges, CTA buttons, lokace)
3. Tabs (parametry, výbava, popis, historie)
4. Cebia + LoanCalculator + Reservation
5. PriceHistory + VehicleTimeline
6. ContactForm + BrokerBox (jen broker listings)
7. Location map placeholder
8. UpsellBanner (jen private listings)
9. Flag button
10. RecommendedParts
11. Similar vehicles

### Řešení

Přidat novou sekci **"Doplňkové služby"** za Cebia/LoanCalculator sekci (pozice 4.5 — po kalkulačce, před historií). Toto je přirozené místo: uživatel si právě spočítal splátky → teď ho nabídneme prověrku a pojištění.

### Kód — nová komponenta (inline v page.tsx)

Přidat jako `<section>` do obou renderů (`renderVehicleDetail` i `renderListingDetail`):

```tsx
{/* ============================================================ */}
{/* Doplňkové služby — cross-linking                             */}
{/* ============================================================ */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
  <h2 className="text-[22px] font-extrabold text-gray-900 mb-6">
    Doplňkové služby
  </h2>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <Link href="/sluzby/proverka" className="no-underline block">
      <Card hover className="p-6 text-center h-full">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl mx-auto">
          🔍
        </div>
        <h3 className="font-bold text-gray-900 mt-3">Prověrka vozidla</h3>
        <p className="text-sm text-gray-500 mt-1">
          Ověřte historii a technický stav před koupí
        </p>
        <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">
          Prověřit →
        </span>
      </Card>
    </Link>
    <Link href="/sluzby/financovani" className="no-underline block">
      <Card hover className="p-6 text-center h-full">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl mx-auto">
          🧮
        </div>
        <h3 className="font-bold text-gray-900 mt-3">Financování</h3>
        <p className="text-sm text-gray-500 mt-1">
          Auto na splátky od 3,9 %, schválení do 30 min
        </p>
        <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">
          Spočítat splátky →
        </span>
      </Card>
    </Link>
    <Link href="/sluzby/pojisteni" className="no-underline block">
      <Card hover className="p-6 text-center h-full">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl mx-auto">
          🛡️
        </div>
        <h3 className="font-bold text-gray-900 mt-3">Pojištění</h3>
        <p className="text-sm text-gray-500 mt-1">
          Porovnání pojišťoven, sjednání online zdarma
        </p>
        <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">
          Pojistit →
        </span>
      </Card>
    </Link>
  </div>
</section>
```

### Umístění v kódu

**Ve `renderVehicleDetail()`:**
- Vložit ZA řádek ~718 (konec Cebia+LoanCalculator sekce: `</section>`)
- PŘED řádek ~720 (PriceHistory+Timeline sekce)

**Ve `renderListingDetail()`:**
- Vložit ZA řádek ~1073 (konec Cebia+LoanCalculator sekce: `</section>`)
- PŘED řádek ~1075 (RecommendedParts sekce)

### Import

`Link` a `Card` jsou v souboru **už importovány** — žádné nové importy.

### STOP pravidla
- **STOP-1:** Sekce musí být identická v obou renderech. Pokud implementátor přidá jen do jednoho → bug.
- **STOP-2:** Design musí být konzistentní s existujícím "Podobná vozidla" section (stejný nadpis styl, stejný grid gap).

### Acceptance Criteria
- [ ] Sekce "Doplňkové služby" se zobrazuje na detailu vozu (Vehicle)
- [ ] Sekce "Doplňkové služby" se zobrazuje na detailu inzerátu (Listing)
- [ ] Všechny 3 karty odkazují na správné URL (/sluzby/proverka, /financovani, /pojisteni)
- [ ] Design je konzistentní (font size, gap, padding) s okolními sekcemi
- [ ] Responzivní: 1 sloupec na mobilu, 3 na desktopu

---

## P0-2: ServicePage.tsx — cross-linking pod FAQ

### Problém
`components/web/ServicePage.tsx` (sdílená šablona pro 3 service pages) neobsahuje ANI JEDEN `<Link>`. Service pages jsou mrtvý konec.

### Aktuální struktura
1. Breadcrumbs
2. Hero (gradient orange)
3. Steps (3-col grid)
4. Benefits (2-col grid)
5. CTA (formulář slot)
6. FAQ
*konec — žádná další sekce*

### Řešení

Přidat cross-linking sekci ZA FAQ (konec stránky). Potřeba:
1. Přidat import `Link` z `next/link`
2. Přidat nový prop `currentService` pro filtrování aktuální služby z cross-linků
3. Přidat cross-linking sekci

### Kód — změny v ServicePage.tsx

#### 1. Přidat import (řádek 1-3):
```tsx
import Link from "next/link";
```

#### 2. Rozšířit interface (řádek 5-27):
```tsx
export interface ServicePageProps {
  // ... stávající props ...
  breadcrumbLabel?: string;
  currentService?: "proverka" | "financovani" | "pojisteni";  // ← nový prop
}
```

#### 3. Přidat prop do destructure (řádek 29-36):
```tsx
export function ServicePage({
  hero, steps, benefits, cta, faq, breadcrumbLabel,
  currentService,  // ← přidat
}: ServicePageProps) {
```

#### 4. Přidat cross-linking sekci za FAQ (za řádek 151, před `</div>`):

```tsx
      {/* Cross-linking — další služby + navigace */}
      <section className="max-w-6xl mx-auto w-full px-4">
        <h2 className="text-xl font-extrabold text-gray-900 text-center mb-6">
          Další služby CarMakléř
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {currentService !== "proverka" && (
            <Link href="/sluzby/proverka" className="no-underline block">
              <Card hover className="p-5 text-center h-full">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-bold text-gray-900 text-sm">Prověrka vozidla</h3>
                <p className="text-xs text-gray-500 mt-1">Ověřte historii před koupí</p>
              </Card>
            </Link>
          )}
          {currentService !== "financovani" && (
            <Link href="/sluzby/financovani" className="no-underline block">
              <Card hover className="p-5 text-center h-full">
                <div className="text-2xl mb-2">🧮</div>
                <h3 className="font-bold text-gray-900 text-sm">Financování</h3>
                <p className="text-xs text-gray-500 mt-1">Auto na splátky od 3,9 %</p>
              </Card>
            </Link>
          )}
          {currentService !== "pojisteni" && (
            <Link href="/sluzby/pojisteni" className="no-underline block">
              <Card hover className="p-5 text-center h-full">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="font-bold text-gray-900 text-sm">Pojištění</h3>
                <p className="text-xs text-gray-500 mt-1">Srovnání pojišťoven online</p>
              </Card>
            </Link>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link href="/nabidka" className="text-orange-500 hover:text-orange-600 font-semibold text-sm no-underline">
            Prohlédnout nabídku vozidel →
          </Link>
          <Link href="/chci-prodat" className="text-orange-500 hover:text-orange-600 font-semibold text-sm no-underline">
            Prodat auto přes makléře →
          </Link>
          <Link href="/makleri" className="text-orange-500 hover:text-orange-600 font-semibold text-sm no-underline">
            Najít makléře →
          </Link>
        </div>
      </section>
```

#### 5. Přidat `currentService` prop na volajících stránkách:

**`app/(web)/sluzby/proverka/page.tsx`** (řádek ~86):
```tsx
<ServicePage ... currentService="proverka" />
```

**`app/(web)/sluzby/financovani/page.tsx`** (řádek ~86):
```tsx
<ServicePage ... currentService="financovani" />
```

**`app/(web)/sluzby/pojisteni/page.tsx`** (řádek ~84):
```tsx
<ServicePage ... currentService="pojisteni" />
```

### STOP pravidla
- **STOP-1:** ServicePage.tsx je server component — NESMÍ přidat "use client". `Link` a `Card` jsou v server componentech povolené.
- **STOP-2:** Všechny 3 stránky musí předat `currentService` prop. Pokud jedna chybí → zobrazí se odkaz sama na sebe.
- **STOP-3:** Breadcrumb "Služby" odkazuje na `/chci-prodat` (řádek 63). Toto je stávající chování — NEMĚNIT.

### Acceptance Criteria
- [ ] Cross-linking sekce se zobrazuje pod FAQ na všech 3 service pages
- [ ] Na `/sluzby/proverka` se zobrazují karty financování + pojištění (ne prověrka)
- [ ] Na `/sluzby/financovani` se zobrazují karty prověrka + pojištění (ne financování)
- [ ] Na `/sluzby/pojisteni` se zobrazují karty prověrka + financování (ne pojištění)
- [ ] Textové odkazy na /nabidka, /chci-prodat, /makleri jsou pod kartami
- [ ] `npm run build` projde bez chyb
- [ ] Responzivní layout (1 sloupec mobil, 2-3 sloupce desktop)

---

## P1-3: /chci-prodat — soft CTA pro nerozhodnuté

### Problém
`app/(web)/chci-prodat/page.tsx` má jen formulář. Uživatelé, kteří nejsou připraveni vyplnit formulář, nemají alternativní cestu.

### Aktuální struktura
1. Breadcrumbs
2. Hero (stats + emoji)
3. Jak to funguje (3 kroky)
4. Formulář (`SellCarForm`)
5. Proč prodat přes CarMakléř (benefits)
6. Testimonial
7. FAQ
*konec*

### Řešení

Přidat sekci **"Nejste si jistí?"** za FAQ (na konec stránky, před uzavírací `</div>`).

### Kód

Za řádek 254 (`</section>` — konec FAQ), před řádek 256 (`</div>` — uzavírací wrapper):

```tsx
      {/* SECTION 7: Nejste si jistí? — alternativy */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">
            Nejste si jistí?
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Prohlédněte si více informací, než se rozhodnete
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/jak-to-funguje" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Jak prodej funguje
          </Link>
          <Link href="/recenze" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Recenze klientů
          </Link>
          <Link href="/makleri" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Najít makléře v okolí
          </Link>
        </div>
      </section>
```

### Import

`Link` z `next/link` **není v souboru importován** (page je server component, ale nepoužívá Link). Přidat na řádek 1-7:
```tsx
import Link from "next/link";
```

### STOP pravidla
- **STOP-1:** Design "pill" odkazů je copy-paste z `/o-nas` a `/kontakt` — konzistentní pattern.
- **STOP-2:** Sekce nesmí odvádět od hlavního CTA (formuláře). Proto je až úplně dole (za FAQ, ne před formulářem).

### Acceptance Criteria
- [ ] Sekce "Nejste si jistí?" se zobrazuje pod FAQ
- [ ] 3 pill odkazy vedou na /jak-to-funguje, /recenze, /makleri
- [ ] Design konzistentní s pill odkazy na /kontakt a /o-nas
- [ ] Formulář zůstává hlavním CTA (sekce je až na konci)

---

## P1-4: /profil/[slug] — CTA "Prodat auto"

### Problém
`app/(web)/profil/[slug]/ProfileClient.tsx` — uživatel si prohlíží profil makléře, ale nemá CTA pro "chci prodat auto s tímto makléřem".

### Aktuální stav
ProfileClient je "use client" komponenta (~1100 řádků). Obsahuje:
- Hero s cover photo, avatar, jméno, role, stats
- Actions: tel, email, share (řádky 448-488)
- About card, Specializations card, Milestones card
- Tabs s vozidly/inzeráty/díly
- Contact info (otevírací hodiny, warehouse adresa, social links)

### Řešení

Přidat CTA kartu **pod actions** (řádek ~488, za uzavírací `</div>` actions wrapperu) — jen pro makléře (`role === "BROKER"`), ne pro vlastní profil.

### Kód

Za řádek 488 (konec actions div), PŘED řádek 490 (`</div>` uzavírající profil info):

```tsx
                {/* CTA — Prodat auto s tímto makléřem */}
                {!isOwner && (user.role === "BROKER" || user.role === "MANAGER") && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href={`/chci-prodat`}
                      className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl no-underline hover:bg-orange-100 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        🚗
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">
                          Chcete prodat auto?
                        </div>
                        <div className="text-xs text-gray-500">
                          Vyplňte formulář a makléř vás kontaktuje
                        </div>
                      </div>
                      <span className="ml-auto text-orange-500 font-semibold text-sm">
                        →
                      </span>
                    </Link>
                  </div>
                )}
```

### Import

`Link` z `next/link` je v souboru **již importován** (řádek 4).

### Poznámka k `?broker=[slug]`

Ideálně by URL měl být `/chci-prodat?broker=${user.slug}` a SellCarForm by mohl pre-fill makléře. Ale to vyžaduje změnu v SellCarForm, která je mimo scope. Pro teď stačí plain `/chci-prodat` — uživatel vyplní formulář a BackOffice přiřadí makléře.

### STOP pravidla
- **STOP-1:** CTA se zobrazuje JEN pro cizí profily (`!isOwner`) a JEN pro makléře/manažery. NE pro dealery, investory, partnery.
- **STOP-2:** CTA je v rámci existujícího profil info wrapperu — nesmí narušit layout.

### Acceptance Criteria
- [ ] CTA "Chcete prodat auto?" se zobrazuje na profilu makléře
- [ ] CTA se NEZOBRAZUJE na vlastním profilu
- [ ] CTA se NEZOBRAZUJE na profilu dealera/investora
- [ ] Link vede na `/chci-prodat`
- [ ] Design konzistentní s profilem (orange-50 bg, rounded-xl)
- [ ] Responzivní

---

## Pořadí implementace

1. **P0-2: ServicePage.tsx** — 1 soubor + 3 jednoduché prop přidání. Nejmenší effort, největší dopad (opraví 3 stránky). ~10 min.
2. **P0-1: Detail vozu** — 1 soubor, stejná sekce na 2 místech (vehicle + listing render). ~10 min.
3. **P1-3: /chci-prodat** — 1 soubor, přidat import + sekci na konec. ~5 min.
4. **P1-4: /profil/[slug]** — 1 soubor, přidat CTA kartu. ~5 min.

**Celkem:** 6 souborů dotčených (ServicePage + 3 service pages + nabidka/[slug] + chci-prodat + ProfileClient). Jeden commit.

---

## Soubory dotčené

| Soubor | Typ změny | Nové importy |
|--------|-----------|-------------|
| `components/web/ServicePage.tsx` | +import Link, +prop, +sekce (~35 řádků) | `Link` from `next/link` |
| `app/(web)/sluzby/proverka/page.tsx` | +1 prop | — |
| `app/(web)/sluzby/financovani/page.tsx` | +1 prop | — |
| `app/(web)/sluzby/pojisteni/page.tsx` | +1 prop | — |
| `app/(web)/nabidka/[slug]/page.tsx` | +sekce na 2 místech (~25 řádků × 2) | — (Link, Card already imported) |
| `app/(web)/chci-prodat/page.tsx` | +import Link, +sekce (~15 řádků) | `Link` from `next/link` |
| `app/(web)/profil/[slug]/ProfileClient.tsx` | +CTA karta (~20 řádků) | — (Link already imported) |
