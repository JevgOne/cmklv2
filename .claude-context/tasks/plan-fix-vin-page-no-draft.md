# Implementační plán — Fix: /makler/vehicles/new/vin bez draftu → prázdná stránka

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** Task #14  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Analýza problému

### Co se děje

Když makléř přejde přímo na `/makler/vehicles/new/vin` (bez `?draft=XXX` query parametru), stránka vykreslí VinStep s prázdným draft kontextem. VinStep se inicializuje s `draft?.vin?.vin ?? ""` — tedy prázdný VIN input, ale **žádný draft neexistuje**. Makléř může vyplnit VIN, ale při pokusu o pokračování (handleNext) se volá `saveDraft()` + `router.push(/makler/vehicles/new/photos?draft=${draft?.id})` — `draft?.id` je **undefined**, výsledná URL je `/makler/vehicles/new/photos?draft=undefined`.

### Proč se to stane

Normální flow: `/makler/vehicles/new` → klik "Nabrat nové auto" → `createDraft()` → redirect na `/makler/vehicles/new/contact?draft={id}`.

Ale makléř může přistoupit na libovolný step přímo:
- Záložka v browseru
- Sdílený link
- Browser history (po refreshi ztratí in-memory draft context)
- Deep link z jiné aplikace

### Rozsah problému

**VŠECHNY step stránky** mají identický pattern:

```typescript
// Každý step page (contact, inspection, vin, photos, details, pricing, review):
export default function XxxPage() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, loadDraft, loading } = useDraftContext();

  useEffect(() => {
    if (draftId && !draft) {
      loadDraft(draftId);   // ← jen pokud draftId existuje v URL
    }
  }, [draftId, draft, loadDraft]);

  if (loading || (!draft && draftId)) {
    return <Spinner />;    // ← spinner jen pokud draftId existuje ale draft ještě nenačten
  }

  return <XxxStep />;     // ← pokud NENÍ draftId v URL → rovnou renderuje step BEZ draftu
}
```

**Problém je v podmínce:** Pokud `draftId` je `null` (žádný `?draft=` v URL), stránka:
1. Nepokusí se načíst draft
2. Neredirectuje pryč
3. Rovnou renderuje step komponentu s `draft === null`
4. Step funguje "napůl" — formuláře se zobrazí (s defaulty z `draft?.xxx ?? ""`), ale data se nikam neuloží

### Postižené stránky

| URL | Soubor | Bug |
|-----|--------|-----|
| `/makler/vehicles/new/contact` | `app/(pwa)/makler/vehicles/new/contact/page.tsx` | ✅ Stejný |
| `/makler/vehicles/new/inspection` | `app/(pwa)/makler/vehicles/new/inspection/page.tsx` | ✅ Stejný |
| `/makler/vehicles/new/vin` | `app/(pwa)/makler/vehicles/new/vin/page.tsx` | ✅ Stejný |
| `/makler/vehicles/new/photos` | `app/(pwa)/makler/vehicles/new/photos/page.tsx` | ✅ Stejný |
| `/makler/vehicles/new/details` | `app/(pwa)/makler/vehicles/new/details/page.tsx` | ✅ Stejný |
| `/makler/vehicles/new/pricing` | `app/(pwa)/makler/vehicles/new/pricing/page.tsx` | ✅ Stejný |
| `/makler/vehicles/new/review` | `app/(pwa)/makler/vehicles/new/review/page.tsx` | ✅ Stejný |

---

## Doporučené řešení

### Možnost A: Redirect na draft hub (DOPORUČENO — nejjednodušší + nejbezpečnější)

Pokud stránka nemá `?draft=` parametr, redirect na `/makler/vehicles/new` (draft hub), kde makléř může vytvořit nový draft nebo pokračovat v existujícím.

**Implementace — v KAŽDÉM step page:**

```typescript
export default function VinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, loadDraft, loading } = useDraftContext();

  useEffect(() => {
    if (!draftId) {
      router.replace("/makler/vehicles/new");  // ← NOVÉ: redirect pokud chybí draft
      return;
    }
    if (!draft) {
      loadDraft(draftId);
    }
  }, [draftId, draft, loadDraft, router]);

  if (!draftId || loading || (!draft && draftId)) {
    return <Spinner />;
  }

  return <VinStep />;
}
```

**Výhody:**
- Jednoduché, bezpečné
- Makléř vidí své drafty a může pokračovat
- Žádná ztráta dat

**Nevýhody:**
- Extra klik pro makléře (musí zvolit/vytvořit draft)

### Možnost B: Auto-create draft + redirect zpět

