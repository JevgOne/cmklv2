# Chrome Test — Nabírání vozu (full flow) — Produkce

**Datum:** 2026-04-26  
**Prostředí:** Produkce — https://carmakler.cz  
**Přihlášen jako:** jan.novak@carmakler.cz (Jan Novák, BROKER, ACTIVE)  
**Draft testování:** draft_1777191078234_kzu9bc9 (standard), draft_1777191385781_p6dyogm (quick)

---

## KRITICKÉ PRODUKČNÍ BUGY 🔴

### BUG 1: VIN step — error boundary (Standard flow)

**URL:** `/makler/vehicles/new/vin?draft=...`  
**Symptom:** Zobrazuje se `error.tsx` — "Nastala neočekávaná chyba — Při načítání stránky VIN došlo k chybě."  
**Tlačítko "Zkusit znovu":** Neresetuje, stejná chyba  
**Příčina:** Pravděpodobně výjimka v `VinStep.tsx` nebo `StepPageGuard` — chyba v inicializaci draft contextu  
**Stav:** Task #18 "Implement VIN StepPageGuard" je IN_PROGRESS  
**Priorita:** P0 — makléř nemůže zadat VIN v standard flow

### BUG 2: Details step — Internal Server Error (Standard flow)

**URL:** `/makler/vehicles/new/details?draft=...`  
**Symptom:** Stránka zobrazuje "Internal Server Error" (prázdná stránka)  
**Priorita:** P0 — makléř nemůže vyplnit detaily vozidla

### BUG 3: Pricing step — Chunk loading failed (Standard flow)

**URL:** `/makler/vehicles/new/pricing?draft=...`  
**Symptom:** "Loading chunk 20271 failed. (error: `.../pricing/page-3e16c52ea5434835.js`)"  
**Příčina:** JS chunk soubor neexistuje na serveru — deployment issue (stale chunk hash)  
**Priorita:** P0 — makléř nemůže nastavit cenu

### BUG 4: Review step — Chunk loading failed (Standard flow)

**URL:** `/makler/vehicles/new/review?draft=...`  
**Symptom:** "Loading chunk 21899 failed. (error: `.../review/page-039be85c8a2e7226.js`)"  
**Příčina:** Stejný deployment issue jako pricing  
**Priorita:** P0 — makléř nemůže odeslat vozidlo ke schválení

**Společná příčina BUG 3+4:** Pravděpodobně nekompletní deployment — nový build byl nahrán ale staré chunk soubory byly přepsány novými hashy. Quick flow stejnou chybou NETRPÍ (používá jiné chunks).

---

## Standard Flow — Krok za krokem

### Přihlášení ✅
- `jan.novak@carmakler.cz` / `heslo123` → redirect na `/makler/dashboard` ✅

### Dashboard ✅
- Stats, follow-up, CTA "Rychle nabrat" + "Kompletně" ✅

### Startovací stránka `/makler/vehicles/new` ✅
- Tlačítko "Nabrat nové auto" → automaticky vytvoří draft + redirect na Contact ✅
- Draft ID ve všech URL query params ✅

### Krok 1/7 — Kontakt ✅
- **URL:** `/makler/vehicles/new/contact?draft=...`
- **Progress:** 14%
- **Pole:** Zdroj leadu (select: Bazos, Sauto, Facebook, Doporučení, Studený kontakt, Jiný), Jméno *, Telefon *, Email, Značka/Model/Rok/KM/Cena (volitelné), Adresa, Termín schůzky, Poznámky ✅
- **Test:** Karel Prodejce / +420 601 234 567 / Škoda Octavia → Pokračovat → přechod na Prohlídku ✅

### Krok 2/7 — Prohlídka ✅
- **URL:** `/makler/vehicles/new/inspection?draft=...`
- **Progress:** 29%
- **Checklisty (26 checkboxů):**
  - Dokumenty: TP malý, TP velký, servisní knížka, STK, emise, nabíjecí kabel, druhé klíče ✅
  - Exteriér: Stav (Výborný/Dobrý/Ucházejí/Špatný) + 6 defektů ✅
  - Interiér: Stav + 7 defektů ✅
  - Motor, převodovka, kola, brzdy ✅
  - "Odmítnout vozidlo" tlačítko ✅
