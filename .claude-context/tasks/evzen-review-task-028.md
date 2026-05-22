# Evžen Review: TASK-028 — SSR migrace Fáze 3+4 batch

**Datum:** 2026-05-07
**Verdikt:** SCHVÁLENO (oba commity)

---

## Fáze 3 (commit 61454a6) — již schváleno

Viz `.claude-context/tasks/evzen-review-task-025.md` — schváleno 2026-05-07. 10/10 stránek OK.

---

## Fáze 4 (commit 11abcb3) — 5 eshop stránek

### Kontrola vs zadání

| # | Kritérium | Výsledek |
|---|-----------|----------|
| 1 | Žádné "use client" na page.tsx | ✅ 5/5 |
| 2 | Prisma queries na serveru | ✅ hlidaci-pes, reklamace, vraceni |
| 3 | Auth guard | ✅ `getServerSession` + `redirect("/login")` kde potřeba |
| 4 | Date serializace | ✅ `.toISOString()` pro client props, nullable handled |
| 5 | Client islands mají "use client" | ✅ ClaimForm, ReturnForm, WatchdogManager |
| 6 | Next.js 15 searchParams pattern | ✅ `async` + `await searchParams` (Promise<>) |
| 7 | Build OK | ✅ |
| 8 | Lint OK | ✅ |

### Namátková kontrola (3 stránky)

**dily/objednavka/potvrzeni/page.tsx** ✅ SSR OK
- Diff ověřen: pouze odebráno "use client" + useSearchParams → async + await searchParams
- `window.location.origin` nahrazeno `process.env.NEXT_PUBLIC_BASE_URL` — lepší pro SSR

**shop/moje-objednavky/[id]/vraceni/page.tsx** ✅
- Auth guard + Prisma `order.findFirst` s `status: "DELIVERED"` guard
- `deliveredAt?.toISOString() ?? null` — nullable date správně serializována
- Not found fallback s vysvětlujícím textem

**muj-ucet/hlidaci-pes/page.tsx** ✅
- Auth guard + Prisma `watchdog.findMany`
- `.createdAt.toISOString()` — správná serializace
- Kompaktní 33 řádků

---

### ⚠️ Pre-existing bug: chybějící diakritika

**Soubor:** `dily/objednavka/potvrzeni/page.tsx`
**Řádky:** 42, 44, 58, 70

| Řádek | Aktuální text | Správný text |
|-------|--------------|--------------|
| 42 | "Odkaz pro sledovani objednavky" | "Odkaz pro sledování objednávky" |
| 44 | "Ulozte si tento odkaz — muzete pres nej sledovat stav objednavky bez prihlaseni." | "Uložte si tento odkaz — můžete přes něj sledovat stav objednávky bez přihlášení." |
| 58 | "Sledovat objednavku" | "Sledovat objednávku" |
| 70 | "Vytvorit ucet" | "Vytvořit účet" |

**Toto NENÍ zavedeno SSR migrací** — diff potvrzuje, že texty nebyly tímto commitem změněny. Je to pre-existing bug, který existoval už v client-side verzi.

**Doporučení:** Opravit diakritiku jako samostatný fix. NEBLOKUJE schválení SSR migrace.

---

### Evženovy kontrolní body

| Pravidlo | Výsledek |
|----------|----------|
| Žádné zkratky v UI | ✅ Žádné zkratky (ale pre-existing chybějící diakritika flagnuta výše) |
| Nic se neschovává | ✅ |
| Nic se nemaže | ✅ |

---

## Celkový verdikt

**SCHVÁLENO** — Fáze 3 i Fáze 4 SSR migrace odpovídají zadání. Chybějící diakritika v dily/potvrzeni je pre-existing a měla by být opravena samostatně.
