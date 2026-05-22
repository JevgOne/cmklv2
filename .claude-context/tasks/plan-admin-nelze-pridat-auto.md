# Plan: Admin — nelze přidat auto

## Analýza problému

### 1. Tlačítko "Přidat vozidlo" je disabled

**Soubor:** `components/admin/VehiclesPageContent.tsx`, řádky 192–194

```tsx
<Button variant="primary" size="sm" disabled>
  Přidat vozidlo
</Button>
```

Tlačítko existuje, ale je `disabled` — nemá žádný `onClick` handler ani `href`.

### 2. Chybí stránka pro přidání vozidla

- `app/(admin)/admin/vehicles/new/` — **NEEXISTUJE**
- `app/(admin)/admin/vehicles/[id]/` — **NEEXISTUJE** (ani detail, ani edit)
- Existuje pouze: `app/(admin)/admin/manager/vehicles/[id]/edit/` — pro MANAGER roli

### 3. Chybí API endpoint pro vytvoření vozidla v admin

- `app/api/admin/vehicles/route.ts` — má pouze **GET** (seznam)
- `app/api/admin/vehicles/[id]/approve/route.ts` — schvalování
- Žádný **POST** endpoint pro vytvoření vozidla z admin panelu

### 4. Existující links v tabulce vedou nikam

V `VehiclesPageContent.tsx` řádky 32–43 jsou akční tlačítka:
- `👁 Zobrazit` → `/admin/vehicles/${vehicleId}` — **stránka neexistuje**
- `✏️ Upravit` → `/admin/vehicles/${vehicleId}/edit` — **stránka neexistuje**

## Business kontext

Vozidla se primárně přidávají přes:
1. **PWA makléře** (`/makler/vehicles/new/`) — multi-step wizard (VIN → details → photos → pricing → review)
2. **Partner PWA** (`/partner/vehicles/new/`) — pro autobazary

Admin panel slouží ke **schvalování a správě** vozidel, ne k jejich přidávání. Otázka je, zda admin potřebuje:
- **A)** Vlastní formulář pro přidání vozidla (plný admin flow)
- **B)** Jen opravu disabled stavu + redirect na existující flow

## Doporučení

**Varianta A je správná** — Admin/BackOffice potřebuje mít možnost přidat vozidlo (např. na žádost zákazníka po telefonu). Ale rozsah je velký.

**Pro MVP:** Zprovoznit alespoň detail + edit vozidla v admin panelu a tlačítko "Přidat vozidlo" buď odkázat na zjednodušený formulář, nebo ponechat disabled s tooltipem "Vozidla přidávají makléři přes PWA".

## Řešení — Fáze 1 (minimum viable fix)

### Krok 1: Vytvořit admin vehicle detail page

**Nový soubor:** `app/(admin)/admin/vehicles/[id]/page.tsx`

Zobrazí detail vozidla (read-only). Využije existující data z `prisma.vehicle.findUnique()`.

```tsx
// Server Component — fetch vehicle detail
// Zobrazí: brand, model, VIN, cena, stav, makléř, fotky, trust score, datum
// Akční tlačítka: Schválit/Zamítnout (pro PENDING), Upravit, Zpět na seznam
```

### Krok 2: Vytvořit admin vehicle edit page

**Nový soubor:** `app/(admin)/admin/vehicles/[id]/edit/page.tsx`

Využít existující `VehicleEditForm` komponentu (`components/admin/VehicleEditForm.tsx`), která už existuje a je používána na `/admin/manager/vehicles/[id]/edit/`.

### Krok 3: Opravit tlačítko "Přidat vozidlo"

**Soubor:** `components/admin/VehiclesPageContent.tsx`, řádky 192–194

Dvě varianty:
- **A)** Změnit na Link → `/admin/vehicles/new` + vytvořit novou stránku
- **B)** Ponechat disabled + přidat tooltip "Vozidla přidávají makléři přes PWA aplikaci"

**Doporučení:** Varianta B pro MVP, varianta A ve fázi 2.

```tsx
// Varianta B — MVP
<Button variant="primary" size="sm" disabled title="Vozidla přidávají makléři přes PWA aplikaci">
  Přidat vozidlo
</Button>
```

### Krok 4: Opravit nefunkční action links v tabulce

**Soubor:** `components/admin/VehiclesPageContent.tsx`

Linky `👁 Zobrazit` a `✏️ Upravit` budou fungovat po vytvoření stránek v krocích 1–2.

## Dotčené soubory

| Soubor | Akce |
|--------|------|
| `app/(admin)/admin/vehicles/[id]/page.tsx` | **NOVÝ** — detail vozidla |
| `app/(admin)/admin/vehicles/[id]/loading.tsx` | **NOVÝ** — loading state |
| `app/(admin)/admin/vehicles/[id]/error.tsx` | **NOVÝ** — error boundary |
| `app/(admin)/admin/vehicles/[id]/edit/page.tsx` | **NOVÝ** — edit formulář |
| `app/(admin)/admin/vehicles/[id]/edit/loading.tsx` | **NOVÝ** — loading state |
| `app/(admin)/admin/vehicles/[id]/edit/error.tsx` | **NOVÝ** — error boundary |
| `components/admin/VehiclesPageContent.tsx` | **EDIT** — tooltip na disabled tlačítko |
| `app/api/admin/vehicles/[id]/route.ts` | **NOVÝ** — GET detail + PATCH update |

## Acceptance Criteria

- [ ] Admin vidí detail vozidla po kliknutí na 👁
- [ ] Admin může editovat vozidlo po kliknutí na ✏️
- [ ] Tlačítko "Přidat vozidlo" má tooltip vysvětlující, že vozidla přidávají makléři
- [ ] API endpoint GET /api/admin/vehicles/[id] vrací detail vozidla
- [ ] API endpoint PATCH /api/admin/vehicles/[id] umožňuje edit

## Složitost

**Střední** — 6 nových souborů, 1 edit. Využívá existující `VehicleEditForm` komponentu.

## ⚠️ STOP-1 Eskalace

Před implementací je třeba ujasnit s leadem:
1. Má admin mít možnost PŘIDÁVAT vozidla, nebo jen spravovat existující?
2. Pokud ano — v jaké fázi? (MVP = jen detail/edit, fáze 2 = přidávání)
