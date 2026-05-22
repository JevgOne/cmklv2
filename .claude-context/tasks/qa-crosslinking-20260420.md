# QA: Cross-linking + Inzerce fix

**Datum:** 2026-04-20  
**Kontrolor:** kontrolor agent  
**Podklad:** audit-crosslinking-20260420.md (P0: nabidka+service pages, P1: chci-prodat+profil)

---

## VÝSLEDEK: ✅ VŠECHNY FIXY APPROVED

---

## 1. CROSS-LINKING — 4 fixy

### 1a. ServicePage.tsx — cross-linking sekce pod FAQ

**Status: ✅ IMPLEMENTOVÁNO**

- Nový prop `currentService?: "proverka" | "financovani" | "pojisteni"` (řádek 28)
- Sekce "Další služby CarMakléř" přidána pod FAQ (řádky 156-201)
- 3 karty (filtrováno podmínkou `currentService !== "X"` — vždy 2 z 3)
- Textové linky pod kartami: `/nabidka →`, `/chci-prodat →`, `/makleri →`

**Všechny 3 service pages předávají prop:**
```
financovani/page.tsx:98  currentService="financovani" ✅
proverka/page.tsx:97     currentService="proverka"    ✅
pojisteni/page.tsx:98    currentService="pojisteni"   ✅
```

---

### 1b. nabidka/[slug] — "Doplňkové služby" sekce

**Status: ✅ IMPLEMENTOVÁNO**

- Sekce přidána 2× — pro vehicle render (řádek 721) i listing render (řádek 1129)
- 3 karty: Prověrka vozidla (`/sluzby/proverka`), Financování (`/sluzby/financovani`), Pojištění (`/sluzby/pojisteni`)
- Design: `w-12 h-12 bg-orange-50 rounded-xl` ikony + popisky + orange CTA text
- Auditní nález P0 vyřešen ✅

---

### 1c. chci-prodat — "Nejste si jistí?" soft CTA

**Status: ✅ IMPLEMENTOVÁNO**

- Sekce 7 na řádku 258 (nová, pod FAQ)
- 3 pill linky (`px-5 py-3 bg-gray-100 rounded-xl`, hover → orange):
  - `/jak-to-funguje` → "Jak prodej funguje"
  - `/recenze` → "Recenze klientů"
  - `/makleri` → "Najít makléře v okolí"
- Auditní nález P1 vyřešen ✅

---

### 1d. profil/[slug] — CTA "Chcete prodat auto?"

**Status: ✅ IMPLEMENTOVÁNO**

- **Umístění:** `ProfileClient.tsx` (client component), řádky 490-512
  - *Pozn.: `page.tsx` je Server Component wrapper → UI je v ProfileClient*
- Podmínka: `!isOwner && (user.role === "BROKER" || user.role === "MANAGER")` ✅
  - Zobrazí se pouze na cizích makléřských/manažerských profilech
- Design: orange-50 pill karta s 🚗 ikonou, text "Chcete prodat auto?" + sub-text
- Link: `/chci-prodat` ✅
- Auditní nález P1 vyřešen ✅

---

## 2. INZERCE FIX — 3 sub-fixy

### 2a. middleware.ts: rewrite místo redirect

**Status: ✅ OPRAVENO**

Řádky 169-173:
```ts
if (subdomain === "inzerce" && (pathname === "/nabidka" || pathname === "/katalog")) {
  const response = NextResponse.rewrite(new URL("/nabidka", request.url));
  response.headers.set("x-subdomain", subdomain);
  return response;
}
```
- `NextResponse.rewrite` ✅ (nikoliv `redirect` — eliminuje loading.tsx spinner flash)
- Pokrývá `/nabidka` i `/katalog` na inzerce subdoméně ✅

### 2b. middleware.ts: /gate v SKIP_REWRITE_PREFIXES

**Status: ✅ PŘÍTOMNO**

Řádek 40: `/gate` je v `SKIP_REWRITE_PREFIXES` ✅  
→ Site password gate stránka neprojde subdomain rewrite (bylo by nekonečné přesměrování)

### 2c. DB pagination pro /nabidka (take/skip)

**Status: ✅ OPRAVENO**

- `app/api/vehicles/route.ts` řádky 94, 104-105: `skip = (page-1)*limit`, `take: limit` ✅
- `app/api/listings/route.ts` řádky 258, 270-271: stejný pattern ✅
- In-memory slice odstraněn → DB provádí stránkování efektivně ✅

---

## Debug kontrola

### npm run build
```
✅ BUILD PASSES
✓ Compiled successfully in 19.0s
```

### npm run lint
```
middleware.ts
  14:7  warning  'INZERENT_ROLES' is assigned a value but never used
  15:7  warning  'BUYER_ROLES' is assigned a value but never used
```
- **2 warnings v middleware.ts — PRE-EXISTUJÍCÍ** (nesouvisí s tímto fixem, proměnné připraveny pro budoucí role-based auth expansion)
- Ostatní soubory: 0 errors, 0 warnings ✅

---

## Simplify kontrola

- ServicePage: `currentService` prop je jednoduchý string literal union — správné řešení, nevyžaduje přepis
- Nabidka detail: sekce správně duplikována pro obě větve (vehicle + listing) — nutné, ne duplicita
- ProfileClient: podmínka `!isOwner && BROKER/MANAGER` — správně, neporušuje privacy
- Middleware: rewrite pattern clean, 1 podmínka = 2 pathname ✅

---

## ZÁVĚR

| Fix | Status |
|---|---|
| ServicePage cross-linking + currentService prop | ✅ APPROVED |
| nabidka/[slug] "Doplňkové služby" | ✅ APPROVED |
| chci-prodat "Nejste si jistí?" pills | ✅ APPROVED |
| profil/[slug] "Chcete prodat auto?" CTA | ✅ APPROVED (v ProfileClient.tsx) |
| middleware.ts: rewrite inzerce+/nabidka | ✅ APPROVED |
| middleware.ts: /gate v SKIP_REWRITE_PREFIXES | ✅ APPROVED |
| DB pagination vehicles + listings | ✅ APPROVED |
| Build | ✅ PASS |
| Lint | ✅ 0 errors (2 pre-existující warnings v middleware) |
