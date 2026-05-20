# QA Report: Bazoš Regex Edge Case Fixes

**Datum:** 2026-05-20  
**Commit:** e233fa2  
**Soubor:** `lead_scout/scrapers/bazos.py`  
**Reviewer:** kontrolor  
**Verdict: APPROVED — 10/10 passed**

---

## Změny

```diff
-    r"\bčtyřkolk\w*\b",
+    r"\bčtyřkol\w+\b",

+    # Služby / autoservisy
+    r"\bautooprav\w*\b",
```

---

## Živé testy: 10/10 passed

### čtyřkol\w+ — všechny deklinační tvary

```
✅ "Čtyřkolce Yamaha"    → SKIP  (dat/lok sg — k→c alternace, fix cíl)
✅ "Čtyřkolky ATV"       → SKIP  (pl)
✅ "Čtyřkolkách jízda"   → SKIP  (lok pl)
✅ "Čtyřkolka Honda TRX" → SKIP  (nom sg)
✅ "Čtyřkolkou cross"    → SKIP  (instr sg)
```

### autooprav\w* v NON_PERSONAL_KEYWORDS

```
✅ "Autoopravna Praha servis" → SKIP  (nom sg)
✅ "Autoopravny servis Praha" → SKIP  (gen pl / nom pl — původní bug)
✅ "Autoopravně u nás"        → SKIP  (dat/lok sg)
```

### filters.py — verifikace

`filters.py` měl `\bautooprav\w*\b` již opraven v předchozím commitu `6dbdbd3` (mimo e233fa2).  
Konzistentní — stejný pattern nyní v obou místech.

```
✅ "Autoopravna Praha" excluded=True  (AUTOBAZAR filter)
✅ "Autoopravny Praha" excluded=True  (AUTOBAZAR filter — původní QA #36 bug)
```

---

## Souhrn

| Bug | Fix | Status |
|---|---|---|
| čtyřkolce (k→c alternace) | `\bčtyřkol\w+\b` | ✅ Fixed |
| autoopravny (chybějící 'y') | `\bautooprav\w*\b` v bazos.py | ✅ Fixed |
| autooprav[na]+ v filters.py | `\bautooprav\w*\b` (commit 6dbdbd3) | ✅ Already fixed |

**Verdict: APPROVED** — oba bugy z QA #36 a qa-bazos-declension jsou uzavřeny.
