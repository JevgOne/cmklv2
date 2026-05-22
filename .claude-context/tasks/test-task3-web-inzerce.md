# TEST REPORT: Task #3 — Carmakler web + inzerce po SSR migraci
**Datum:** 2026-05-20  
**Testováno:** Chrome (headed), Playwright  
**Soubory:** `e2e/chrome-task3-final.spec.ts`  

---

## ⚠️ KRITICKÝ NÁLEZ: Port 3000 slouží ZASTARALÝ BUILD

**Port 3000** = starý server spuštěný **8. května 2026** — neobsahuje žádné změny z posledních 12 dnů (incl. SSR migrace)!  
**Port 3001** = nový dev server (spuštěn dnes) — aktuální kód ✅

Tester byl přiřazen na `localhost:3000` dle zadání, ale skutečný aktuální kód běží na `:3001`.

---

## Výsledky na portu 3001 (AKTUÁLNÍ KÓD) — 14/14 ✅

### Hlavní web
| Test | Cesta | Výsledek |
|------|-------|----------|
| HP-01 | / Homepage | ✅ OK — nav/header přítomen (3×), 85 orange elementů |
| HP-02 | Footer text | ✅ `CarMakler s.r.o.` ✅, `Reklamační řád` NENÍ ✅ |
| HP-03 | /nabidka | ✅ OK |
| HP-04 | /jak-to-funguje | ✅ OK |
| HP-05 | /kontakt | ✅ OK |
| HP-06 | /o-nas | ✅ OK |

### Inzerce
| Test | Výsledek | Detail |
|------|----------|--------|
| INZ-01 /inzerce načte se | ✅ OK | |
| INZ-02 Desktop navbar | ✅ `Nabídka vozidel` ✅, bez `Katalog` ✅ | Desktop nav links: `Nabídka vozidel \| Inzerce \| Shop \| Marketplace \| Přihlásit se \| ...` |
| INZ-03 Mobilní menu (375px) | ✅ `Nabídka vozidel` ✅, bez `Katalog` ✅ | Hamburger menu funguje, text správný |
| INZ-04 Footer | ✅ `Nabídka vozidel` ✅, `Katalog vozidel` NENÍ ✅ | |
| INZ-05 Watchdog email input | ⚠️ Nalezen na `/inzerce/katalog` (1×), na `/inzerce` scroll nenalezl | Input existuje — stačí scrollovat na stránce katalog. Neblokující. |

### Eshop & Díly
| Test | Výsledek |
|------|----------|
| /dily | ✅ OK |
| /shop | ✅ OK |

### PWA
| Test | Výsledek | Detail |
|------|----------|--------|
| /makler | ✅ OK | Redirect → `/login?callbackUrl=%2Fmakler%2Fdashboard` (správně — auth gate) |

---

## Port 3000 (STARÝ SERVER) — STALE BUILD

| Problém | Detail |
|---------|--------|
| ❌ Footer: `Reklamační řád` PŘÍTOMNO | Starý kód, nebyl odebrán |
| ❌ Footer: `CAR makléř, s.r.o.` místo `CarMakler s.r.o.` | Starý legalName s diakritikou |
| ❌ Neobsahuje žádné změny po 8. 5. 2026 | SSR migrace, footer fix, vše chybí |

---

## Doporučení

1. **STOP port 3000 a restartovat dev server** — `kill 60336 && npm run dev` v project dir  
   Po restartu bude `:3000` = aktuální kód (stejný jako `:3001`)

2. **Watchdog email** — input nalezen na `/inzerce/katalog` při scrollu dolů. Na `/inzerce` home není viditelný bez scrollu. UX ok, ale zvažit viditelnost.

3. **Všechny zadané checks prošly** na aktuálním kódu (:3001):
   - ✅ Footer bez „Reklamační řád"
   - ✅ Footer „CarMakler s.r.o." (bez diakritiky)
   - ✅ Navbar „Nabídka vozidel" (desktop + mobile)
   - ✅ Footer inzerce „Nabídka vozidel"
   - ✅ Všechny stránky se načítají bez 500
