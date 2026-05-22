# Plan: Opravy 2 chybějících položek z auditu

**Vytvořeno:** 2026-04-19
**Zdroj:** audit-full-platform-20260419.md
**Původní nález:** 3 chybějící položky → po verifikaci **2 položky** (PATCH /api/partners/[id] existuje)

---

## KOREKCE: PATCH /api/partners/[id] JIŽ EXISTUJE

Při auditu byla tato položka chybně označena jako chybějící. Soubor `app/api/partners/[id]/route.ts` obsahuje plně implementovaný PATCH handler (řádky 45-105) s:
- Zod validací přes `updatePartnerSchema`
- Auth checkem (ADMIN, BACKOFFICE, MANAGER)
- Automatickým logováním změny stavu do PartnerActivity
- Automatickým logováním přiřazení manažera
- GET a DELETE handlery ve stejném souboru

**Zbývají tedy 2 položky k implementaci.**

---

## POLOŽKA 1: /sluzby/vykup/page.tsx

**Zdroj:** TASK-010 (řádky 668-691 TASK-QUEUE.md)
**Složitost:** Nízká (copy-paste pattern)
**Odhadovaný rozsah:** 2 soubory, ~150 řádků

### Co chybí
Stránka `/sluzby/vykup` — výkup vozidel. Ostatní 3 service pages (proverka, financovani, pojisteni) existují a fungují. Tato jedna chybí.

### Vzor k následování
Identický pattern jako `app/(web)/sluzby/proverka/page.tsx`, `financovani/page.tsx`, `pojisteni/page.tsx`:
```
1. Export metadata (title, description, openGraph, alternates via pageCanonical)
2. Definice steps[] (3 kroky)
3. Definice benefits[] (4 benefity)
4. Definice faq[] (3-5 otázek)
5. Default export renderující <ServicePage> s props
6. CTA komponenta jako prop
```

### Soubory k vytvoření

#### 1a. `app/(web)/sluzby/vykup/page.tsx`

**Metadata:**
- title: "Výkup vozidel"
- description: "Vykoupíme vaše auto za hotové. Férová cena, peníze na účtu do 24 hodin, bez skrytých poplatků."
- openGraph.title: "Výkup auta za hotové | CarMakléř"
- alternates: `pageCanonical("/sluzby/vykup")`

**Hero:**
- title: "Vykoupíme vaše auto za hotové"
- highlight: "za hotové"
- subtitle: "Peníze na účtu do 24 hodin"

**Steps (3 kroky):**
1. icon: "📋", title: "Pošlete info o voze", description: "Vyplňte značku, model, rok a stav — ozveme se do 30 minut"
2. icon: "💵", title: "Nabídneme férovou cenu", description: "Na základě aktuální tržní hodnoty vám nabídneme konkrétní částku"
3. icon: "✅", title: "Vyplatíme do 24 hodin", description: "Po odsouhlasení ceny peníze odešleme na účet a přepíšeme auto"

**Benefits (4):**
1. icon: "💰", title: "Férová tržní cena", desc: "Cenu stanovíme na základě aktuální tržní hodnoty a stavu vozidla"
2. icon: "⚡", title: "Platba ihned", desc: "Peníze na účtu do 24 hodin od odsouhlasení ceny"
3. icon: "🚫", title: "Bez skrytých poplatků", desc: "Žádné poplatky za ocenění ani za převod. Cena = to, co dostanete"
4. icon: "📝", title: "Přepis na počkání", desc: "Zajistíme kompletní administrativu — přepis, odhlášení pojištění, vše"

**FAQ (3-5 otázek):**
1. "Jak se stanoví výkupní cena?" → "Cenu stanovíme na základě aktuální tržní hodnoty, stavu vozu, servisní historie a poptávky na trhu. Vždy vám poskytneme transparentní kalkulaci."
2. "Jak rychle dostanu peníze?" → "Peníze odesíláme na účet do 24 hodin od odsouhlasení ceny a podpisu smlouvy."
3. "Vykupujete i auta s vadami?" → "Ano, vykupujeme i vozidla s technickými vadami, po nehodě nebo s vyšším nájezdem. Cena se přizpůsobí stavu."
4. "Musím mít auto splacené?" → "Pokud je auto na leasing nebo úvěr, pomůžeme s předčasným ukončením a vyrovnáním. Výkup je možný i v tomto případě."

