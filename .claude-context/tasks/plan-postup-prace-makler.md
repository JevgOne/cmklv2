# Plan — Postup práce makléře — checklist workflow v PWA

**Datum:** 2026-04-12
**Agent:** Plánovač
**Zdroj:** Task #31 (team-lead, inspirace Autorro — VEŠKERÝ obsah musí být originální CarMakler)
**Effort:** ~4-5h
**DB migrace:** 1 (přidat `Vehicle.workflowChecklist String?` pole)

---

## §0 Executive summary

Interaktivní checklist workflow v makléřské PWA. Makléř vidí celý postup práce od prvního kontaktu po prodej jako vizuální checklist s fázemi a kroky. Systém hlídá co chybí, doporučuje další krok, a navazuje na existující data (fotky, smlouva, VIN).

**Existující vzor:** `HandoverChecklist.tsx` (5 položek, toggle, progress bar, submit) — rozšíříme pattern na celý workflow.

**Co se mění:**
- **1 DB migrace:** `Vehicle.workflowChecklist String?` (JSON pole)
- **1 nový soubor:** `components/pwa/vehicles/WorkflowChecklist.tsx` (~250 lines)
- **1 edit:** `app/(pwa)/makler/vehicles/[id]/page.tsx` — přidat WorkflowChecklist tab/section
- **1 nový API route:** `app/api/vehicles/[id]/workflow/route.ts` — GET/PUT checklist data

---

## §1 Workflow fáze a kroky

Adaptace Autorro postupu na CarMakler proces. 9 fází, 28 kroků.

### Fáze 1: Příprava (před schůzkou)

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 1.1 | Kontakt s prodejcem | `draft.contact.phone` exists | Telefonát dle callscriptu, domluvit termín |
| 1.2 | Ověřit základní info o voze | `draft.contact.brand` exists | Značka, model, rok, najeto, cena — z inzerátu nebo telefonu |
| 1.3 | Naplánovat schůzku | `draft.contact.appointmentDate` exists | Datum + čas + místo setkání |

### Fáze 2: Vybavení (den schůzky)

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 2.1 | Měřič tloušťky laku | manual | Funkční, nabito |
| 2.2 | Baterka | manual | Pro kontrolu podvozku a motorového prostoru |
| 2.3 | Utěrka na čištění | manual | Očistit VIN štítek, SPZ |
| 2.4 | Nabitý telefon + paměť | manual | Pro fotodokumentaci (min. 2 GB volného místa) |

### Fáze 3: Osobní prohlídka

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 3.1 | Exteriér — vizuální kontrola | manual | Lak, rzi, promáčkliny, praskliny |
| 3.2 | Měření laku na každém dílu | manual | Zaznamenat hodnoty, hledat přelakované díly |
| 3.3 | Interiér — stav sedadel, palubky | manual | Opotřebení, zápach, funkce ovládacích prvků |
| 3.4 | Motor — vizuální kontrola | manual | Úniky, koroze, stav řemenů |
| 3.5 | Testovací jízda | manual | Převodovka, brzdy, podvozek, řízení, vibrace |

### Fáze 4: Fotodokumentace

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 4.1 | Nafotit dle fotomanuálu (13 pozic) | `photos.filter(ext_*).length >= 8` | Exteriér dle fotomanuálu |
| 4.2 | Interiér + motor | `photos.filter(int_*|eng_*).length >= 5` | Interiér 4 + motor 1 |
| 4.3 | Důkazní fotky (tachometr, VIN, klíče) | `photos.filter(evi_*).length >= 3` | Povinné 3 důkazní fotky |
| 4.4 | Vyfotit velký TP (obě strany) | `photos.filter(doc_*).length >= 1` | Technický průkaz |
| 4.5 | Fotky defektů | `defectPhotos.length > 0` OR manual | Pokud nalezeny defekty, vyfotit detail |

### Fáze 5: Zadání do systému

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 5.1 | VIN dekódování | `vehicle.vin` exists | Zadat VIN, ověřit dekódovaná data |
| 5.2 | Zapsat výbavu | `vehicle.equipment` not empty | Vybrat vybavení ze seznamu |
| 5.3 | Zapsat info o voze | `vehicle.description` length >= 20 | Rok, najeto, stav, palivo, převodovka, popis |
| 5.4 | STK + emise | manual | Zapsat datum platnosti STK a EK |
| 5.5 | Počet klíčů, sezónní pneu | manual | Servisní historie, další doplňky |

### Fáze 6: Cena a smlouva

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 6.1 | Dohodnout prodejní cenu | `vehicle.price > 0` | Cena dohodnutá s prodejcem |
| 6.2 | Dohodnout provizi | `vehicle.commission > 0` | Min. 5% / 25 000 Kč |
| 6.3 | Podepsat smlouvu | `contracts.some(signed)` | Exkluzivní zprostředkovatelská smlouva (2 kopie) |

