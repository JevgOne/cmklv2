# QA Report: Audit komponent — 2026-05-03

**Autor:** Kontrolor  
**Datum:** 2026-05-03  
**Rozsah:** `components/` — celkem **314 TSX souborů**

---

## 1. PŘEHLED STRUKTURY

| Složka | Souborů | `use client` | Poznámka |
|--------|---------|--------------|----------|
| `components/ui/` | 33 | 17 (52%) | Sdílené UI primitives |
| `components/web/` | 87 | 65 (75%) | Veřejný web |
| `components/admin/` | 39 | 36 (92%) | Admin panel |
| `components/pwa/` | 112 | 97 (87%) | PWA makléř |
| `components/pwa-parts/` | 25 | 23 (92%) | PWA dodavatel dílů |
| `components/partner/` | 4 | 3 | Partner portal |
| `components/common/` | 2 | 0 | Sdílená základ. kostra |
| Subdomain navbars/footers | 10 | 8 | 4 Navbar + 4 Footer |
| **Celkem** | **314** | | |

---

## 2. NEPOUŽÍVANÉ KOMPONENTY (0 imports)

### 🟠 Kandidáti na odstranění

| Komponenta | Cesta | Řádků | Poznámka |
|------------|-------|-------|---------|
| `LiveRegion` | `components/ui/LiveRegion.tsx` | 14 | Accessibility helper, nikde neimportován |
| `CommentSection` | `components/web/CommentSection.tsx` | 212 | Superseded by `blog/ArticleComments.tsx` |
| `InstallPrompt` | `components/pwa/InstallPrompt.tsx` | ? | PWA install banner, 0 importů |
| `FeatureGate` | `components/pwa/FeatureGate.tsx` | ? | Feature gating wrapper, 0 importů |

**Poznámka k `CommentSection`:** Existuje novější `components/web/blog/ArticleComments.tsx` se stejným účelem. `CommentSection` je 212 řádků mrtvého kódu.

**Poznámka k `LiveRegion`:** Přístupnostní komponenta (screen reader announcements). Mohla by být hodnotná ale není nikde použita.

---

## 3. DUPLICITNÍ KOMPONENTY (stejné jméno, různé složky)

### ✅ Správná duplicita (různé domény, různá data)

| Jméno | Výskyt | Zdůvodnění |
|-------|--------|------------|
| `VehicleCard` | web/ (157 ř.) + pwa/vehicles/ (135 ř.) | Web = veřejný katalog (FavoriteButton, CompareButton); PWA = admin preview (StatusPill). Správný split. |
| `VehicleTimeline` | web/ + pwa/vehicles/ | Různé datové typy. Web = veřejný pohled, PWA = admin pohled s více event typy. |
| `VehicleFilters` | web/ + pwa/vehicles/ | Různé filtry pro různé kontexty. |
| `ProfileForm` | admin/ (332 ř.) + pwa/profile/ (121 ř.) + pwa/onboarding/ (287 ř.) | 3 různé formuláře pro 3 různé účely — správně. |
| `DetailsStep` | pwa/contracts/ + pwa/vehicles/new/ + pwa-parts/parts/ | Různé wizard steps v různých doménách — správně. |
| `PricingStep` | pwa/vehicles/new/ + pwa-parts/parts/ | Různé pricing flows — správně. |
| `Footer` | main/ + inzerce/ + shop/ + marketplace/ | Všechny využívají `common/FooterBase` ✅ |

### ⚠️ Potenciální refaktoring (podobná logika bez sdílené báze)

| Jméno | Výskyt | Problém |
|-------|--------|---------|
| `NotificationBell` | admin/ (168 ř.) + pwa/ (174 ř.) + web/marketplace/ (191 ř.) | 3 implementace s podobným dropdown/bell patternem, různé API endpointy. Mohly by sdílet `NotificationBellBase` jako Footer → FooterBase. |
| `Navbar` | main/ (243 ř.) + inzerce/ (128 ř.) + shop/ (133 ř.) + marketplace/ (116 ř.) | Footery mají `FooterBase`, Navbary NE. Podobná struktura (logo, links, mobile hamburger) ale žádná sdílená kostra. |

---

## 4. BROKEN IMPORTY

**✅ Žádné broken importy nenalezeny.**

Kontroloval jsem importy v `app/` a `components/`. Výsledky "MISSING":
- `@/components/ui` → adresářový import, resolves přes `components/ui/index.ts` ✅
- `@/components/web/listing-form` → adresářový import s `index.ts` ✅

---

## 5. `"use client"` ANALÝZA

### ✅ Správné server components (bez `"use client"`)

Tyto komponenty správně nemají `"use client"` — jsou to pure display komponenty:

**admin/:**
- `admin/DataTable.tsx` — generický tabulkový renderer, pure ✅
- `admin/QualityChecklist.tsx` — pure display checklist ✅
- `admin/partners/PartnerStatusBadge.tsx` — pure badge ✅

