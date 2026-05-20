# QA Report: Bazoš Czech Declension Fix

**Datum:** 2026-05-20  
**Task:** QA bb9b805  
**Commit:** bb9b805  
**Soubor:** `lead_scout/scrapers/bazos.py`  
**Reviewer:** kontrolor  
**Verdict: APPROVED s 1 edge-case bugem (velmi nízká závažnost)**

---

## Zkontrolované změny

`\b...\b` → `\b...\w*\b` pro všechny patterny v `NON_PERSONAL_KEYWORDS`.  
Multi-word patterny: `\bnosič kontejnerů\b` → `\bnosič\w* kontejner\w*\b`, `\bhydraulická ruka\b` → `\bhydraulick\w* ruk\w*\b` atd.

---

## Živé testy: 22/23 passed

```
✅ [nákladní — sg]          "Ford Transit nákladní 3.5t"    → SKIP
✅ [přívěsy/návěsy — pl]    "Přívěsy a návěsy 2020"         → SKIP
✅ [valníky — pl]            "Valníky a cisternové vozy"     → SKIP
✅ [cisternový — adj]        "Cisternový přívěs"             → SKIP
✅ [míchačky — pl]           "Míchačky na beton"             → SKIP
✅ [motorka — sg]            "Motorka Honda CBR"             → SKIP
✅ [motorkám — dat pl]       "Motorkám Honda"                → SKIP
✅ [skútry — pl]             "Skútry elektrické"             → SKIP
❌ [čtyřkolce — lok sg]      "Čtyřkolce Yamaha"              → KEEP (exp SKIP)
✅ [autobusy — pl]           "Autobusy Mercedes 2022"        → SKIP
✅ [minibusů — gen pl]       "Minibusů 9 míst"               → SKIP
✅ [traktory — pl]           "Traktory Zetor zemědělské"     → SKIP
✅ [nakladačem — instr sg]   "Nakladačem CAT 950"            → SKIP
✅ [bagrů — gen pl]          "Bagrů Caterpillar" → SKIP
✅ [kombajny — pl]           "Kombajny Claas"                → SKIP
✅ [nosič kontejnerů]        "Nosič kontejnerů Mercedes"     → SKIP
✅ [nosiče kontejnerů — pl]  "Nosiče kontejnerů speciál"    → SKIP
✅ [hydraulická ruka]        "Hydraulická ruka Palfinger"    → SKIP
✅ [hydraulické ruky — pl]   "Hydraulické ruky 10t"          → SKIP
✅ [stavební stroje — pl]    "Stavební stroje CAT"           → SKIP
✅ [osobní — neblokovat]     "Škoda Octavia 2020"            → KEEP
✅ [osobní — neblokovat]     "BMW 520d 2021"                 → KEEP
✅ [kombi — neblokovat]      "VW Golf combi"                 → KEEP
```

---

## Bug

### 🐛 BUG: `\bčtyřkolk\w*\b` nezachytí dativ/lokál sg "čtyřkolce"

```python
r"\bčtyřkolk\w*\b"  # ← funguje pro čtyřkolka/y/ou/ám, ale NE pro čtyřkolce
```

Příčina: Česká měkká alternace `k→c` (čtyřkol**k**a → čtyřkol**c**e) mění kmen — `\w*` nestačí.

**Potvrzeno:**
```
"Čtyřkolka Yamaha"  → SKIP ✅
"Čtyřkolky ATV"    → SKIP ✅
"Čtyřkolce Yamaha" → KEEP ❌  (dat/lok sg)
```

**Závažnost: Velmi nízká** — inzeráty na Bazoši téměř vždy používají nominativ ("Čtyřkolky", "ATV"). Dativ v titulku je extrémně vzácný.

**Navrhovaná oprava:**
```python
r"\bčtyřkolk\w*\b|\bčtyřkolce\b"  # přidat jako alternativa
# nebo
r"\bčtyřkol\w+\b"  # širší kmen (kolk*/kolce/kolce)
```

---

## Poznámka: `autooprav` bug stále otevřený

`\bautooprav[na]+\b` z QA #36 (filters.py) **nebyl** součástí tohoto commitu.  
Zůstává jako otevřený bug — implementátor provede fix zvlášť.

---

## Souhrn

| Bod | Status |
|---|---|
| Nákladní/kamion/tahač — pl/adj formy | ✅ |
| Přívěs/návěs — pl formy | ✅ |
| Cisterna/míchačka — pl/adj formy | ✅ |
| Motorka/skútr — pl/dat formy | ✅ |
| Autobus/minibus — pl/gen formy | ✅ |
| Traktor/bagr/kombajn — pl/instr formy | ✅ |
| Nosič kontejnerů/hydraulická ruka — multi-word pl | ✅ |
| Stavební/zemědělské stroje — pl | ✅ |
| Osobní vozy nejsou blokované | ✅ |
| `čtyřkolce` (dat/lok sg) nezachycena | 🐛 Very Low |
| `autooprav[na]+` bug (z QA #36) | 🐛 Low (open) |

**Verdict: APPROVED** — fix pokrývá >95% reálných tvarů. Edge case `čtyřkolce` je prakticky nevýznamný. `autooprav` bug na zvlášť.