### Fáze 7: Ověření

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 7.1 | CEBIA prověrka | manual (API check possible) | Ověření historie vozu přes CEBIA |

### Fáze 8: Publikace

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 8.1 | Úprava fotek | manual | Ořez, úprava jasu/kontrastu (volitelné) |
| 8.2 | Seřadit fotky | manual | Dle fotomanuálu: 1_ZNACKA_MODEL, 2_... |
| 8.3 | Publikovat inzerát | `vehicle.status === "ACTIVE"` | Odeslat ke schválení → BackOffice aktivuje |

### Fáze 9: Záloha

| # | Krok | Auto-check? | Popis |
|---|------|-------------|-------|
| 9.1 | Záloha fotek | manual | Cloud/disk záloha originálních fotek |

---

## §2 Architektura

### 2.1 Data model

```typescript
// Uloženo v Vehicle.workflowChecklist (JSON string)
interface WorkflowChecklistData {
  steps: Record<string, {
    checked: boolean;
    checkedAt?: string;  // ISO date
    autoChecked?: boolean; // true = systém ověřil automaticky
    note?: string;  // volitelná poznámka makléře
  }>;
  lastUpdated: string; // ISO date
}
```

**Proč JSON string a ne relační tabulka:**
- Checklist je per-vehicle, 28 kroků max
- Nepotřebujeme queryovat individuální kroky
- Jednoduchý read/write, žádné JOIN
- Kompatibilní s offline (IndexedDB cache)

### 2.2 Auto-check pattern

Některé kroky se mohou automaticky odškrtnout na základě existujících dat:

```typescript
function computeAutoChecks(vehicle: Vehicle, photos: Photo[], contracts: Contract[]): Record<string, boolean> {
  return {
    "1.1": !!vehicle.sellerPhone,
    "1.2": !!vehicle.brand && !!vehicle.model,
    "1.3": false, // manual
    // ...
    "4.1": photos.filter(p => p.slotId?.startsWith("ext_")).length >= 8,
    "4.2": photos.filter(p => p.slotId?.startsWith("int_") || p.slotId?.startsWith("eng_")).length >= 5,
    "4.3": photos.filter(p => p.slotId?.startsWith("evi_")).length >= 3,
    // ...
    "5.1": !!vehicle.vin && vehicle.vin.length === 17,
    "6.1": (vehicle.price || 0) > 0,
    "6.3": contracts.some(c => c.status === "SIGNED"),
    "8.3": vehicle.status === "ACTIVE",
  };
}
```

Auto-checked kroky jsou vizuálně odlišené (modrý check místo zeleného) a nelze je manuálně odškrtnout/odškrtnout.

---

## §3 Soubory k vytvoření

### 3.1 DB migrace

```sql
-- prisma/migrations/XXXXXX_add_workflow_checklist/migration.sql
ALTER TABLE "Vehicle" ADD COLUMN "workflowChecklist" TEXT;
```

Schema:
```prisma
model Vehicle {
  // ... existující pole
  workflowChecklist String? // JSON: WorkflowChecklistData
}
```

### 3.2 `components/pwa/vehicles/WorkflowChecklist.tsx` (NEW, ~250 lines)