**CTA:** `<VykupForm />`

**breadcrumbLabel:** "Výkup vozidel"

#### 1b. `components/web/VykupForm.tsx`

"use client" komponenta — formulář pro výkup. Vzor: `PojisteniForm.tsx` nebo `ProverkaForm.tsx`.

**Pole formuláře (dle TASK-010 spec):**
- Značka (text/select)
- Model (text)
- Rok výroby (number, min 1990, max current year)
- Nájezd km (number)
- Telefon (tel)

**Chování:**
- Vizuální formulář (zatím neodesílá na API — stejně jako ostatní service forms)
- Po "odeslání" zobrazí potvrzovací hlášku
- Card wrapper s heading "Chci nabídku výkupu"
- Tlačítko: "Získat nabídku" (oranžové, plná šířka)

### Závislosti
- `components/web/ServicePage.tsx` — existuje, beze změn
- `components/ui/Card.tsx` — existuje
- `lib/canonical.ts` — existuje, `pageCanonical()` funkce

### Acceptance Criteria
- [ ] Stránka `/sluzby/vykup` renderuje bez chyb
- [ ] Metadata (title, description, OG) jsou správné
- [ ] 3 kroky, 4 benefity, FAQ accordion funguje
- [ ] Formulář se zobrazuje a je responzivní
- [ ] Breadcrumbs: Domů > Služby > Výkup vozidel
- [ ] Design konzistentní s ostatními /sluzby/* stránkami
- [ ] `npm run build` projde bez chyb

---

## POLOŽKA 2: /prezentace/page.tsx

**Zdroj:** TASK-031 sekce 6 (řádky 4147-4162 TASK-QUEUE.md)
**Složitost:** Střední (unikátní layout, Framer Motion, dynamický obsah)
**Odhadovaný rozsah:** 1-2 soubory, ~300-400 řádků

### Co chybí
Fullscreen pitch deck stránka pro obchodní schůzky s potenciálními partnery (autobazary, vrakoviště). Používá se na tabletu při osobní návštěvě nebo se posílá emailem.

### Klíčové požadavky
1. **BEZ navbar/footer** — fullscreen layout
2. **8 sekcí** — každá zabere celou obrazovku (100vh)
3. **Swipe/click navigace** mezi sekcemi
4. **Framer Motion** animace přechodů (fade/slide)
5. **`?manager=slug`** URL parametr pro dynamický kontakt manažera v sekci 8
6. **Design:** Orange (#F97316) + bílá + gray-900, velké fonty (Outfit), málo textu

### Architektura

Stránka je pod `app/(web)/prezentace/page.tsx`, ale musí schovat navbar/footer. Dvě možnosti:
- **Preferovaná:** Samostatný layout `app/(web)/prezentace/layout.tsx` který NEPROVEDE wrapper s Navbar/Footer
- **Alternativní:** CSS třída na body/html pro hide navbar (méně čisté)

**Doporučení:** Vytvořit `app/(web)/prezentace/layout.tsx` s minimálním layoutem (jen `<main>{children}</main>`, bez Navbar/Footer).

### Soubory k vytvoření

#### 2a. `app/(web)/prezentace/layout.tsx`

Minimální layout BEZ Navbar a Footer:
```tsx
export default function PrezentaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Tím přepíše parent `(web)/layout.tsx` navbar/footer wrapping pro tuto konkrétní route.

**POZOR:** Ověřit, jak `(web)/layout.tsx` funguje — pokud má Navbar/Footer přímo v sobě, tato metoda nebude fungovat (Next.js App Router layouts se **vnořují**, nepřepisují). V tom případě:
- Zvážit přesun stránky do vlastní route group: `app/(pitch)/prezentace/page.tsx` s vlastním layout.tsx
- NEBO: CSS approach — `className="prezentace"` na body + CSS `body.prezentace header, body.prezentace footer { display: none }`

**Implementátor musí zkontrolovat** `app/(web)/layout.tsx` a rozhodnout nejčistší approach.

#### 2b. `app/(web)/prezentace/page.tsx` (nebo `app/(pitch)/prezentace/page.tsx`)

**Metadata:**
- title: "CarMakléř — Partnerská prezentace"
- robots: "noindex, nofollow" (interní materiál, ne pro SEO)

**"use client"** — potřebuje Framer Motion, useSearchParams, scroll/swipe handling.

**8 sekcí:**

1. **Kdo jsme**
   - CarMakléř logo (velké, centrované)
   - "Jsme síť certifikovaných automakléřů"
   - 3 stat čísla: počet makléřů, prodaných aut, partnerů (hardcoded nebo z API)

2. **Jak to funguje**
   - 3 kroky vizuálně s ikonkami: Nabírání → Inzerce → Prodej
   - Horizontální flow diagram

3. **Pro autobazary**
   - Bullet list benefitů:
     - Leads od kupujících
     - Větší viditelnost
     - Badge "Ověřený partner"
     - Žádné náklady na start
     - Provize jen z úspěšného prodeje

4. **Pro vrakoviště**
   - Bullet list benefitů:
     - Online prodej dílů bez vlastního eshopu
     - Objednávkový systém
     - Platby za vás

5. **Provizní model**
   - Transparentní přehled:
     - Bazary: provize z prodeje platí kupující, bonus za financování
     - Vrakoviště: 15% z prodeje dílů, 85% pro vás

6. **Naši partneři**
   - Mapa ČR s piny partnerů (statická SVG mapa nebo jednoduché vizuální zobrazení)
   - Čísla: X partnerů v Y krajích

7. **Další kroky**
   - 3 kroky: "1. Podepíšeme smlouvu → 2. Nastavíme profil → 3. Do týdne jste online"

8. **Kontakt**
   - Dynamicky jméno manažera z URL parametru `?manager=slug`
   - Pokud slug existuje: fetch `/api/users?slug=...` → jméno, telefon, email
   - Pokud ne: generic kontakt CarMakléř
   - QR kód (odkaz na /kontakt nebo registraci) — lze použít `qrcode.react` knihovnu

**Navigace mezi sekcemi:**
- Scroll snap (`scroll-snap-type: y mandatory` na kontejneru, `scroll-snap-align: start` na sekcích)
- Tečkový indikátor na pravé straně (8 teček, aktivní = oranžová)
- Keyboard: šipky nahoru/dolů
- Touch: native scroll snap

**Framer Motion:**
- `<motion.section>` s `whileInView` animacemi
- Fade + slide up na obsah každé sekce
- `viewport={{ once: true }}` pro single trigger

### Závislosti
- `framer-motion` — již v package.json
- `qrcode.react` — **nutno přidat** (`npm install qrcode.react`) NEBO vygenerovat QR jako SVG ručně
- Ověřit `(web)/layout.tsx` pro navbar/footer bypass

### Acceptance Criteria
- [ ] Stránka `/prezentace` renderuje fullscreen bez navbar/footer
- [ ] Všech 8 sekcí zobrazeno, každá = 100vh
- [ ] Scroll snap funguje (plynulé přechody mezi sekcemi)
- [ ] Framer Motion animace na obsahu sekcí
- [ ] `?manager=slug` parametr dynamicky zobrazuje kontakt manažera
- [ ] Bez `?manager` zobrazí generic kontakt
- [ ] Tečkový indikátor ukazuje aktuální sekci
- [ ] Responzivní (tablet primary, ale funguje i na desktopu a mobilu)
- [ ] robots: noindex, nofollow
- [ ] `npm run build` projde bez chyb

---

## Pořadí implementace

1. **Položka 1 (/sluzby/vykup)** — jednoduchá, copy-paste pattern, hotovo za minuty
2. **Položka 2 (/prezentace)** — komplexnější, vyžaduje layout rozhodnutí + Framer Motion

### STOP pravidla pro implementátora

- **STOP-1:** Pokud `app/(web)/layout.tsx` vnořuje Navbar/Footer tak, že nelze přepsat layoutem → ESKALOVAT s návrhem route group `(pitch)`
- **STOP-2:** Pokud `qrcode.react` nebo jiná QR knihovna nelze nainstalovat / build fail → nahradit statickým textem "Naskenujte QR kód" s odkazem
- **STOP-3:** Pokud scroll snap nefunguje cross-browser → fallback na prosté scrollování + IntersectionObserver pro tečkový indikátor
