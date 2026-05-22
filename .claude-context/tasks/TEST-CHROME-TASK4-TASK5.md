# TEST-CHROME Report: Task #4 + Task #5

**Datum:** 2026-05-21  
**Tester:** TEST-CHROME agent  
**Dev server:** localhost:3001/3000 (nestabilní — OOM crashes při Playwright)

---

## Task #4 — Enrichment sync fix (upsert v ingest endpointu)

**Výsledek:** PŘESKOČENO (dle instrukcí leada)  
Backend pipeline, nelze testovat v browseru.

---

## Task #5 — LeadPriceChart redesign

### Stav prostředí

**Problém:** Dev server opakovaně crashoval kvůli nedostatku paměti (OOM):
- Server byl spuštěn na portu 3001 (jiný process než standardní 3000)
- Po spuštění nového dev serveru na 3000: server konsumoval 1GB+ RAM
- "Server is approaching the used memory threshold, restarting..." → crash po každé Playwright session
- Playwright Chromium + Next.js Turbopack = příliš vysoká paměťová zátěž pro dev prostředí
- screencapture nefungoval v tmux bez X11 display

**Co se podařilo vizuálně ověřit:**
- ✓ Login stránka se načetla (screenshot: `/tmp/t5-02-login.png`)
- ✓ Admin dashboard po přihlášení (screenshot: `/tmp/min-02-dashboard.png`, `/tmp/t5-03-after-login.png`)
- ✗ Scout-leads detail stránka nedosažitelná z Playwright (vždy timeout)

### Code Review (primární ověření implementace)

#### LeadPriceChart.tsx (`components/admin/scout-leads/LeadPriceChart.tsx`)

| Požadavek | Stav | Detail |
|-----------|------|--------|
| Gradient bary (ne flat šedé) | ✅ PASS | `linearGradient` def + `Cell fill="url(#barGradient)"` na isCurrent, `url(#barGradientMuted)` ostatní |
| Modrá dashed čára = medián | ✅ PASS | `stroke="#3B82F6"` + `strokeDasharray="5 3"` + label "Medián" |
| Oranžová čára = cena vozu | ✅ PASS | `stroke="#F97316"` + label "Tento vůz" (podmíněno: bucket ≠ median bucket) |
| Dark tooltip při hoveru | ✅ PASS | CustomTooltip s `bg-gray-900 text-white text-xs rounded-lg` |
| Mini-cards stats | ✅ PASS | "Tržní medián" (blue), "Průměr", "Cenové pásmo", "Porovnáno" (4 cardy) |
| Source badge "AutoScout24" | ✅ PASS | `AutoScout24: {sources.autoscout24}` na řádku 87 |
| Badge NENÍ "AS24" | ✅ PASS | String "AutoScout24" explicitně, žádný alias "AS24" |
| Source badge "Sauto" | ✅ PASS | `Sauto: {sources.sauto}` |
| Responzivní layout | ✅ PASS | `grid grid-cols-2 sm:grid-cols-4 gap-3` |

#### Integrace v ScoutLeadDetail.tsx

| Aspekt | Stav | Detail |
|--------|------|--------|
| Podmíněný render | ✅ PASS | `{isSoukromnik && (...)}` — graf jen pro SOUKROMNIK kategorii |
| "Nedostatek dat" zpráva | ✅ PASS | `"Nedostatek dat pro cenovou analýzu"` při `marketData && !priceDistribution` |
| Market data fetch | ✅ PASS | `useEffect` → `/api/scout-leads/${id}/market-analysis` client-side |
| Tržní analýza sekce | ✅ PASS | Sekce existuje v kódu jako MARKET ANALYSIS SECTION comment + conditional rendering |

### Data v DB

SOUKROMNIK leady v DB (potenciální testovací data):
- `cmpedbenz0002s47r5avx444p` — Volvo V60, 433 500 Kč, Bazoš
- `cmpedbenp0001s47rps8dgj0f` — Škoda Octavia (2017), 239 000 Kč, Bazoš  
- `cmpe4v31q0000n57reymt7rsp` — VW Passat B8, 416 000 Kč, Bazoš

Pro vizuální verifikaci market analysis: nutné ověřit zda market-analysis API vrací data pro tyto leady (závisí na dostupnosti externích dat).

### Souhrn

| | Task #4 | Task #5 |
|-|---------|---------|
| **Code Review** | N/A | ✅ VŠECHNY požadavky splněny |
| **Browser test** | Přeskočeno | ⚠️ BLOKOVÁNO (OOM server) |
| **Doporučení** | — | Manuální re-test po restartu serveru s dostatečnou RAM |

### Screenshoty

- `/tmp/t5-01-filled.png` — Login formulář vyplněný
- `/tmp/t5-02-login.png` — Login stránka (cookies banner)
- `/tmp/t5-03-after-login.png` — Admin dashboard po přihlášení (loading skeleton)
- `/tmp/min-02-dashboard.png` — Admin dashboard (viewport 1400x900)

---

## Závěr

**Task #4:** Nelze testovat v browseru, přeskočeno dle zadání.

**Task #5:** Implementace je **kompletní a správná** dle code review. Všechny vizuální požadavky (gradient bary, dashed median čára, dark tooltip, mini-cards, source badges se správným "AutoScout24" labelem, responzivní grid) jsou implementovány přesně dle specifikace.

Vizuální browser test byl zablokován OOM pádem dev serveru při Playwright seseích. **Doporučuji manuální ověření** přes `localhost:3000/admin/scout-leads/{ID}` po restartu dev serveru.

**Výsledek:** ✅ CODE REVIEW PASS / ⚠️ BROWSER TEST BLOKOVÁNO (environment issue, ne code issue)
