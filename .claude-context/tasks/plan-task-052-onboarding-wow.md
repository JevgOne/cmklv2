# Plan: TASK-052 — Onboarding WOW efekt — registrace + pruvodce systemem

**Datum:** 2026-04-25
**Autor:** Planovac
**Priorita:** STREDNI
**Typ:** UX vylepseni + nova feature
**Zavislosti:** Zadne (build na stavajicim onboardingu)

---

## Shrnutí

Uživatel chce:
1. Vylepšit registrační/onboarding flow (vizuálně + UX)
2. Přidat interaktivní průvodce systémem (tour po PWA po prvním přihlášení)
3. Popisky/tooltips/nápověda ke všemu
4. WOW efekt — "kdokoliv se na cokoliv podívá řekne si WAAAU"

---

## Stávající stav

### Registrace (3 typy)

| Typ | URL | Flow |
|-----|-----|------|
| Kupující/Prodávající | `/registrace` | Jednoduchý formulář → success screen → login |
| Makléř | `/registrace/makler?token=X` | Token z pozvánky → formulář s ARES validací → auto-login → onboarding |
| Partner (autobazar/vrakoviště) | `/registrace/partner` | Formulář s výběrem typu + ARES → success screen |
| Dodavatel dílů | `/registrace/dodavatel` | Formulář s ARES → success screen |

### Onboarding makléře (5 kroků)

1. **Profil** — foto, bio, specializace, města, IBAN
2. **Dokumenty** — živnostenský list + OP (přední + zadní)
3. **Školení + Kvíz** — 4 slidů + 10 otázek (80% pass)
4. **Smlouva** — zobrazení + elektronický podpis
5. **Schválení** — čekání na aktivaci manažerem

### Co chybí

- **Žádný průvodce po PWA** po aktivaci (nový makléř vidí prázdný dashboard bez kontextu)
- **Žádné tooltips/nápověda** nikde v PWA
- **Žádné welcome screen** po prvním přihlášení do dashboardu
- **Žádné animace** v onboardingu (jen statické formuláře)
- **Žádný progress celebration** po dokončení kroku
- **Žádná motivační copy** — texty jsou funkční ale nudné
- Framer Motion je v `package.json` ale není v onboardingu využit

---

## Implementační plán

### Fáze 1: WOW registrace — vizuální vylepšení

**Cíl:** Registrace, která vypadá profesionálně a budí důvěru.

#### 1.1 Registrační stránka — přidat hero sekci nahoře

**Soubor:** `app/(web)/registrace/page.tsx`

Přidat nad formulář motivační hero:

```tsx
<div className="text-center mb-8">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h1 className="text-3xl font-extrabold text-gray-900">
      Vítejte na <span className="text-orange-500">CarMakléř</span>
    </h1>
    <p className="mt-3 text-lg text-gray-500">
      Připojte se k tisícům spokojených uživatelů
    </p>
  </motion.div>

  {/* Trust badges */}
  <div className="flex justify-center gap-6 mt-6">
    <TrustBadge icon="shield" text="Bezpečné" />
    <TrustBadge icon="clock" text="2 min registrace" />
    <TrustBadge icon="users" text="500+ makléřů" />
  </div>
</div>
```

#### 1.2 Registrace makléře — welcome info karta

**Soubor:** `app/(web)/registrace/makler/page.tsx`

Před formulář přidat personalizovanou info kartu:

```tsx
{invitation && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="mb-6 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-6"
  >
    <p className="text-sm text-gray-600">Pozvánku vám poslal/a:</p>
    <p className="text-lg font-bold text-gray-900">{invitation.manager}</p>
    <p className="text-sm text-gray-500 mt-1">Region: {invitation.region.name}</p>
  </motion.div>
)}
```

#### 1.3 Success screen — konfety efekt

**Soubor:** `app/(web)/registrace/page.tsx` (success state) + `app/(web)/registrace/makler/page.tsx` (success state)

