# Plan: FIX M2+M9+M10 — Admin buttons + kontakt mapa

**Task:** #28
**Issue IDs:** M2, M9, M10 z audit-deep-stubs-broken-20260424.md
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## ANALÝZA

### M2 — Kontakt mapa placeholder

**Soubor:** `app/(web)/kontakt/page.tsx:69-80`

Stávající stav — placeholder section místo mapy:
```tsx
<section className="bg-gray-200 flex items-center justify-center h-[250px] sm:h-[300px] md:h-[400px]">
  <div className="text-center">
    <span className="text-5xl">📍</span>
    <p className="text-gray-600 font-semibold mt-3 text-lg">CarMakléř — Praha</p>
    <p className="text-gray-500 text-sm mt-1">{companyInfo.address.full}</p>
  </div>
</section>
```

**Adresa z `lib/company-info.ts`:** Školská 660/3, 110 00 Praha

**Existující map integrace v projektu:** Žádná (Mapy.cz/Google Maps/Mapbox/Leaflet nenalezeny).

**Doporučení:** Mapy.cz embed iframe — český provider, zdarma, žádný API key potřeba. Alternativa: Google Maps embed (vyžaduje API key).

---

### M9 — Admin Vehicles: Delete + Filtrovat disabled

**Soubor:** `components/admin/VehiclesPageContent.tsx`

| Tlačítko | Řádek | Stav | Fix |
|----------|-------|------|-----|
| 🗑 Delete (per-row) | 48 | `disabled` na `<button>` | Implementovat s confirm dialog + DELETE API |
| Filtrovat | 189 | `disabled` na `<Button>` | Implementovat filter dropdown/panel |
| Přidat vozidlo | 192 | `disabled` s tooltip | **NEMĚNIT** — legitimní (makléři přidávají přes PWA) |

**API stav:**
- GET `/api/admin/vehicles` — existuje ✅
- GET `/api/admin/vehicles/[id]` — existuje ✅
- PATCH `/api/admin/vehicles/[id]` — existuje ✅
- DELETE `/api/admin/vehicles/[id]` — **NEEXISTUJE** ❌

**Pozor:** Delete vozidla je destruktivní akce. Musí:
- Vyžadovat ADMIN/BACKOFFICE roli (ne MANAGER)
- Soft-delete (nastavit status na "deleted") nebo hard-delete s confirm
- Zachovat audit trail (vehicleChangeLog)
- Ověřit, že vozidlo nemá aktivní objednávky/smlouvy

---

### M10 — Admin Brokers: Delete + Exportovat disabled

**Soubor:** `components/admin/BrokersPageContent.tsx`

| Tlačítko | Řádek | Stav | Fix |
|----------|-------|------|-----|
| 🗑 Delete (per-row) | 65 | `disabled` na `<button>` | Implementovat s confirm + DELETE/deactivate API |
| Exportovat | 185 | `disabled` na `<Button>` | CSV export |
| Pozvat makléře | 188 | Funguje ✅ | **NEMĚNIT** |

**API stav:**
- GET `/api/admin/brokers` — existuje ✅
- POST `/api/admin/brokers/[id]/activate` — existuje ✅
- POST `/api/admin/brokers/[id]/reject` — existuje ✅
- DELETE `/api/admin/brokers/[id]` — **NEEXISTUJE** ❌

**Pozor:** Delete makléře — nesmí mazat pokud má aktivní vozidla. Lepší: deactivate (status → "rejected"/"inactive") než hard delete.

---

## IMPLEMENTAČNÍ PLÁN (5 kroků)

### Krok 1: Nahradit mapa placeholder za Mapy.cz embed

**Soubor:** `app/(web)/kontakt/page.tsx`

Nahradit řádky 69-80 (map placeholder section) za:

```tsx
<section className="h-[250px] sm:h-[300px] md:h-[400px]">
  <iframe
    src="https://frame.mapy.cz/s/gusekapave"
    width="100%"
    height="100%"
    style={{ border: 0 }}
    loading="lazy"
    title="Mapa — CarMakléř Praha"
    allowFullScreen
  />
</section>
```

**POZNÁMKA PRO IMPLEMENTÁTORA:**
URL `https://frame.mapy.cz/s/gusekapave` je placeholder — před implementací:
1. Jít na mapy.cz, najít "Školská 660/3, Praha"
2. Kliknout Sdílet → Embed → zkopírovat URL
3. Nebo použít formát: `https://frame.mapy.cz/?x=14.424&y=50.079&z=16&m=firm-13172682` (najít přesné koordináty)

Alternativa pokud Mapy.cz embed nefunguje: Google Maps `https://www.google.com/maps/embed?pb=...` (vyžaduje Maps Embed API, zdarma do limitu).

---

### Krok 2: Implementovat DELETE API pro vozidla

**Nový soubor:** `app/api/admin/vehicles/[id]/route.ts` (přidat DELETE metodu do existujícího souboru)

```ts
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { _count: { select: { contracts: true } } },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }

  // Nelze smazat vozidlo s aktivními smlouvami
  if (vehicle._count.contracts > 0) {
    return NextResponse.json(
      { error: "Vozidlo má aktivní smlouvy a nelze smazat" },
      { status: 400 }
    );
  }

  // Soft-delete: změnit status
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

  return NextResponse.json({ success: true });
}
```

**STOP-1:** Ověřit v Prisma schema že Vehicle má pole `contracts` (relace) — pokud ne, upravit guard logiku.

---

### Krok 3: Implementovat Delete + Filtrovat v VehiclesPageContent