- **Test:** Klik Výborný exteriér + interiér → Pokračovat → přechod na VIN ✅

### Krok 3/7 — VIN 🔴 BUG #1
- **URL:** `/makler/vehicles/new/vin?draft=...`
- **Symptom:** error.tsx — "Nastala neočekávaná chyba"
- **Nelze testovat**

### Krok 4/7 — Fotky ✅ (přímá navigace)
- **URL:** `/makler/vehicles/new/photos?draft=...`
- **Progress:** 57%
- **Exteriér:** 13 guided slots (Přední 3/4, Přímý přední, Pravý bok, ...) ✅
- **Interiér:** Palubní deska, Přední/Zadní sedadla, Zavazadlový prostor ✅
- **Motor:** Motorový prostor ✅
- **Důkazní (POVINNÉ):** Tachometr, VIN štítek, Klíče s doklady ✅
- **Doklady:** TP, Servisní knížka ✅
- Progress counter "0/13 exteriér" ✅

### Krok 5/7 — Detaily 🔴 BUG #2
- **URL:** `/makler/vehicles/new/details?draft=...`
- **Symptom:** Internal Server Error
- **Nelze testovat** (AI popis feature na tomto kroku nelze ověřit)

### Krok 6/7 — Cena a lokace 🔴 BUG #3
- **URL:** `/makler/vehicles/new/pricing?draft=...`
- **Symptom:** "Loading chunk 20271 failed"
- **Nelze testovat**

### Krok 7/7 — Review 🔴 BUG #4
- **URL:** `/makler/vehicles/new/review?draft=...`
- **Symptom:** "Loading chunk 21899 failed"
- **Nelze testovat**

---

## AI Popis feature — nelze ověřit 🔴

Feature "auto-generuje se po zadání 3+ položek výbavy" je v kroku Details (Krok 5/7), který vrací Internal Server Error. **Feature nelze otestovat.**

---

## Quick Flow — 3 kroky ✅ KOMPLETNĚ FUNKČNÍ

### Step 1/3 — VIN + Kontakt ✅
- Auto-vytvoří draft s ID ✅
- Progress: 33%
- Pole: VIN (17 znaků s validací), Jméno, Telefon, Poloha ✅

### Step 2/3 — Fotky ✅
- Progress: 67%
- 5 povinných fotek: Přední 3/4, Zadní 3/4, Interiér, Tachometr, VIN štítek ✅
- Counter "0/5 povinných" ✅

### Step 3/3 — Cena a odeslání ✅
- Progress: 100%
- Najeto KM, Prodejní cena, Stav vozidla (6 opcí) ✅
- "⚡ Odeslat rychlý draft" + info o 48h doplnění ✅

---

## Souhrn

| Komponenta | Stav | Poznámka |
|-----------|------|---------|
| Broker dashboard | ✅ PASS | Stats, CTA tlačítka |
| Standard flow — Kontakt (1/7) | ✅ PASS | Formulář, přechod OK |
| Standard flow — Prohlídka (2/7) | ✅ PASS | 26 checkboxů, stav vozidla |
| Standard flow — VIN (3/7) | 🔴 FAIL | error.tsx, Task #18 in progress |
| Standard flow — Fotky (4/7) | ✅ PASS | 13+4+1+3 sloty |
| Standard flow — Detaily (5/7) | 🔴 FAIL | Internal Server Error |
| Standard flow — Cena (6/7) | 🔴 FAIL | Chunk loading failed (deployment) |
| Standard flow — Review (7/7) | 🔴 FAIL | Chunk loading failed (deployment) |
| AI popis feature | 🔴 NELZE | Detaily step nefunguje |
| Quick flow (všechny 3 kroky) | ✅ PASS | Kompletně funkční |

**Verdict:** Standard flow je částečně nefunkční (4/7 kroků FAIL). Quick flow 100% funkční. Deployment issue (stale chunks) je nutno urgentně opravit na serveru.

**Doporučení:**
1. 🔴 Urgentní: Zkontrolovat deployment na serveru — `ls /app/.next/static/chunks` — ověřit že pricing a review chunk soubory existují
2. 🔴 Task #18 (VIN StepPageGuard) — dokončit a znovu deployovat
3. 🔴 Details step Internal Server Error — zkontrolovat server logs

---

*Chrome test: 2026-04-26*
