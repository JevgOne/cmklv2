# Lead systém + Progressivní přístup — Plán

**Datum:** 2026-04-25
**Autor:** Plánovač (analýza kódu)

---

## 1. Analýza aktuálního stavu

### 1.1 Kariérní systém (hvězdičky) — EXISTUJE ✅

Soubory: `lib/broker-points.ts`, `lib/gamification-levels.ts`, `lib/commission-calculator.ts`

**5 úrovní na základě kumulativního obratu (totalRevenue) × region:**

| Level | Jméno | Provize | Praha | Brno | Ostrava/Plzeň | Malý region |
|-------|-------|---------|-------|------|----------------|-------------|
| STAR_1 | ⭐ Makléř | 30% | 0 Kč | 0 Kč | 0 Kč | 0 K�� |
| STAR_2 | ⭐��� Makléř | 40% | 1.5M | 1.2M | 1M | 750k |
| STAR_3 | ⭐⭐⭐ Makléř | 50% | 2.5M | 2M | 1.5M | 1.2M |
| STAR_4 | ⭐⭐⭐��� Makléř | 55% | 4M | 3M | 2.5M | 2M |
| STAR_5 | ⭐⭐⭐⭐��� Maklé�� | 60% | 6M | 4.5M | 3.5M | 3M |

**Mechanismus:** `addBrokerRevenue()` přičítá obrat, automaticky přepočítává level.

**User model relevantní sloupce:**
- `level` (STAR_1..STAR_5)
- `totalSales` (počet prodejů)
- `totalRevenue` (kumulativní obrat)
- `status` (PENDING → ONBOARDING → ACTIVE → SUSPENDED → INACTIVE)
- `quickModeEnabled` (boolean — aktuálně per-user toggle, NENÍ vázáno na level)
- `onboardingCompleted`, `onboardingStep`, `quizScore`, `hasSeenTour`

### 1.2 Lead Management — EXISTUJE ✅ (základní)

**Prisma model `Lead`** (schema.prisma:594-645):
- Kontakt: name, phone, email
- Auto info: brand, model, year, mileage, expectedPrice, description
- Zdroj: source (WEB_FORM, EXTERNAL_APP, MANUAL, REFERRAL), externalId, sourceDetail
- Lokace: city, regionId → Region
- Přiřazení: assignedToId → User, assignedById → User, assignedAt
- Stav: status (NEW → ASSIGNED → CONTACTED → MEETING_SCHEDULED → VEHICLE_ADDED / REJECTED / EXPIRED)
- Propojení: vehicleId → Vehicle

**API routes:**
| Route | Metoda | Funkce |
|-------|--------|--------|
| `/api/leads` | GET | Seznam leadů (role-based filtering) |
| `/api/leads/[id]` | GET | Detail leadu |
| `/api/leads/[id]/status` | PUT | Změna statusu |
| `/api/leads/[id]/assign` | PUT | Přiřazení makléři (jen manager+) |
| `/api/leads/stats` | GET | Statistiky (jen manager+) |
| `/api/leads/external` | POST | Externí API (API key auth) |
| `/api/sell-request` | POST | Webový formulář → auto-creates lead + round-robin assignment |

**PWA stránky:**
| Stránka | Typ | Obsah |
|---------|-----|-------|
| `/makler/leads` | Client | Tab-based seznam leadů dle statusu |
| `/makler/leads/[id]` | Server | Detail s timeline, kontakt, akce |
| Dashboard widget | Client | NewLeadsSection (přijmout/odmítnout) |
| Dashboard widget | Client | FollowUpSection (kontakty k follow-upu) |

**Komponenty:**
- `LeadCard` — karta s jménem, badge, kontaktní tlačítka (tel, SMS, WhatsApp)
- `LeadActions` — stavové akce + reject modal + meeting modal
- `NewLeadsSection` — dashboard widget s novými leady
- `FollowUpSection` — dashboard widget s kontakty k follow-upu

**Lead management lib** (`lib/lead-management.ts`):
- `assignRegionByCity()` — auto-přiřazení regionu
- `roundRobinAssignBroker()` — round-robin přiřazení nejméně vytíženému makléři
- `expireStaleLeads()` — expirace po 14 dnech bez aktivity
- `checkDuplicateLead()` — dedup phone+brand+model za 30 dní

