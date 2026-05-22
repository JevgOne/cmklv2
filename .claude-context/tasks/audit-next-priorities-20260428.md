# Audit rozpracovaných tasků + TOP 5 priority

**Datum:** 2026-04-28
**Autor:** planovac
**Účel:** Ověřit stav TASK-NEW-001–005 proti kódu, identifikovat mezery v projektu, navrhnout dalši práci.

---

## 1. STAV TASK-NEW-001 až 005

### TASK-NEW-001: Vehicle Equipment Checkboxes
**Stav: HOTOVO**

Implementace existuje a je kompletní:
- **Prisma schema:** `equipment String?` (JSON array) na modelech Vehicle (line 277) i Listing (line 710)
- **PWA makléř:** Plný equipment wizard step
  - `app/(pwa)/makler/vehicles/new/equipment/page.tsx` — dedikovaná stránka
  - `components/pwa/vehicles/new/EquipmentStep.tsx` — step s EquipmentSelector komponentou
- **Zobrazení:** `app/(web)/nabidka/[slug]/page.tsx` — parsuje JSON equipment, zobrazuje v tab "Výbava" (lines 308-316, 682-687)
- **Edit:** `app/(pwa)/makler/vehicles/[id]/edit/page.tsx` (line 60), `app/(admin)/admin/vehicles/[id]/edit/page.tsx` (line 29)

**Verdikt:** Lze uzavřít jako HOTOVO. Žádná práce potřeba.

---

### TASK-NEW-002: Donor Car Flow (PWA Parts Supplier)
**Stav: HOTOVO**

Kompletní implementace donor car flow:
- **Prisma schema:** DonorVehicle model existuje, migrace `20260426160000_add_donor_vehicle_and_tecdoc_fields` aplikována
- **API routes:** `app/api/donor-vehicles/route.ts` (POST/GET), `app/api/donor-vehicles/[id]/route.ts` (GET/PUT/DELETE)
- **PWA pages:**
  - `app/(pwa-parts)/parts/donors/page.tsx` — seznam donor aut
  - `app/(pwa-parts)/parts/donors/[id]/page.tsx` — detail donor auta
  - `app/(pwa-parts)/parts/new/page.tsx` — ModeSelector (single part vs. donor car)
- **Wizard kroky:**
  - `components/pwa-parts/parts/DonorVehicleStep.tsx` — VIN zadání + info o vozu
  - `components/pwa-parts/parts/DonorPhotosStep.tsx` — fotodokumentace
  - `components/pwa-parts/parts/DonorSummaryStep.tsx` — souhrn a odeslání
  - `components/pwa-parts/parts/ModeSelector.tsx` — volba single part vs. celé auto
- **Validace:** `lib/validators/donor-vehicle.ts`

**Verdikt:** Lze uzavřít jako HOTOVO. Plně funkční flow.

---

### TASK-NEW-003: Blog Rich Text Editor (TipTap)
**Stav: HOTOVO**

