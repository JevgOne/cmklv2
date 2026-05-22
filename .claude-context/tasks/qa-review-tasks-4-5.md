# QA Report: Task #4 + #5
**Datum:** 2026-05-20
**Kontrolor:** kontrolor
**Scope:** Enrichment sync fix (Task #4) + LeadPriceChart redesign (Task #5)

---

## VERDIKT: ✅ SCHVÁLENO — Obě implementace odpovídají plánům

---

## Task #4 — Enrichment Sync Fix

### Zkontrolované soubory
- `lib/scout-lead-management.ts` — Carmakler
- `lead_scout/client.py` — lead-scout
- `scripts/re_enrich.py` — lead-scout
- `lib/validators/scout-lead.ts` — validace typů
- `app/api/scout-leads/ingest/route.ts` — API route

### Acceptance Criteria

| Kritérium | Status | Poznámka |
|-----------|--------|----------|
| `ingestScoutLeads()` provede `prisma.update()` na enrichment pole při duplikátu | ✅ | Řádky 188–212, `buildEnrichmentUpdate()` vrátí neprázdný objekt → update |
| Response obsahuje `status: "updated"` pro enriched duplikáty | ✅ | Union typ `"created" \| "duplicate" \| "updated" \| "error"` (řádek 175) |
| `re_enrich.py` resetuje `push_status` na PENDING | ✅ | Řádky 86–89, správně s `params.append(lead_id)` pro WHERE klauzuli |
| `client.py` rozpozná "updated" status a markne jako PUSHED | ✅ | Řádky 102–104 |
| Enrichment NEOVLIVNÍ status/assignment/notes | ✅ | `buildEnrichmentUpdate()` nepřidává žádné status/assignedToId pole |
| Žádné Prisma schema změny | ✅ | Pouze update na existující sloupcích |

### Odchylka od plánu (zlepšení)

Plan Krok 1 specifikoval `accepted++` pro větev "updated". Implementace správně přidala
dedikovaný counter `updated` (deklarován na řádku 183, return zahrnuje všechny countery).
Toto je **zlepšení** oproti plánu — granularnější reporting.

### Nalezené problémy

**Žádné kritické problémy.**

🟡 **Minor — `basicFields` přepisuje existující hodnoty:**
Plan komentář říká "update only if previously null", ale kód jen kontroluje `val != null`
na payload straně (ne DB straně). Tj. re-enrichment přepíše brand/model/year i pokud jsou
v DB již nastaveny. Toto je ZÁMĚRNÉ dle STOP-1 v plánu: _"re-enrich přináší LEPŠÍ data
(z detail pages), chceme přepsat"_. Není bug.

🟡 **Minor — `get_leads_to_enrich` filtruje jen podle chybějícího `vehicle_description`:**
Leady s description ale bez fotek nebudou re-enrichovány při druhém běhu. Mimo scope tohoto tasku.

---

## Task #5 — LeadPriceChart Redesign

### Zkontrolovaný soubor
- `components/admin/scout-leads/LeadPriceChart.tsx`

### Acceptance Criteria

| Kritérium | Status | Poznámka |
|-----------|--------|----------|
| Graf má gradient bars (ne flat šedá) | ✅ | SVG `linearGradient` `barGradient` + `barGradientMuted` (řádky 107–115) |
| ReferenceLine pro medián (dashed modrá) | ✅ | Řádky 138–146, `stroke="#3B82F6"`, `strokeDasharray="5 3"` |
| Zvýraznění ceny aktuálního leadu (orange) | ✅ | Řádky 147–154, guard `currentBucketLabel !== medianBucketLabel` ← bonus |
| Stats v mini-card formátu s vizuální hierarchií | ✅ | Modrá karta pro medián, šedé pro ostatní |
| Source badges v headeru grafu | ✅ | Řádky 83–102, inline s h3 nadpisem |
| Custom tooltip v dark stylu s českým formátem | ✅ | Řádky 46–57 |
| X-axis labels čitelné bez rotace | ✅ | `height={25}`, bez `angle` |
| Responzivní 2 cols mobile / 4 cols desktop | ✅ | `grid-cols-2 sm:grid-cols-4` |
| Celkový dojem: profesionální dashboard | ✅ | CartesianGrid, proper YAxis, cursor tooltip |

### Vylepšení oproti plánu

- **TypeScript typing** — Plan navrhoval `any` typ pro CustomTooltip; implementace použila
  správné TS typy `{ active?: boolean; payload?: Array<{ value: number }>; label?: string }`.
- **Česká pluralizace** — Plan: `vůz` vs `vozů`. Implementace: `vůz / vozy / vozů` (správná
  3-hodnotová pluralizace pro češtinu).
- **Collision guard** — `currentBucketLabel !== medianBucketLabel` zabraňuje dvěma
  ReferenceLine na stejné pozici. V plánu chybělo.

### Nalezené problémy

**Žádné problémy.**

---

## Doporučení před deployem

1. **Build test** — Spustit `npm run build` a ověřit, že nenastaly TypeScript chyby
   (kontrolor nemůže spustit build, doporučuje implementátorovi).
2. **Deploy pořadí** (dle STOP-2 v plánu) — Carmakler PRVNÍ, pak lead-scout. Musí být
   nasazeno současně, jinak client.py nerozpozná "updated" status.

---

## Závěr

Implementace Tasks #4 a #5 je kompletní, odpovídá plánům, obsahuje navíc drobná
vylepšení oproti specifikaci. **Schvaluju k deployi.**
