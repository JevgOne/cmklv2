# QA Report: Dev Server — ověření renderování stránek — 2026-05-03

**Autor:** Kontrolor  
**Datum:** 2026-05-03  
**Příkaz:** `npm run dev` → curl HTTP checks

---

## Výsledky — SHRNUTÍ

| | Výsledek |
|---|---|
| **Dev server start** | ✅ Nastartoval (~12s) |
| **Klíčové stránky (9/9)** | ✅ HTTP 200 |
| **Auth redirecty (4/4)** | ✅ HTTP 307 → /login |

---

## 1. KLÍČOVÉ STRÁNKY

| URL | HTTP Status | Render time | Poznámka |
|-----|------------|-------------|---------|
| `/` | **200** | 87ms | Homepage ✅ |
| `/nabidka` | **200** | 644ms | Katalog vozidel ✅ |
| `/blog` | **200** | 242ms | Blog ✅ |
| `/login` | **200** | 251ms | Přihlašovací stránka ✅ |
| `/admin/dashboard` | **307** | 4ms | → /login?callbackUrl= ✅ (správně, middleware) |
| `/shop` | **200** | 410ms | Eshop ✅ |
| `/inzerce` | **200** | 457ms | Inzertní platforma ✅ |
| `/marketplace` | **200** | 336ms | Marketplace ✅ |
| `/dily` | **200** | 209ms | Díly eshop ✅ |
| `/api/vehicles` | **200** | 237ms | API endpoint ✅ |

---

## 2. AUTH REDIRECTY (ověření middlewaru)

| URL | HTTP Status | Cíl redirectu | Výsledek |
|-----|------------|---------------|---------|
| `/admin/dashboard` | 307 | `/login?callbackUrl=...` | ✅ |
| `/makler/onboarding` | 307 | `/login?callbackUrl=...` | ✅ |
| `/parts` | 307 | `/login?callbackUrl=...` | ✅ |
| `/partner` | 307 | `/login?callbackUrl=...` | ✅ |
| `/marketplace/dealer` | 307 | `/marketplace/apply?reason=auth_required&role=dealer` | ✅ |

Middleware funguje správně — nepřihlášený uživatel je redirectován na login (nebo marketplace/apply pro marketplace routes).

---

## 3. RENDER ČASY — ANALÝZA

| Kategorie | Časy | Posouzení |
|-----------|------|-----------|
| Statické/cached (`/`, `/dily`, `/login`) | 87–251ms | ✅ Rychlé |
| Dynamické s DB (`/blog`, `/marketplace`) | 242–336ms | ✅ OK |
| Heavy listing pages (`/nabidka`, `/inzerce`, `/shop`) | 410–644ms | ⚠️ Pomalejší, ale přijatelné pro dev |

**Poznámka:** Časy jsou pro dev server (neoptimalizovaný). Produkční build (next start) bude řádově rychlejší díky statickému generování a CDN.

`/nabidka` (644ms) je nejpomalejší — pravděpodobně Prisma query pro katalog vozidel s filtrováním. Sledovat v produkci.

---

## 4. ZÁVĚR

**Celkový stav: ✅ Dev server funguje. Všechny klíčové stránky renderují správně.**

Žádné chybové stránky (500, 404) na klíčových routes. Auth middleware funguje přesně dle specifikace. Render časy jsou v přijatelném rozsahu pro dev prostředí.
