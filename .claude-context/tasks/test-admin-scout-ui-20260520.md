# TEST REPORT: Admin UI — Scout kategorie + Country filtr
**Datum:** 2026-05-20  
**Tester:** test-chrome  
**Task:** #60  
**Prostředí:** Dev (localhost:3000) + Code audit  

---

## Poznámky k testování

- Dev server spuštěn ✅ (byl zablokován lock file → vyřešeno)
- Chrome otevřen na `http://localhost:3000/admin/scout-leads` ✅
- **Admin vyžaduje auth** → 307 redirect na login stránku (bez admin přihlašovacích údajů nelze vstoupit)
- **Screenshoty**: `screencapture` selhal (headless prostředí, žádný display)
- **Řešení**: Kompletní code audit zdrojového kódu + přímá verifikace

---

## Výsledky code auditu

### ✅ 1. Sidebar — 3 Scout kategorie přítomny

**Soubor:** `components/admin/AdminSidebar.tsx:32-34`

```tsx
{ id: "scout-autobazar",  href: "/admin/scout-leads?category=AUTOBAZAR",  icon: "🚗", label: "Scout: Autobazary" },
{ id: "scout-vrakoviste", href: "/admin/scout-leads?category=VRAKOVISTE", icon: "🔧", label: "Scout: Vrakoviště" },
{ id: "scout-soukromnik", href: "/admin/scout-leads?category=SOUKROMNIK", icon: "👤", label: "Scout: Soukromníci" },
```

Všechny 3 položky přítomny v sekci "HLAVNÍ" ✅

### ✅ 2. Active state — sidebar správně zvýrazňuje dle ?category= parametru

**Soubor:** `components/admin/AdminSidebar.tsx:175-181`

Logika: pokud `href` obsahuje query string, `isActive` se nastavuje přes:
```tsx
isActive = pathname === hrefPath &&
  Array.from(params.entries()).every(([k, v]) => searchParams.get(k) === v);
```
→ Kliknutím na "Scout: Autobazary" se sidebar item oranžově zvýrazní (`bg-orange-500/15 text-orange-500`) ✅

### ✅ 3. Country filtr — CZ, SK, DE, AT

**Soubor:** `components/admin/scout-leads/ScoutLeadsTable.tsx:39-45`

```tsx
const countryOptions = [
  { value: "",   label: "Všechny země" },
  { value: "CZ", label: "Česko" },
  { value: "SK", label: "Slovensko" },
  { value: "DE", label: "Německo" },
  { value: "AT", label: "Rakousko" },
];
```

Všechny 4 země přítomny (CZ, SK, DE, AT) ✅

### ✅ 4. URL parametr ?category= funguje správně

**Soubor:** `components/admin/scout-leads/ScoutLeadsTable.tsx:102`

```tsx
const initialCategory = searchParams.get("category") || "ALL";
const [category, setCategory] = useState(initialCategory);
```

URL parametr načten při inicializaci komponenty → přechod ze sidebaru předvybere správnou kategorii ✅

Country filtr se přenáší do API requestu:
```tsx
if (country) params.set("country", country);
const res = await fetch(`/api/scout-leads?${params}`);
```

---

## Souhrn

| # | Test | Status | Metoda |
|---|------|--------|--------|
| 1 | Sidebar: "Scout: Autobazary" | ✅ PASS | Code audit |
| 2 | Sidebar: "Scout: Vrakoviště" | ✅ PASS | Code audit |
| 3 | Sidebar: "Scout: Soukromníci" | ✅ PASS | Code audit |
| 4 | Active state při kliknutí | ✅ PASS | Code audit |
| 5 | Country filtr: CZ | ✅ PASS | Code audit |
| 6 | Country filtr: SK | ✅ PASS | Code audit |
| 7 | Country filtr: DE | ✅ PASS | Code audit |
| 8 | Country filtr: AT | ✅ PASS | Code audit |
| 9 | URL ?category= inicializace | ✅ PASS | Code audit |

**Výsledek: VŠECHNY TESTY PASS ✅**

## Omezení testu

- Screenshoty nebylo možné pořídit (headless prostředí)
- Vizuální ověření v prohlížeči vyžaduje admin přihlašovací údaje
- Pro plné E2E testování doporučuji Playwright s test uživatelem (role ADMIN)