Přidat konfety animaci po úspěšné registraci:

```tsx
// Nová komponenta: components/ui/Confetti.tsx
// Použít canvas-confetti (lightweight, 6 KB) nebo CSS-only konfety

<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
>
  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success-50">
    <motion.svg
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="h-10 w-10 text-success-500"
      /* ... checkmark ... */
    />
  </div>
  <h2 className="text-2xl font-extrabold text-gray-900">
    Skvělé! Registrace hotová!
  </h2>
</motion.div>
```

---

### Fáze 2: WOW onboarding — animace a motivace

**Cíl:** Každý krok onboardingu má WOW moment.

#### 2.1 Animovaný OnboardingProgress

**Soubor:** `components/pwa/onboarding/OnboardingProgress.tsx`

Přidat Framer Motion animace:

```tsx
import { motion } from "framer-motion";

// Kroužky: spring animace při přechodu completed
<motion.div
  initial={false}
  animate={{
    scale: state === "active" ? [1, 1.15, 1] : 1,
    backgroundColor: state === "completed" ? "#22c55e" : state === "active" ? "#f97316" : "#e5e7eb",
  }}
  transition={{ type: "spring", bounce: 0.4 }}
  className="w-10 h-10 rounded-full flex items-center justify-center"
>
  {state === "completed" && (
    <motion.svg
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", delay: 0.1 }}
    >
      {/* checkmark */}
    </motion.svg>
  )}
</motion.div>

// Propojovací čáry: animovaná šířka
<motion.div
  initial={{ scaleX: 0 }}
  animate={{ scaleX: completedSteps.includes(step.key) ? 1 : 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="h-0.5 bg-success-500 origin-left"
/>
```

#### 2.2 Step transition animace

**Soubor:** `app/(pwa)/makler/onboarding/layout.tsx`

Přidat page transition:

```tsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence mode="wait">
  <motion.main
    key={pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="max-w-2xl mx-auto px-4 py-6"
  >
    {children}
  </motion.main>
</AnimatePresence>
```

#### 2.3 Step completion celebration

**Nový soubor:** `components/pwa/onboarding/StepComplete.tsx`

Po každém úspěšném kroku (před redirect na další) zobrazit celebration overlay:

```tsx
export function StepComplete({ step, onContinue }: { step: number; onContinue: () => void }) {
  const messages = [
    { title: "Profil vytvořen!", subtitle: "Skvělý základ pro vaši kariéru", icon: "👤" },
    { title: "Dokumenty nahrány!", subtitle: "Vaše identita je ověřena", icon: "📄" },
    { title: "Školení dokončeno!", subtitle: "Jste připraven/a na terén", icon: "🎓" },
    { title: "Smlouva podepsána!", subtitle: "Už jen schválení a můžete začít", icon: "✍️" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
        className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.6, delay: 0.3 }}
          className="text-5xl mb-4"
        >
          {messages[step - 1].icon}
        </motion.div>
        <h2 className="text-xl font-extrabold text-gray-900">{messages[step - 1].title}</h2>
        <p className="text-sm text-gray-500 mt-2">{messages[step - 1].subtitle}</p>
        <div className="mt-2 text-xs text-gray-400">Krok {step} z 5</div>

        <Button onClick={onContinue} className="mt-6 w-full">
          Pokračovat
        </Button>
      </motion.div>
    </motion.div>
  );
}
```

**Integrace:** V API response z každého onboarding endpointu vrátit `{ success: true, nextStep: N }`. V klientské komponentě po úspěšném POST zobrazit `StepComplete` na 2s, pak redirect.

#### 2.4 Vylepšení textů — motivační copy

**Soubory:** Všechny `onboarding/*/page.tsx`

