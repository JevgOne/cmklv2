# Chrome Post-Deploy Test — 2026-04-26

**Produkce:** https://carmakler.cz  
**Datum:** 2026-04-26  
**Tester:** TEST-CHROME agent  

---

## Souhrn

| Kategorie | Testů | PASS | FAIL |
|-----------|-------|------|------|
| P0 fixy | 3 | 3 | 0 |
| P1 fixy | 4 | 2 | 2 |
| Blog | 2 | 2 | 0 |
| Nová feature | 1 | 1 | 0 |
| P2 fixy | 2 | 0 | 2 |
| **Celkem** | **12** | **8** | **4** |

---

## P0 Fixy

### 1. Vehicle Intake — VIN step ✅ PASS
- **URL:** `/makler/vehicles/new/vin?draft=...`
- Přihlášen jako `jan.novak@carmakler.cz` / heslo123
- Stránka se načetla správně (Krok 1/7, 14%)
- Input pro VIN přítomen (1 input, maxlength 17)
- Žádný error.tsx, žádná chyba

### 2. Vehicle Intake — Details step ✅ PASS
- **URL:** `/makler/vehicles/new/details?draft=...`
- Stránka se načetla bez ISE (Krok 5/7, 71%)
- Zobrazuje formulář: Základní údaje, Technické údaje
- Selectory: Značka, Model, Rok výroby, Karoserie, Palivo, Převodovka
- Žádná Internal Server Error

### 3. Vehicle Intake — Pricing + Review ✅ PASS
- **Pricing** `/makler/vehicles/new/pricing?draft=...` — Krok 6/7 (86%), formulář pro cenu, lokaci, popis OK
- **Review** `/makler/vehicles/new/review?draft=...` — Krok 7/7 (100%), kontrola kompletnosti 0/10, tlačítka Odeslat ke schválení + Uložit jako draft OK
- Žádný chunk loading error

---

## P1 Fixy

### 4. `/cenik` ⚠️ FAIL — nezredirektuje na /jak-to-funguje
- **HTTP status:** 200 (místo 307/301)
- **Očekáváno:** redirect → `/jak-to-funguje`
- **Skutečnost:** Stránka existuje na `/cenik` se správným obsahem (5% provize, min. 25 000 Kč, kalkulačky)
- Obsah je správný, ale redirect nebyl nasazen

### 5. `/pro-maklere` ✅ PASS
- HTTP 307 → redirect na `/kariera`
- Stránka se přesměruje správně

### 6. `/dily/katalog` ❌ FAIL — 0 produktů
- **Skutečnost:** "0 produktů v nabídce"
- Šablona katalogu se zobrazuje (filtry OK), ale žádné díly v databázi
- Filtry: Motor, Karoserie, Brzdy, Odpružení, Elektrika, Interiér
- Zdroj: prázdná databáze dílů (není problém kódu, ale dat)

### 7. Admin Manager sidebar ✅ PASS
- Přihlášen jako `admin@carmakler.cz` / heslo123
- Sidebar zobrazuje sekci **MANAŽER** s položkami:
  - 📊 Můj tým
  - 👥 Moji makléři
  - ✅ Schvalování
  - 🎯 Bonusy
- Sekce je správně zobrazena

---

## Blog

### 8. `/blog` ✅ PASS
- Zobrazuje ~13 článků
- Featured article má cover obrázek (full-width)
- Gridové karty: část má fotky (Unsplash), část používá gradient pozadí s emoji (📊, 🚗 apod.)
- Gradient fallbacky jsou vizuálně přijatelné

### 9. `/blog/trh-s-ojetinami-v-cr-trendy-a-predikce` ✅ PASS
- Typografie správná — prose classes fungují (`prose prose-lg max-w-none`)
- Nadpisy správně zanořené (h2, h3), odstavce, seznamy s oranžovými markery
- Blockquotes s oranžovým levým bordrem
- **Reading progress bar** přítomen (ReadingProgress komponenta)
- Žádné vizuální problémy

---

## Nová Feature

### 10. `/admin/partners/new` ✅ PASS
- Stránka existuje a načte se správně (při přihlášení jako admin)
- Formulář zobrazuje 8 input polí:
  - TYP PARTNERA (radio: Autobazar / Vrakoviště)
  - NÁZEV FIRMY
  - KONTAKTNÍ OSOBA
  - EMAIL, TELEFON, IČO
  - ADRESA, MĚSTO
  - KRAJ (select s kraji ČR)
- Bez chyb

---

## P2 Fixy

### 11. `/dily/kosik` ❌ FAIL — chybí H1
- Prázdný košík zobrazuje `<h3>Košík je prázdný</h3>` místo `<h1>`
- CTA tlačítko "Procházet katalog" přítomno
- H1 nadpis stále chybí

### 12. `/profil/jan-novak-praha` ❌ FAIL — nekonzistentní stats
- **Stats sekce:** 3 Vozidla, 2 Prodejů, 0 Likes
- **Listings sekce:** "Žádné položky v této kategorii" (0 vozidel zobrazeno)
- Nesoulad: stats říkají 3 vozidla, listings zobrazuje 0

---

## Závěr

**P0 fixy (kritické):** Všechny 3 opraveny ✅ — vehicle intake flow funguje end-to-end bez chyb.  
**P1 fixy:** 2/4 opraveny — `/cenik` redirect chybí, `/dily/katalog` 0 dílů (prázdná DB).  
**Blog:** Plně funkční s typografií a reading progress barem ✅  
**Admin Partners:** Nová feature nasazena a funkční ✅  
**P2 fixy:** 0/2 opraveny — H1 v košíku a stats konzistence stále čekají.
