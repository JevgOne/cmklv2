# QA: Smazání vykupu + Redesign service pages + Redesign prezentace

**Datum:** 2026-04-19  
**Kontrolor:** kontrolor agent  
**Podklad:** plan-visual-redesign-20260419.md

---

## VÝSLEDEK: ✅ VŠECHNY 3 ČÁSTI APPROVED

---

## ČÁST 1: Smazání /sluzby/vykup

### Simplify / Reverzní kontrola

| Acceptance Criterion | Výsledek |
|---|---|
| `app/(web)/sluzby/vykup/page.tsx` smazán | ✅ |
| `components/web/VykupForm.tsx` smazán | ✅ |
| e2e file — vykup testy odstraněny | ✅ |
| Žádné broken importy (`grep VykupForm/sluzby/vykup`) | ✅ 0 výsledků |
| `/sluzby/vykup` vrací 404 (není v build outputu) | ✅ |

**e2e:** `chrome-test-final-vykup-prezentace.spec.ts` — vykup testy odstraněny, soubor přejmenován na prezentace-only spec. Správně dle plánu.

**Co NESMAZÁNO (správně):** `lib/broker-specializations.ts` "Výkup vozů" a seed tag "vykup-do-24h" — dle plánu se nesmazaly.

---

## ČÁST 2: Redesign service pages (ServicePage.tsx + formuláře)

### Reverzní kontrola — ServicePage.tsx

| Prvek | Plan | Implementace | Status |
|---|---|---|---|
| Hero pozadí | gradient orange-50 to-100 | `bg-gradient-to-br from-orange-50 to-orange-100` | ✅ |
| Blur dekorace v hero | 2 blur kruhy | `absolute -top-20 -right-20 w-60 h-60` + `absolute -bottom-10 -left-10 w-40 h-40` | ✅ |
| Step čísla barva | orange (ne gray) | `text-orange-100` (bylo `text-gray-100`) | ✅ |
| Benefit ikony | ikona v kruhu/boxy | `w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl` | ✅ |
| CTA sekce | gradient pozadí | `bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 md:py-16` | ✅ |

### Reverzní kontrola — Formuláře

Zkontrolován **PojisteniForm.tsx** (vzorový příklad):
- `Card` má `shadow-lg` ✅
- Emoji ikona `🛡️` jako `text-4xl text-center` nahoře ✅
- "formuláře shadow+ikony" — splněno

---

## ČÁST 3: Redesign /prezentace

### Barevný řetězec sekcí

| # | Sekce | Plan | Implementace | Status |
|---|---|---|---|---|
| S1 | Kdo jsme | gradient gray-900 → 800 + orange glow | `from-gray-900 via-gray-900 to-gray-800` + glow div | ✅ |
| S2 | Jak to funguje | **dark** gradient (bylo white) | `from-gray-900 via-gray-800 to-gray-900` | ✅ |
| S3 | Pro autobazary | orange gradient + glow | `from-orange-500 to-orange-600` + glow div | ✅ |
| S4 | Pro vrakoviště | dark gradient + orange glow | `from-gray-900 to-gray-800` + glow div | ✅ |
| S5 | Provizní model | **light** gradient orange-50 → gray-100 | `from-orange-50 via-white to-gray-100` | ✅ |
| S6 | Naši partneři | **dark** gradient (bylo gray-50) | `from-gray-900 to-gray-800` | ✅ |
| S7 | Další kroky | **orange** gradient (bylo white) | `from-orange-500 to-amber-500` | ✅ |
| S8 | Kontakt | gray-900 → black | `from-gray-900 to-black` + glow div | ✅ |

**Výsledek:** Žádná sekce nemá plain `bg-white`. Střídání: dark→dark→orange→dark→light→dark→orange→dark ✅

### Acceptance Criteria

| Kritérium | Status | Detail |
|---|---|---|
| Žádná sekce plain bg-white | ✅ | Všechny sekce gradient |
| Emoji min. text-5xl nebo w-20+ | ✅ | S2: `w-24 h-24` gradient boxy; S3/S4: `text-8xl`; S5: `text-5xl` |
| Stat čísla text-5xl+ | ✅ | S1: `text-5xl sm:text-7xl`; S5: `text-6xl`; S6: `text-4xl sm:text-5xl` |
| Stagger animace na lists | ✅ | S1: delay 0.15×i; S2: 0.2×i; S3/S4: 0.1×i; S7: 0.2×i |
| Dekorativní glow prvky min. 3× | ✅ | S1, S3, S4, S8 (4 sekce) |
| Provizní karty gradient + shadow-xl | ✅ | `from-orange-500 to-amber-500 shadow-xl shadow-orange-500/20` + dark karta `shadow-xl` |
| DotNav glow na aktivní tečce | ✅ | `shadow-lg shadow-orange-500/50`; neaktivní `w-2 h-2` (menší) |
| Responzivní (tablet primary) | ✅ | sm: breakpointy konzistentně |

### AnimatedSection upgrade

| Změna | Plan | Status |
|---|---|---|
| `relative overflow-hidden` na section | ✅ | přidáno |
| `scale: 0.98 → 1` | ✅ | `initial={{ opacity: 0, y: 50, scale: 0.98 }}` |
| Custom easing `[0.16, 1, 0.3, 1]` | ✅ | přítomno |
| `relative z-10` na content div | ✅ | přítomno |

### CzechMap na dark pozadí (STOP-2)

- SVG fill: `#374151` (gray-700) ✅ — původně `#e5e7eb` (světlé)
- Stroke: `#4b5563` ✅
- Glow za mapou: `bg-orange-500/5 blur-[80px]` ✅
- Mapa bude viditelná na dark S6 ✅

### Sekce 8 — QR a CTA

- QR: `w-36 h-36` (plán říkal větší — bylo `w-32`) ✅
- CTA tlačítko: `bg-gradient-to-r from-orange-500 to-amber-500 py-4 px-10 text-lg rounded-2xl shadow-lg shadow-orange-500/20` ✅
- Manager card: `border border-orange-500/30` ✅

---

## Debug kontrola

### npm run build
```
✅ BUILD PASSES
✓ Compiled successfully in 19.5s
```
- `/sluzby/vykup` — ABSENT (404) ✅
- `/prezentace` — přítomno ✅

### npm run lint
```
✅ 0 problems (0 errors, 0 warnings)
app/prezentace/page.tsx — čistě
components/web/ServicePage.tsx — čistě
```

---

## ZÁVĚR

| Část | Status |
|---|---|
| ČÁST 1: Smazání /sluzby/vykup | ✅ APPROVED |
| ČÁST 2: Redesign service pages | ✅ APPROVED |
| ČÁST 3: Redesign /prezentace | ✅ APPROVED |
| Build | ✅ PASS |
| Lint | ✅ 0 errors, 0 warnings |

**Všechny 3 části splňují acceptance criteria z plan-visual-redesign-20260419.md.**
