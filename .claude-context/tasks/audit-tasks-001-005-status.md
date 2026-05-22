# Audit stavu TASK-NEW-001 až 005

**Datum auditu:** 2026-05-08
**Auditor:** Plánovač (agent team)
**Zdroj:** TASK-QUEUE.md řádky 6380–6443, codebase search

---

## TASK-NEW-001: Vehicle Equipment Checkboxes — ✅ HOTOVO

**Zadání:** Checkboxy výbavy ve vehicle intake flow. VIN decode předvyplní sériovou výbavu. Kategorie: bezpečnost, komfort, infotainment, exteriér, interiér. Aftermarket ručně.

**Nalezená implementace:**

| Soubor | Účel |
|--------|------|
| `app/(pwa)/makler/vehicles/new/equipment/page.tsx` | Stránka kroku výbavy v intake flow |
| `components/pwa/vehicles/new/EquipmentStep.tsx` | Step wrapper — integrace do draft context, navigace, save |
| `components/pwa/vehicles/new/EquipmentSelector.tsx` | Hlavní UI komponent — kategorie, checkboxy, VIN prefill, custom items |
| `types/vehicle-draft.ts:276-345` | `EquipmentCategory` interface + `DEFAULT_EQUIPMENT_CATALOG` (6 kategorií: komfort, bezpečnost, infotainment, exteriér, interiér, asistence) |
| `components/web/listing-form/Step3Equipment.tsx` | Ekvivalent pro inzertní flow |

**Kompletnost:**
- ✅ VIN decode → předvyplnění výbavy z `vinDecoded?.equipment`
- ✅ 6 kategorií checkboxů (zadání chtělo 5, implementace má 6 — navíc "asistence")
- ✅ Expandable accordion po kategoriích s počtem zaškrtnutých
- ✅ Custom aftermarket položky (ruční přidání)
- ✅ Offline podpora (IndexedDB katalog)
- ✅ Integrace do draft flow (step 6 z intake wizardu)
- ✅ Inzertní flow má vlastní Step3Equipment

**Stav: HOTOVO — plně funkční implementace**

---

## TASK-NEW-002: Donor Car Flow (PWA Parts Supplier) — ✅ HOTOVO

**Zadání:** Kompletní donor car flow v PWA: VIN → typ poškození → damage zones → filtr dílů → výběr + stav + fotka → fotky auta → cena → souhrn + publish.

**Nalezená implementace:**

| Soubor | Účel |
|--------|------|
| `app/(pwa-parts)/parts/new/page.tsx` | Main page — mode selector (single/donor), 7-step donor wizard |
| `components/pwa-parts/parts/ModeSelector.tsx` | Volba single díl vs. donor car |
| `components/pwa-parts/parts/DonorVehicleStep.tsx` | Step 1: VIN decode |
| `components/pwa-parts/parts/DisposalTypeStep.tsx` | Step 2: Typ poškození (nehoda/nepojízdné/kompletní/zatopené/požár) |
| `components/pwa-parts/parts/DamageZoneSelector.tsx` | Step 3: 8 zón SVG top-down + 4 stupně poškození + auto-presety |
| `components/pwa-parts/parts/PartsFilterStep.tsx` | Step 4+5: Výběr dílů, stav A/B/C, filtr zničených zón |
| `components/pwa-parts/parts/DonorPhotosStep.tsx` | Step 6: Fotky celého auta (4 povinné) |
| `components/pwa-parts/parts/BulkPricingStep.tsx` | Step 7: Hromadné oceňování dílů |
| `components/pwa-parts/parts/DonorSummaryStep.tsx` | Souhrn + publish do eshopu |
| `lib/damage-zones.ts` | Zóny, úrovně, presety, labels, airbag warning |

**Kompletnost:**
- ✅ Step 1: VIN → dekóduj auto (`DonorVehicleStep`)
- ✅ Step 2: Typ poškození 5 typů (`DisposalTypeStep`)
- ✅ Step 3: Damage zone selector — SVG 8 zón, 4 úrovně, auto-presety dle typu (`DamageZoneSelector`)
- ✅ Step 4: Automatický filtr dílů — destroyed zóny vyřazeny (`PartsFilterStep`)
- ✅ Step 5: Výběr dílů + stav + poznámka + fotka (v `PartsFilterStep`)
- ✅ Step 6: Fotky celého auta — 4 povinné (`DonorPhotosStep`)
- ✅ Step 7: Cena — hromadné nastavení (`BulkPricingStep`)
- ✅ Step 8: Souhrn + publish (`DonorSummaryStep`)
- ✅ TecDoc mock data integrace (`lib/tecdoc.ts`)

**Stav: HOTOVO — všech 8 kroků ze zadání implementováno**

---

## TASK-NEW-003: Blog Rich Text Editor — ✅ HOTOVO

**Zadání:** Nahradit textarea za TipTap editor. Toolbar: bold, italic, headings, lists, images, links, blockquotes.

**Nalezená implementace:**

| Soubor | Účel |
|--------|------|
| `components/ui/RichTextEditor.tsx` | Sdílená TipTap komponenta — plný toolbar |
| `app/(admin)/admin/blog/[id]/edit/ArticleEditor.tsx` | Admin blog editor (používá RichTextEditor) |
| `app/(pwa)/makler/blog/[id]/edit/BrokerArticleEditor.tsx` | PWA broker editor (používá RichTextEditor) |
| `package.json:28-34` | 7 TipTap packages nainstalovány |

