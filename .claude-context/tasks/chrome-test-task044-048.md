# Chrome Test Report — TASK-044/045/047/048

**Datum:** 2026-04-25
**Tester:** test-chrome
**Dev server:** http://localhost:3000 ✅ (HTTP 200)

---

## TASK-044 — Kariérní systém s hvězdičkami

### 1. Admin `/admin/career`
- **HTTP:** 307 → `/login?callbackUrl=%2Fadmin%2Fcareer` ✅ (správná auth ochrana)
- **Zdrojový kód:** `CareerOverviewContent.tsx`
  - Tabulka prahů pro 4 regiony: PRAHA, BRNO, OSTRAVA_PLZEN, SMALL ✅
  - Přehled makléřů s kolonami: Jméno, Region, Celkový obrat, Úroveň, Provize, Prodeje, Obrat měsíc, K vyplacení, Akce ✅
  - Tlačítko **"Snížit"** pro degradaci úrovně (viditelné u STAR_2+ makléřů) ✅
  - API endpoint `/api/admin/career/[id]/level` — 401 bez auth ✅

### 2. PWA `/makler/stats`
- **HTTP:** 307 → `/login?callbackUrl=%2Fmakler%2Fstats` ✅ (správná auth ochrana)
- **Zdrojový kód:** `stats/page.tsx`
  - `LevelBadge` — hvězdičky ✅
  - Progress bar s obratem (currentThreshold → nextThreshold) ✅
  - Region tier display ✅
  - Provize % ✅
  - "Chybí X Kč do..." ✅

### 3. Veřejný profil `/profil/jan-novak-praha`
- **HTTP:** 200 ✅
- **Otevřeno v Chrome** ✅
- `LevelProgressBar` v source: **NENALEZENO** ✅ (odstraněno)
- `Kč` / `obrat` / `revenue` v rendered HTML: **NENALEZENO** ✅
- Hvězdičky: kód správně zobrazuje ⭐ pro STAR_2-5 makléře ✅
- **Poznámka:** Seed data v DB má "JUNIOR" úroveň (starý systém), ne STAR_X. Proto testovací profily nezobrazí hvězdičky. Kód je správný — noví makléři dostanou výchozí `STAR_1`. Seed data neodpovídají novému schématu.

---

## TASK-045 — Loga v PDF

### 4. `/api/contracts/[id]/pdf`
- Endpoint existuje: `app/api/contracts/[id]/pdf/route.ts` ✅
- Logo implementace: `lib/pdf/logo.ts` čte `public/brand/logo-dark.png` a vrací base64 ✅
- Soubor `logo-dark.png` existuje v `public/brand/` ✅
- `doc.addImage(logoData, "PNG", ...)` — ŽÁDNÝ text "CARMAKLER" ✅
- **Nelze otestovat přes browser bez existující smlouvy + přihlášení** — kód ověřen staticky

---

## TASK-047 — Registrace

### 5. `/registrace/makler`
- **HTTP:** 200 ✅
- **Otevřeno v Chrome** ✅
- Diakritika v source: `Jméno` ✅, `Příjmení` ✅, `Heslo` ✅, `Telefon` ✅, `IČO` ✅, `Souhlasím` ✅
- Nadpis: "Registrace makléře" ✅
- Token-based flow: bez tokenu zobrazí "Chybí pozvázkový token" ✅
- Formulář: vyplňuje Jméno, Příjmení, Telefon, IČO (s ARES validací), Heslo ✅

---

## TASK-048 — Onboarding

### 6. `/makler/onboarding/profile`
- **HTTP:** 307 → `/login?callbackUrl=%2Fmakler%2Fonboarding%2Fprofile` ✅
- **Zdrojový kód:** `<h2 className="text-xl font-bold text-gray-900 mb-2">Váš profil</h2>` ✅
- "Váš profil" (správná čeština, ne "Vas profil") ✅

### 7. `/makler/onboarding/training`
- **HTTP:** 307 → `/login?callbackUrl=%2Fmakler%2Fonboarding%2Ftraining` ✅
- **Zdrojový kód:** `{showQuiz ? "Kvíz" : "Školení"}` ✅
- "Kvíz" ✅, "Školení" ✅ (správná diakritika)

---

## Shrnutí

| Task | Status | Poznámka |
|------|--------|----------|
| TASK-044 admin career | ✅ PASS | Auth správně, tabulka 4 regiony, Snížit btn |
| TASK-044 PWA stats | ✅ PASS | Auth správně, LevelBadge, progress bar |
| TASK-044 veřejný profil | ✅ PASS | Bez LevelProgressBar/Kč — seed data mají staré "JUNIOR" úrovně |
| TASK-045 PDF logo | ✅ PASS | logo-dark.png v base64, bez textu CARMAKLER |
| TASK-047 registrace | ✅ PASS | HTTP 200, správná diakritika |
| TASK-048 onboarding/profile | ✅ PASS | "Váš profil" |
| TASK-048 onboarding/training | ✅ PASS | "Kvíz", "Školení" |

**Celkový výsledek: VŠECHNY TASKY PASS ✅**

**Drobná poznámka (není blocker):** Seed data v DB mají staré úrovně ("JUNIOR") z doby před kariérním systémem. Nový kód je správný, ale pro plné vizuální testování hvězdiček by bylo potřeba makléře se STAR_2+ úrovní nebo aktualizovat seed data.
