# Build Check — 2026-04-13

**Agent:** KONTROLOR  
**Příkaz:** `npm run build`  
**Datum:** 2026-04-13  
**Framework:** Next.js 16.1.7 (webpack mode)

---

## Verdict: ✅ BUILD PASS

**Compile:** 16.9s  
**TypeScript:** PASS (0 errors — build dokončen bez TypeScript chyby)  
**Stránky:** 1 233 stránek vygenerováno (7 workers, 5.2s)

---

## Warningy (5 — žádný bloker)

### W1 — Sentry: 3× deprecated options
```
[@sentry/nextjs] DEPRECATION WARNING: autoInstrumentServerFunctions is deprecated
[@sentry/nextjs] DEPRECATION WARNING: autoInstrumentMiddleware is deprecated
[@sentry/nextjs] DEPRECATION WARNING: autoInstrumentAppDirectory is deprecated
```
- **Dopad:** Nízký — stále funguje, jen deprecated API
- **Fix:** Přesunout do `webpack.autoInstrument*` namespace v `next.config.ts`
- **Priorita:** Před dalším Sentry upgrade

### W2 — Sentry: sentry.client.config.ts naming
```
[@sentry/nextjs] It is recommended renaming sentry.client.config.ts to instrumentation-client.ts
```
- **Dopad:** Nízký — při Turbopack migraci přestane fungovat
- **Fix:** Přejmenovat soubor (až při Turbopack přechodu)
- **Priorita:** Nízká

### W3 — Next.js: middleware → proxy (IMPORTANT)
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```
- **Dopad:** Střední — Next.js 16 přejmenoval `middleware.ts` → `proxy.ts`
- **Fix:** Přejmenovat `middleware.ts` → `proxy.ts`
- **Priorita:** Střední (před Next.js 17)

---

## Přehled vygenerovaných stránek

### Typy routů
| Typ | Symbol | Počet | Popis |
|-----|--------|-------|-------|
| Dynamic (SSR) | ƒ | ~950+ | Server-rendered on demand |
| Static | ○ | ~60+ | Prerendered jako statický HTML |
| SSG (ISR) | ● | ~850 | Staticky generované `/dily/znacka/[brand]/[model]/[rok]` |

### Klíčové sekce

#### Admin panel (28 stránek)
| Stránka | Typ |
|---------|-----|
| `/admin/dashboard` | ƒ Dynamic |
| `/admin/users` | ○ **Static** (nová stránka) |
| `/admin/orders` | ○ **Static** (nová stránka) |
| `/admin/vehicles` | ○ Static |
| `/admin/partners` | ƒ Dynamic |
| `/admin/brokers` | ○ Static |
| `/admin/feeds` | ○ Static |
| `/admin/manager/*` | ƒ Dynamic |
| `/admin/marketplace/*` | ƒ Dynamic |

#### Makléřská PWA — `/makler/` (35 stránek)
Všechny statické ○ nebo dynamic ƒ, žádné chyby.

#### Partnerský portál — `/partner/` (13 stránek)
Všechny statické ○ nebo dynamic ƒ, žádné chyby.

#### Eshop dílů — `/dily/` (ISR 1d/1y)
```
/dily/znacka/[brand]         — 17+ paths
/dily/znacka/[brand]/[model] — 51+ paths
/dily/znacka/[brand]/[model]/[rok] — 846+ paths  ← největší ISR sada
```
Celkem ~914 ISR stránek s revalidace 1 den (expire 1 rok).

#### SEO Landing pages — `/nabidka/`
Všechny ƒ dynamic:
- 16 značkových LP (skoda, vw, bmw, audi, ford, toyota...)
- 12 modelových LP (octavia, fabia, golf, passat...)
- 8 lokálních LP (praha, brno, ostrava...)
- 5 cenových LP (do-100000 až do-1000000)
- 7 kategoriových LP (suv, kombi, sedan, elektromobily...)

#### API routes (~200 endpointů)
Všechny ƒ Dynamic. Kompletní sada včetně:
- Admin API (users, orders, vehicles, brokers, feeds, partners...)
- Broker API (commissions, vehicles, stats, leaderboard...)
- Wolt commission model (partners/[id]/commission + history + reports)
- Stripe Connect (webhook, connect/onboard-link, connect/status...)
- Marketplace (opportunities, investments, payout...)

---

## Nové stránky (z posledních commitů)

### `/admin/users` ○ Static
→ Přidáno v `11a436b` (feat: add admin users and orders pages)

### `/admin/orders` ○ Static
→ Přidáno v `11a436b` (feat: add admin users and orders pages)

**Poznámka:** Obě stránky generovány jako static (○) — build nezaznamenal žádné DB queries při generování, správné chování pro admin stránky s session gate.

---

## Souhrn

| Oblast | Status |
|--------|--------|
| Build | ✅ PASS |
| TypeScript | ✅ 0 errors |
| ESLint | ℹ️ Nespuštěn v build (samostatný `npm run lint`) |
| Stránek | ✅ 1233 |
| Critical errors | ✅ 0 |
| Warningy | ⚠️ 5 (vše nízká/střední priorita, neblokující) |
| Service Worker | ✅ Serwist bundled `/sw.js` |

---

## Doporučení

| # | Akce | Priorita | Effort |
|---|------|----------|--------|
| 1 | Přejmenovat `middleware.ts` → `proxy.ts` (Next.js 16 deprecation) | Střední | 5 min |
| 2 | Aktualizovat Sentry config: `webpack.autoInstrument*` namespace | Nízká | 15 min |
| 3 | Spustit `npm run lint` pro kompletní ESLint audit | Nízká | — |

**Celkové hodnocení: BUILD GREEN ✅ — platforma je buildovatelná, produkčně nasaditelná.**
