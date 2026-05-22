# Chrome Test — SEO Interlinking Audit (PRODUKCE)
**Datum:** 2026-04-21  
**Agent:** test-chrome  
**Task:** #33

---

## ⚠️ DNS PROBLÉM — carmakler.cz veřejně nedostupná

```
carmakler.cz DNS → 46.28.106.235  (Apache, vrací 404 pro všechny URL)
Produkční Next.js → 91.98.203.239  (běží správně, HTTPS 200)
```

**Dopad:** Veřejný přístup na carmakler.cz je nefunkční.  
**Produkce testována přes:** `curl --resolve carmakler.cz:443:91.98.203.239` — obchází DNS, testuje přímo prod server.

---

## 1. carmakler.cz/nabidka/skoda ✅

**HTTP:** 200  
**H2 "Mohlo by vás zajímat":** ✅ přítomno

### Cross-linky:
| Sekce | Href |
|-------|------|
| Všechny díly Škoda | `/dily/znacka/skoda` ✅ |
| Prověrka vozidla | `/sluzby/proverka` ✅ |
| Financování | `/sluzby/financovani` ✅ |
| Pojištění | `/sluzby/pojisteni` ✅ |

### Model linky (/nabidka/skoda/\*):
- `/nabidka/skoda/octavia` ✅
- `/nabidka/skoda/fabia` ✅
- `/nabidka/skoda/superb` ✅
- `/nabidka/skoda/kodiaq` ✅

---

## 2. carmakler.cz/nabidka/skoda/octavia ✅

**HTTP:** 200  
**Bridge linky na díly:**

| Text | Href |
|------|------|
| Díly pro Škoda Octavia | `/dily/znacka/skoda/octavia` ✅ |
| Všechny díly Škoda | `/dily/znacka/skoda` ✅ |

---

## 3. carmakler.cz/dily/znacka/skoda ✅

**HTTP:** 200  
**H2 "Mohlo by vás zajímat":** ✅  
**Bridge link zpět na ojetá Škoda:**

| Text | Href |
|------|------|
| Ojeté vozy Škoda | `/nabidka/skoda` ✅ (2×) |
| Katalog ojetých vozidel | `/nabidka` ✅ |

---

## 4. carmakler.cz/jak-prodat-auto ✅

**HTTP:** 200  
**H2 "Související články a nástroje":** ✅

### Linky v sekci:
| Href |
|------|
| `/kolik-stoji-moje-auto` ✅ |
| `/makleri` ✅ |
| `/nabidka` ✅ |
| `/sluzby/financovani` ✅ |
| `/sluzby/pojisteni` ✅ |
| `/sluzby/proverka` ✅ |

---

## 5. carmakler.cz/kolik-stoji-moje-auto ✅

**HTTP:** 200  
**H2 "Související články a nástroje":** ✅

### Linky v sekci:
| Href |
|------|
| `/jak-prodat-auto` ✅ (cross-link mezi stránkami funguje!) |
| `/makleri` ✅ |
| `/nabidka` ✅ |
| `/sluzby/financovani` ✅ |
| `/sluzby/pojisteni` ✅ |
| `/sluzby/proverka` ✅ |

---

## Celkový verdikt

| Stránka | HTTP | Sekce | Linky |
|---------|------|-------|-------|
| /nabidka/skoda | ✅ 200 | "Mohlo by vás zajímat" ✅ | dily/skoda + 3 sluzby + 4 modely |
| /nabidka/skoda/octavia | ✅ 200 | "Mohlo by vás zajímat" ✅ | dily/skoda/octavia + dily/skoda |
| /dily/znacka/skoda | ✅ 200 | "Mohlo by vás zajímat" ✅ | bridge → /nabidka/skoda (2×) |
| /jak-prodat-auto | ✅ 200 | "Související články a nástroje" ✅ | 6 linků |
| /kolik-stoji-moje-auto | ✅ 200 | "Související články a nástroje" ✅ | 6 linků |

**SEO interlinking na produkčním serveru FUNGUJE.** Všechny cross-linky implementovány správně.

---

## 🚨 Kritický problém: DNS

**carmakler.cz je veřejně nedostupná** — DNS pro doménu ukazuje na špatný server (Apache na 46.28.106.235).  
Produkční Next.js aplikace běží na 91.98.203.239 a je funkční.  

**Nutná oprava DNS záznamu:**
```
carmakler.cz A 91.98.203.239   ← správná hodnota
carmakler.cz A 46.28.106.235   ← aktuální (CHYBNÁ)
```
Dokud není DNS opraveno, žádný uživatel ani Googolbot nemůže stránky vidět.