Pokud chybí `?draft=`, automaticky vytvořit draft a redirect na stejnou stránku s novým draft ID.

```typescript
useEffect(() => {
  if (!draftId) {
    createDraft().then(id => {
      router.replace(`/makler/vehicles/new/vin?draft=${id}`);
    });
    return;
  }
  // ...
}, [draftId, ...]);
```

**Výhody:**
- Seamless — makléř zůstane na VIN stránce

**Nevýhody:**
- Vytváří "prázdné" drafty (bez kontaktu, inspekce) — přeskakuje kroky 1-2
- U jiných stepů (photos, pricing) je to nesmysl bez předchozích dat

### Možnost C: Centrální guard v layout (NEJELEGANTNĚJŠÍ)

Přidat guard přímo do `app/(pwa)/makler/vehicles/new/layout.tsx` — jeden fix pro všechny stepy.

**Problém:** Layout je Server Component OR Client Component — `useSearchParams()` funguje jen v Client Component. Layout ale nemá přístup k route pathname (nevíme zda jsme na hub `/new` nebo na stepu `/new/vin`).

**Alternativa:** Middleware route guard, ale to komplikuje a je overkill.

---

## Doporučený plán: Možnost A

### KROK 1: Vytvořit shared komponentu `StepPageGuard`

**Vytvořit:** `components/pwa/vehicles/new/StepPageGuard.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";

interface StepPageGuardProps {
  children: React.ReactNode;
}

export function StepPageGuard({ children }: StepPageGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, loadDraft, loading } = useDraftContext();

  useEffect(() => {
    if (!draftId) {
      router.replace("/makler/vehicles/new");
      return;
    }
    if (!draft) {
      loadDraft(draftId);
    }
  }, [draftId, draft, loadDraft, router]);

  if (!draftId || loading || !draft) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
```

**Cílový počet řádků:** ~35

### KROK 2: Aktualizovat všech 7 step pages

Nahradit duplicitní logiku v každém step page za `StepPageGuard`:

```typescript
// PŘED (každý step page, ~29 řádků):
"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { VinStep } from "@/components/pwa/vehicles/new/VinStep";
import { useDraftContext } from "@/lib/hooks/useDraft";

export default function VinPage() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, loadDraft, loading } = useDraftContext();
  // ... 15 řádků boilerplate ...
  return <VinStep />;
}

// PO (každý step page, ~12 řádků):
"use client";
import { VinStep } from "@/components/pwa/vehicles/new/VinStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function VinPage() {
  return (
    <StepPageGuard>
      <VinStep />
    </StepPageGuard>
  );
}
```

**Postižené soubory (7):**
1. `app/(pwa)/makler/vehicles/new/contact/page.tsx`
2. `app/(pwa)/makler/vehicles/new/inspection/page.tsx`
3. `app/(pwa)/makler/vehicles/new/vin/page.tsx`
4. `app/(pwa)/makler/vehicles/new/photos/page.tsx`
5. `app/(pwa)/makler/vehicles/new/details/page.tsx`
6. `app/(pwa)/makler/vehicles/new/pricing/page.tsx`
7. `app/(pwa)/makler/vehicles/new/review/page.tsx`

**Success page** (`/new/success`) se NEUPRAVUJE — ta nepotřebuje draft.

---

## Soubory k vytvoření

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `components/pwa/vehicles/new/StepPageGuard.tsx` | Component | Shared guard: no draft → redirect to hub |

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 2-8 | 7 step pages (viz výše) | Wrap step komponentu do `<StepPageGuard>` |

---

## STOP kritéria

1. `/makler/vehicles/new/vin` (bez `?draft=`) → redirect na `/makler/vehicles/new`
2. `/makler/vehicles/new/photos` (bez `?draft=`) → redirect na `/makler/vehicles/new`
3. Všech 7 step stránek redirectuje bez draft parametru
4. `/makler/vehicles/new/vin?draft=XXX` → normální funkce (beze změny)
5. `/makler/vehicles/new/vin?draft=neexistujici_id` → loading → error state (stávající chování)
6. `/makler/vehicles/new/success` → BEZ guardu (funguje bez draftu)
7. `npm run build` projde bez chyb

---

## Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| Break existujících linků s `?draft=` | Nulová | Guard jen přidává redirect pro chybějící draft, stávající flow nezměněn |
| Infinite redirect loop | Nízká | Hub page (`/new`) nemá guard — je to cílová stránka redirectu |
| DraftProvider reset při redirect | Nízká | Provider je v layout — přežije navigaci v rámci `/new/*` |

---

*Plán připraven: 2026-04-26*  
*Čeká na schválení team leadem*
