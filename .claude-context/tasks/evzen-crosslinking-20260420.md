# Evžen THE KING — Verdikt: Cross-linking + Inzerce fix

**Datum:** 2026-04-20  
**Kontrolor:** Evžen THE KING  
**Zadání uživatele:**
1. "navazují na sebe nějak ty stránky nebo jsou to jen stránky myslím to ohledně prokliku" → stránky propojit cross-linky
2. "inzerce.carmakler.cz nefunguje stále" + "stále se tam točí kolečko a načítání katalogu" → opravit inzerce katalog

---

## BOD 1: Cross-linking — SCHVÁLENO

### 1a. ServicePage.tsx — cross-linking sekce pod FAQ

| Kontrolní bod | Výsledek |
|---|---|
| Import `Link` z `next/link` | ✅ řádek 1 |
| Prop `currentService?: "proverka" \| "financovani" \| "pojisteni"` | ✅ řádek 28 |
| Cross-linking sekce pod FAQ (řádky 156-201) | ✅ |
| 3 karty služeb s podmínkou `currentService !== "X"` | ✅ vždy zobrazeny jen 2 ze 3 |
| 3 textové linky pod kartami (/nabidka, /chci-prodat, /makleri) | ✅ řádky 190-199 |
| `proverka/page.tsx` předává `currentService="proverka"` | ✅ řádek 97 |
| `financovani/page.tsx` předává `currentService="financovani"` | ✅ řádek 98 |
| `pojisteni/page.tsx` předává `currentService="pojisteni"` | ✅ řádek 98 |

**Shoda s auditem (P0-2): ✅** Service pages už NEJSOU mrtvý konec.

---

### 1b. nabidka/[slug] — "Doplňkové služby"

| Kontrolní bod | Výsledek |
|---|---|
| Sekce v `renderVehicleDetail()` | ✅ řádek 721 |
| Sekce v `renderListingDetail()` | ✅ řádek 1129 |
| Karta: Prověrka → `/sluzby/proverka` | ✅ |
| Karta: Financování → `/sluzby/financovani` | ✅ |
| Karta: Pojištění → `/sluzby/pojisteni` | ✅ |
| Obě sekce identické | ✅ |
| Responzivní grid (1col mobil → 3col desktop) | ✅ `grid-cols-1 sm:grid-cols-3` |

**Shoda s auditem (P0-1): ✅** Detail vozu má upselling cross-linky na služby.

---

### 1c. chci-prodat — "Nejste si jistí?"

| Kontrolní bod | Výsledek |
|---|---|
| Sekce pod FAQ (řádek 258) | ✅ |
| Pill link → `/jak-to-funguje` ("Jak prodej funguje") | ✅ řádek 269 |
| Pill link → `/recenze` ("Recenze klientů") | ✅ řádek 272 |
| Pill link → `/makleri` ("Najít makléře v okolí") | ✅ řádek 275 |
| Design konzistentní (gray-100 bg, hover orange) | ✅ |
| Sekce na konci (neodvádí od hlavního CTA formuláře) | ✅ |

**Shoda s auditem (P1-3): ✅** Soft CTA pro nerozhodnuté uživatele.

---

### 1d. profil/[slug] — CTA "Chcete prodat auto?"

| Kontrolní bod | Výsledek |
|---|---|
| CTA karta v ProfileClient.tsx (řádky 490-513) | ✅ |
| Podmínka `!isOwner` (ne na vlastním profilu) | ✅ řádek 491 |
| Podmínka `user.role === "BROKER" \|\| user.role === "MANAGER"` | ✅ řádek 491 |
| Link vede na `/chci-prodat` | ✅ řádek 494 |
| Design: orange-50 bg, rounded-xl, 🚗 ikona | ✅ |

**Shoda s auditem (P1-4): ✅** Makléřský profil má CTA pro prodej auta.

---

## BOD 2: Inzerce fix — SCHVÁLENO

### 2a. Middleware: rewrite místo redirect

| Kontrolní bod | Výsledek |
|---|---|
| `subdomain === "inzerce"` check | ✅ řádek 169 |
| Pokrývá `/nabidka` i `/katalog` | ✅ řádek 169 |
| `NextResponse.rewrite` (NE redirect) | ✅ řádek 170 |
| `x-subdomain` header zachován | ✅ řádek 171 |

**Eliminuje loading.tsx spinner flash** — rewrite místo redirect znamená, že Next.js nemusí renderovat loading state mezi redirectem.

### 2b. /gate v SKIP prefixes

| Kontrolní bod | Výsledek |
|---|---|
| `/gate` v SKIP_REWRITE_PREFIXES | ✅ řádek 40 |
| `/gate` v publicPrefixes | ✅ řádek 133 |

**Bez nekonečné smyčky** — gate stránka neprojde subdomain rewrite.

### 2c. DB pagination

| Kontrolní bod | Výsledek |
|---|---|
| `app/api/vehicles/route.ts`: `skip = (page-1)*limit` | ✅ řádek 94 |
| `app/api/vehicles/route.ts`: `take: limit` | ✅ řádek 105 |
| `app/api/listings/route.ts`: `skip = (page-1)*limit` | ✅ řádek 258 |
| `app/api/listings/route.ts`: `take: limit` | ✅ řádek 271 |

**DB-level stránkování** — efektivní, žádné in-memory slicing.

---

## CELKOVÝ VERDIKT

| Bod | Zadání uživatele | Verdikt |
|---|---|---|
| Cross-linking (4 fixy) | "navazují na sebe nějak ty stránky" | ✅ **SCHVÁLENO** |
| Inzerce fix (3 sub-fixy) | "stále se tam točí kolečko" | ✅ **SCHVÁLENO** |

Všechny body z auditu (P0-1, P0-2, P1-3, P1-4) implementovány v souladu se zadáním. Inzerce fix řeší middleware rewrite + DB pagination. Žádné nálezy k vrácení.

---

*Evžen THE KING, 2026-04-20*