**TipTap packages:**
`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`, `@tiptap/pm` (vše v3.22.4)

**Toolbar features:**
- ✅ Bold, Italic, Underline
- ✅ Headings (H2, H3, H4)
- ✅ Lists (ordered + unordered — via StarterKit)
- ✅ Images (upload přes Cloudinary endpoint `/api/upload/image`)
- ✅ Links (URL prompt, noopener/noreferrer)
- ✅ Blockquotes (via StarterKit)
- ✅ Placeholder text

**Použito v:**
- Admin blog editor
- PWA broker blog editor

**Stav: HOTOVO — plný TipTap editor s toolbar, image upload, integrace do admin i PWA**

---

## TASK-NEW-004: Redirect /auth/prihlasit → /login — ✅ HOTOVO

**Zadání:** 301 redirect v `next.config.ts`: `/auth/prihlasit` → `/login`

**Nalezená implementace:**

| Soubor | Řádek | Obsah |
|--------|-------|-------|
| `next.config.ts` | 101-105 | `{ source: "/auth/prihlasit", destination: "/login", permanent: true }` |

**Kompletnost:**
- ✅ `permanent: true` = HTTP 308 (Next.js equivalent of 301 for all methods)
- ✅ Správný source a destination
- ✅ V produkčním config souboru

**Stav: HOTOVO — jednořádková změna, plně funkční**

---

## TASK-NEW-005: Marketplace VIP Detail Page — ✅ HOTOVO

**Zadání:** Detail stránka pro marketplace VIP dealy. Gated za INVESTOR/VERIFIED_DEALER/ADMIN. Fotogalerie, finanční kalkulace, profit split, tlačítko "Investovat", historie dealů.

**Nalezená implementace:**

| Soubor | Účel |
|--------|------|
| `app/(web)/marketplace/deals/[id]/page.tsx` | SSR stránka — auth gate, Prisma fetch, role-based filtering |
| `app/(web)/marketplace/deals/[id]/loading.tsx` | Loading skeleton |
| `components/web/marketplace/DealDetailClient.tsx` | Client wrapper — orchestrace všech sub-komponent |
| `components/web/marketplace/ProfitCalculator.tsx` | ROI kalkulace, profit split slider (dealer/investor/carmakler) |
| `components/web/marketplace/InvestModal.tsx` | Modal "Investovat" — částka, souhlas, submit |
| `components/web/marketplace/DealPhotoGallery.tsx` | Fotogalerie auta |
| `components/web/marketplace/DealScoreBadge.tsx` | Deal score badge |
| `components/web/marketplace/FlipTimeline.tsx` | Historie/timeline dealu |
| `components/web/marketplace/FlipProgressTracker.tsx` | Progress milestones |
| `components/web/marketplace/NegotiationPanel.tsx` | Panel vyjednávání |
| `components/web/marketplace/DealTabs.tsx` | Tab navigace na detailu |
| `components/web/marketplace/DealAdminPanel.tsx` | Admin panel na detailu |
| `components/web/marketplace/DealerReputationBadge.tsx` | Reputace dealera |
| `components/web/marketplace/NotificationBell.tsx` | Notifikace |
| `components/web/marketplace/DealerFlipDetail.tsx` | Dealer-specific detail view |

**Kompletnost:**
- ✅ Deal detail page s fotkami — `DealPhotoGallery`
- ✅ Finanční kalkulace — `ProfitCalculator` (nákupní cena, opravy, prodejní cena, ROI)
- ✅ Profit split: `carmaklerFeePct` (default 5%), dealer/investor slider s negotiation support
- ✅ Tlačítko "Investovat" — `InvestModal` (částka, validace, API submit)
- ✅ Historie dealů — `FlipTimeline` + `FlipProgressTracker` (milestones)
- ✅ Role gating: `ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"]`
- ✅ Dealer vidí jen své opportunity, investor nevidí PENDING_APPROVAL
- ✅ Negotiation panel, deal score, dealer reputation — **navíc oproti zadání**

**Stav: HOTOVO — rozsáhlá implementace překračující původní zadání (15+ komponent)**

---

## Souhrnná tabulka

| Task | Název | Priorita | Stav v QUEUE | Skutečný stav | Poznámka |
|------|-------|----------|-------------|---------------|----------|
| TASK-NEW-001 | Vehicle Equipment Checkboxes | 1 | zpracovává se | ✅ **HOTOVO** | 6 kategorií, VIN prefill, custom items, offline |
| TASK-NEW-002 | Donor Car Flow | 1 | zpracovává se | ✅ **HOTOVO** | Všech 8 kroků, 10+ komponent, SVG damage zones |
| TASK-NEW-003 | Blog Rich Text Editor | 2 | zpracovává se | ✅ **HOTOVO** | TipTap s plným toolbar, admin + PWA |
| TASK-NEW-004 | Redirect /auth/prihlasit | 1 | zpracovává se | ✅ **HOTOVO** | Permanent redirect v next.config.ts |
| TASK-NEW-005 | Marketplace VIP Detail | 2 | zpracovává se | ✅ **HOTOVO** | 15+ komponent, ROI calc, invest flow, negotiations |

## Doporučení

**Všech 5 úkolů je implementováno.** TASK-QUEUE.md by měl být aktualizován:
- Změnit stav všech 5 tasků z `zpracovává se` na `hotovo`
- Zaznamenat datum dokončení