```typescript
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui";

// ============================================
// WORKFLOW DEFINITION
// ============================================

interface WorkflowStep {
  id: string;      // "1.1", "4.3" etc.
  label: string;
  description: string;
  autoCheckKey?: string; // key pro automatické ověření
}

interface WorkflowPhase {
  id: string;
  label: string;
  icon: string;    // CSS class nebo emoji
  steps: WorkflowStep[];
}

const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    id: "prep",
    label: "Příprava",
    icon: "phone",
    steps: [
      { id: "1.1", label: "Kontakt s prodejcem", description: "Telefonát dle callscriptu, domluvit termín", autoCheckKey: "hasContact" },
      { id: "1.2", label: "Základní info o voze", description: "Značka, model, rok, najeto — z inzerátu", autoCheckKey: "hasBasicInfo" },
      { id: "1.3", label: "Naplánovat schůzku", description: "Datum, čas a místo setkání" },
    ],
  },
  {
    id: "equipment",
    label: "Vybavení",
    icon: "briefcase",
    steps: [
      { id: "2.1", label: "Měřič tloušťky laku", description: "Funkční, nabitý" },
      { id: "2.2", label: "Baterka", description: "Pro kontrolu podvozku a motoru" },
      { id: "2.3", label: "Utěrka na čištění", description: "Očistit VIN štítek, SPZ" },
      { id: "2.4", label: "Nabitý telefon + paměť", description: "Min. 2 GB volného místa pro fotky" },
    ],
  },
  {
    id: "inspection",
    label: "Osobní prohlídka",
    icon: "search",
    steps: [
      { id: "3.1", label: "Exteriér — vizuální kontrola", description: "Lak, rzi, promáčkliny, praskliny" },
      { id: "3.2", label: "Měření laku", description: "Na každém dílu, hledat přelakované díly" },
      { id: "3.3", label: "Interiér — stav", description: "Sedadla, palubka, zápach, ovládací prvky" },
      { id: "3.4", label: "Motor — vizuální kontrola", description: "Úniky, koroze, stav řemenů" },
      { id: "3.5", label: "Testovací jízda", description: "Převodovka, brzdy, podvozek, řízení" },
    ],
  },
  {
    id: "photos",
    label: "Fotodokumentace",
    icon: "camera",
    steps: [
      { id: "4.1", label: "Exteriér dle fotomanuálu", description: "13 pozic dle průvodce", autoCheckKey: "hasExteriorPhotos" },
      { id: "4.2", label: "Interiér + motor", description: "4 interiér + 1 motorový prostor", autoCheckKey: "hasInteriorPhotos" },
      { id: "4.3", label: "Důkazní fotky", description: "Tachometr, VIN štítek, klíče s doklady", autoCheckKey: "hasEvidencePhotos" },
      { id: "4.4", label: "Technický průkaz", description: "Obě strany velkého TP" },
      { id: "4.5", label: "Defekty", description: "Detailní fotky nalezených defektů" },
    ],
  },
  {
    id: "data",
    label: "Zadání do systému",
    icon: "edit",
    steps: [
      { id: "5.1", label: "VIN dekódování", description: "Zadat 17místný VIN kód", autoCheckKey: "hasVin" },
      { id: "5.2", label: "Výbava", description: "Vybrat vybavení ze seznamu" },
      { id: "5.3", label: "Popis vozidla", description: "Min. 20 znaků, klíčové info pro kupce", autoCheckKey: "hasDescription" },
      { id: "5.4", label: "STK + emise", description: "Datum platnosti STK a EK" },
      { id: "5.5", label: "Doplňky", description: "Počet klíčů, sezónní pneu, servisní historie" },
    ],
  },
  {
    id: "price",
    label: "Cena a smlouva",
    icon: "handshake",
    steps: [
      { id: "6.1", label: "Dohodnout prodejní cenu", description: "Cena s prodejcem", autoCheckKey: "hasPrice" },
      { id: "6.2", label: "Dohodnout provizi", description: "Min. 5% z ceny / 25 000 Kč" },
      { id: "6.3", label: "Podepsat smlouvu", description: "Exkluzivní zprostředkovatelská smlouva (2 kopie)", autoCheckKey: "hasSigned" },
    ],
  },
  {
    id: "verify",
    label: "Ověření",
    icon: "shield",
    steps: [
      { id: "7.1", label: "CEBIA prověrka", description: "Ověření historie vozu" },
    ],
  },
  {
    id: "publish",
    label: "Publikace",
    icon: "globe",
    steps: [
      { id: "8.1", label: "Úprava fotek", description: "Ořez, jas, kontrast (volitelné)" },
      { id: "8.2", label: "Seřadit fotky", description: "Dle fotomanuálu — hlavní fotka první" },
      { id: "8.3", label: "Publikovat inzerát", description: "Odeslat ke schválení", autoCheckKey: "isActive" },
    ],
  },
  {
    id: "backup",
    label: "Záloha",
    icon: "cloud",
    steps: [
      { id: "9.1", label: "Záloha fotek", description: "Originální fotky na cloud/disk" },
    ],
  },
];

// ... (zbytek implementace — HandoverChecklist pattern rozšířený o fáze)
```

**UI komponenta:**
- Accordion fází (expandable sections)
- Každá fáze: ikona + název + progress (3/5)
- Kroky: toggle checkbox (manuální) nebo auto-check badge (systém)
- Celkový progress bar nahoře
- "Další doporučený krok" banner (první neodškrtnutý v pořadí)
- Uložit tlačítko → PUT `/api/vehicles/{id}/workflow`

**Vizuální vzor:** Rozšíření `HandoverChecklist.tsx`:
- Stejné toggle buttons (border-2, rounded-xl, green check)
- Přidat accordion pro fáze
- Přidat auto-check vizuální odlišení (modré/šedé check místo zeleného)
- Přidat progress per fáze (X/Y)

### 3.3 `app/api/vehicles/[id]/workflow/route.ts` (NEW, ~60 lines)

