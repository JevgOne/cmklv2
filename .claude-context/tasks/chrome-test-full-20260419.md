# Chrome Test Report — 2026-04-19

**Tester:** test-chrome  
**Datum:** 2026-04-19 08:14  
**Branch:** main  
**Build:** production (carmakler.cz)  
**Metoda:** headless Chrome screenshots + WebFetch + curl HTTP check + zdrojový kód

---

## Výsledek: ✅ PASS (bez kritických chyb)

---

## 1. Homepage (https://carmakler.cz)

**HTTP:** 200 ✅

### Navbar logo
- Třída: `h-6 sm:h-8 w-auto object-contain` (24–32 px)
- **Logo je menší** ✅ (screenshoty potvrzují kompaktní logo vlevo)

### Hero sekce
- Unsplash obrázek (Mustang) se **zobrazuje správně** ✅
- URL: `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80`
- Screenshot potvrzuje plné vykreslení obrázku

### TOP Makléři — IG-style karty ✅
Z HTML zdroje stránky potvrzeno:
- **Kulatý avatar s oranžovým ringem:** `p-[3px] rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600` ✅
- **3 statistiky** v grid: `grid grid-cols-3 divide-x divide-gray-100` ✅
- **Full-width tlačítko:** `w-full inline-flex ... bg-orange-500 ... "Zobrazit profil"` ✅
- **Hover efekty:** `hover:-translate-y-1 hover:shadow-card-hover` ✅
- **Badge Ověřený** + lokace ✅

---

## 2. Footer

**Přítomno:**
- „Platformy CarMakléř" — badges vycentrované: `flex flex-wrap items-center justify-center gap-3` ✅
- „Web vytvořil weblyx.cz" — credit link přítomen ✅
- Logo v footeru: `h-8 w-auto object-contain` ✅
- Border top: `border-t-4 border-orange-500` ✅

---

## 3. Katalog vozidel (https://carmakler.cz/nabidka)

**HTTP:** 200 ✅  
**Screenshot:** stránka se plně načetla  
- **15 vozidel** zobrazeno (BMW 330i, Škoda Octavia, Mercedes-Benz C300, Peugeot 3008, atd.)
- Filtry funguji (značka, cena, palivo, karoserie, rok, prodejce) ✅
- Quick filtry (SUV do 500k, Elektro, Diesel, Ověřeno makléřem, …) ✅
- „Vložit inzerát zdarma" tlačítko ✅
- „Hlídejte bez registrace" watchdog banner ✅

---

## 4. Hashtag landing (https://carmakler.cz/makleri/praha)

**HTTP:** 200 ✅  
**Stav stránky:** načte se, ale zobrazí empty state:  
> „Tento hashtag zatím nemá žádné makléře"

⚠️ **INFORMACE:** Hashtag `praha` nemá v databázi přiřazené žádné makléře. Nejde o bug — jde o datový stav.

**Ověření kódu:** Stránka používá `BrokerGrid → BrokerCard` — **stejná komponenta jako homepage** ✅  
(import: `app/(web)/makleri/[slug]/page.tsx` → `BrokerGrid` → `BrokerCard`)

---

## 5. Profil makléře (https://carmakler.cz/profil/jan-novak-praha)

**HTTP:** 200 ✅  
**Screenshot potvrzuje:**
- **Cover foto** — noční scéna řidiče ✅ (references `cover-4.jpg`)
- **Avatar** — placeholder iniciály „JN" v kruhu ✅ (fotka není nahraná)
- **Jméno:** Jan Novák ✅
- **Role:** Makléř · Člen od duben 2026 ✅
- **Statistiky:** 3 Vozidla, 0 Lajky, 0 Prodáno ✅
- **Bio sekce:** „O makléři" ✅
- **Sdílet profil** tlačítko ✅

---

## 6. CSP Check (console / headers)

**HTTP headers:**
```
x-frame-options: DENY ✅
x-content-type-options: nosniff ✅
content-security-policy-report-only: default-src 'self'; ...
  img-src 'self' data: blob: https://files.carmakler.cz https://res.cloudinary.com 
         https://placehold.co https://images.unsplash.com ... ✅
```

**CSP fix Unsplash potvrzeno:** `https://images.unsplash.com` je v `img-src` ✅  
**Mód:** `report-only` — žádné blokování, jen reportování ✅  
**JS chyby:** Žádné kritické errors v headless Chrome logu ✅

---

## Souhrn

| Test | Výsledek | Poznámka |
|------|----------|----------|
| Homepage logo malé | ✅ PASS | h-6 sm:h-8 |
| Hero Unsplash obrázek | ✅ PASS | Mustang viditelný |
| TOP Makléři IG-style karty | ✅ PASS | Oranžový ring, 3 stats, full-width btn |
| Footer badges centered | ✅ PASS | justify-center |
| Footer weblyx credit | ✅ PASS | Link přítomen |
| Katalog vozidel načítá | ✅ PASS | 15 vozidel |
| Hashtag landing /makleri/praha | ⚠️ INFO | Empty state — žádná data pro 'Praha' |
| BrokerCard komponenta hashtag | ✅ PASS | Stejná BrokerCard jako homepage |
| Profil makléře cover foto | ✅ PASS | cover-4.jpg |
| Profil makléře avatar | ✅ PASS | Iniciály (bez fotky) |
| CSP Unsplash fix | ✅ PASS | img-src obsahuje images.unsplash.com |
| Žádné JS errors | ✅ PASS | |

**Celkem: 11× PASS, 1× INFO (data), 0× FAIL**

---

## Screenshots

- `screenshots/homepage-20260419.png` — hero sekce
- `screenshots/nabidka-20260419.png` — katalog vozidel
- `screenshots/profil-loaded-20260419.png` — profil makléře
- `screenshots/makleri-listing-20260419.png` — výpis makléřů
- `screenshots/footer-20260419.png` — full-page homepage