### 1.3 CRM Prodejců (SellerContact) — EXISTUJE ✅

Paralelní systém vedle Lead. SellerContact je osobní CRM makléře pro prodejce, jejichž auta spravuje. Obsahuje:
- Kontakt, poznámky, follow-up dates
- Komunikační log (SellerCommunication: hovory, SMS, emaily, schůzky)
- Propojení na Vehicle
- Notifikační preference prodejce

### 1.4 Existující gamifikace — EXISTUJE ✅

- **Achievements** (UserAchievement): FIRST_VEHICLE, FIRST_SALE, QUICK_SALE, FIVE_SALES, TEN_SALES, MILLIONAIRE, PHOTO_PRO, PERFECTIONIST, LOYAL_CLIENT
- **Trust Score** (TrustScore): 0-100, per-product (brokerScore, supplierScore...)
- **Skill Tags** (SkillTag): PROFESSIONAL, FAST, FAIR, COMMUNICATIVE...
- **Auto Badges** (AutoBadge): automaticky odemykané
- **Profile Badges** (ProfileBadge): manuální
- **Leaderboard** — měsíční žebříček provizí

### 1.5 Middleware ochrana — EXISTUJE ✅

`middleware.ts` chrání `/makler/*` routes:
- Vyžaduje přihlášení + role BROKER/MANAGER/REGIONAL_DIRECTOR/ADMIN
- ONBOARDING status → redirect na `/makler/onboarding`
- **CHYBÍ:** Žádný feature-level gating na základě hvězdičkového levelu

### 1.6 Co CHYBÍ ❌

1. **Progressivní přístup** — všechny funkce jsou dostupné všem aktivním makléřům
2. `quickModeEnabled` je per-user toggle, ne vázáno na kariérní level
3. **Manuální tvorba leadů** — makléř nemůže sám přidávat leady v PWA
4. **Activity log na leadu** — žádné poznámky/hovory na leadu
5. **Lead pipeline analytics** — per-broker KPI (response time, conversion)
6. **Lead scoring/prioritizace** — žádné automatické řazení
7. **Limity** — žádné limity na aktivní vozidla/leady dle levelu
8. **Feature gating knihovna** — žádný centrální mechanismus pro feature gating

---

## 2. Návrh tier systému (progressivní přístup)

### 2.1 Princip: Rozšíření existujícího hvězdičkového systému

**NEMĚNIT** stávající prahy ani provize. Pouze přidat feature gates navázané na `user.level`.

### 2.2 Feature Access Matrix

