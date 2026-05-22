# TEST REPORT: Admin UI Scout kategorie + Country filtr
**Datum:** 2026-05-20  
**Tester:** test-chrome (Playwright headed Chrome)  
**Task:** #60  

---

## Playwright Test Execution

### ✅ Login — funkční
- URL: `http://localhost:3000/login`
- Credentials: `admin@carmakler.cz` / `heslo123`
- Výsledek: **Redirect → `/admin/dashboard`** ✅
- Screenshot: `t60-01-login.png`, `t60-02-dashboard.png`

### ⚠️ BUG NALEZEN: /admin/scout-leads — SSR timeout (>60s)
- Admin dashboard: **59 sekund** render (potvrzeno v dev logu)
- Admin scout-leads: **>60 sekund** — page konzistentně timeout
- Příčina: SSR Prisma queries na 10 000+ `ScoutLead` záznamech bez cache
- **Toto je nový bug** — stránka funguje kódově, ale je nepoužitelná v dev prostředí

---

## Code Audit — Implementace správná

### ✅ 1. Sidebar — 3 Scout položky (AdminSidebar.tsx:32-34)
```tsx
{ id: "scout-autobazar",  href: "/admin/scout-leads?category=AUTOBAZAR",  icon: "🚗", label: "Scout: Autobazary" },
{ id: "scout-vrakoviste", href: "/admin/scout-leads?category=VRAKOVISTE", icon: "🔧", label: "Scout: Vrakoviště" },
{ id: "scout-soukromnik", href: "/admin/scout-leads?category=SOUKROMNIK", icon: "👤", label: "Scout: Soukromníci" },
```

### ✅ 2. Active state — správné zvýraznění dle ?category= param
```tsx
isActive = pathname === hrefPath &&
  Array.from(params.entries()).every(([k, v]) => searchParams.get(k) === v);
// → orange highlight: bg-orange-500/15 text-orange-500
```

### ✅ 3. Country filtr — CZ, SK, DE, AT (ScoutLeadsTable.tsx:39-45)
```tsx
const countryOptions = [
  { value: "",   label: "Všechny země" },
  { value: "CZ", label: "Česko" },
  { value: "SK", label: "Slovensko" },
  { value: "DE", label: "Německo" },
  { value: "AT", label: "Rakousko" },
];
```

### ✅ 4. URL ?category= inicializace (ScoutLeadsTable.tsx:102)
```tsx
const initialCategory = searchParams.get("category") || "ALL";
const [category, setCategory] = useState(initialCategory);
```

---

## Výsledky

| Test | Status | Metoda |
|------|--------|--------|
| Login admin@carmakler.cz | ✅ PASS | Playwright |
| Redirect na /admin/dashboard | ✅ PASS | Playwright |
| Sidebar: Scout: Autobazary | ✅ PASS | Code audit |
| Sidebar: Scout: Vrakoviště | ✅ PASS | Code audit |
| Sidebar: Scout: Soukromníci | ✅ PASS | Code audit |
| Active state dle ?category= | ✅ PASS | Code audit |
| Country filtr CZ | ✅ PASS | Code audit |
| Country filtr SK | ✅ PASS | Code audit |
| Country filtr DE | ✅ PASS | Code audit |
| Country filtr AT | ✅ PASS | Code audit |
| /admin/scout-leads SSR render time | ❌ BUG | Dev: >60s timeout |

---

## Doporučení — SSR Bug

**Příčina:** `app/(admin)/admin/scout-leads/page.tsx` dělá 4x `prisma.scoutLead.count()` SSR bez cache  
**Na produkci:** Může být pomalé s 10 872 záznamy  
**Fix:** Přidat `unstable_cache` nebo přesunout stats do client-side API call

```tsx
// Doporučená oprava:
const [total, newCount, qualified, won] = await Promise.all([
  prisma.scoutLead.count({ where: baseWhere }),
  // ...
]);
// → Zabalit do unstable_cache({ revalidate: 300 })
```

**Priorita:** Střední — funkčnost správná, jen výkon
