# QA Report: Mega UI + Mileage Fix (commit 8454132 + 65f8237)
**Datum:** 2026-05-21
**Kontrolor:** kontrolor
**Commits:** 8454132 (cmklv2 — ScoutLeadDetail + ScoutLeadsTable), 65f8237 (lead-scout — Bazoš mileage)

---

## VERDIKT: ⚠️ PODMÍNĚNĚ SCHVÁLENO — 2 medium bugs (non-blocking pro deploy, doporučuji opravit)

---

## 🟡 BUG #1: CompletenessGradeBadge — špatné thresholdy

**Soubor:** `components/admin/scout-leads/ScoutLeadsTable.tsx`

UI thresholdy **neodpovídají** `completeness.py` (lead-scout):

| Grade | Python `completeness.py` | Frontend `CompletenessGradeBadge` |
|-------|--------------------------|-----------------------------------|
| A | score ≥ 90 | score ≥ 80 ❌ |
| B | score ≥ 70 | score ≥ 60 ❌ |
| C | score ≥ 50 | score ≥ 40 ❌ |
| D | score ≥ 30 | score ≥ 20 ❌ |

Lead se skóre 85 → Python řekne "B", UI ukáže "A". Matoucí pro makléře.

**Fix:**
```typescript
if (score >= 90) return { grade: "A", color: "bg-green-100 text-green-700" };
if (score >= 70) return { grade: "B", color: "bg-blue-100 text-blue-700" };
if (score >= 50) return { grade: "C", color: "bg-orange-100 text-orange-700" };
if (score >= 30) return { grade: "D", color: "bg-red-100 text-red-600" };
return { grade: "F", color: "bg-red-200 text-red-800" };
```

---

## 🟡 BUG #2: Equipment category labels — 5 kategorií chybí

**Soubor:** `components/admin/scout-leads/ScoutLeadDetail.tsx` (řádek ~408)

Frontend mapuje jen 6 kategorií, ale `text_extraction.py` definuje 9+1:

| Kategorie | Python (EQUIPMENT_CATEGORY_MAP) | Frontend label | Status |
|-----------|--------------------------------|----------------|--------|
| safety | ✅ | "Bezpečnost" | ✅ |
| interior | ✅ | "Interiér" | ✅ |
| exterior | ✅ | "Exteriér" | ✅ |
| systems | ✅ | "Systémy" | ✅ |
| other | ✅ | "Ostatní" | ✅ |
| **assist** | ✅ | ❌ chybí | raw key "assist" |
| **security** | ✅ | ❌ chybí | raw key "security" |
| **seats** | ✅ | ❌ chybí | raw key "seats" |
| **lights** | ✅ | ❌ chybí | raw key "lights" |
| **drive** | ✅ | ❌ chybí | raw key "drive" |
| comfort | ❌ není | "Komfort" | mrtvý label |

Položky v těchto 5 kategoriích budou v UI zobrazeny s anglickým klíčem (např. "assist", "drive") místo českého překladu.

**Fix:**
```typescript
const categoryLabelsEquip: Record<string, string> = {
  safety: "Bezpečnost", assist: "Asistence", security: "Zabezpečení",
  interior: "Interiér", systems: "Systémy", seats: "Sedadla",
  lights: "Osvětlení", exterior: "Exteriér", drive: "Pohon", other: "Ostatní",
};
```

---

## Ostatní kontroly — vše OK

### ScoutLeadDetail.tsx — 24 nových polí

**Interface** — 24 polí přidána odpovídající Prisma schématu z Task #8 ✅

**API select** — `app/api/scout-leads/[id]/route.ts` používá `include` bez explicitního `select` → vrací všechny sloupce automaticky ✅

**Karta "Stav vozidla"** — podmínka renderuje kartu jen když ≥1 pole má hodnotu ✅

**VIN copy button** — `navigator.clipboard.writeText(lead.vehicleVin!)` — správné použití non-null assertion (uvnitř `{lead.vehicleVin && ...}`) ✅

**Badges havárie/majitel/servisní** — boolean `!= null` guard (zobrazí i `false` = "✗ Bourané") ✅

**Cena bez DPH + DPH badge** — podmíněné zobrazení, správný formát `toLocaleString("cs-CZ")` ✅

**Videa** — IIFE pattern s try/catch + `videos.length === 0 return null` ✅

**Výbava po kategoriích** — backward compat: flat `string[]` → "other" group, structured `{name, category}` → správné skupiny ✅

**Spec chips** — 5 nových (pohon, spotřeba, místa, verze, klima) s `driveLabels`/`aircondLabels` fallbacky ✅

**Technické detaily karta** — 7 polí, podmíněný render, správný grid layout ✅

**District v lokaci** — `vehicleDistrict !== lead.city` guard zamezuje duplicitě ✅

### ScoutLeadsTable.tsx

**`completenessScore` v interface** ✅

**`completenessScore` v API** — list route `app/api/scout-leads/route.ts` vrací vše přes `include` → pole dostupné ✅

**`CompletenessGradeBadge` render** — správně zakomponován do tabulky ✅

(Thresholdy viz BUG #1 výše)

### Bazoš mileage fix (65f8237)

**3 nové formáty — ověřeno regex analýzou:**

| Formát | Pattern | Výsledek | Status |
|--------|---------|----------|--------|
| "najeto 157 tis.km." | Pattern 1 s `(?:tis\.?\s*)?km` | 157000 (po tis detect) | ✅ |
| "149.256 kmTechnická" | Pattern 3 s relaxed `(?:\b\|[^a-z...])` | 149256 | ✅ |
| "naj 124 tis" | Pattern 2 `naj\.?\s+(\d+)\s*tis\b` | 124000 (km ×1000) | ✅ |

**"tis" multiplier** — `m.end(1)` position je správná (po captured group, ne po celém matchi) ✅

**`\xa0` (non-breaking space)** — přidán do cleanup `replace("\xa0", "")` ✅

**Range guard** `100 < km < 1_000_000` zachovává ochranu před nesmyslnými hodnotami ✅

---

## Minor poznámky (non-blocking)

- `vehicleLicensePlate` přidáno do interface, ale nikde nerendrováno. Zřejmě záměrné (SPZ = citlivé), ale mrtvé pole v interface.

---

## Závěr

Implementace je z velké části správná — všechna nová pole, karty, backward compat equipment, Bazoš regex fix. Dva medium bugy:
1. **CompletenessGradeBadge thresholdy** — opravit na 90/70/50/30 dle completeness.py
2. **Equipment category labels** — doplnit assist/security/seats/lights/drive

Obojí je jednoduché jednořádkové/víceřádkové opravy. **Doporučuji opravit před produkčním deployem.**