```
┌─────────────────────────────────────┬───────┬───────┬───────┬───────┬───────┐
│ Funkce                              │ ⭐ 1  │ ⭐ 2  ��� ⭐ 3  │ ⭐ 4  │ ⭐ 5  │
├─────────────────────────────────────┼───────┼───────┼───────┼───────┼───────┤
│ Dashboard (základní)                │  ✅   │  ✅   │  ✅   │  ✅   │  ✅   │
│ Přijímat/odmítat přiřazené leady    │  ✅   │  ✅   │  ✅   ���  ✅   │  ✅   │
│ Detail leadu + kontaktování         │  ✅   │  ✅   │  ✅   │  ✅   │  ✅   │
│ Nabírání aut (kompletní 7-krokový)  │  ✅   │  ✅   │  ✅   │  ✅   │  ✅   │
│ Základní CRM (kontakty)             │  ✅   │  ✅   ���  ✅   │  ✅   │  ��   │
│ Notifikace                          │  ✅   │  ���   │  ✅   │  ✅   │  ✅   │
│ Nastavení profilu                   │  ✅   │  ✅   │  ✅   ���  ✅   │  ✅   │
├─────────────────────────────────────┼───────┼───────┼───────┼───────┼───────┤
│ Max aktivních vozidel               │  5    │  15   │  30   │  ∞    │  ∞    │
│ Max aktivních leadů                 │  5    │  15   │  30   │  ��    │  ∞    │
├─────────────────────────────────────┼───────┼───────┼───────┼───────┼───────┤
│ Rychlé nabírání (3-krokový)         │  🔒   │  ✅   │  ✅   │  ✅   │  ��   │
│ Manuální tvorba leadů (self-source) ���  🔒   │  ✅   │  ✅   │  ✅   │  ��   │
│ Leaderboard                         │  🔒   │  ✅   │  ��   │  ✅   │  ✅   │
│ Kalkulačka financování              │  🔒   │  ✅   │  ✅   │  ✅   │  ✅   │
│ Lead pipeline analytics             │  🔒   │  ✅   │  ✅   │  ✅   │  ✅   │
├─────────────────────────────────────┼───────┼���──────┼───────┼───────┼───────┤
│ AI asistent                         ���  🔒   │  🔒   │  ✅   │  ✅   │  ✅   │
│ Pokročilé statistiky                │  🔒   │  🔒   │  ✅   │  ✅   │  ✅   │
│ Email šablony (prezentace auta)     │  🔒   │  🔒   │  ✅   │  ✅   │  ✅   │
│ Materiály (vizitka, podpis, PDF)    │  🔒   │  🔒   │  ✅   │  ✅   ���  ✅   │
│ Priority lead assignment (round-rob)│  🔒   │  🔒   │  ✅   │  ✅   │  ���   │
│ Správa smluv                        │  🔒   │  🔒   ��  ✅   │  ✅   │  ✅   │
├─────────────────────────────────────┼───────┼───────┼───────┼───────┼───────┤
│ Eskalace                            │  🔒   │  🔒   │  🔒   │  ✅   │  ✅   │
│ Návrhy snížení ceny                 │  🔒   │  🔒   │  🔒   │  ✅   │  ✅   │
│ Exkluzivní smlouvy                  │  ����   │  🔒   │  ����   │  ✅   │  ✅   │
│ Web sell-request (přímý přístup)    │  🔒   │  🔒   │  🔒   │  ���   │  ✅   │
├─────────────────────────────────────┼───────┼───────┼───────┼───────┼───────┤
│ Team mentoring (junior stats)       │  🔒   │  🔒   │  🔒   │  🔒   │  ✅   │
│ Profil na homepage (featured)       │  🔒   │  🔒   │  🔒   ���  🔒   │  ✅   │
│ Priority routing ALL leads          │  🔒   │  🔒   │  🔒   │  🔒   │  ✅   │
└─────────────────────────────────────┴───────┴───────┴───────┴───────┴───────┘
```

### 2.3 UX zamčených funkcí

Zamčená funkce = **viditelná, ale nepřístupná** s motivací k postupu:
- Zobrazí se jako karta/link s 🔒 ikonou a overlay
- Klik → bottom sheet: "Tato funkce je dostupná od ⭐⭐ Makléř. Chybí ti {X} Kč obratu."
- Progress bar k odemčení
- Tlačítko "Jak získat více obratu?" → tipy

### 2.4 Pojmenování tier hladin

| Level | Interní key | Zobrazovaný název | Barva |
|-------|-------------|-------------------|-------|
| STAR_1 | STAR_1 | Nováček | gray |
| STAR_2 | STAR_2 | Pokročilý | blue |
| STAR_3 | STAR_3 | Expert | orange |
| STAR_4 | STAR_4 | Senior | purple |
| STAR_5 | STAR_5 | Šampion | gold |

---

## 3. Lead Management UI — návrh rozšíření

### 3.1 Stávající stránky (zachovat + vylepšit)

**`/makler/leads` — Seznam leadů**
- ✅ Existuje: tab-based list dle statusu
- ➕ Přidat: počítadlo leadů v tabu, search/filter bar, sort options
- ➕ Přidat: floating FAB "+" pro manuální přidání leadu (STAR_2+)
- ➕ Přidat: jednoduchý stav pipeline (čísla: 3 nové → 2 kontaktováno → 1 schůzka)

**`/makler/leads/[id]` — Detail leadu**
- ✅ Existuje: timeline, kontaktní info, vehicle info, akce
- ➕ Přidat: Activity log sekce (poznámky, záznamy hovorů)
- ➕ Přidat: Quick notes — textarea na přidání poznámky
- ➕ Přidat: Timer od vytvoření ("Lead čeká 2h" → urgency indikátor)

### 3.2 Nové stránky

**`/makler/leads/new` — Manuální vytvoření leadu (STAR_2+)**
- Formulář: jméno, telefon, email, značka, model, rok, najeto, očekávaná cena, město, zdroj (MANUAL/REFERRAL), poznámka
- Auto-přiřadí se na aktuálního makléře
- Status: ASSIGNED (přeskočí NEW)

