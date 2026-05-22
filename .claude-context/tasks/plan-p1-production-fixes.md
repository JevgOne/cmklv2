# Plan: P1 Production Fixes — 4 bugy z produkčního auditu

**Datum:** 2026-04-26
**Status:** PLAN READY
**Zdroj:** `.claude-context/tasks/chrome-production-audit-20260426.md`

---

## BUG P1-1: Admin manager sekce — ADMIN nevidí odkazy v sidebaru

### Symptom
ADMIN role nevidí sekci MANAŽER v admin sidebaru → nemůže se dostat na `/admin/manager/*`.

### Root cause

**Soubor:** `components/admin/AdminSidebar.tsx:51`

```typescript
{
  title: "MANAŽER",
  items: [
    { id: "manager-dashboard", href: "/admin/manager", icon: "📊", label: "Můj tým" },
    { id: "manager-brokers", href: "/admin/manager/brokers", icon: "👥", label: "Moji makléři" },
    { id: "manager-approvals", href: "/admin/manager/approvals", icon: "✅", label: "Schvalování" },
    { id: "manager-bonuses", href: "/admin/manager/bonuses", icon: "🎯", label: "Bonusy" },
  ],
  roles: ["MANAGER", "REGIONAL_DIRECTOR"],  // ← CHYBÍ "ADMIN"
}
```

Sidebar filtruje sekce podle `section.roles.includes(userRole)`. ADMIN nemá roli v seznamu → sekce se nezobrazí.

**Pozn:** Samotné page-level checky (server components) ADMIN povolují:
- `admin/manager/page.tsx:17` → `["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"]` ✅
- `admin/manager/brokers/page.tsx:14` → `["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"]` ✅
- `admin/manager/approvals/page.tsx:21` → `["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"]` ✅
- `admin/manager/bonuses/page.tsx:27` → `["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"]` ✅

Middleware (`middleware.ts:7`) → `ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"]` ✅

Takže stránky samotné fungují pro ADMIN — jen sidebar odkaz chybí.

### Fix

**Edit:** `components/admin/AdminSidebar.tsx:51`

```diff
-    roles: ["MANAGER", "REGIONAL_DIRECTOR"],
+    roles: ["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
```

**Složitost:** TRIVIÁLNÍ (1 řádek)
**Riziko:** NULOVÉ (pouze přidání viditelnosti existující funkcionality)

---

## BUG P1-2: `/cenik` — 404

### Symptom
URL `/cenik` vrací 404. Stránka neexistuje.

### Root cause

Stránka nikdy nebyla implementována. V celém codebase neexistuje `app/**/cenik/page.tsx`.

**Interní odkazy:** Žádný interní odkaz na `/cenik` neexistuje v kódu. URL je pravděpodobně zadávaná uživateli přímo (SEO expectation — běžný URL pattern pro české weby).

**Existující pricing info:** Stránka `/jak-to-funguje` (`app/(web)/jak-to-funguje/page.tsx:143`) už obsahuje:
> "Provize 5 % z prodejní ceny — a to jen při úspěšném prodeji."

### Doporučení: Redirect → `/jak-to-funguje`

Jednoduchý Next.js redirect v `next.config.ts`:

```typescript
// next.config.ts → redirects
{
  source: "/cenik",
  destination: "/jak-to-funguje",
  permanent: false, // 302 — možnost změnit na dedicated stránku později
}
```

**Alternativa (full page):** Pokud chcete dedikovanou stránku `/cenik`, bude potřeba:
- Nový soubor `app/(web)/cenik/page.tsx`
- Obsah: hero + pricing card (5%, min 25 000 Kč, all-inclusive) + CTA na `/chci-prodat`
- Ale to je spíš P3 nice-to-have, redirect stačí

### Fix

**Edit:** `next.config.ts` — přidat redirect

**Složitost:** TRIVIÁLNÍ
**Riziko:** NULOVÉ

---

## BUG P1-3: `/dily/katalog` — 0 produktů

### Symptom
Stránka `/dily/katalog` se načte, filtry fungují, ale zobrazuje 0 produktů. Homepage `/dily` přitom zobrazuje 6 featured produktů.

### Analýza

| Aspekt | Homepage `/dily` | Katalog `/dily/katalog` |
|--------|------------------|------------------------|
| Typ komponenty | Server Component | Client Component ("use client") |
| Zdroj dat | Přímý Prisma query | `fetch("/api/parts?...")` |
| Query | `prisma.part.findMany({ where: { status: "ACTIVE" }, take: 6 })` | API route s Zod validací |
| Řazení | `viewCount: "desc"` | `createdAt: "desc"` (default) |

**Klíčový rozdíl:** Homepage přistupuje k DB přímo (server component), katalog přes API route.

### Root cause — 3 možné příčiny (seřazeno podle pravděpodobnosti)

#### 1. NEJPRAVDĚPODOBNĚJŠÍ: Tichý API error (client necontroluje `res.ok`)

**Soubor:** `app/(web)/dily/katalog/page.tsx:119-128`

```typescript
const res = await fetch(`/api/parts?${params.toString()}`);
const data = await res.json();           // ← Nečeká na res.ok!
setParts(data.parts ?? []);              // ← Pokud API vrátí { error: "..." }, parts = []
```

Pokud API vrátí 400/500, response body je `{ error: "Neplatné parametry" }` → `data.parts` je `undefined` → `undefined ?? []` → prázdné pole. **Žádný error toast, žádný log.**

#### 2. MOŽNÉ: Zod validation error na query params

**Soubor:** `app/api/parts/route.ts:91`