TipTap editor je implementován a integrován:
- **Package:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline` v package.json
- **Komponenta:** `components/ui/RichTextEditor.tsx` — plně funkční editor s toolbar (bold, italic, underline, headings, lists, links, images s Cloudinary upload)
- **Admin editor:** `app/(admin)/admin/blog/[id]/edit/ArticleEditor.tsx` — používá RichTextEditor
- **Makléř editor:** `app/(pwa)/makler/blog/[id]/edit/BrokerArticleEditor.tsx` — používá RichTextEditor

**Verdikt:** Lze uzavřít jako HOTOVO.

---

### TASK-NEW-004: Redirect /auth/prihlasit → /login
**Stav: HOTOVO**

Redirect existuje v next.config.ts:
```typescript
// next.config.ts lines 101-105
{
  source: "/auth/prihlasit",
  destination: "/login",
  permanent: true,
}
```

Login stránka existuje: `app/(web)/login/page.tsx` — plně funkční s email/password formulářem.

**Verdikt:** Lze uzavřít jako HOTOVO. Jednořádková konfigurace, funguje.

---

### TASK-NEW-005: Marketplace VIP Detail Page
**Stav: ZASTARALÉ (OBSOLETE) — superseded by CarMarketplace MVP**

Celý CarMarketplace MVP byl implementován v 8 fázích a nasazen na produkci (2026-04-27). Deal detail page nyní obsahuje:
- **Tabbed layout:** DealTabs (Přehled, Finance, Oprava) — `components/web/marketplace/DealTabs.tsx`
- **AI Deal Score:** `components/web/marketplace/DealScoreBadge.tsx` + `lib/marketplace/deal-score.ts`
- **Flip Progress Tracker:** `components/web/marketplace/FlipProgressTracker.tsx` s milníky
- **Negotiation Panel:** `components/web/marketplace/NegotiationPanel.tsx` s offer/counter-offer
- **Portfolio Dashboard:** `components/web/marketplace/PortfolioDashboard.tsx`
- **Notification Bell:** `components/web/marketplace/NotificationBell.tsx`
- **Dealer Reputation:** `components/web/marketplace/DealerReputationBadge.tsx`

**Verdikt:** SMAZAT z queue. Kompletně nahrazeno MVP implementací.

---

## 2. CELKOVÝ STAV PROJEKTU — AUDIT MEZER

### 2.1 Hlavní produkty — status

| Produkt | Status | Poznámka |
|---------|--------|----------|
| **Makléřská síť** (PWA) | ✅ Funkční | 51 stránek, kompletní onboarding → nabírání aut → smlouvy → provize. Stats mají placeholder grafy. |
| **Inzertní platforma** | ✅ Funkční | Landing, registrace, vložení inzerátu (ListingFormWizard), katalog (→/nabidka). 13 API endpointů pro listings. |
| **Eshop autodíly** | ✅ Funkční | 12 web stránek (katalog, košík, objednávka, potvrzení, moje objednávky). 14 API endpointů pro parts. Cart na client-side (lib/cart). Orders + returns v admin. |
| **CarMarketplace** | ✅ Funkční | 8 fází MVP nasazeno. Kompletní flow: dealer → opportunity → investor → negotiation → funding → repair → sale → payout. |

### 2.2 Stubs / Placeholders nalezené v kódu

| Soubor | Typ | Popis |
|--------|-----|-------|
| `app/(partner)/partner/documents/page.tsx:66` | STUB | "Připravujeme" — dokumenty pro partnery nejsou funkční |
| `app/(pwa)/makler/stats/page.tsx:138,337,358` | PLACEHOLDER | Placeholder data pro měsíční grafy prodejů a provizí (chybí reálná data) |
| `app/(pwa)/makler/onboarding/training/page.tsx:46` | PLACEHOLDER | Video placeholder — chybí skutečný training video |

### 2.3 Chybějící / neúplné oblasti

1. **Cart API chybí** — Eshop košík je čistě client-side (localStorage via `lib/cart.ts`). Neexistuje `/api/cart/` endpoint. Pro multi-device sync a spolehlivost by měl být server-side cart.

2. **Stripe checkout flow** — Existuje `app/api/payments/create-checkout/route.ts` a `app/api/stripe/webhook/route.ts`, ale není jasné zda je end-to-end testován na produkci. Listing reserve + promote + extend používají Stripe.

3. **Partner dokumenty** — `app/(partner)/partner/documents/page.tsx` zobrazuje "Připravujeme". Partneři nemohou nahrávat/stahovat dokumenty.

4. **Makléř statistiky** — Grafy na `app/(pwa)/makler/stats/page.tsx` používají placeholder data, ne reálné DB queries.

5. **Zásilkovna integrace** — `app/api/shipping/calculate/route.ts` existuje, ale plná Zásilkovna widget + tracking integrace není ověřena.

6. **Pusher real-time** — V tech stacku, ale žádné `PUSHER_` env proměnné ani `pusher` importy v kódu nalezeny. Real-time messaging nefunguje. NotificationBell používá polling (30s auto-refresh).

7. **CEBIA prověrka** — `app/api/vehicles/[id]/cebia/route.ts` existuje, ale vyžaduje API klíč a není jasné zda funguje na produkci.

8. **PWA offline sync** — Service Worker a IndexedDB jsou nastaveny, ale rozsah offline podpory není auditován.

9. **Branding nesrovnalost** — Commit `9bcddcd` revertoval "CarMarketplace" → "Marketplace" v navigaci, v rozporu s rebrand plánem. Potřeba rozhodnutí PO.

---

## 3. TOP 5 PRIORIT — DOPORUČENÉ TASKY

### PRIORITA 1: Partner Documents — dokončit stub
**Dopad:** STŘEDNÍ | **Effort:** NÍZKÝ (1-2h)
**Soubor:** `app/(partner)/partner/documents/page.tsx`

Jediný aktivní STUB v produkci. Partneři (autobazary) vidí "Připravujeme" místo svých smluv/dokumentů. Minimální implementace:
- Upload dokumentů (smlouva, pojištění, IČO doklad) přes Cloudinary
- Seznam nahraných dokumentů s download linkem
- Admin review v admin panelu

### PRIORITA 2: Makléř statistiky — reálná data místo placeholderů
**Dopad:** STŘEDNÍ | **Effort:** NÍZKÝ-STŘEDNÍ (2-3h)
**Soubory:** `app/(pwa)/makler/stats/page.tsx`, potřeba API endpoint

Makléři vidí fake grafy. Implementovat:
- API endpoint pro měsíční statistiky (prodeje, provize) z DB
- Nahradit placeholder data reálnými Prisma queries
- Zobrazit skutečné trendy (posledních 6 měsíců)

### PRIORITA 3: Eshop — server-side cart + objednávkový flow audit
**Dopad:** VYSOKÝ | **Effort:** STŘEDNÍ (3-5h)
**Soubory:** Nový `app/api/cart/route.ts`, úprava `lib/cart.ts`

Client-side cart (localStorage) má problémy:
- Ztráta košíku při vymazání cache/jiné zařízení
- Race condition při reserved parts (quantity=1)
- Žádná validace stock availability na serveru před checkout

Implementovat:
- Server-side cart (DB nebo session-based)
- Stock validation před checkout
- Audit celého checkout → payment → order flow

### PRIORITA 4: Branding rozhodnutí — "Marketplace" vs "CarMarketplace"
**Dopad:** NÍZKÝ-STŘEDNÍ | **Effort:** NÍZKÝ (30min kód, hlavně rozhodnutí PO)

V MVP plánu byl rebrand na "CarMarketplace" (21 souborů, ~40 změn), ale commit `9bcddcd` to v navigaci revertoval zpět na "Marketplace". Potřeba:
- Rozhodnutí PO: jaký je finální brand name?
- Pokud CarMarketplace → aplikovat rebrand dle plánu sekce 2.1
- Pokud Marketplace → aktualizovat plán a odstranit rebrand

### PRIORITA 5: Makléř training video + onboarding dokončení
**Dopad:** STŘEDNÍ | **Effort:** NÍZKÝ (1h kód + video content)
**Soubor:** `app/(pwa)/makler/onboarding/training/page.tsx`

Onboarding flow pro nové makléře obsahuje placeholder pro training video. Potřeba:
- Nahrát skutečný training video (business task)
- Implementovat tracking dokončení (progress indicator)
- Případně quiz/test po videu

---

## 4. SOUHRNNÁ TABULKA TASK-NEW

| Task | Stav v kódu | Akce |
|------|------------|------|
| TASK-NEW-001 (Equipment Checkboxes) | ✅ HOTOVO | Uzavřít |
| TASK-NEW-002 (Donor Car Flow) | ✅ HOTOVO | Uzavřít |
| TASK-NEW-003 (Blog Rich Text Editor) | ✅ HOTOVO | Uzavřít |
| TASK-NEW-004 (Redirect /auth/prihlasit) | ✅ HOTOVO | Uzavřít |
| TASK-NEW-005 (Marketplace Detail Page) | ❌ ZASTARALÉ | Smazat — nahrazeno MVP |

---

## 5. POZNÁMKY

- **TASK-019 (Inzerce):** Označen jako "hotovo" v TASK-QUEUE.md. Potvrzeno — landing, registrace, ListingFormWizard, katalog (/nabidka), 13 API endpointů funkční.
- **TASK-020 (Eshop dílů):** Označen jako "hotovo". Potvrzeno — katalog, košík, objednávky, returns, 14 API endpointů. Cart je client-side (viz Priorita 3).
- **TASK-021 (Marketplace):** Označen jako "hotovo". Potvrzeno a rozšířeno — 8 fází CarMarketplace MVP nasazeno na produkci.
- **QA stav Marketplace MVP:** Fáze 5,6 QA done. Fáze 3+4 QA in_progress (#27). Fáze 0,1,2,7,8 QA pending — kontrolor by měl dokončit review.