**`/makler/leads/analytics` — Lead analytics (STAR_2+)**
- Pipeline funnel: NEW → ASSIGNED → CONTACTED → MEETING → VEHICLE_ADDED
- Konverzní poměr leadů (celkový + měsíční)
- Průměrná doba reakce (lead created → CONTACTED)
- Průměrná doba konverze (lead created → VEHICLE_ADDED)
- Response rate (% leadů kde status progressed beyond NEW)
- Porovnání s průměrem (jako ve stats stránce)

### 3.3 Dashboard vylepšení

**Nová sekce: "Vaše lead pipeline" (STAR_2+)**
- Jednořádkový pipeline: 🟠 3 nové → 🔵 2 kontaktováno → 🟢 1 schůzka
- Klik → `/makler/leads`

**Urgency indicators:**
- Lead starší 4h bez akce → žlutý badge "Čeká!"
- Lead starší 24h bez akce → červený badge "Urgentní!"

### 3.4 Nové komponenty

| Komponenta | Umístění | Účel |
|-----------|----------|------|
| `FeatureGate` | `components/pwa/FeatureGate.tsx` | Wrapper — zkontroluje level, zobrazí obsah nebo locked overlay |
| `LockedFeatureCard` | `components/pwa/LockedFeatureCard.tsx` | Zamčená funkce s motivací + progress |
| `LeadPipelineMini` | `components/pwa/dashboard/LeadPipelineMini.tsx` | Mini pipeline widget pro dashboard |
| `LeadActivityLog` | `components/pwa/leads/LeadActivityLog.tsx` | Log aktivit na leadu |
| `LeadNoteForm` | `components/pwa/leads/LeadNoteForm.tsx` | Přidání poznámky k leadu |
| `CreateLeadForm` | `components/pwa/leads/CreateLeadForm.tsx` | Formulář pro manuální tvorbu leadu |
| `LeadAnalyticsDashboard` | `components/pwa/leads/LeadAnalyticsDashboard.tsx` | Analytics widgety |
| `UrgencyBadge` | `components/pwa/leads/UrgencyBadge.tsx` | Indikátor čekací doby |

---

## 4. Databázové změny

### 4.1 Nový model: LeadNote (activity log na leadu)

```prisma
model LeadNote {
  id     String @id @default(cuid())
  leadId String
  lead   Lead   @relation(fields: [leadId], references: [id], onDelete: Cascade)
  userId String // Autor poznámky (broker)

  type    String  // NOTE, CALL, SMS, EMAIL, MEETING, STATUS_CHANGE
  content String  // Text poznámky
  
  // Pro typ CALL
  callDuration Int?     // sekundy
  callResult   String?  // ANSWERED, NO_ANSWER, BUSY, VOICEMAIL

  createdAt DateTime @default(now())

  @@index([leadId])
  @@index([userId])
  @@index([createdAt])
}
```

### 4.2 Rozšíření modelu Lead

```prisma
// Přidat do existujícího modelu Lead:
  
  // Activity tracking
  firstContactedAt  DateTime?  // Kdy makléř poprvé kontaktoval
  lastActivityAt    DateTime?  // Poslední aktivita na leadu
  noteCount         Int @default(0) // Cached počet poznámek
  
  // Scoring
  priority    String @default("NORMAL") // LOW, NORMAL, HIGH, URGENT
  temperature String @default("WARM")   // COLD, WARM, HOT
  
  // Self-sourced
  selfSourced Boolean @default(false) // True pokud makléř sám přidal

  // Relace
  notes LeadNote[]
```

### 4.3 Změny na User modelu

```prisma
// ODSTRANIT quickModeEnabled (nahradit feature gate na level)
// quickModeEnabled Boolean @default(false) — DEPRECATED, nahrazeno level-based gating

// Žádné nové sloupce — level + totalRevenue + region.tier stačí pro feature gating
```

**Poznámka k quickModeEnabled:** Stávající hodnoty v DB zachovat, ale logiku změnit — `quickModeEnabled` bude automaticky `true` pro STAR_2+ a `false` pro STAR_1. Tím se zachová zpětná kompatibilita bez migrace dat.

### 4.4 Nové indexy

