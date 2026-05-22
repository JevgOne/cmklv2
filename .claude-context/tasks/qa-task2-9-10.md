# QA Report — Tasks #2, #9, #10

**Datum:** 2026-05-22  
**Commits:** dd2bf02 (Task #2), a1f207f (Task #9), abe90b7 (Task #10)

---

## Task #2 — OG font fix — FAIL ❌

### Co bylo opraveno (5 souborů ✅)
| Soubor | Import přidán | const options | { ...size } → options |
|---|---|---|---|
| kariera/opengraph-image.tsx | ✅ | ✅ | ✅ |
| recenze/opengraph-image.tsx | ✅ | ✅ | ✅ |
| nabidka/[slug]/opengraph-image.tsx | ✅ | ✅ | ✅ (2× — fallback + main) |
| profil/[slug]/opengraph-image.tsx | ✅ | ✅ | ✅ (2× — fallback + main) |
| blog/[slug]/opengraph-image.tsx | ✅ | ✅ | ✅ (2×) + bonus fix fontFamily "sans-serif"→"Outfit" |

### STOP-5 VIOLATION ❌

```
app/(web)/twitter-image.tsx:40:    { ...size },
```

`twitter-image.tsx` stále používá `{ ...size }` bez fontů. Import `ogImageOptions` chybí.  
STOP-5: *"Po implementaci NESMÍ zůstat žádný soubor s `{ ...size }` v `ImageResponse`"*

Soubor **nebyl v plánu** (plan výčtu 5 souborů), ale STOP-5 pravidlo je absolutní.  
Efekt: Twitter OG karta stránky (root) renderuje Noto Sans místo Outfit.

### Lint
0 errors na dotčených souborech.

### Acceptance Criteria
- ✅ 5 souborů opraveno
- ❌ Všech 17 (18?) OG souborů předává `options` — `twitter-image.tsx` ne
- ❌ STOP-5: zůstává `{ ...size }` v `twitter-image.tsx`
- ⚠️ Browser test (STOP-1) neproveden

**→ POTŘEBUJE DOFIX: přidat `ogImageOptions` do `twitter-image.tsx` (identická oprava jako kariera/recenze).**

---

## Task #9 — QA bugy fix — PASS ✅

### Thresholds (BUG #1)
ScoutLeadsTable.tsx `CompletenessGradeBadge`: 80/60/40/20 → **90/70/50/30** ✅  
Odpovídá `completeness.py` dle zadání.

### Equipment labels (BUG #2)
Odstraněno: `comfort`  
Přidáno: `assist` (Asistence), `security` (Zabezpečení), `seats` (Sedadla), `lights` (Osvětlení), `drive` (Pohon) ✅

### Lint
0 errors. 2 pre-existující warning (no-img-element), nesouvisí s fixem.

### Poznámka — DRY issue (minor)
Grade logika (90/70/50/30) existuje na dvou místech:
- `ScoutLeadsTable.tsx` — inline v `CompletenessGradeBadge`
- `lib/lead-completeness.ts` — `gradeFromPercent()` (Task #10)

Thresholdy jsou **konzistentní**, takže funkčně OK. Refaktor na jeden zdroj pravdy vhodný ale neblokuje.

---

## Task #10 — Scout Leads completeness systém — PASS ✅

### 100-bodový systém — matematická verifikace
| Tier | Pole | Body |
|---|---|---|
| Kritická | vehicleBrand(8)+vehicleModel(8)+vehicleYear(8)+vehiclePrice(10)+phone(10)+city(6)+vehiclePhotos(10) | **60** ✅ |
| Důležitá | vehicleMileage(5)+vehicleFuel(4)+vehicleTransmission(4)+vehicleDescription(4)+vehicleEquipment(4)+vehicleBodyType(2)+vehiclePower(2) | **25** ✅ |
| Historie | vehicleVin(5)+vehicleServiceBook(2)+vehicleFirstOwner(2)+vehicleStkDate(1) | **10** ✅ |
| Bonus | vehicleConsumption(2)+vehicleDrive(1)+vehicleCountryOfOrigin(1)+vehicleCondition(1) | **5** ✅ |
| **Celkem** | 22 polí | **100** ✅ |

### hasValue() fix ✅
`boolean false` je nyní "přítomná hodnota" (ne missing). Opravuje false-negative u polí jako `firstOwner = false`.

### DB score preference ✅
`completenessScore` z DB (0-100 od scraperu) použit přednostně před lokálním výpočtem.

### Grade badge ✅
`gradeFromPercent()` exportováno z `lib/lead-completeness.ts`, použito v `LeadDataCompleteness.tsx`.

### Lint
0 errors na dotčených souborech.

---

## Souhrnný výsledek

| Task | Status | Poznámka |
|---|---|---|
| #2 OG font fix | **FAIL ❌** | twitter-image.tsx — STOP-5 violation |
| #9 QA bugy fix | **PASS ✅** | DRY issue minor (neblokuje) |
| #10 Completeness systém | **PASS ✅** | 100-bodová matematika OK |
