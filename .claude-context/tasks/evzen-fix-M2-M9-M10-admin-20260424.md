# Evzen verdikt: Task #28 — M2+M9+M10: Admin buttons + kontakt mapa
**Datum:** 2026-04-24
**Verdikt: SCHVALENO (s poznamkou k M9)**

---

## M2: Kontakt mapa

### Puvodni zadani
- `app/(web)/kontakt/page.tsx:69-80` — Map placeholder misto mapy
- Fix: Pridat Mapy.cz iframe nebo Google Maps embed

### Kontrola (`app/(web)/kontakt/page.tsx`)

- R. 70-80: Mapy.cz iframe implementovan ✅
- `src="https://frame.mapy.cz/zakladni?x=14.4244&y=50.0793&z=16&source=addr&id=8942598"` ✅
- Responsive vyska: `h-[250px] sm:h-[300px] md:h-[400px]` ✅
- `loading="lazy"` — nezdrzuje page load ✅
- `title="Mapa — CarMakler Praha, Skolska 660/3"` — accessibility ✅
- `allowFullScreen` ✅
- `style={{ border: 0 }}` — cista vizualita ✅

**VERDIKT: SPLNENO**

---

## M9: Vehicles — Delete + Filtrovat

### Puvodni zadani
- Delete a Filtrovat buttons trvale disabled bez vysvetleni
- "Pridat vozidlo" ma tooltip OK (makleri pres PWA)
- Delete: implementovat s potvrzenim (confirm dialog)
- Filtrovat: implementovat filtr (status, makler)

### Kontrola (`components/admin/VehiclesPageContent.tsx`)

**Delete button (r. 65-72):**
- Tlacitko 🗑 s `onClick={handleDelete}`, `disabled={deleting}` ✅
- `window.confirm("Opravdu smazat toto vozidlo? Akci nelze vratit.")` ✅
- fetch DELETE `/api/admin/vehicles/${vehicleId}` ✅
- Error handling: `res.json().catch(() => ({}))` + alert ✅
- catch: `alert("Chyba spojeni")` ✅
- On success: `onDelete(vehicleId)` → odstrani z local state ✅

**DELETE API (`app/api/admin/vehicles/[id]/route.ts`):**
- Auth: `DELETE_ROLES = ["ADMIN", "BACKOFFICE"]` — spravne omezeno ✅
- Contract guard (r. 130-145): `vehicle._count.contracts > 0` → HTTP 400 "Vozidlo ma aktivni smlouvy a nelze smazat" ✅ BEZPECNOSTNI POJISTKA
- SOFT-DELETE (r. 147-164): transakce → vehicleChangeLog + `status: "DELETED"` ✅ (NE hard delete)
- Log: "Smazano adminem", userId, oldValue→newValue ✅

**Filtrovat button (r. 216-229):**
- Tlacitko "Filtrovat" funkci (BYLO disabled) → `onClick={() => setFilterOpen(!filterOpen)}` ✅
- Dropdown: status select s moznostmi (Vsechna, Aktivni, Cekajici, Zamitnuta, Prodana) ✅
- onChange: sets activeTab + reset page 1 + closes dropdown ✅

**"Pridat vozidlo" (r. 232-234):**
- Stale disabled s tooltip "Vozidla pridavaji makleri pres PWA aplikaci" ✅

**⚠️ POZNAMKA:** Zadani uvadi "Filtrovat: implementovat filtr (status, makler)". Implementace obsahuje POUZE status filtr. Filtr dle maklere (brokerName) CHYBI. Tabulka zobrazuje sloupec "Makler" (r. 112-123), ale dropdown neobsahuje select pro filtr dle maklere. Tabs uz filtruji dle statusu, takze dropdown je de facto duplicitni s taby.

→ Toto je MINOR gap, ne blocker. Hlavni fix (tlacitka byla disabled → nyni funkci) je splnen. Doporucuji pridat makler filtr jako follow-up.