```prisma
// Lead model — přidat:
@@index([assignedToId, status])  // Pro filtrování leadů makléře dle statusu
@@index([createdAt])              // Pro timeline/urgency queries
@@index([priority])               // Pro priority sorting
@@index([selfSourced])            // Pro filtrování self-sourced leadů
```

---

## 5. Implementační kroky (seřazené podle priority)

### Fáze 1: Feature Gate systém (ZÁKLAD) — Priority: CRITICAL

**Krok 1.1: Vytvořit `lib/feature-gates.ts`**
- Definice feature → min level mapování
- Funkce `canAccess(userLevel, feature): boolean`
- Funkce `getUnlockLevel(feature): StarLevelKey`
- Funkce `getLockedFeatures(userLevel): Feature[]`
- Funkce `getVehicleLimit(userLevel): number | null`
- Funkce `getLeadLimit(userLevel): number | null`

**Krok 1.2: Vytvořit `FeatureGate` komponentu**
- Server component wrapper: `<FeatureGate feature="QUICK_MODE" level={userLevel}>...</FeatureGate>`
- Pokud zamčeno → zobrazí `LockedFeatureCard` s motivací
- Pokud odemčeno → zobrazí children

**Krok 1.3: Vytvořit `LockedFeatureCard` komponentu**
- Karta s 🔒, název funkce, level potřebný k odemčení
- Progress bar k dalšímu levelu
- "Chybí X Kč do odemčení"

**Krok 1.4: API middleware helper**
- `checkFeatureAccess(session, feature)` → 403 pokud nedostatečný level
- Použít v existujících API routes

### Fáze 2: Aplikace feature gates na existující stránky — Priority: HIGH

**Krok 2.1: Dashboard — integrovat feature gates**
- AddVehicleCTA: rychlé nabírání viditelné ale zamčené pro STAR_1
- NewLeadsSection: zachovat (základní funkce pro všechny)
- FollowUpSection: zachovat
- Přidat motivační sekci "Odemkněte další funkce" pro STAR_1

**Krok 2.2: Navigace PWA — zobrazit zamčené položky**
- Sidebar/bottom nav: zamčené stránky zobrazit s 🔒 ikonou
- Klik → LockedFeatureCard modal

**Krok 2.3: Middleware — přidat level check**
- `/makler/leaderboard` → STAR_2+
- `/makler/financing-calculator` → STAR_2+
- `/makler/materials` → STAR_3+
- `/makler/contracts` → STAR_3+
- Přesměrování na `/makler/dashboard?locked=FEATURE_NAME`

**Krok 2.4: API routes — přidat level check**
- `POST /api/vehicles/quick` → STAR_2+
- `GET /api/broker/leaderboard` → STAR_2+
- `POST /api/escalations` → STAR_4+

### Fáze 3: Lead management rozšíření — Priority: HIGH

**Krok 3.1: Prisma migrace**
- Přidat LeadNote model
- Přidat nové sloupce na Lead (firstContactedAt, lastActivityAt, priority, temperature, selfSourced, noteCount)
- Přidat nové indexy

**Krok 3.2: API routes pro LeadNote**
- `GET /api/leads/[id]/notes` — seznam poznámek
- `POST /api/leads/[id]/notes` — přidat poznámku (typ NOTE/CALL/SMS/EMAIL/MEETING)
- Auto-update `lastActivityAt` a `noteCount` na leadu

**Krok 3.3: API route pro manuální tvorbu leadu**
- `POST /api/leads` — nový endpoint (aktuálně jen GET)
- Validace: `manualLeadSchema` (již existuje v `lib/validators/lead.ts`)
- Feature gate: STAR_2+
- Auto-přiřadit na aktuálního brokera, status=ASSIGNED, selfSourced=true

**Krok 3.4: Lead detail — přidat activity log**
- `LeadActivityLog` komponenta na stránce `/makler/leads/[id]`
- `LeadNoteForm` — textarea + typ (poznámka/hovor/meeting)
- Urgency badge (čas od vytvoření / poslední aktivity)

**Krok 3.5: Lead list — vylepšit**
- Přidat search bar (jméno, telefon, značka)
- Přidat urgency badge na LeadCard
- Přidat FAB "+" tlačítko (STAR_2+)
- Přidat mini pipeline summary nahoře

**Krok 3.6: Nová stránka — `/makler/leads/new`**
- CreateLeadForm komponenta
- Feature gate: STAR_2+

