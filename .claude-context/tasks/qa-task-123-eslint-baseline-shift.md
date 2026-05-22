# QA Diagnóza — Task #121/#123: ESLint baseline shift 538 → 542

**Datum:** 2026-04-07  
**Agent:** KONTROLOR  
**Předmět:** Identifikace 4 nových warnings (538 → 542)

---

## Aktuální stav

| Metrika | Hodnota |
|---------|---------|
| Aktuální baseline | **542 warnings, 0 errors** |
| Předchozí baseline | **538 warnings, 0 errors** (QA #114 při `f13f2f2`) |
| Rozdíl | **+4 warnings** |
| Celkový lint exit code | 0 (PASS) — žádné errors |

---

## Výsledek analýzy

`git diff --name-only f13f2f2 ea4386c` (přesný rozsah měření) ukazuje **pouze 3 commitnuté soubory** změněné mezi baseline 538 a měřením 542:

```
.github/workflows/ci.yml      ← YAML, eslint nespouštěn
lib/hooks/useOnlineStatus.ts  ← TypeScript ✓
prisma.config.ts               ← 0 warnings
```

---

## 4 Nové Warnings — Přesný výčet

### Warning #1 (commit `16367b4` — COMMITTED)

| Pole | Hodnota |
|------|---------|
| **Soubor** | `lib/hooks/useOnlineStatus.ts:15:5` |
| **Rule** | `react-hooks/purity` |
| **Message** | "Calling setState synchronously within an effect can trigger cascading renders" |
| **Příčina** | Commit `16367b4` přidal `setIsOnline(navigator.onLine)` jako první volání v `useEffect()` |
| **Severity** | Medium — není error, ale anti-pattern dle React docs |
| **Suggested fix** | Přesunout sync stav do lazy initializer NEBO použít `useLayoutEffect` pro okamžitou synchronizaci |

**Diff kód:**
```typescript
// PŘED (f13f2f2): lazy initializer — 0 warnings
const [isOnline, setIsOnline] = useState(() =>
  typeof navigator !== "undefined" ? navigator.onLine : true
);

// PO (16367b4): setIsOnline() v useEffect — +1 warning
const [isOnline, setIsOnline] = useState(true);
useEffect(() => {
  setIsOnline(navigator.onLine); // ← react-hooks/purity warning
  ...
}, []);
```

---

### Warnings #2–#4 (untracked soubor `e2e/chrome-test-116-deploy.spec.ts`)

Soubor byl vytvořen test-chrome agentem během **Task #118 (TEST-CHROME po deployi)** — tedy MEZI měřením 538 (QA #114) a měřením 542 (CI diagnóza #117). Není commitnutý.

| # | Soubor:řádek | Rule | Message |
|---|---|---|---|
| 2 | `e2e/chrome-test-116-deploy.spec.ts:1:29` | `@typescript-eslint/no-unused-vars` | 'BrowserContext' is defined but never used |
| 3 | `e2e/chrome-test-116-deploy.spec.ts:1:50` | `@typescript-eslint/no-unused-vars` | 'Page' is defined but never used |
| 4 | `e2e/chrome-test-116-deploy.spec.ts:8:16` | `@typescript-eslint/no-unused-vars` | 'authFetch' is defined but never used |

*(4. warning tohoto souboru — `r2` na řádku 175 — mohl offset kompenzovat jinou změnu, viz poznámka níže)*

**Suggested fix:** Odebrat nepoužité importy z hlavičky souboru:
```typescript
// Odstranit z importu:
import { BrowserContext, Page } from "@playwright/test"; // → oba nepoužity
// A:
const authFetch = ... // → smazat nebo použít
```

---

## Hypotéza leadera — verifikace

**Hypotéza:** viník = `aa9bdac` (#87a SEO MVP) nebo `f13f2f2` (URL canonicalization)

**Výsledek: ❌ HYPOTÉZA NESPRÁVNÁ**

QA #114 report (pro commit `f13f2f2`) explicitně naměřil **538 warnings** — tedy oba commity `aa9bdac` a `f13f2f2` jsou ALREADY zahrnuty v baseline 538. Žádný z nich nepřinesl nové warnings.

**Skutečný viník:**
- Commit `16367b4` (prod hardening — useOnlineStatus hydration fix) — **+1 committed warning**
- Nový untracked soubor `e2e/chrome-test-116-deploy.spec.ts` (test-chrome task #118) — **+3 warnings** (nebo +4 s lehkým offsetem)

---

## Per-file analýza nových souborů z batche `aa9bdac`

| Soubor | Warnings | Závěr |
|--------|---------|-------|
| `app/(web)/dily/vrakoviste/[slug]/page.tsx` | 0 | ✅ Čistý |
| `app/llms.txt/route.ts` | 0 | ✅ Čistý |
| `lib/seo/slugify.ts` | 0 | ✅ Čistý |
| `lib/seo.ts` (modifikován) | 0 | ✅ Čistý |
| `app/sitemap.ts` (modifikován) | 0 | ✅ Čistý |

**`aa9bdac` nezavedl žádné nové warnings.** Potvrzeno.

---

## Distribuce untracked vs committed warnings

| Zdroj | Count |
|-------|-------|
| Committed soubory | **533** |
| Untracked test soubory | **9** |
| **Celkem** | **542** |

Untracked soubory s warnings (lokálně přítomny, ale necommitnuté):

| Soubor | Warnings |
|--------|---------|
| `e2e/chrome-test-116-deploy.spec.ts` | 4 |
| `e2e/debug-login3.spec.ts` | 2 |
| `e2e/debug-login.spec.ts` | 1 |
| `e2e/debug-login2.spec.ts` | 1 |
| `e2e/flow-2-4-test.spec.ts` | 1 |

**V CI (commitnuté soubory only): 533 warnings — není 542!** CI počítá MÉNĚ warnings než lokální měření.

---

## Doporučení

### Option A — Přijmout nový baseline (doporučeno pro untracked)
Untracked test soubory nejsou součástí commitů → CI nikdy neuvidí jejich warnings. Lokální 542 je "znečištěno" dočasnými test soubory. **Žádná akce není potřeba pro CI.**

### Option B — Opravit `useOnlineStatus.ts` (doporučeno)
1 warning z `react-hooks/purity` v commitnutém kódu je reálný a zasluhuje fix:
```typescript
// Fix: lazy initializer s navigator.onLine místo setState v useEffect
const [isOnline, setIsOnline] = useState(() =>
  typeof window !== "undefined" ? navigator.onLine : true
);
// useEffect pouze pro event listeners, bez sync setState
```

### Option C — Vyčistit untracked test soubory
Commitnout nebo smazat `e2e/chrome-test-116-deploy.spec.ts` a zbývající debug soubory. Pak lokální baseline klesne na ~533.

---

## Souhrn

| Aspekt | Výsledek |
|--------|---------|
| Hypotéza leader (aa9bdac / f13f2f2) | ❌ NESPRÁVNÁ — obě v baseline 538 |
| Skutečný viník commitnutý | ✅ `16367b4` → `useOnlineStatus.ts:15:5` (1 warning) |
| Skutečný viník untracked | ✅ `chrome-test-116-deploy.spec.ts` (3–4 warnings, nový soubor z task #118) |
| CI impakt | ✅ MINIMÁLNÍ — CI vidí 533 committed warnings (ne 542) |
| Severity | LOW — všechno pouze warnings, 0 errors |
| Blocker | ❌ Ne |
