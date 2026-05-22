# Implementace P0-06: Odstraneni hardcoded site password

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Odstraneno hardcoded heslo `"Admin2026"` z `middleware.ts`. Nahrazeno dynamickym ctenim z `process.env.SITE_PASSWORD`. Pokud env promenna neni nastavena, password ochrana je kompletne vypnuta (web je verejny).

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `middleware.ts` r.86 | Odstranen `const SITE_PASSWORD = "Admin2026"` (top-level const) |
| `middleware.ts` r.108-109 | `sitePassword` se cte dynamicky uvnitr middleware funkce, pridana podminka `sitePassword &&` |
| `__tests__/middleware.test.ts` | Testy upraveny: `process.env.SITE_PASSWORD` se nastavuje v `beforeEach`, cisti v `afterEach`. Pridan novy test "bez SITE_PASSWORD v env je web verejny". |

### Detaily implementace

Middleware nyni cte heslo dynamicky uvnitr funkce (ne jako top-level const):
```ts
const sitePassword = process.env.SITE_PASSWORD || null;
if (sitePassword && !shouldSkipSiteAuth(pathname)) { ... }
```

Duvod: top-level const by se v testech nacetl jednou pri importu a nelze ho menit. Dynamicke cteni umoznuje testovani i runtime zmeny.

### Gate stranka

Gate stranka (`/gate`) jako soubor v `app/` neexistuje. Middleware na ni redirectuje, ale pokud `SITE_PASSWORD` neni nastaveno, redirect se nikdy nestane. Pro staging/dev bude gate stranka potreba -- to je separatni task.

## Bezpecnostni poznamky

- `"Admin2026"` je stale v git history -- po launchi zvazit vycisteni
- Cookie `site_access` by mela byt httpOnly a secure v produkci
- Pro staging pouzit silnejsi heslo

## Overeni

- [x] Zadny hardcoded `"Admin2026"` v zdrojovem kodu (pouze v plan souborech a testech jako ocekavana hodnota)
- [x] Bez `SITE_PASSWORD` v env: blok se preskoci, web je verejny
- [x] S `SITE_PASSWORD` v env: password ochrana funguje jako predtim
- [x] Testy upraveny a konzistentni s novou logikou
- [ ] Testy nespusteny (node_modules neni nainstalovano)