```typescript
// GET — načíst workflow checklist
// PUT — uložit workflow checklist

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { workflowChecklist: true, brokerId: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }

  // Ověřit vlastnictví (broker nebo admin)
  if (vehicle.brokerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
  }

  const data = vehicle.workflowChecklist ? JSON.parse(vehicle.workflowChecklist) : { steps: {}, lastUpdated: new Date().toISOString() };
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Ověřit vlastnictví
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { brokerId: true },
  });

  if (!vehicle || (vehicle.brokerId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
  }

  await prisma.vehicle.update({
    where: { id },
    data: { workflowChecklist: JSON.stringify({ ...body, lastUpdated: new Date().toISOString() }) },
  });

  return NextResponse.json({ ok: true });
}
```

---

## §4 Soubory k editaci

### 4.1 `prisma/schema.prisma` — přidat pole

V `model Vehicle` (po existujících polích):

```diff
  // ... existující pole
+ workflowChecklist String?  // JSON: WorkflowChecklistData
```

### 4.2 `app/(pwa)/makler/vehicles/[id]/page.tsx` — přidat WorkflowChecklist

Přidat jako nový tab nebo sekci na vehicle detail stránce:

```typescript
import { WorkflowChecklist } from "@/components/pwa/vehicles/WorkflowChecklist";

// V render:
<WorkflowChecklist vehicleId={vehicle.id} />
```

**Umístění:** Jako tab vedle "Detail" / "Fotky" / "Smlouvy", nebo jako expandable section na detailu.

---

## §5 Implementační pořadí

1. **DB migrace** — přidat `workflowChecklist` pole
2. **API route** — `app/api/vehicles/[id]/workflow/route.ts`
3. **Komponent** — `WorkflowChecklist.tsx` (accordion fáze + toggle kroky)
4. **Integrace** — přidat do vehicle detail page
5. **Auto-check** — propojit s existujícími daty (fotky, VIN, cena, smlouva)
6. **Test** — proklikat workflow, ověřit auto-check, uložit + reload

---

## §6 Acceptance criteria

- [ ] 9 fází, 28 kroků v interaktivním checklistu
- [ ] Toggle na manuální kroky (click → check/uncheck)
- [ ] Auto-check pro kroky s daty v systému (fotky, VIN, cena, smlouva)
- [ ] Auto-checked kroky vizuálně odlišené (modré) od manuálních (zelené)
- [ ] Progress bar per fáze (X/Y) + celkový progress
- [ ] "Další doporučený krok" banner
- [ ] Uložení do DB přes PUT `/api/vehicles/{id}/workflow`
- [ ] Load při otevření přes GET
- [ ] Accordion fáze (expandable/collapsible)
- [ ] Žádný obsah z Autorro (vše originální CarMakler)
- [ ] DB migrace: `workflowChecklist String?` na Vehicle
- [ ] TypeScript: 0 errors
- [ ] Build: passes

---

## §7 STOP kritéria

- **STOP-1:** DB migrace selže na produkci → standard fix: `npx prisma migrate deploy`. Pole je nullable String, žádný default, žádný breaking change.
- **STOP-2:** Auto-check logika je příliš komplexní (potřebuje JOIN přes Vehicle + VehicleImage + Contract) → zjednodušit: auto-check jen z Vehicle polí (VIN, price, status), ne z relací. Fotky a smlouvy nechat manuální.
- **STOP-3:** 28 kroků je příliš na mobilní obrazovku → accordion pattern řeší (jen aktivní fáze expandovaná). Pokud stále nepřehledné → sbalit fáze 2 (Vybavení) a 9 (Záloha) do jedné fáze.
- **STOP-4:** Offline sync — checklist data v IndexedDB vs server → pro MVP neřešit offline sync. Checklist vyžaduje online připojení. Offline drafty mají vlastní step tracking.

---

## §8 Poznámky

### Proč ne relační tabulka
- Checklist je 1:1 k Vehicle, max 28 kroků
- Nepotřebujeme agregovat přes kroky (žádné "kolik makléřů dokončilo krok 3.2?")
- JSON string je jednodušší, rychlejší, a kompatibilní s existujícím pattern (Equipment, documents)

### Rozdíl od HandoverChecklist
- HandoverChecklist = 5 finálních kroků při předání, submit → změna statusu
- WorkflowChecklist = 28 kroků celého procesu, průběžné ukládání, žádná akce na "complete all"
- Oba sdílejí vizuální pattern (toggle buttons, progress bar)

### Budoucí rozšíření (out of scope)
- Callscript template v kroku 1.1
- GPS trackování schůzky
- Automatické řazení fotek (krok 8.2)
- CEBIA API auto-trigger (krok 7.1)
- Reporting: průměrný čas na fázi per makléř