| Krok | Stávající | Nový |
|------|-----------|------|
| 1 | "Vyplňte základní informace o sobě" | "Ukažte klientům, kdo jste. Váš profil je vaše vizitka." |
| 2 | "Nahrajte potřebné dokumenty..." | "Ověření identity = důvěra klientů. Zabere to minutku." |
| 3 | "Projděte si základní informace..." | "Krátké školení vás připraví na úspěch v terénu." |
| 4 | "Přečtěte si smlouvu, podepište ji..." | "Poslední krok! Podpis smlouvy a můžete začít vydělávat." |
| 5 | "Váš profil byl odeslán ke schválení" | "Hotovo! Manažer vás brzy aktivuje. Obvykle do 24 hodin." |

#### 2.5 Layout header — přidat motivační progress text

**Soubor:** `app/(pwa)/makler/onboarding/layout.tsx`

```tsx
// Pod OnboardingProgress přidat:
<p className="text-xs text-gray-400 mt-2 text-center">
  {currentIndex === 0 && "Začínáme — ještě 5 kroků do startu"}
  {currentIndex === 1 && "Skvěle! Profil máte, pokračujme"}
  {currentIndex === 2 && "Půlka za vámi! Zbývají 3 kroky"}
  {currentIndex === 3 && "Skoro hotovo! Už jen 2 kroky"}
  {currentIndex === 4 && "Poslední krok — hned budete mít hotovo!"}
</p>
```

---

### Fáze 3: Průvodce systémem (PWA Tour)

**Cíl:** Po prvním přihlášení do dashboardu (po aktivaci) se spustí interaktivní tour.

#### 3.1 DB model — tracking, zda uživatel viděl tour

**Soubor:** `prisma/schema.prisma`

Přidat do User modelu:

```prisma
hasSeenTour     Boolean  @default(false)
```

#### 3.2 Tour komponenta

**Nový soubor:** `components/pwa/tour/AppTour.tsx`

Implementovat vlastní tour komponentu (bez závislosti na externích knihovnách — Shepherd/react-joyride jsou těžké, 50+ KB):

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface TourStep {
  target: string;         // CSS selector pro highlight element
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right";
  route?: string;         // Pokud krok vyžaduje navigaci na jinou stránku
}

const BROKER_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='dashboard-stats']",
    title: "Vaše statistiky",
    content: "Zde vidíte měsíční přehled — provize, prodeje, aktivní vozidla. Vše na jednom místě.",
    placement: "bottom",
  },
  {
    target: "[data-tour='add-vehicle-cta']",
    title: "Přidejte první vozidlo",
    content: "Klikněte sem a naberte první auto. Můžete použít VIN dekodér pro rychlé vyplnění.",
    placement: "top",
  },
  {
    target: "[data-tour='notifications']",
    title: "Notifikace",
    content: "Zde uvidíte všechny důležité zprávy — nové leady, schválení vozidel, zprávy od manažera.",
    placement: "bottom",
  },
  {
    target: "[data-tour='bottom-nav-vehicles']",
    title: "Vaše vozidla",
    content: "Seznam všech nabíraných vozidel. Filtrujte podle stavu — aktivní, čekající, prodáno.",
    placement: "top",
  },
  {
    target: "[data-tour='bottom-nav-messages']",
    title: "Zprávy",
    content: "Komunikace s klienty a manažerem. Vše na jednom místě.",
    placement: "top",
  },
  {
    target: "[data-tour='bottom-nav-stats']",
    title: "Statistiky a kariéra",
    content: "Sledujte svůj pokrok, úroveň (hvězdičky), leaderboard a provize.",
    placement: "top",
  },
  {
    target: "[data-tour='topbar-search']",
    title: "Vyhledávání",
    content: "Rychlé hledání vozidel, klientů a kontaktů v celé aplikaci.",
    placement: "bottom",
  },
];