**web/:**
- `web/VehicleCard.tsx` — uses `memo`, pure display ✅
- `web/Breadcrumbs.tsx` — pure navigation ✅
- `web/LandingHero.tsx` — statický hero ✅
- `web/BrandLandingContent.tsx`, `web/ModelLandingContent.tsx` — SEO landing wrappers ✅
- `web/ServicePage.tsx` — statický template ✅
- `web/marketplace/OpportunityCard.tsx`, `DealScoreBadge.tsx`, `DealerStats.tsx` atd. — pure display ✅

**pwa/:**
- `pwa/commissions/MonthStats.tsx`, `SaleCard.tsx` — pure display ✅
- `pwa/contracts/ContractCard.tsx` — pure display ✅
- `pwa/vehicles/VehicleCard.tsx` — pure display ✅
- (15 pwa komponent správně bez use client)

### ⚠️ Potenciálně zbytečné `"use client"` v admin

Admin sekce má 92% `"use client"` — téměř všechny admin komponenty jsou client components. Většina se ale skutečně spoléhá na `useSession()`, `useState`, `useRouter` — takže je to technicky správně. Vybrané příklady pro případné budoucí refaktoring (pokud by se přešlo na server actions):
- `admin/BrokerApprovalCard.tsx`
- `admin/BrokerCard.tsx` (tyto zobrazují data která by mohla být pure server)

---

## 6. DUPLICITA FUNKCIONALITY (různé jméno, stejný účel)

| Dvojice | Problém |
|---------|---------|
| `web/CommentSection.tsx` × `web/blog/ArticleComments.tsx` | Obě řeší zobrazení komentářů. CommentSection má 0 importů → je to mrtvý kód z dřívější verze. |
| `pwa/vehicles/VehicleTimeline.tsx` × `web/VehicleTimeline.tsx` | Podobné chování ale různá data — správný split. |
| `admin/InviteBrokerModal.tsx` × `/registrace/makler` flow | Různé kontexty (admin invite vs. self-registration) — správně. |

---

## 7. i18n — HARDCODED TEXTY

**✅ Záměrně hardcoded — projekt je single-language (CZ).**

- Žádná i18n knihovna není nainstalována (next-intl, i18next, react-i18next)
- Všechny texty jsou přímo v komponentách v češtině
- Pro CZ-only projekt je toto správný přístup — i18n by přidalo zbytečnou komplexitu

---

## 8. `RichTextEditor`

- **Implementace:** TipTap (`StarterKit`, `Image`, `Link`, `Placeholder`, `Underline`) ✅
- **Použití:** 2 místa
  - `app/(admin)/admin/blog/[id]/edit/ArticleEditor.tsx` ✅
  - `app/(pwa)/makler/blog/[id]/edit/BrokerArticleEditor.tsx` ✅
- **Stav:** ✅ Funkční, sdílená komponenta

---

## 9. SUBDOMAIN NAVBARY — chybějící sdílená báze

Footery mají `common/FooterBase.tsx` — sdílená kostra pro všechny 4 subdomény ✅  
Navbary NEMAJÍ sdílenou bázi:
- `main/Navbar.tsx` (243 řádků) — auth-aware (useSession), plný hamburger menu
- `inzerce/Navbar.tsx` (128 řádků) — PlatformSwitcher
- `shop/Navbar.tsx` (133 řádků) — PlatformSwitcher + CartIcon
- `marketplace/Navbar.tsx` (116 řádků) — PlatformSwitcher

Jsou si podobné (logo, responsive hamburger, sticky), ale nejsou refaktorovány. Riziko: změna ve stylu vyžaduje 4 úpravy.

---

## 10. SOUHRN PRIORIT

### 🟠 Střední — odstranit

| Akce | Soubor | Dopad |
|------|--------|-------|
| Smazat mrtvý kód | `components/web/CommentSection.tsx` | 212 řádků dead code |
| Smazat nebo implementovat | `components/pwa/InstallPrompt.tsx` | 0 importů |
| Smazat nebo implementovat | `components/pwa/FeatureGate.tsx` | 0 importů |
| Zvážit použití nebo smazat | `components/ui/LiveRegion.tsx` | 14 řádků, dobrá přístupnost |

### ⚠️ Nízká priorita — tech debt

| Akce | Popis |
|------|-------|
| Refaktorovat Navbar | Vytvořit `common/NavbarBase` jako `FooterBase` |
| Refaktorovat NotificationBell | Vytvořit sdílenou `NotificationBellBase` |

### ✅ Žádné problémy

- Žádné broken importy
- Žádné cyklické závislosti (viditelné)
- Duplicitní názvy jsou záměrné a správné (různé domény)
- Server components jsou správně označeny (bez "use client")
- RichTextEditor správně sdílený

---

**Celkový verdikt: ✅ Componentový systém je zdravý. 4 mrtvé komponenty ke smazání, 2 drobné tech debt příležitosti.**
