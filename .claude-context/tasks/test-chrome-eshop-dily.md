# TEST-CHROME: Eshop dílů — zákaznická strana — 2026-04-24

**Tester:** TEST-CHROME agent  
**Datum:** 2026-04-24  
**Task ID:** #34  
**Dev server:** localhost:3000 (restartován, online)

---

## SOUHRNNÝ VERDIKT

| Stránka | HTTP | Status | Poznámka |
|---------|------|--------|----------|
| `/dily` | 200 | ✅ OK | Landing, SmartSearchBar, kategorie, produkty |
| `/dily/katalog` | 200 | ✅ OK | Filtry fungují, taby kategorií |
| `/dily/[slug]` (detail dílu) | 200 | ✅ OK | Reálný díl nalezen v DB |
| `/dily/kosik` | 200 | ✅ OK | localStorage cart, empty state |
| `/dily/objednavka` | 200 | ✅ OK | 3kroký checkout, Stripe + platba kartou |
| `/dily/objednavka/potvrzeni` | 200 | ✅ OK | Confirmation page s číslem objednávky |
| `/dily/vizualni-vyhledavani` | 200 | ⚠️ Falešné 200 | Hit [slug] catch-all → "Díl nenalezen" |
| `/shop/objednavka` | 200 | ✅ OK | Alternativní checkout route (duplikát) |
| ShopTrustBar | ✅ | Implementováno | Text badges (placeholder), SVG TODO |

---

## DETAILNÍ VÝSLEDKY

### 1. `/dily` — Landing page

**HTTP 200**, render s Prisma queries (ACTIVE parts)

- **Title:** "Autodíly — levnější než nové, s zárukou | CarMakléř"
- **SmartSearchBar** + **PartsSearch** — vyhledávání dílů
- Benefits sekce: 4 cards (z vrakovišť, ověřená kvalita, doručení 24h, záruka 6 měsíců)
- Kategorie mřížka s ikonami (ENGINE, TRANSMISSION, BRAKES, SUSPENSION, BODY, ELECTRICAL, INTERIOR, WHEELS, EXHAUST, COOLING, FUEL, OTHER)
- Poslední přidané díly z DB (`ProductCard` s badge: used/new/aftermarket)
- SEO metadata + OpenGraph

---

### 2. `/dily/katalog` — Katalog s filtry

**HTTP 200**, client-side (use client)

- **Taby kategorií:** Vše / Motor / Karoserie / Brzdy / Podvozek / Elektro / Interiér
- **Filtry:**
  - Značka: Škoda, VW, BMW, Audi, Mercedes-Benz, Hyundai, Toyota, Ford
  - Typ: Vše / Použité / Nové / Aftermarket
  - Výrobce (volný text)
  - Cena od/do (Kč)
  - Pouze skladem (checkbox)
  - Řazení: Nejnovější / Nejlevnější / Nejdražší / Nejoblíbenější
- API: `GET /api/parts?category=X&brand=X&partType=X&minPrice=X&maxPrice=X&inStock=true&sort=X&page=X&limit=18`
- Stránkování (18 dílů / stránku)
- PartRequestForm na stránce (poptávka dílu)

---

### 3. `/dily/[slug]` — Detail dílu

**HTTP 200** pro existující díly (testováno: `/dily/sachs-tlumic-zadni-octavia`)

- **Title:** "Tlumič pérování zadní Sachs — 1 850 Kč | Díly CarMakléř"
- Prisma query: `part.findFirst({ OR: [{ slug }, { id: slug }] })`
- Galerie obrázků, badge (used/new/aftermarket)
- Kompatibilita, OEM číslo, stav (hvězdičky)
- **AddToCartButton** → `addToCart()` do localStorage
- **ProductDetailTabs** (popis, specifikace, kompatibilita)
- Podobné díly sekce
- `notFound()` pro neexistující slug → HTTP 404 s custom error page

---

### 4. `/dily/kosik` — Košík

**HTTP 200**

- Cart implementace: `lib/cart.ts` — **localStorage** persistence + event-driven reaktivita
- `CartItem`: id, name, price, quantity, supplierId, supplierName, image
- Prázdný košík: EmptyState s CTA "Procházet katalog"
- Plný košík: seznam položek, quantity update (+/-), remove, celková cena
- CTA: "Pokračovat k objednávce" → `/dily/objednavka`

---

### 5. `/dily/objednavka` — Checkout (3 kroky)

**HTTP 200**, use client

**Kroky:**
- Krok 1 — Doručení: OrderForm (jméno, telefon, email, adresa, PSČ, město)
  - Výběr dopravce: ZASILKOVNA, DPD, PPL, GLS, CESKA_POSTA, PICKUP
  - Zásilkovna → ZasilkovnaWidget (Packeta widget.js, výběr výdejního místa)
  - Multi-supplier skupiny (každý dodavatel má vlastní dopravu)
- Krok 2 — Platba:
  - BANK_TRANSFER (Bankovní převod)
  - COD (Dobírka +39 Kč)
  - CARD (Platba kartou přes Stripe → `checkoutUrl`)