### Fáze 4: Analytics a dashboard — Priority: MEDIUM

**Krok 4.1: Lead analytics stránka**
- `/makler/leads/analytics` (STAR_2+)
- Pipeline funnel vizualizace
- KPI karty: response time, conversion rate, avg time to convert
- Měsíční trend

**Krok 4.2: Dashboard lead pipeline widget**
- `LeadPipelineMini` — mini horizontal pipeline s čísly
- Urgency alerts na dashboardu

**Krok 4.3: API route pro broker-level lead stats**
- `GET /api/leads/my-stats` — per-broker statistiky
- Response time, conversion rate, pipeline counts

### Fáze 5: Priority lead assignment — Priority: LOW

**Krok 5.1: Upravit round-robin logiku**
- `roundRobinAssignBroker()` v `lib/lead-management.ts`
- STAR_3+ makléři mají 2× váhu (dostanou 2 leady na 1 lead STAR_1/2)
- STAR_5 makléři mají 3× váhu

**Krok 5.2: Lead limit enforcement**
- V API kontrolovat počet aktivních leadů makléře
- STAR_1: max 5, STAR_2: max 15, STAR_3: max 30, STAR_4+: neomezeno
- Nad limitem → nové leady přesměrovat na jiného makléře

**Krok 5.3: Vehicle limit enforcement**
- V `POST /api/vehicles` a `POST /api/vehicles/quick` kontrolovat limit
- STAR_1: max 5, STAR_2: max 15, STAR_3: max 30, STAR_4+: neomezeno

---

## 6. Estimace složitosti

### Quick wins (1-2 hodiny každý)
| # | Úkol | Složitost |
|---|------|-----------|
| 1 | `lib/feature-gates.ts` — definice + funkce | S |
| 2 | `FeatureGate` komponenta | S |
| 3 | `LockedFeatureCard` komponenta | S |
| 4 | API helper `checkFeatureAccess()` | S |
| 5 | Dashboard motivační sekce pro STAR_1 | S |

### Střední složitost (2-4 hodiny)
| # | Úkol | Složitost |
|---|------|-----------|
| 6 | Prisma migrace (LeadNote + Lead rozšíření) | M |
| 7 | API routes pro LeadNote (CRUD) | M |
| 8 | LeadActivityLog + LeadNoteForm komponenty | M |
| 9 | Manuální tvorba leadu (API + UI) | M |
| 10 | Lead list vylepšení (search, urgency, FAB) | M |
| 11 | Feature gates na existující stránky (middleware + UI) | M |
| 12 | Dashboard pipeline widget | M |

### Komplexní (4-8 hodin)
| # | Úkol | Složitost |
|---|------|-----------|
| 13 | Lead analytics stránka + API | L |
| 14 | Navigace PWA redesign (zamčené položky) | L |
| 15 | Priority lead assignment (round-robin změny) | L |
| 16 | Vehicle/Lead limit enforcement across APIs | L |

### Celkový odhad: ~30-40 hodin implementace

**Doporučené pořadí implementace:**
1. Fáze 1 (feature gates) — MUSÍ být první, vše ostatní na tom závisí
2. Fáze 2 (aplikace gates) — ihned po Fázi 1
3. Fáze 3 (lead rozšíření) — paralelně s Fází 2
4. Fáze 4 (analytics) — po Fázi 3
5. Fáze 5 (priority assignment) — poslední, nejmenší dopad

---

## 7. Technické poznámky

### 7.1 Feature gate architektura