**Soubor:** `components/admin/VehiclesPageContent.tsx`

**3a) Delete button (ř. 45-53) — TableActions component:**
- Odebrat `disabled` z delete buttonu
- Přidat `onClick` s confirm dialog + DELETE fetch
- Props: přidat `onDelete: (id: string) => void`

```tsx
function TableActions({ vehicleId, onDelete }: { vehicleId: string; onDelete: (id: string) => void }) {
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

  return (
    <div className="flex items-center gap-1.5">
      {/* ... view + edit links zachovat ... */}
      <button
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-[10px] text-sm cursor-pointer transition-colors hover:bg-error-50 hover:text-error-500 border-none"
        title="Smazat"
        onClick={handleDelete}
        disabled={deleting}
      >
        🗑
      </button>
    </div>
  );
}
```

**3b) Filtrovat button (ř. 189) — implementovat dropdown:**

Přidat state:
```ts
const [filterOpen, setFilterOpen] = useState(false);
const [filterStatus, setFilterStatus] = useState<string>("all");
const [filterBroker, setFilterBroker] = useState<string>("");
```

Nahradit disabled Button za:
```tsx
<div className="relative">
  <Button variant="outline" size="sm" onClick={() => setFilterOpen(!filterOpen)}>
    Filtrovat
  </Button>
  {filterOpen && (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
      <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
      <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setActiveTab(e.target.value); setFilterOpen(false); }}
        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
        {tabs.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
    </div>
  )}
</div>
```

**Poznámka:** Filtrovat může být jednoduše alias pro tab switching — status filtry už existují jako Tabs. Filtrovat button by mohl být dropdown s dalšími filtry (makléř, cena range) nebo stačí odkázat na existující taby. Implementátor rozhodne rozsah.

---

### Krok 4: Implementovat Delete + Export v BrokersPageContent

**Soubor:** `components/admin/BrokersPageContent.tsx`

**4a) Delete button (ř. 62-69) — deactivate:**

Namísto hard-delete → přepnout status na "rejected" (deactivace):
```tsx
async function handleDeactivate() {
  if (!window.confirm("Opravdu deaktivovat tohoto makléře?")) return;
  // Použít existující reject endpoint
  const res = await fetch(`/api/admin/brokers/${brokerId}/reject`, { method: "POST" });
  if (res.ok) onDelete(brokerId);
  else alert("Nepodařilo se deaktivovat makléře");
}
```

Odebrat `disabled`, přidat `onClick={handleDeactivate}`.

**4b) Export CSV (ř. 185):**

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
  a.download = `makleri-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

Nahradit disabled Button za:
```tsx
<Button variant="outline" size="sm" onClick={handleExport}>
  Exportovat
</Button>
```

---

### Krok 5: Přidat onDelete callback do DataTable columns

**VehiclesPageContent:** Předat `onDelete` callback přes columns nebo jako prop do TableActions. Po smazání odebrat vozidlo ze state:

```ts
function handleVehicleDeleted(id: string) {
  setVehicles(prev => prev.filter(v => v.id !== id));
}
```

**BrokersPageContent:** Stejný pattern.

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `app/(web)/kontakt/page.tsx` | EDIT ř.69-80 | Nahradit map placeholder za Mapy.cz iframe |
| 2 | `app/api/admin/vehicles/[id]/route.ts` | EDIT | Přidat DELETE handler (soft-delete) |
| 3 | `components/admin/VehiclesPageContent.tsx` | EDIT | Delete onClick + filtrovat dropdown |
| 4 | `components/admin/BrokersPageContent.tsx` | EDIT | Delete (deactivate) onClick + CSV export |

---

## ACCEPTANCE CRITERIA

- [ ] Kontakt stránka zobrazuje skutečnou mapu (Mapy.cz embed) místo placeholder
- [ ] Mapa ukazuje správnou adresu (Školská 660/3, Praha)
- [ ] Iframe má `loading="lazy"` a `title` pro accessibility
- [ ] Admin: Delete vozidla funguje s confirm dialogem
- [ ] Admin: Delete vozidla s aktivními smlouvami je odmítnuto s chybovou hláškou
- [ ] Admin: Soft-delete (status → DELETED) + audit trail v vehicleChangeLog
- [ ] Admin: Filtrovat button otevře dropdown nebo funguje jako enhanced filter
- [ ] Admin: "Přidat vozidlo" zůstává disabled s tooltipem (NEMĚNIT)
- [ ] Admin: Delete makléře → deactivate (reject) s confirm
- [ ] Admin: Export makléřů → CSV soubor se stáhne (UTF-8 BOM pro Excel CZ)
- [ ] TypeScript build OK

## STOP PRAVIDLA

- **STOP-1:** Pokud Vehicle model nemá `contracts` relaci → upravit delete guard (zkontrolovat jiné závislosti)
- **STOP-2:** Pokud Mapy.cz embed nefunguje (CORS/iframe blocking) → fallback na Google Maps embed
- **STOP-3:** Pokud admin/brokers/[id]/reject endpoint nefunguje pro active makléře → vytvořit dedikovaný deactivate endpoint

## POZNÁMKA PRO IMPLEMENTÁTORA

**Mapy.cz embed URL:** Musíš najít správný embed link pro "Školská 660/3, Praha" na mapy.cz → Sdílet → Embed. Placeholder URL v plánu je příklad.

## ODHAD

- **Složitost:** Střední (4 soubory, mix UI + API)
- **Risk:** Nízký-střední — DELETE API je nová funkcionalita, vyžaduje opatrnost
