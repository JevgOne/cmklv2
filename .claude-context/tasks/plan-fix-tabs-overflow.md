# FIX P1: Tabs overflow na mobile (375px)

**Soubor:** `components/ui/Tabs.tsx`
**Radek:** 62

## Problem

Wrapper `div[role="tablist"]` na radku 62 ma `flex gap-1 bg-gray-100 p-1 rounded-lg` ale chybi `overflow-x-auto`. Na 375px se tab buttony (kazdy `px-5 py-2.5 whitespace-nowrap`) nevejdou a zpusobuji horizontalni scroll cele stranky.

Dotcene admin stranky: vehicles (525px), brokers (534px), payments (450px), orders (490px), returns (666px).

## Fix

**Radek 62 — zmenit z:**
```tsx
className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg", className)}
```

**Na:**
```tsx
className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto", className)}
```

Jediny 1-radkovy diff: pridat `overflow-x-auto` do className.

## Overeni

Na 375px viewport:
- Tabs se budou horizontalne scrollovat uvnitr wrapperu
- Stranka nebude mit horizontalni overflow
- Desktop (1280px) bude bez zmeny (vsechny taby se vejdou)

## Rizika

Zadna — `overflow-x-auto` se aktivuje jen kdyz obsah presahne sirku kontejneru. Na desktopu neni viditelny efekt.

**Poznamka:** Volitelne pridat `-webkit-overflow-scrolling: touch` (Tailwind nema built-in tridu) a `scrollbar-hide` pro lepsi mobile UX, ale to neni nutne pro P1 fix.