```typescript
// lib/feature-gates.ts

export type Feature =
  | "QUICK_VEHICLE_MODE"      // Rychlé nabírání
  | "MANUAL_LEAD_CREATE"      // Manuální tvorba leadů
  | "LEADERBOARD"             // Žebříček
  | "FINANCING_CALCULATOR"    // Kalkulačka
  | "LEAD_ANALYTICS"          // Lead analytics
  | "AI_ASSISTANT"            // AI asistent
  | "ADVANCED_STATS"          // Pokročilé statistiky
  | "EMAIL_TEMPLATES"         // Email šablony
  | "MATERIALS"               // Vizitka, podpis, prezentace
  | "PRIORITY_LEADS"          // Priority assignment
  | "CONTRACTS"               // Správa smluv
  | "ESCALATIONS"             // Eskalace
  | "PRICE_REDUCTIONS"        // Návrhy snížení ceny
  | "EXCLUSIVE_CONTRACTS"     // Exkluzivní smlouvy
  | "TEAM_MENTORING"          // Team mentoring
  | "FEATURED_PROFILE"        // Profil na homepage
  | "PRIORITY_ALL_LEADS";     // Priority routing

export const FEATURE_MIN_LEVEL: Record<Feature, StarLevelKey> = {
  QUICK_VEHICLE_MODE: "STAR_2",
  MANUAL_LEAD_CREATE: "STAR_2",
  LEADERBOARD: "STAR_2",
  FINANCING_CALCULATOR: "STAR_2",
  LEAD_ANALYTICS: "STAR_2",
  AI_ASSISTANT: "STAR_3",
  ADVANCED_STATS: "STAR_3",
  EMAIL_TEMPLATES: "STAR_3",
  MATERIALS: "STAR_3",
  PRIORITY_LEADS: "STAR_3",
  CONTRACTS: "STAR_3",
  ESCALATIONS: "STAR_4",
  PRICE_REDUCTIONS: "STAR_4",
  EXCLUSIVE_CONTRACTS: "STAR_4",
  TEAM_MENTORING: "STAR_5",
  FEATURED_PROFILE: "STAR_5",
  PRIORITY_ALL_LEADS: "STAR_5",
};
```

### 7.2 quickModeEnabled migrace

Stávající `quickModeEnabled` na User modelu zůstane v DB, ale logika se změní:
- `quickModeEnabled` bude computed: `user.level >= "STAR_2"`
- V AddVehicleCTA a dalších komponentách se místo `quickModeEnabled` bude kontrolovat level
- Tím se plynule přejde bez breaking changes

### 7.3 Offline/PWA kompatibilita

- Feature gate data se cachují v Service Worker
- Při offline se používají cached gate data
- Při sync se aktualizují

### 7.4 Admin override

- ADMIN a BACKOFFICE mají vždy přístup ke všemu (bypass feature gates)
- MANAGER a REGIONAL_DIRECTOR mají přístup ke svým nástrojům (neovlivněno)
- Feature gates se aplikují POUZE na role BROKER

---

## 8. Rizika a mitigace

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| Stávající makléři ztratí funkce | Vysoký | Grandfather clause — aktivní STAR_1 makléři s historickými daty dostanou 30-denní grace period |
| Příliš přísné limity odradí | Střední | Limity nastavit spíše mírně, postupně zpřísňovat dle dat |
| quickModeEnabled → level migrace | Nízký | quickModeEnabled zůstane v DB, jen se přestane číst přímo |
| Performance feature gate checks | Nízký | Level je na User modelu, žádný extra DB call — jen porovnání stringu |

---

## 9. Acceptance Criteria

### Fáze 1 (Feature gates)
- [ ] `lib/feature-gates.ts` existuje s kompletní definicí features
- [ ] `FeatureGate` komponenta funguje pro server i client components
- [ ] Zamčená funkce zobrazuje `LockedFeatureCard` s progress barem
- [ ] API routes vrací 403 pro nedostatečný level

### Fáze 2 (Aplikace gates)
- [ ] STAR_1 makléř vidí zamčené funkce v dashboardu
- [ ] STAR_1 makléř NEMŮŽE přistoupit k zamčeným stránkám
- [ ] Middleware chrání routes dle level matrixu
- [ ] Rychlé nabírání je automaticky dostupné pro STAR_2+

### Fáze 3 (Lead rozšíření)
- [ ] LeadNote model v DB, migrace proběhla
- [ ] Makléř může přidávat poznámky k leadu
- [ ] STAR_2+ makléř může vytvářet leady manuálně
- [ ] Lead list má search a urgency indikátory
- [ ] `/makler/leads/new` stránka funguje

### Fáze 4 (Analytics)
- [ ] `/makler/leads/analytics` zobrazuje pipeline funnel + KPI
- [ ] Dashboard pipeline mini widget funguje

### Fáze 5 (Priority assignment)
- [ ] Round-robin respektuje level-based váhy
- [ ] Vehicle/Lead limity se vynucují v API

---

*Plán připraven k review. Doporučuji začít Fází 1 — feature gate systém je prerekvizitou pro vše ostatní.*