export function AppTour({ userId }: { userId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const router = useRouter();

  const step = BROKER_TOUR_STEPS[currentStep];
  const isLast = currentStep === BROKER_TOUR_STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      // Mark tour as seen
      fetch("/api/broker/tour-complete", { method: "POST" });
      setIsActive(false);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLast]);

  const handleSkip = () => {
    fetch("/api/broker/tour-complete", { method: "POST" });
    setIsActive(false);
  };

  if (!isActive) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

      {/* Spotlight + tooltip */}
      <TourSpotlight target={step.target} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed z-[60] ..."
          /* positioned relative to target element */
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                {currentStep + 1}
              </span>
              <h3 className="font-bold text-gray-900">{step.title}</h3>
            </div>
            <p className="text-sm text-gray-600">{step.content}</p>

            <div className="flex items-center justify-between mt-4">
              <button onClick={handleSkip} className="text-xs text-gray-400 hover:text-gray-600">
                Přeskočit tour
              </button>
              <div className="flex items-center gap-2">
                {/* Step dots */}
                <div className="flex gap-1">
                  {BROKER_TOUR_STEPS.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? "bg-orange-500" : i < currentStep ? "bg-orange-300" : "bg-gray-300"}`} />
                  ))}
                </div>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600"
                >
                  {isLast ? "Hotovo!" : "Další"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
```

#### 3.3 Tour Spotlight komponenta

**Nový soubor:** `components/pwa/tour/TourSpotlight.tsx`

Zvýrazní cílový element skrze CSS clip-path:

```tsx
export function TourSpotlight({ target }: { target: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(target);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect(r);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [target]);

  if (!rect) return null;

  // Spotlight: element je "vyříznut" z overlay
  return (
    <div
      className="fixed inset-0 z-[55] pointer-events-none"
      style={{
        boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`,
        clipPath: `polygon(
          0 0, 100% 0, 100% 100%, 0 100%,
          0 ${rect.top - 8}px,
          ${rect.left - 8}px ${rect.top - 8}px,
          ${rect.left - 8}px ${rect.bottom + 8}px,
          ${rect.right + 8}px ${rect.bottom + 8}px,
          ${rect.right + 8}px ${rect.top - 8}px,
          0 ${rect.top - 8}px
        )`,
      }}
    />
  );
}
```

#### 3.4 Data atributy na dashboardové komponenty

Přidat `data-tour="..."` atributy na existující elementy:

| Soubor | Element | Atribut |
|--------|---------|---------|
| `components/pwa/dashboard/StatsRow.tsx` | Root div | `data-tour="dashboard-stats"` |
| `components/pwa/dashboard/AddVehicleCTA.tsx` | Root div | `data-tour="add-vehicle-cta"` |
| `components/pwa/dashboard/NotificationsList.tsx` | Root div | `data-tour="notifications"` |
| `components/pwa/BottomNav.tsx` | Vehicles link | `data-tour="bottom-nav-vehicles"` |
| `components/pwa/BottomNav.tsx` | Messages link | `data-tour="bottom-nav-messages"` |
| `components/pwa/BottomNav.tsx` | Stats link | `data-tour="bottom-nav-stats"` |
| `components/pwa/TopBar.tsx` | Search button | `data-tour="topbar-search"` |

#### 3.5 Tour trigger na dashboardu

**Soubor:** `app/(pwa)/makler/dashboard/page.tsx`

```tsx
// V server component:
const showTour = userData && !userData.hasSeenTour;

