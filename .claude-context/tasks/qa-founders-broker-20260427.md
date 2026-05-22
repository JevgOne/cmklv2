# QA Report — Přidání makléřů: Yevgen + Kateřina (Task #3)

**Datum:** 2026-04-27  
**Autor:** Kontrolor  
**Soubory:** `prisma/seed.ts` (modified), `prisma/update-founders.ts` (new, untracked)  
**Status: ⚠️ PODMÍNĚNĚ OK — 1 bug blokuje produkci, 1 warning**

---

## VERDICT

Seed a BrokerCard jsou správné — jména, slug, bio, jobTitle. Na webu se pozice zobrazí. **Ale `update-founders.ts` neaktualizuje `jobTitle` → produkční DB bude mít jobTitle = null = žádná pozice se nezobrazí.** Navíc změny nejsou commitnuty.

---

## 1. SIMPLIFY KONTROLA

- `seed.ts`: Minimální, cílené změny. Žádná duplicita. ✅  
- `update-founders.ts`: 57 řádků, přímočarý script. Žádná zbytečná složitost. ✅  

---

## 2. DEBUG KONTROLA

Build z předchozího reportu: ✅ PASS (1295 stránek)  
Lint: ✅ PASS (žádné nové chyby)

---

## 3. REVERZNÍ KONTROLA

### Požadavek: Správná jména

| Pole | Yevgen | Kateřina |
|------|--------|----------|
| firstName | `"Yevgen"` ✅ | `"Kateřina"` ✅ |
| lastName | `"Ulyanchenko"` ✅ | `"Fusslová"` ✅ |
| email | `zenuly3@gmail.com` ✅ | `Fusslova.k@gmail.com` ✅ |

### Požadavek: Role a viditelnost na /makleri

`makleri/page.tsx` filter: `role: { in: ["BROKER", "ADMIN", "MANAGER"] }`

| Uživatel | Role v seed.ts | Viditelný na /makleri |
|----------|---------------|----------------------|
| Yevgen | `"BROKER"` ✅ | ANO ✅ |
| Kateřina | `"BROKER"` ✅ | ANO ✅ |

> **Poznámka (WARN-1):** Yevgen měl původně `"ADMIN"` roli — nově `"BROKER"`. Na fresh seed nebude mít admin přístup. Dle zadání ("V DB mají roli BROKER") je toto záměr. Ale dev setup bude odlišný od produkce (kde má stále ADMIN/MANAGER). Doporučení: zvážit ponechání `"ADMIN"` role nebo vytvoření separátního admin účtu.

### Požadavek: Pozice "Founder" / "Manažer" na webu

| Krok | Status |
|------|--------|
| `jobTitle` v `schema.prisma` | ✅ — field existuje s komentářem "Zobrazená pozice na webu" |
| `jobTitle` v `seed.ts` | ✅ — `jobTitle: "Founder"` / `jobTitle: "Manažer"` |
| `makleri/page.tsx` fetchuje jobTitle | ✅ — `select: { jobTitle: true }`, předává do BrokerCard |
| `BrokerCard` zobrazuje jobTitle | ✅ — `{broker.jobTitle && <span className="text-xs font-semibold text-orange-500">{broker.jobTitle}</span>}` |

**Na webu se pozice zobrazí — IF jobTitle je nastaven v DB.**

---

## 4. HLAVNÍ PROBLÉM: update-founders.ts NEaktualizuje jobTitle

### 🔴 BUG-1 (BLOKUJÍCÍ pro produkci)

**Soubor:** `prisma/update-founders.ts`

```typescript
// Yevgen (řádky 21-32) — chybí jobTitle!
const yevgen = await prisma.user.updateMany({
  where: { email: "zenuly3@gmail.com" },
  data: {
    firstName: "Yevgen",
    lastName: "Ulyanchenko",
    slug: "yevgen-ulyanchenko",
    city: "Praha",
    bio: "Zakladatel CarMakléř...",
    showPhone: true,
    status: "ACTIVE",
    // ❌ jobTitle: "Founder" CHYBÍ
  },
});
```

**Dopad:** Po spuštění `update-founders.ts` na produkci:  
- Yevgen a Kateřina budou mít správná jména, slug, bio ✅  
- Ale `jobTitle` zůstane `null` (nebo co bylo dříve) → BrokerCard nezobrazí pozici ❌  

**Fix:**
```typescript
// Yevgen
data: {
  ...,
  jobTitle: "Founder",  // ← přidat
}

// Kateřina  
data: {
  ...,
  jobTitle: "Manažer",  // ← přidat
}
```

---

## 5. GIT STATUS — NEZCOMMITOVÁNO

```
Changes not staged for commit:
  modified:   prisma/seed.ts

Untracked files:
  prisma/update-founders.ts
```

**⚠️ WARN-2:** Ani seed.ts ani update-founders.ts nejsou v gitu. Pro produkci je potřeba commit a deploy.

---

## 6. BEZPEČNOST update-founders.ts

| Kritérium | Stav |
|-----------|------|
| `updateMany` s přesným email filtrem | ✅ Idempotentní — bezpečné spouštět opakovaně |
| NEmění roli uživatele | ✅ Yevgen zůstane ADMIN, Kateřina MANAGER na produkci |
| Error handling → `process.exit(1)` | ✅ |
| `prisma.$disconnect()` v finally | ✅ |
| Hardcoded credentials | ✅ Žádné — pouze profile data |
| Bezpečné pro produkci? | ✅ (po přidání jobTitle) |

---

## 7. SLUG A BIO

| Pole | Yevgen | Kateřina |
|------|--------|---------|
| slug | `yevgen-ulyanchenko` ✅ | `katerina-fusslova` ✅ |
| city | `Praha` ✅ | `Praha` ✅ |
| bio | Smysluplné, in-character ✅ | Smysluplné, in-character ✅ |
| showPhone | `true` ✅ | `true` ✅ |

---

## ZÁVĚR

**⚠️ NEPROCHÁZET — fix potřeba před commitem**

1. **BUG-1 [BLOCKER]:** Přidat `jobTitle: "Founder"` a `jobTitle: "Manažer"` do `update-founders.ts`
2. **WARN-2:** Po fixu commitnout `prisma/seed.ts` + `prisma/update-founders.ts`
3. **WARN-1:** Zvážit roli Yevgena v seed.ts (`"BROKER"` vs `"ADMIN"`) — záměr OK dle zadání, ale broken dev setup

Po opravě BUG-1 a commitu: **SCHVÁLENO** ✅
