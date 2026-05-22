# QA Report: FIX M2+M9+M10 — Kontakt mapa + Admin buttons

**Task:** #28  
**Commit:** `81fc85e`  
**Kontrolor:** KONTROLOR agent  
**Datum:** 2026-04-24

---

## VERDIKT: ✅ PASS

Všechny 4 soubory odpovídají zadání. Contract guard funguje, CSV má UTF-8 BOM, mapa je embednutá.

---

## M2 — Kontakt mapa (`app/(web)/kontakt/page.tsx`)

```tsx
<section className="h-[250px] sm:h-[300px] md:h-[400px]">
  <iframe
    src="https://frame.mapy.cz/zakladni?x=14.4244&y=50.0793&z=16&source=addr&id=8942598"
    width="100%"
    height="100%"
    style={{ border: 0 }}
    loading="lazy"
    title="Mapa — CarMakléř Praha, Školská 660/3"
    allowFullScreen
  />
</section>
```

✅ Mapy.cz iframe embed (`frame.mapy.cz` — oficiální embed doména Seznam.cz)  
✅ Souřadnice: `x=14.4244, y=50.0793` — Praha, Školská oblast ✅  
✅ `source=addr&id=8942598` — konkrétní adresní bod (Školská 660/3 dle title)  
✅ Responsivní výška: 250px → 300px (sm) → 400px (md)  
✅ `loading="lazy"` — výkon ✅  
✅ `title` atribut — přístupnost ✅  
✅ `allowFullScreen` ✅  

---

## M9 — Vehicle DELETE API (`app/api/admin/vehicles/[id]/route.ts`)

### Auth guard
```ts
const DELETE_ROLES = ["ADMIN", "BACKOFFICE"];
if (!session?.user || !DELETE_ROLES.includes(session.user.role)) {
  return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
}
```
✅ Pouze ADMIN + BACKOFFICE — MANAGER nemůže mazat ✅

### Contract guard (klíčový AC)
```ts
const vehicle = await prisma.vehicle.findUnique({
  where: { id },
  include: { _count: { select: { contracts: true } } },
});

if (vehicle._count.contracts > 0) {
  return NextResponse.json(
    { error: "Vozidlo má aktivní smlouvy a nelze smazat" },
    { status: 400 }
  );
}
```
✅ Guard existuje a funguje ✅  
✅ HTTP 400 s jasnou chybovou hláškou ✅  
✅ Vrací tu samou hlášku, kterou UI zobrazí přes `alert(data.error)` ✅

Poznámka: Guard kontroluje **všechny** smlouvy (ne jen aktivní). Vozidlo s uzavřenými smlouvami nelze smazat. Konzervativní, ale správné z pohledu audit trail.

### Soft delete + Audit trail
```ts
await prisma.$transaction(async (tx) => {
  await tx.vehicleChangeLog.create({
    data: {
      vehicleId: id,
      userId: session.user.id,
      field: "status",
      oldValue: vehicle.status,
      newValue: "DELETED",
      reason: "Smazáno adminem",
      flagged: false,
      flagReason: null,
    },
  });
  await tx.vehicle.update({
    where: { id },
    data: { status: "DELETED" },
  });
});
```
✅ **Soft delete** — `status: "DELETED"`, Prisma záznam zůstává ✅  
✅ **Audit trail** — vehicleChangeLog v téže transakci ✅  
✅ `oldValue: vehicle.status` — zaznamenán původní stav ✅  
✅ `userId: session.user.id` — zaznamenán kdo mazal ✅  
✅ Transakce — atomicita (log + update společně) ✅  

---

## M9 — VehiclesPageContent (`components/admin/VehiclesPageContent.tsx`)

### Delete button (TableActions)
```tsx
function TableActions({ vehicleId, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Opravdu smazat toto vozidlo? Akci nelze vrátit.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(vehicleId);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nepodařilo se smazat vozidlo");
      }
    } catch {
      alert("Chyba spojení");
    } finally {
      setDeleting(false);
    }
  }
  ...
  <button onClick={handleDelete} disabled={deleting}>🗑</button>
```

✅ `window.confirm` před smazáním ✅  
✅ Loading state `deleting` + `disabled={deleting}` ✅  
✅ `onDelete(vehicleId)` → `setVehicles(prev => prev.filter(v => v.id !== id))` — okamžité odstranění z UI ✅  
✅ Error: `alert(data.error)` — zobrazí "Vozidlo má aktivní smlouvy..." z API ✅  
✅ Catch: `alert("Chyba spojení")` ✅  

