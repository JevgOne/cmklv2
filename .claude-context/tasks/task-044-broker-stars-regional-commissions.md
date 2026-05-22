# TASK-044: Makléřský kariérní systém — hvězdičky, regionální prahy, výplaty

**Priorita:** 1
**Stav:** čeká
**Datum:** 2026-04-25
**Zdroj:** Uživatel (ručně psané poznámky z Pages dokumentu + upřesnění v konverzaci)

---

## Kompletní zadání

### 1. Kariérní úrovně — Makléř s hvězdičkami

Nahradit stávající systém (Tipař/Junior/Senior/Expert s body) za systém hvězdiček založený na **celkovém obratu prodejů v regionu**.

| Úroveň | Provize makléře |
|--------|----------------|
| ⭐ Makléř | 30% |
| ⭐⭐ Makléř | 40% |
| ⭐⭐⭐ Makléř | 50% |
| ⭐⭐⭐⭐ Makléř | 55% |
| ⭐⭐⭐⭐⭐ Makléř | 60% |

- **Max provize: 60%** — žádné bonusy navíc, žádný TIP bonus
- Zbytek provize jde firmě (+ manažerský bonus)

### 2. Regionální prahy

Úroveň makléře se určuje podle **celkového kumulativního obratu prodejů za celou kariéru**. Prahy se liší podle regionu (větší trh = vyšší prahy):

| Region | ⭐ 30% | ⭐⭐ 40% | ⭐⭐⭐ 50% | ⭐⭐⭐⭐ 55% | ⭐⭐⭐⭐⭐ 60% |
|--------|--------|---------|----------|-----------|------------|
| Praha | 1 000 000 | 1 500 000 | 2 500 000 | 4 000 000 | 6 000 000 |
| Brno | 750 000 | 1 200 000 | 2 000 000 | 3 000 000 | 4 500 000 |
| Ostrava/Plzeň | 500 000 | 1 000 000 | 1 500 000 | 2 500 000 | 3 500 000 |
| Menší města | 300 000 | 750 000 | 1 200 000 | 2 000 000 | 3 000 000 |

### 3. Pravidla

- **Kumulativně** — jednou dosažená úroveň se neztrácí
- **Snížení úrovně** může provést pouze **ADMIN** nebo **MANAGER** (NE REGIONAL_DIRECTOR)
- Obrat = součet prodejních cen všech prodaných vozidel daného makléře

### 4. Admin panel — přehled výplat a vysvětlivky

Admin musí v admin panelu vidět:

- **Kompletní vysvětlivky** celého systému — tabulka všech regionů, všech prahů, všech % provizí
- **Přehled makléřů s výplatami:**
  - Jméno makléře
  - Region
  - Celkový obrat prodejů (kumulativní)
  - Aktuální úroveň (hvězdičky)
  - Aktuální % provize
  - Kolik prodal (počet + obrat)
  - Kolik mu náleží vyplatit (provize v Kč)

### 5. Makléř (PWA) — vidí svůj region

Každý makléř vidí ve své PWA:

- Svou aktuální úroveň (hvězdičky)
- Své aktuální % provize
- **Prahy pro SVŮJ region** — kolik mu chybí do další hvězdičky
- Svůj celkový obrat prodejů

### 6. Co je potřeba změnit oproti stávajícímu stavu

Stávající implementace (commit `930db25`) používá:
- Názvy Tipař/Junior/Senior/Expert → **NAHRADIT** za ⭐-⭐⭐⭐⭐⭐
- Abstraktní body (auto + úvěr + pojištění) → **NAHRADIT** za celkový obrat prodejů v Kč
- Stejné prahy pro celé ČR → **NAHRADIT** za regionální prahy
- `lib/broker-points.ts` → přepsat na obratový systém
- `lib/gamification-levels.ts` → přepsat na hvězdičky
- `lib/commission-calculator.ts` → provize dle hvězdiček
- `components/pwa/gamification/LevelBadge.tsx` → hvězdičky místo textových úrovní
- `components/ui/LevelProgressBar.tsx` → progress k další hvězdičce dle regionu
- Admin panel — nová stránka/sekce s přehledem výplat a vysvětlivkami

---

## Očekávaný výstup

1. Funkční kariérní systém s 5 úrovněmi (hvězdičky)
2. Regionální prahy konfigurovatelné (ideálně v DB nebo configu, ne hardcoded)
3. Admin panel — kompletní přehled výplat + vysvětlivky systému
4. PWA makléře — vidí svůj region, úroveň, progress, %
5. Provize se automaticky počítá dle úrovně makléře (30-60%)
6. Snížení úrovně pouze ADMIN/MANAGER
