# PLÁN: Fix 3x HIGH Severity Role Checks

**Task #11** | Implementátor | 2026-05-26
**Status:** HOTOVO
**Typ:** Dokumentace — ŽÁDNÉ změny kódu

---

## Referenční pattern

Existující chráněný endpoint `app/api/donor-vehicles/route.ts` (řádky 7, 26–28):

```typescript
const ALLOWED_ROLES = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

Pattern: konstanta s povolenými rolemi → `includes()` check ihned po session check → 403 response.

---

## Fix #1: POST /api/vehicles

**Soubor:** `app/api/vehicles/route.ts`
**Funkce:** `POST` (řádek 175)
**Aktuální stav (řádky 177–183):**

```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json(
    { error: "Přístup odepřen. Přihlaste se." },
    { status: 401 }
  );
}
```

**Problém:** Pouze ověřuje autentizaci (`session?.user?.id`), neověřuje roli. Jakýkoliv přihlášený uživatel (BUYER, ADVERTISER, PARTS_SUPPLIER...) může vytvořit Vehicle.

**Požadované role:** `BROKER, MANAGER, REGIONAL_DIRECTOR, ADMIN`
- BROKER — primární tvůrce vozidel (nabírání v terénu)
- MANAGER — může zadat za makléře
- REGIONAL_DIRECTOR — supervize
- ADMIN — plný přístup

**Změna:** Vložit mezi řádek 183 a 185 (po session check, před `const body`):

```typescript
const CREATE_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];
if (!CREATE_ROLES.includes(session.user.role)) {
  return NextResponse.json(
    { error: "Nemáte oprávnění vytvářet vozidla" },
    { status: 403 }
  );
}
```

---

## Fix #2: POST /api/contracts

**Soubor:** `app/api/contracts/route.ts`
**Funkce:** `POST` (řádek 92)
**Aktuální stav (řádky 94–100):**

```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json(
    { error: "Přístup odepřen" },
    { status: 401 }
  );
}
```

**Problém:** Pouze ověřuje autentizaci. Jakýkoliv přihlášený uživatel může vytvořit smlouvu (BROKERAGE nebo HANDOVER protokol).

**Požadované role:** `BROKER, MANAGER, ADMIN`
- BROKER — primární tvůrce smluv (zprostředkovatelská, předávací)
- MANAGER — může vytvořit za makléře
- ADMIN — plný přístup
- REGIONAL_DIRECTOR — NENÍ (nemá business potřebu vytvářet smlouvy)

**Změna:** Vložit mezi řádek 100 a 102 (po session check, před `const body`):

```typescript
const CONTRACT_ROLES = ["BROKER", "MANAGER", "ADMIN"];
if (!CONTRACT_ROLES.includes(session.user.role)) {
  return NextResponse.json(
    { error: "Nemáte oprávnění vytvářet smlouvy" },
    { status: 403 }
  );
}
```

---

## Fix #3: POST /api/escalations

**Soubor:** `app/api/escalations/route.ts`
**Funkce:** `POST` (řádek 8)
**Aktuální stav (řádky 10–13):**

```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
}
```

**Problém:** Pouze ověřuje autentizaci (`session?.user`). Jakýkoliv přihlášený uživatel může vytvořit eskalaci. Kód na řádku 28 předpokládá `brokerId = session.user.id` a hledá `managerId` — logicky je to BROKER flow.

**Požadované role:** `BROKER, MANAGER, REGIONAL_DIRECTOR, ADMIN`
- BROKER — primární tvůrce eskalací (nahlašuje problémy manažerovi)
- MANAGER — může eskalovat výš
- REGIONAL_DIRECTOR — supervize
- ADMIN — plný přístup

**Změna:** Vložit mezi řádek 13 a 15 (po session check, před `const body`):

```typescript
const ESCALATION_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];
if (!ESCALATION_ROLES.includes(session.user.role)) {
  return NextResponse.json(
    { error: "Nemáte oprávnění vytvářet eskalace" },
    { status: 403 }
  );
}
```

---

## Souhrn

| # | Soubor | Řádek vložení | Povolené role | Status code |
|---|--------|---------------|---------------|-------------|
| 1 | `app/api/vehicles/route.ts` | Po ř. 183 | BROKER, MANAGER, RD, ADMIN | 403 |
| 2 | `app/api/contracts/route.ts` | Po ř. 100 | BROKER, MANAGER, ADMIN | 403 |
| 3 | `app/api/escalations/route.ts` | Po ř. 13 | BROKER, MANAGER, RD, ADMIN | 403 |

**Effort:** ~15 min
**Riziko:** LOW — přidáváme jen auth check, žádná business logika se nemění
**Commit message:** `fix(security): add role checks to POST /vehicles, /contracts, /escalations`
