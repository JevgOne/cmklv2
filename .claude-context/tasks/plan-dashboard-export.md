# Implementační plán — Dashboard ExportButton

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** audit-admin-buttons-links.md (varování #5)  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Analýza problému

### Aktuální stav
**Soubor:** `app/(admin)/admin/dashboard/ExportButton.tsx`

ExportButton je placeholder — zobrazí tooltip "Export dat bude brzy dostupný." a nic neexportuje:
```typescript
onClick={() => {
  setMessage("Export dat bude brzy dostupný.");
  setTimeout(() => setMessage(""), 3000);
}}
```

### Dashboard data k dispozici

Dashboard (Server Component) načítá:
1. **totalVehicles** — počet aktivních vozidel
2. **totalBrokers** — počet aktivních makléřů
3. **pendingApprovals** — počet čekajících na schválení
4. **monthlyCommissions** — suma provizí za měsíc
5. **recentActivity** — posledních 5 vozidel (brand, model, status, broker, datum)
6. **recentVehicles** — pending vozidla ke schválení

### Existující CSV export vzor
**Soubor:** `components/admin/BrokersPageContent.tsx:106-118`

```typescript
function handleExport() {
  const header = "Jméno,Email,Region,Vozidla,Status\n";
  const rows = brokers.map(b =>
    `"${b.name}","${b.email}","${b.region}",${b.vehicles},"${statusLabels[b.status]}"`
  ).join("\n");
  const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `makleri-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Doporučené řešení

Dashboard ExportButton by měl exportovat **souhrnný report** — ne jen stat karty, ale smysluplný CSV/XLSX se seznamem vozidel + makléřů + provizí.

### Možnost A: Dropdown s výběrem exportu (DOPORUČENO)

Tlačítko "Export" otevře dropdown s volbami:
1. **Vozidla (CSV)** — všechna aktivní vozidla s maklé��em, cenou, statusem
2. **Makléři (CSV)** — všichni makléři s počtem vozidel, statusem
3. **Provize (CSV)** — provize za vybrané období

Každá volba volá příslušný API endpoint s `?format=csv` nebo stáhne client-side.

### Možnost B: Jeden souhrnný report (jednodušší)

Jeden CSV s dashboard daty — ale to jsou jen 4 čísla, málo užitečné.

---

## Implementační plán (Možnost A)

### KROK 1: Vytvořit API endpoint pro CSV export (~60 řádků)

**Vytvořit:** `app/api/admin/export/route.ts`

```typescript
GET /api/admin/export?type=vehicles|brokers|commissions
```

**Logika:**
1. Auth check: ADMIN, BACKOFFICE
2. Switch na typ:
   - `vehicles`: Prisma query všech ACTIVE vozidel → CSV
   - `brokers`: Prisma query všech ACTIVE makléřů → CSV  
   - `commissions`: Prisma query provizí za aktuální měsíc → CSV
3. Vrátit Response s `Content-Type: text/csv` a `Content-Disposition: attachment`

### KROK 2: Aktualizovat ExportButton (~40 řádků)

**Soubor:** `app/(admin)/admin/dashboard/ExportButton.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ExportButton() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string, label: string) => {
    setExporting(type);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (!res.ok) throw new Error("Export selhal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export se nezdařil");
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
        Export
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
          {[
            { type: "vehicles", label: "Vozidla" },
            { type: "brokers", label: "Makléři" },
            { type: "commissions", label: "Provize" },
          ].map(item => (
            <button
              key={item.type}
              onClick={() => handleExport(item.type, item.label)}
              disabled={!!exporting}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {exporting === item.type ? "Exportuji..." : `${item.label} (CSV)`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Soubory k vytvoření

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `app/api/admin/export/route.ts` | API | GET endpoint pro CSV export (vehicles/brokers/commissions) |

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 2 | `app/(admin)/admin/dashboard/ExportButton.tsx` | Nahradit placeholder za dropdown s fetch + download |

---

## STOP kritéria

1. Klik na "Export" → otevře dropdown se 3 volbami
2. "Vozidla (CSV)" → stáhne CSV se seznamem aktivních vozidel
3. "Makléři (CSV)" → stáhne CSV se seznamem makléřů
4. "Provize (CSV)" → stáhne CSV s provizemi za měsíc
5. CSV soubory mají BOM pro správné zobrazení diakritiky v Excelu
6. Auth check — pouze ADMIN/BACKOFFICE mohou exportovat
7. `npm run build` projde bez chyb

---

## Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| Velký počet vozidel (tisíce) | Střední | Server-side CSV generování, stream response |
| Diakritika v Excelu | Jistá | BOM prefix `\uFEFF` (vzor z BrokersPageContent) |
| Export bez filtrů (vše) | Nízká | MVP = celý dataset, filtry = fáze 2 |

---

*Plán připraven: 2026-04-26*  
*Čeká na schválení team leadem*