// V JSX (na konci):
{showTour && <AppTourWrapper userId={userId} />}
```

**Nový soubor:** `components/pwa/tour/AppTourWrapper.tsx` (client wrapper)

```tsx
"use client";
import { AppTour } from "./AppTour";
export function AppTourWrapper({ userId }: { userId: string }) {
  return <AppTour userId={userId} />;
}
```

#### 3.6 API endpoint pro dokončení tour

**Nový soubor:** `app/api/broker/tour-complete/route.ts`

```typescript
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasSeenTour: true },
  });

  return NextResponse.json({ ok: true });
}
```

---

### Fáze 4: Welcome screen po aktivaci

**Cíl:** Když manažer aktivuje makléře a ten se poprvé přihlásí na dashboard, vidí WOW welcome screen.

#### 4.1 Welcome overlay

**Nový soubor:** `components/pwa/tour/WelcomeScreen.tsx`

Zobrazí se PŘED tour (pokud `hasSeenTour === false`):

```tsx
export function WelcomeScreen({ userName, onStart }: { userName: string; onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-center px-8"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-3xl font-extrabold text-white">
            Car<span className="text-orange-500">Makléř</span>
          </span>
        </motion.div>

        {/* Welcome text */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-extrabold text-white mt-8"
        >
          Vítejte, {userName}!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-gray-400 mt-3 max-w-xs"
        >
          Váš účet je aktivní. Pojďme si projít, jak aplikace funguje.
        </motion.p>

        {/* Stats preview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center gap-8 mt-8"
        >
          <StatPreview value="5%" label="Provize" />
          <StatPreview value="PWA" label="Offline app" />
          <StatPreview value="AI" label="Asistent" />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <button
            onClick={onStart}
            className="mt-10 px-8 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all"
          >
            Prohlédnout aplikaci
          </button>
          <button
            onClick={() => { fetch("/api/broker/tour-complete", { method: "POST" }); onStart(); }}
            className="block mx-auto mt-3 text-sm text-gray-500 hover:text-gray-300"
          >
            Přeskočit průvodce
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
```

#### 4.2 Flow: Welcome → Tour → Dashboard

```
Manažer aktivuje makléře (status: ONBOARDING → ACTIVE)
    ↓
Makléř se přihlásí → middleware přesměruje na /makler/dashboard
    ↓
Dashboard zjistí hasSeenTour === false
    ↓
Zobrazí WelcomeScreen (fullscreen dark overlay)
    ↓
Klik "Prohlédnout aplikaci"
    ↓
Spustí AppTour (7 kroků s spotlight efektem)
    ↓
Po dokončení: POST /api/broker/tour-complete → hasSeenTour = true
    ↓
Dashboard normálně viditelný
```

---

### Fáze 5: Kontextová nápověda (Tooltips)

**Cíl:** Popisky/nápověda ke klíčovým elementům v celé PWA.

#### 5.1 Help tooltip komponenta

**Nový soubor:** `components/ui/HelpTooltip.tsx`

Jednoduchá komponenta — otazníček v kroužku, po kliknutí (ne hover — mobil!) zobrazí popover:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface HelpTooltipProps {
  text: string;
  className?: string;
}

export function HelpTooltip({ text, className }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center hover:bg-gray-300 transition-colors"
        aria-label="Nápověda"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
```

#### 5.2 Kde přidat tooltips

| Soubor | Element | Nápověda text |
|--------|---------|---------------|
| `components/pwa/dashboard/StatsRow.tsx` | "Provize" label | "Celková provize za tento měsíc. Provize = 5% z prodejní ceny, min. 25 000 Kč." |
| `components/pwa/dashboard/StatsRow.tsx` | "Prodeje" label | "Počet úspěšně dokončených prodejů tento měsíc." |
| `components/pwa/dashboard/StatsRow.tsx` | "Aktivní" label | "Počet vozidel, která jsou aktuálně v nabídce." |
| `components/pwa/dashboard/AddVehicleCTA.tsx` | Quick mode toggle | "Rychlý režim: vyplníte jen VIN + fotky, zbytek doplní AI." |
| `components/pwa/dashboard/FollowUpSection.tsx` | Section title | "Kontakty, u kterých je čas na follow-up. Pravidelná komunikace = více prodejů." |
| `components/pwa/gamification/LevelBadge.tsx` | Badge | "Vaše úroveň závisí na obratu. Vyšší úroveň = vyšší provize." |
| Onboarding: IBAN pole | Label | "IBAN vašeho podnikatelského účtu pro vyplácení provizí." |
| Onboarding: Specializace | Label | "Vyberte typy vozidel, na které se zaměřujete. Klienti vás díky tomu snáze najdou." |

**Použití v komponentě:**

```tsx
import { HelpTooltip } from "@/components/ui/HelpTooltip";

<div className="flex items-center gap-1.5">
  <span className="text-xs text-gray-500">Provize</span>
  <HelpTooltip text="Celková provize za tento měsíc. Provize = 5% z prodejní ceny, min. 25 000 Kč." />
</div>
```

---

### Fáze 6: Drobné WOW detaily

#### 6.1 Skeleton loading pro onboarding kroky

Stávající `loading.tsx` soubory v onboardingu zobrazují spinner. Nahradit za skeleton loading (content placeholder).

#### 6.2 Micro-interakce na formulářích

- Úspěšná validace pole → zelený checkmark animace (scale in)
- Fotka nahrána → preview s fade-in efektem
- Dokument nahrán → progress bar + success animace
- Quiz odpověď správně → zelené bliknutí + jemný shake pro špatnou

#### 6.3 Onboarding header — gradient pozadí

**Soubor:** `app/(pwa)/makler/onboarding/layout.tsx`

Změnit header z `bg-white` na subtle gradient:

```tsx
<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
  <div className="max-w-2xl mx-auto px-4 py-4">
    <h1 className="text-lg font-bold text-white mb-4">Onboarding</h1>
    {/* Progress bar s bílými kroužky místo oranžových */}
  </div>
</div>
```

#### 6.4 Approval page — animovaná timeline

**Soubor:** `app/(pwa)/makler/onboarding/approval/page.tsx`

Vylepšit čekací stránku — místo statických bodů přidat animovanou timeline:

```tsx
<motion.ul className="space-y-4">
  {steps.map((step, i) => (
    <motion.li
      key={i}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.3 }}
      className="flex items-start gap-3"
    >
      <motion.div
        animate={i === 0 ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"
      >
        {/* icon */}
      </motion.div>
      <span>{step.text}</span>
    </motion.li>
  ))}
</motion.ul>
```

---

## Přehled všech změn

| # | Soubor | Akce | Fáze |
|---|--------|------|------|
| 1 | `prisma/schema.prisma` | EDIT — přidat `hasSeenTour` do User | 3 |
| 2 | `app/(web)/registrace/page.tsx` | EDIT — hero sekce, trust badges, success animace | 1 |
| 3 | `app/(web)/registrace/makler/page.tsx` | EDIT — welcome karta, success animace | 1 |
| 4 | `components/ui/Confetti.tsx` | NOVÝ — konfety CSS animace | 1 |
| 5 | `components/pwa/onboarding/OnboardingProgress.tsx` | EDIT — Framer Motion animace | 2 |
| 6 | `app/(pwa)/makler/onboarding/layout.tsx` | EDIT — page transition, gradient header, progress text | 2 |
| 7 | `components/pwa/onboarding/StepComplete.tsx` | NOVÝ — celebration overlay | 2 |
| 8 | Onboarding page.tsx soubory (×4) | EDIT — motivační texty | 2 |
| 9 | `components/pwa/tour/AppTour.tsx` | NOVÝ — hlavní tour komponenta | 3 |
| 10 | `components/pwa/tour/TourSpotlight.tsx` | NOVÝ — spotlight efekt | 3 |
| 11 | `components/pwa/tour/AppTourWrapper.tsx` | NOVÝ — client wrapper | 3 |
| 12 | `app/api/broker/tour-complete/route.ts` | NOVÝ — API pro dokončení tour | 3 |
| 13 | `components/pwa/dashboard/StatsRow.tsx` | EDIT — data-tour atribut | 3 |
| 14 | `components/pwa/dashboard/AddVehicleCTA.tsx` | EDIT — data-tour atribut | 3 |
| 15 | `components/pwa/dashboard/NotificationsList.tsx` | EDIT — data-tour atribut | 3 |
| 16 | `components/pwa/BottomNav.tsx` | EDIT — data-tour atributy | 3 |
| 17 | `components/pwa/TopBar.tsx` | EDIT — data-tour atribut | 3 |
| 18 | `app/(pwa)/makler/dashboard/page.tsx` | EDIT — tour trigger, hasSeenTour query | 3+4 |
| 19 | `components/pwa/tour/WelcomeScreen.tsx` | NOVÝ — fullscreen welcome overlay | 4 |
| 20 | `components/ui/HelpTooltip.tsx` | NOVÝ — tooltip s otazníčkem | 5 |
| 21 | Různé PWA komponenty (×8) | EDIT — přidat HelpTooltip | 5 |
| 22 | `app/(pwa)/makler/onboarding/approval/page.tsx` | EDIT — animovaná timeline | 6 |
| 23 | Onboarding loading.tsx soubory | EDIT — skeleton loading | 6 |

## STOP pravidla

| # | Podmínka | Akce |
|---|----------|------|
| STOP-1 | Prisma migrace selže (hasSeenTour) | Standard `migrate reset --force` (dev only) |
| STOP-2 | Tour spotlight nefunguje na mobilech | Zjednodušit na fullscreen card bez spotlight |
| STOP-3 | Framer Motion import zvětší bundle nad 50 KB | Použít CSS animace místo FM pro menší komponenty |
| STOP-4 | Onboarding page transitions nefungují (App Router limitation) | Použít CSS transitions místo AnimatePresence |

## Pořadí implementace

1. **Fáze 2** (onboarding WOW) — nejrychlejší vizuální dopad, žádné DB změny
2. **Fáze 1** (registrace WOW) — vizuální vylepšení bez závislostí
3. **Fáze 3 + 4** (tour + welcome) — vyžaduje DB migraci (hasSeenTour)
4. **Fáze 5** (tooltips) — nezávislé, přidávat postupně
5. **Fáze 6** (detaily) — polish, nejnižší priorita

## Technické poznámky

- **Framer Motion** — již v `package.json` (`^12.38.0`), lze přímo importovat
- **Žádná nová závislost** — vše řešitelné FM + CSS + nativní JS
- **canvas-confetti** — volitelná micro-knihovna (6 KB) pro konfety; alternativně čisté CSS
- **Tour spotlight** — clip-path je lepší než box-shadow overlay (performance)
- **Mobile-first** — tour musí fungovat na 375px, tooltips musí být tap-friendly (ne hover)
- **Offline** — tour data jsou lokální (žádný fetch), `hasSeenTour` POST může čekat na sync

## Acceptance criteria

1. ✅ Registrační stránky mají motivační hero sekci a trust badges
2. ✅ Success screen po registraci má animaci (checkmark + celebratory text)
3. ✅ Onboarding progress bar má Framer Motion animace
4. ✅ Přechod mezi onboarding kroky má page transition animaci
5. ✅ Po dokončení každého onboarding kroku se zobrazí celebration overlay
6. ✅ Texty v onboardingu jsou motivační, ne jen funkční
7. ✅ Po prvním přihlášení do dashboardu se zobrazí welcome screen
8. ✅ Po welcome screen se spustí 7-krokový interaktivní tour
9. ✅ Tour zvýrazňuje konkrétní elementy spotlight efektem
10. ✅ Tour lze přeskočit ("Přeskočit tour")
11. ✅ Po dokončení/přeskočení tour se hasSeenTour nastaví na true
12. ✅ HelpTooltip komponenta funguje na mobilu (tap, ne hover)
13. ✅ Klíčové dashboard elementy mají tooltip nápovědu
14. ✅ Žádné nové npm závislosti (kromě volitelného canvas-confetti)
15. ✅ Vše funguje na mobilech (375px+)