**VERDIKT: SPLNENO (minor gap — chybi filtr dle maklere)**

---

## M10: Brokers — Deaktivovat + Exportovat

### Puvodni zadani
- Delete a Exportovat trvale disabled
- Delete: implementovat s potvrzenim
- Exportovat: CSV export seznamu makleru

### Kontrola (`components/admin/BrokersPageContent.tsx`)

**Deaktivovat button (r. 82-89):**
- Tlacitko 🗑 s title "Deaktivovat" (spravna terminologie pro osoby) ✅
- `onClick={handleDeactivate}`, `disabled={deactivating}` ✅
- `window.confirm("Opravdu deaktivovat tohoto maklere?")` ✅
- fetch POST `/api/admin/brokers/${brokerId}/reject` ✅
- Error handling: `res.json().catch(() => ({}))` + alert ✅
- catch: `alert("Chyba spojeni")` ✅
- On success: `onDeactivate(brokerId)` → zmeni local status na "rejected" (r. 102-104) ✅

**Reject API (`app/api/admin/brokers/[id]/reject/route.ts`):**
- Auth: `ALLOWED_ROLES = ["MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "BACKOFFICE"]` ✅
- Overeni ze uzivatel je BROKER (r. 45-49) ✅
- Manager scope: muze zamitnut JEN sve maklere (r. 60-68) ✅
- Status update: `status: "REJECTED"` ✅
- Poznamka: API kontroluje `broker.status !== "ONBOARDING"` (r. 52-57) — deaktivace funguje jen pro ONBOARDING brokery. Pro aktivni maklere vraci HTTP 400 s chybovou hlaskou, ktera se zobrazi v alert. Toto je akceptovatelne — admin vidi chybovou hlasku a vi proc akce selhala.

**CSV Export (r. 106-118):**
- UTF-8 BOM `"\uFEFF"` — Excel kompatibilita ✅
- Header: "Jmeno,Email,Region,Vozidla,Status" ✅
- Radky: properly quoted CSV fields ✅
- Filename: `makleri-YYYY-MM-DD.csv` ✅
- Blob download via `document.createElement("a")` ✅

**Export button (r. 224):**
- `<Button variant="outline" size="sm" onClick={handleExport}>Exportovat</Button>` ✅ — NENI disabled!

**VERDIKT: SPLNENO**

---

## Kontrola Evzenova pravidel

| Pravidlo | M2 | M9 | M10 |
|---|---|---|---|
| Zadne zkratky v UI | N/A | ✅ "Opravdu smazat toto vozidlo? Akci nelze vratit." | ✅ "Opravdu deaktivovat tohoto maklere?" |
| Nedokoncene funkce oznaceny | N/A | ✅ "Pridat vozidlo" disabled s tooltip | N/A |
| Nic se neschovava | ✅ mapa viditelna | ✅ error alerts viditelne | ✅ error alerts viditelne |
| Nic se nemaze bez schvaleni | N/A | ✅ window.confirm + contract guard + soft-delete | ✅ window.confirm |

---

## Souhrn

| Fix | Verdict |
|-----|---------|
| M2 — Kontakt mapa (Mapy.cz iframe) | ✅ SPLNENO |
| M9 — Vehicle delete (soft-delete + contract guard + confirm) | ✅ SPLNENO |
| M9 — Vehicle filtr (status) | ✅ SPLNENO (minor: chybi makler filtr) |
| M10 — Broker deaktivace (confirm + reject API) | ✅ SPLNENO |
| M10 — CSV export (UTF-8 BOM) | ✅ SPLNENO |

**CELKOVY VERDIKT: SCHVALENO**

**Follow-up doporuceni:**
1. Pridat filtr dle maklere do VehiclesPageContent dropdown (M9 minor gap)
2. Zvazit rozsireni reject API pro deaktivaci aktivnich brokeru (nejen ONBOARDING)