### Filter button
```tsx
<Button variant="outline" size="sm" onClick={() => setFilterOpen(!filterOpen)}>
  Filtrovat
</Button>
{filterOpen && (
  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
    <select
      value={activeTab}
      onChange={e => { setActiveTab(e.target.value); setCurrentPage(1); setFilterOpen(false); }}
      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
    >
      {tabs.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
    </select>
  </div>
)}
```

✅ Dříve `disabled` bez handleru — nyní `onClick={() => setFilterOpen(!filterOpen)}` ✅  
✅ Dropdown s `<select>` — filtruje dle statusu ✅  
✅ `setCurrentPage(1)` na změnu — reset stránkování ✅  
✅ `setFilterOpen(false)` po výběru — auto-close ✅  
✅ `z-50` — dropdown nad ostatním obsahem ✅  

---

## M10 — BrokersPageContent (`components/admin/BrokersPageContent.tsx`)

### Deactivate button (TableActions)
```tsx
async function handleDeactivate() {
  if (!window.confirm("Opravdu deaktivovat tohoto makléře?")) return;
  setDeactivating(true);
  try {
    const res = await fetch(`/api/admin/brokers/${brokerId}/reject`, { method: "POST" });
    if (res.ok) {
      onDeactivate(brokerId);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Nepodařilo se deaktivovat makléře");
    }
  } catch {
    alert("Chyba spojení");
  } finally { setDeactivating(false); }
}
```

✅ `window.confirm` před deaktivací ✅  
✅ POST `/api/admin/brokers/${brokerId}/reject` — existující reject endpoint (soft deactivace) ✅  
✅ `onDeactivate(brokerId)` → `setBrokers(prev => prev.map(b => b.id === id ? { ...b, status: "rejected" } : b))` ✅  
✅ Broker zůstává v listu, jen se status změní — správné pro workflow (audit trail) ✅  

### Export CSV
```tsx
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

✅ **UTF-8 BOM** `"\uFEFF"` — Excel správně čte česká písmena ✅  
✅ CSV hlavička: Jméno, Email, Region, Vozidla, Status ✅  
✅ Hodnoty v uvozovkách — odolné vůči čárkám v hodnotách ✅  
✅ Název souboru: `makleri-YYYY-MM-DD.csv` ✅  
✅ `URL.revokeObjectURL(url)` — čištění paměti ✅  
✅ Button `onClick={handleExport}` — dříve `disabled`, nyní funkční ✅  

---

## Acceptance Criteria

| AC | Popis | Výsledek |
|----|-------|---------|
| M2-1 | Mapy.cz iframe embed | ✅ |
| M2-2 | Responsivní výška | ✅ 250/300/400px |
| M9-1 | DELETE API: pouze ADMIN+BACKOFFICE | ✅ |
| M9-2 | **Contract guard** (400 pokud smlouvy existují) | ✅ |
| M9-3 | Soft delete (`status: "DELETED"`) | ✅ |
| M9-4 | Audit trail (vehicleChangeLog v transakci) | ✅ |
| M9-5 | UI delete: confirm + error handling | ✅ |
| M9-6 | Filter button funkční (dropdown) | ✅ |
| M10-1 | Broker deactivate: confirm + reject endpoint | ✅ |
| M10-2 | CSV export: UTF-8 BOM | ✅ |
| M10-3 | CSV export: správná struktura + filename | ✅ |
| M10-4 | Export button funkční (ne disabled) | ✅ |

---

## Otevřené body (nekritické)

| # | Závažnost | Popis |
|---|-----------|-------|
| 1 | ℹ️ | Export exportuje **všechny** makléře bez ohledu na aktivní tab filtr. Pokud admin filtruje "aktivní", export stáhne všechny. Přijatelné pro MVP. |
| 2 | ℹ️ | CSV hodnoty nejsou escapovány pro embedded `"` (pokud jméno obsahuje uvozovky). Edge case pro admin tool. |
| 3 | ℹ️ | Contract guard kontroluje všechny smlouvy (i uzavřené) — konzervativní, ale bezpečné. |

---

## Souhrn

| Fix | Verdict |
|-----|---------|
| M2 — Mapy.cz iframe | ✅ PASS |
| M9 — Vehicle DELETE API (guard + soft-delete + audit) | ✅ PASS |
| M9 — Vehicle filter button | ✅ PASS |
| M9 — Vehicle delete UI | ✅ PASS |
| M10 — Broker deactivate | ✅ PASS |
| M10 — CSV export (UTF-8 BOM) | ✅ PASS |

**Všechny fixy připraveny k evžen review / merge.**