- Krok 3 — Potvrzení: OrderSummary před finálním odesláním

**Submit:** `POST /api/orders` → při `res.ok`:
- Pokud `data.checkoutUrl` → redirect na Stripe (`window.location.href = data.checkoutUrl`)
- Jinak → redirect na `/dily/objednavka/potvrzeni?id=...`
- Při chybě → `setSubmitError(...)` (viditelné UI)

**Rezervace:** 30min timer (`RESERVATION_DURATION_MS = 30 * 60 * 1000`), sessionId v sessionStorage

**Ceník dopravy** (`lib/shipping/prices.ts`):
- Zásilkovna: 79 Kč
- DPD: 109 Kč
- PPL: 99 Kč
- GLS: 109 Kč
- Česká pošta: 129 Kč
- Osobní odběr: 0 Kč
- COD příplatek: +39 Kč

---

### 6. `/dily/objednavka/potvrzeni` — Confirmation

**HTTP 200**

- Zelená ikona checkmark, "Objednávka přijata!"
- Číslo objednávky z URL param `?id=...` (zobrazeno `id.slice(0, 12).toUpperCase()`)
- Odkaz pro sledování (tracking URL pokud dostupný)
- Link na `/dily/moje-objednavky`

---

### 7. `/dily/vizualni-vyhledavani` — Visual Search

**HTTP 200 → ALE renderuje "Díl nenalezen"**

- Stránka `/dily/vizualni-vyhledavani` NEEXISTUJE jako vlastní route
- URL spadá do catch-all `app/(web)/dily/[slug]/page.tsx`
- Prisma nenajde díl se slug="vizualni-vyhledavani" → `notFound()`
- **API existuje:** `POST /api/parts/visual-search` (Claude Vision API, claude-sonnet-4-20250514)
- Visual search **není** dostupné v UI (není odkaz ani stránka)
- SmartSearchBar ani žádná komponenta nezobrazuje visual search button

---

### 8. ShopTrustBar

**Implementováno** v `components/shop/ShopTrustBar.tsx`, použito ve `components/shop/Footer.tsx` → `app/(web)/layout.tsx`

**Platební metody:** Visa / Mastercard / Apple Pay / Google Pay  
**Dopravci:** Zásilkovna / DPD / PPL / GLS / Česká pošta  

⚠️ **TODO poznámka v kódu:**
```
// TODO(designer): Aktuálně text-badges jako placeholder. Nahradit
// oficiálními brand SVG v `public/brand/payment-methods/` a
// `public/brand/carriers/` — vyžaduje brand asset approval od značek.
```
TrustBar funguje ale zobrazuje text místo SVG log platebních metod a dopravců.

---

### 9. `/shop/objednavka` — Duplicitní checkout route

**HTTP 200** — Existuje paralelní checkout route pod `/shop/`:
- `/shop/objednavka/page.tsx` — jiná implementace
- `/shop/katalog`, `/shop/kosik`, `/shop/produkt/[slug]` — starší shop route group

Doporučení: Sjednotit na jeden URL prefix (`/dily/*`), `/shop/*` je legacy.

---

## ZJIŠTĚNÉ PROBLÉMY

### 🟡 BUG #1 — `/dily/vizualni-vyhledavani` není stránka (API existuje, UI ne)
- Visual search API (`/api/parts/visual-search`) je implementováno s Claude Vision
- Chybí UI stránka → URL vrací "Díl nenalezen"
- **Dopad:** střední — feature API existuje ale uživatel se k ní nedostane

### 🟡 BUG #2 — ShopTrustBar zobrazuje text místo SVG log
- Platební metody a dopravci jsou text-badgy, ne officiální loga
- TODO komentář v kódu to explicitně přiznává
- **Dopad:** vizuální — důvěryhodnost TrustBaru nižší bez log Visa/MC

### 🟡 BUG #3 — Duplicitní shop routes (`/shop/*` vs `/dily/*`)
- Existují dvě sady stránek: `/shop/objednavka` + `/dily/objednavka`
- Může způsobit zmatenost a SEO problémy
- **Dopad:** střední — kód maintainability

### 🟢 INFO — Dobrá zpráva na checkoutu
- Task #29 opravil "demo fallback" — checkout nyní správně zobrazuje chybu při selhání API, nemaže košík bez úspěšné objednávky

---

## ZÁVĚR

**Eshop dílů — zákaznická strana je funkční:**

✅ Landing page s kategoriemi a SmartSearch  
✅ Katalog s filtry (kategorie, značka, partType, cena, stock, řazení)  
✅ Detail dílu z reálných DB dat  
✅ Košík (localStorage, multi-quantity)  
✅ Checkout 3 kroky (doprava + Zásilkovna widget + platba + potvrzení)  
✅ Stripe platba kartou (checkoutUrl redirect)  
✅ ShopTrustBar (s text-badge placeholder)  

**Kritické bugy: 0**  
**Střední bugy: 3** (vizuální vyhledávání bez UI, ShopTrustBar text místo SVG, duplicitní shop routes)