```typescript
const filters = partFilterSchema.parse(Object.fromEntries(params));
```

`Object.fromEntries(params)` konvertuje URLSearchParams na objekt. Pokud params obsahují neočekávaný klíč (např. z browser extension, tracking param, nebo cached stará verze), Zod **strict mode** by mohl failnout.

Ale `partFilterSchema` nepoužívá `.strict()`, takže extra klíče by měly projít. Nicméně: ověřit na produkci.

#### 3. MÉNĚ PRAVDĚPODOBNÉ: Production build / DB issue

API route nemusí být správně zbuildovaná na produkci, nebo seed data mají `status` jiný než `"ACTIVE"`.

### Fix — 2 kroky

**Krok 1: Přidat error handling do katalogu** (HLAVNÍ FIX)

**Edit:** `app/(web)/dily/katalog/page.tsx:119-128`

```typescript
try {
  const res = await fetch(`/api/parts?${params.toString()}`);
  if (!res.ok) {
    console.error("Parts API error:", res.status, await res.text());
    setParts([]);
    return;
  }
  const data = await res.json();
  setParts(data.parts ?? []);
  setTotal(data.total ?? 0);
  setTotalPages(data.totalPages ?? 0);
} catch {
  console.error("Parts fetch failed");
  setParts([]);
}
```

**Krok 2: Debug na produkci**

```bash
# SSH na server a otestovat API přímo
ssh server
curl -s "http://localhost:3000/api/parts?limit=18&sort=newest" | jq '.total'

# Pokud vrátí 0 → problém v DB/query
# Pokud vrátí > 0 → problém v klientovi (CORS, middleware, build)

# Zkontrolovat Prisma data
npx prisma studio  # → Part tabulka → filtr status = ACTIVE
```

**Složitost:** MALÁ (error handling) + DIAGNOSTIKA (produkce)
**Riziko:** NULOVÉ (přidání error handling nemůže nic rozbít)

---

## BUG P2-3: `/pro-maklere` — 404

### Symptom
URL `/pro-maklere` vrací 404. Audit tvrdí, že CTA odkaz z `/o-nas` vede na tuto URL.

### Root cause

1. Stránka `/pro-maklere` nikdy neexistovala
2. **Audit se mýlí ohledně zdroje odkazu** — stránka `/o-nas` (`app/(web)/o-nas/page.tsx:254,263`) odkazuje na:
   - `/makleri` → "Najít ověřeného makléře" ✅
   - `/kariera` → "Kariéra u CarMakléř" ✅
   - **Žádný odkaz na `/pro-maklere`** v celém codebase
3. Předchozí review (`review-finalni-kontrola.md:288`) už potvrdil: "NERELEVANTNÍ — správná URL je /makleri a všude v kódu je použita korektně."

URL `/pro-maklere` je pravděpodobně zadávaná uživateli přímo nebo z externích zdrojů (Google, social links).

### Fix: Redirect → `/kariera`

**Edit:** `next.config.ts` → přidat redirect

```typescript
{
  source: "/pro-maklere",
  destination: "/kariera",
  permanent: true, // 301 — definitivní redirect
}
```

**Složitost:** TRIVIÁLNÍ
**Riziko:** NULOVÉ

---

## Souhrn změn

| Bug | Soubor | Akce | Složitost | Řádky |
|-----|--------|------|-----------|-------|
| P1-1 | `components/admin/AdminSidebar.tsx` | EDIT (přidat "ADMIN" do roles) | TRIVIÁLNÍ | 1 |
| P1-2 | `next.config.ts` | EDIT (přidat redirect /cenik → /jak-to-funguje) | TRIVIÁLNÍ | 4 |
| P1-3 | `app/(web)/dily/katalog/page.tsx` | EDIT (přidat res.ok check + error log) | MALÁ | 5 |
| P1-3 | produkce | DIAGNOSTIKA (curl API, check DB) | — | — |
| P2-3 | `next.config.ts` | EDIT (přidat redirect /pro-maklere → /kariera) | TRIVIÁLNÍ | 4 |

**Celkem: 3 soubory, 3 edity, 0 nových souborů, 0 Prisma změn.**

---

## Pořadí implementace

1. **P1-1** — Sidebar fix (1 řádek, okamžitý efekt)
2. **P1-3** — Error handling + produkční diagnostika (odhalí skutečný problém)
3. **P1-2 + P2-3** — Redirecty v next.config.ts (spojit do jednoho commitu)

---

## next.config.ts — kompletní redirect blok

Oba redirecty (P1-2 + P2-3) patří do `next.config.ts`. Zjistit aktuální stav redirectů v konfiguraci a přidat:

```typescript
async redirects() {
  return [
    // ... existující redirecty ...
    {
      source: "/cenik",
      destination: "/jak-to-funguje",
      permanent: false,
    },
    {
      source: "/pro-maklere",
      destination: "/kariera",
      permanent: true,
    },
  ];
}
```

---

## Poznámky k auditu

1. **P1-1 audit diagnosis nepřesná:** Audit tvrdí `role !== "MANAGER"` check — ve skutečnosti je problém v sidebar visibility (roles array), ne v page-level check.
2. **P2-3 audit zdroj nepřesný:** Audit tvrdí odkaz z `/o-nas` — ve skutečnosti `/o-nas` odkazuje na `/makleri` a `/kariera`, ne `/pro-maklere`.
3. **P1-3 vyžaduje produkční diagnostiku:** Z kódu nelze jednoznačně určit příčinu — API i Zod schema vypadají korektně. Problém je buď v tichém error handling klienta, nebo v produkčním prostředí (build, DB data).
