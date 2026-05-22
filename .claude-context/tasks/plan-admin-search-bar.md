# Implementační plán — Admin search bar

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** audit-admin-buttons-links.md (varování #4)  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Analýza problému

### Aktuální stav
**Soubor:** `components/admin/AdminHeader.tsx:27-31`

Search bar je čistě vizuální placeholder — `<input>` bez jakéhokoliv handleru:
```html
<input
  type="text"
  placeholder="Hledat vozidla, makléře..."
  className="..."
/>
```
Žádný `onChange`, `onSubmit`, `onFocus` — uživatel může psát, ale nic se nestane.

### Existující infrastruktura

#### 1. PWA GlobalSearch — KOMPLETNÍ vzor
**Soubor:** `components/pwa/GlobalSearch.tsx`
- Modal overlay s debounced search
- Volá `GET /api/search?q=...`
- Zobrazuje výsledky ve 3 kategoriích: vozidla, kontakty, smlouvy
- Click → navigace na detail

#### 2. Search API endpoint — EXISTUJE
**Soubor:** `app/api/search/route.ts`
- `GET /api/search?q=...`
- Auth: přihlášený uživatel
- Role-aware: BROKER vidí jen své, MANAGER své makléře, **ADMIN/BACKOFFICE vidí vše** (žádný brokerFilter)
- Hledá: vehicles (VIN, brand, model), contacts (jméno, telefon, email), contracts (typ, číslo)
- Vrací: `{ vehicles[], contacts[], contracts[] }`

#### 3. Admin-specific API search — existuje pro některé entity
- `GET /api/admin/users?search=...` — hledá v firstName, lastName, email
- `GET /api/admin/listings?search=...` — hledá v inzerátech
- `GET /api/admin/orders?search=...` — hledá v objednávkách

---

## Doporučené řešení

### Dvě možnosti:

#### A) Reuse PWA GlobalSearch (DOPORUČENO — rychlé)

Existující `GlobalSearch` komponenta funguje pro ADMIN role — API `/api/search` vrací vše bez filtru. Stačí:
1. Naimportovat `GlobalSearch` do `AdminHeader`
2. Input v headeru otevře GlobalSearch modal
3. Upravit navigační URL pro admin kontext (`/makler/vehicles/X` → `/admin/vehicles/X`)

#### B) Nová AdminSearch komponenta (komplexnější)

Vytvořit admin-specifickou search komponentu, která hledá napříč admin entitami:
- Vozidla → `/admin/vehicles/{id}`
- Makléři → `/admin/brokers/{id}` (až bude existovat)
- Inzeráty → `/admin/inzerce/{id}`
- Uživatelé → `/admin/users` (nemá detail)
- Objednávky → `/admin/orders`

**Vyžaduje:** nový API endpoint nebo úpravu `/api/search` pro admin entity.

---

## Implementační plán (Možnost A — reuse GlobalSearch)

### KROK 1: Vytvořit `AdminGlobalSearch` wrapper (~80 řádků)

**Vytvořit:** `components/admin/AdminGlobalSearch.tsx`

Kopie logiky z `components/pwa/GlobalSearch.tsx`, ale:
- Navigační URL přemapované na admin routes:
  - `/makler/vehicles/{id}` → `/admin/vehicles/{id}`
  - `/makler/contacts/{id}` → (není v adminu) → vynechat nebo `/admin/users`
  - `/makler/contracts/{id}` → (není v adminu) → vynechat
- Přidat sekci "Makléři" — volat `GET /api/admin/brokers` nebo `GET /api/admin/users?role=BROKER&search=...`
- Admin-friendly design (bez PWA mobilních stylů)

**Alternativa (ještě jednodušší):** Předat `routePrefix` prop do GlobalSearch a použít ji přímo.

### KROK 2: Připojit do AdminHeader (~15 řádků)

**Soubor:** `components/admin/AdminHeader.tsx`

```typescript
const [searchOpen, setSearchOpen] = useState(false);

// V JSX — nahradit statický input:
<div onClick={() => setSearchOpen(true)} className="cursor-pointer ...">
  <input ... readOnly placeholder="Hledat vozidla, makléře... (⌘K)" />
</div>

// Modal:
<AdminGlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
```

### KROK 3: Keyboard shortcut Cmd/Ctrl+K (~10 řádků)

V AdminHeader přidat global keydown listener:
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, []);
```

---

## Soubory k vytvoření

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `components/admin/AdminGlobalSearch.tsx` | Component | Search modal pro admin panel |

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 2 | `components/admin/AdminHeader.tsx` | Přidat "use client", state pro search modal, Cmd+K shortcut |

---

## STOP kritéria

1. Klik na search bar v admin headeru → otevře se search modal
2. Psaní v modalu → výsledky se zobrazují (vozidla, makléři)
3. Klik na výsledek → navigace na admin detail stránku
4. Cmd/Ctrl+K → otevře search
5. Escape → zavře search
6. `npm run build` projde bez chyb

---

## Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| `/api/search` nevrací makléře | Střední | Přidat broker search do API, nebo volat `/api/admin/users?search=...` separátně |
| Admin routes pro kontakty/smlouvy neexistují | Jistá | Zobrazit jen vozidla + makléře, zbytek skrýt |
| AdminHeader je teď Server Component | Nízká | Už JE "use client" — OK |

---

*Plán připraven: 2026-04-26*  
*Čeká na schválení team leadem*
