# PLÁN: Mobilní aplikace Carmakler — React Native + Expo

**Datum:** 2026-05-24
**Autor:** Plánovač
**Status:** DRAFT — čeká na schválení leada

---

## 1. ANALÝZA SOUČASNÉHO STAVU

### 1.1 Backend API (Next.js API Routes)

Carmakler má **74+ API routes** v `app/api/`, které fungují jako plnohodnotné REST API. Klíčové skupiny:

| Oblast | Routes | Popis |
|--------|--------|-------|
| **Auth** | `/api/auth/*` | NextAuth.js (JWT strategy), registrace, reset hesla, verifikace emailu, onboarding |
| **Vehicles** | `/api/vehicles/*` | CRUD, workflow, images, timeline, damage, price-reduction, handover, comments |
| **Broker** | `/api/broker/*` | Dashboard stats, provize, profil, achievements, leaderboard |
| **Leads** | `/api/leads/*` | Lead management, assignment, status updates |
| **Contracts** | `/api/contracts/*` | Smlouvy, podpisy |
| **Contacts** | `/api/contacts/*` | CRM, sync, komunikace |
| **Workflow** | `/api/vehicles/[id]/workflow` + `/api/escalations/*` | Požadavky, eskalace |
| **Inzerce** | `/api/listings/*`, `/api/inzerce/*` | Inzeráty, inquiry, promote, extend |
| **Parts** | `/api/parts/*`, `/api/donor-vehicles/*` | Díly, objednávky, supplier stats |
| **Marketplace** | `/api/marketplace/*` | Investice, příležitosti, schválení |
| **Payments** | `/api/payments/*`, `/api/stripe/*` | Stripe checkout, webhook, Connect |
| **Notifications** | `/api/broker/notifications`, `/api/admin/notifications` | In-app notifikace |
| **SSE** | `/api/sse/stream` | Real-time eventy (workflow, notifikace) |
| **Partner** | `/api/partner/*`, `/api/partners/*` | Partnerský portál (autobazary, vrakoviště) |
| **Admin** | `/api/admin/*` | BackOffice operace |

**Klíčový závěr:** Backend API je **READY pro mobilní konzumaci** — Next.js API routes jsou standardní HTTP endpointy, mobilní app na ně může přímo volat. Není třeba budovat novou API vrstvu.

### 1.2 Autentizace (NextAuth.js)

**Soubor:** `lib/auth.ts`

- **Strategy:** JWT (ne database sessions)
- **Provider:** CredentialsProvider (email + password)
- **Token payload:** `id, email, name, role, status, firstName, lastName, avatar, accountType, level, onboardingStep, onboardingCompleted, isEmailVerified`
- **Session refresh:** `trigger === "update"` → re-fetch z DB

**Pro mobilní app:**
- JWT tokens lze přímo použít — NextAuth vystaví JWT cookie
- Pro React Native je potřeba **custom token endpoint** (mobilní app nemá browser cookies)
- Řešení: Nový `/api/auth/mobile/login` endpoint → vrací raw JWT + refresh token
- Alternativa: Expo AuthSession + PKCE flow (ale CredentialsProvider to neumí)

### 1.3 Role-based systém

**Soubor:** `middleware.ts`

| Role | Přístup | Mobilní relevance |
|------|---------|-------------------|
| `BROKER` | PWA makléře | **HLAVNÍ** cíl mobilní app |
| `MANAGER` | Admin + PWA | Schvalování, workflow, team management |
| `REGIONAL_DIRECTOR` | Admin + PWA | Regionální správa |
| `ADMIN` | Admin panel | Plný přístup |
| `BACKOFFICE` | Admin panel | BackOffice operace |
| `ADVERTISER` | Inzertní platforma | Správa inzerátů |
| `BUYER` | Kupující | Prohlížení, oblíbené |
| `PARTS_SUPPLIER` | PWA díly | Správa dílů, objednávek |
| `WHOLESALE_SUPPLIER` | PWA díly | Velkoobchod |
| `PARTNER_BAZAR` | Partnerský portál | Autobazar partner |
| `PARTNER_VRAKOVISTE` | Partnerský portál | Vrakoviště partner |
| `INVESTOR` | Marketplace | Investiční příležitosti |
| `VERIFIED_DEALER` | Marketplace | Flip příležitosti |

### 1.4 Real-time systém

**Aktuální stav:** SSE (Server-Sent Events) přes `lib/sse/manager.ts`
- Singleton `SSEManager` udržuje aktivní spojení per userId + per role
- Events: `workflow:created`, `workflow:updated`, `workflow:comment`, `workflow:assigned`
- Heartbeat: 30s
- Endpoint: `GET /api/sse/stream`

**Pro mobilní app:**
- SSE funguje v React Native (via `EventSource` polyfill)
- Alternativa: Přejít na WebSocket pro lepší mobilní podporu (reconnect, battery)
- Push notifikace pro background (viz §4)

### 1.5 Offline systém (IndexedDB)

**Soubory:** `lib/offline/db.ts`, `lib/offline/upload-photos.ts`, `app/sw.ts`

IndexedDB stores:
- `drafts` — rozpracované nabírání vozidel
- `vehicles` — cache vozidel
- `pendingActions` — fronta akcí pro sync
- `images` — blob storage fotek
- `contacts` — offline CRM
- `vinCache` — VIN decode cache
- `equipmentCatalog` — výbava cache
- `contracts` — offline smlouvy

Service Worker (Serwist): precache + background sync (vehicles, images, contracts, contacts)

**Pro mobilní app:**
- React Native nemá IndexedDB → nahradit `AsyncStorage` + `expo-sqlite`
- Background sync → `expo-background-fetch` + `expo-task-manager`
- Image cache → `expo-file-system`

### 1.6 Notifikační systém

**Soubory:** `lib/notifications.ts`, `lib/workflow/notifications.ts`

- **In-app:** Prisma model `Notification` (type: COMMISSION, VEHICLE, SYSTEM, MESSAGE)
- **Email:** Resend SDK
- **SMS:** GoSMS.cz / Twilio
- **Preferences:** Model `NotificationPreference` (push/email/sms per eventType)
- **Real-time:** SSE push (workflow events)

**Chybí:** Push notifikace (FCM/APNs) — dosud jen PWA Web Push (není implementováno)

### 1.7 Platební systém

- **Stripe Checkout** — platby za díly, inzeráty, CEBIA reports
- **Stripe Connect** — onboarding dodavatelů/partnerů
- **Webhooks** — `/api/stripe/webhook`, `/api/payments/webhook`

---

## 2. ARCHITEKTURA MOBILNÍ APLIKACE

### 2.1 Stack

| Vrstva | Technologie | Důvod |
|--------|-------------|-------|
| **Framework** | React Native + Expo SDK 53 | Managed workflow, OTA updates, EAS Build |
| **Navigation** | Expo Router (file-based) | Konzistentní s Next.js App Router |
| **State** | Zustand + React Query (TanStack) | Lightweight state + server cache |
| **Styling** | NativeWind (Tailwind for RN) | Sdílené design tokens s webem |
| **Forms** | React Hook Form + Zod | Sdílené validátory s backendem |
| **Storage** | expo-secure-store (auth), expo-sqlite (offline) | Nahrazení IndexedDB |
| **Push** | expo-notifications + FCM/APNs | Native push notifications |
| **Camera** | expo-camera + expo-image-picker | Fotky vozidel |
| **Maps** | react-native-maps | Lokace vozidel |
| **Real-time** | EventSource polyfill (SSE) | Kompatibilní se stávajícím SSE |
| **Auth** | Custom JWT (expo-secure-store) | Kompatibilní s NextAuth JWT |
| **Payments** | @stripe/stripe-react-native | Native Stripe sheet |
| **Analytics** | expo-analytics / Plausible | Privacy-first |

### 2.2 Monorepo struktura

```
carmakler/
├── apps/
│   ├── web/              ← existující Next.js (beze změny)
│   └── mobile/           ← nová Expo aplikace
│       ├── app/          ← Expo Router (file-based routing)
│       │   ├── (auth)/   ← Login, registrace
│       │   ├── (broker)/ ← Makléřská sekce
│       │   ├── (admin)/  ← Manažer/admin
│       │   ├── (parts)/  ← Dodavatel dílů
│       │   ├── (buyer)/  ← Kupující
│       │   └── (partner)/← Partner (autobazar)
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── assets/
├── packages/
│   └── shared/           ← sdílený kód web + mobile
│       ├── validators/   ← Zod schémata (z lib/validators/)
│       ├── types/        ← TypeScript types
│       ├── constants/    ← Role, workflow typy, status mapy
│       └── utils/        ← Formátování cen, dat, VIN
└── package.json          ← workspace root
```

### 2.3 API komunikace

```
┌──────────────┐     HTTPS/JWT      ┌───────────────────┐
│  Expo Mobile │ ──────────────────→ │ Next.js API Routes│
│  App         │ ←────────────────── │ (beze změny)      │
│              │     SSE stream      │                   │
│              │ ←────────────────── │ /api/sse/stream   │
│              │                     │                   │
│  FCM/APNs   │ ←──── push ──────── │ + nový push svc   │
└──────────────┘                     └───────────────────┘
```

**Nové API endpointy (minimální):**

| Endpoint | Metoda | Účel |
|----------|--------|------|
| `/api/auth/mobile/login` | POST | Login → vrací `{ accessToken, refreshToken, expiresAt }` |
| `/api/auth/mobile/refresh` | POST | Refresh token → nový access token |
| `/api/auth/mobile/logout` | POST | Invalidace refresh tokenu |
| `/api/push/register` | POST | Registrace FCM/APNs device tokenu |
| `/api/push/unregister` | POST | Odregistrace device tokenu |

Všechny ostatní API routes zůstávají **beze změny** — mobilní app posílá JWT v `Authorization: Bearer <token>` headeru místo cookie.

### 2.4 Autentizační flow pro mobilní app

```
1. User zadá email + heslo
2. POST /api/auth/mobile/login
   → Backend: bcrypt.compare(), generuje JWT (stejný payload jako NextAuth)
   → Response: { accessToken (15min), refreshToken (30d), user: {...} }
3. Expo app ukládá do expo-secure-store
4. Každý request: Authorization: Bearer <accessToken>
5. Po expiraci: POST /api/auth/mobile/refresh
6. Logout: POST /api/auth/mobile/logout + smazání z secure-store
```

**Úprava v existujícím kódu:**
- Stávající API routes používají `getServerSession(authOptions)` nebo `getToken()`
- Potřeba přidat alternativní auth check pro `Authorization: Bearer` header
- Řešení: Wrapper funkce `getAuthUser(request)` → zkusí cookie (web) → fallback na Bearer (mobile)

```typescript
// lib/auth-mobile.ts (NOVÝ)
export async function getAuthUser(request: Request) {
  // 1. Zkusit NextAuth session (web)
  const session = await getServerSession(authOptions);
  if (session?.user) return session.user;

  // 2. Fallback: Bearer token (mobile)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyJwt(token);
    if (payload) return payload;
  }

  return null;
}
```

---

## 3. ROLE-BASED UI ARCHITEKTURA

### 3.1 Broker (Makléř) — HLAVNÍ CÍLE

Přenesení celé PWA (`app/(pwa)/makler/`) do nativní mobilní app:

| Web route | Mobile screen | Priorita |
|-----------|---------------|----------|
| `/makler/dashboard` | `(broker)/dashboard` | P0 |
| `/makler/vehicles` | `(broker)/vehicles` | P0 |
| `/makler/vehicles/new/*` | `(broker)/vehicles/new/*` | P0 |
| `/makler/vehicles/quick/*` | `(broker)/vehicles/quick/*` | P0 |
| `/makler/vehicles/[id]` | `(broker)/vehicles/[id]` | P0 |
| `/makler/vehicles/[id]/handover` | `(broker)/vehicles/[id]/handover` | P0 |
| `/makler/leads` | `(broker)/leads` | P0 |
| `/makler/contacts` | `(broker)/contacts` | P0 |
| `/makler/contracts` | `(broker)/contracts` | P1 |
| `/makler/contracts/[id]/sign` | `(broker)/contracts/[id]/sign` | P1 |
| `/makler/commissions` | `(broker)/commissions` | P1 |
| `/makler/provize` | `(broker)/provize` | P1 |
| `/makler/messages` | `(broker)/messages` | P1 |
| `/makler/stats` | `(broker)/stats` | P1 |
| `/makler/leaderboard` | `(broker)/leaderboard` | P2 |
| `/makler/assistant` | `(broker)/assistant` | P2 |
| `/makler/profile` | `(broker)/profile` | P2 |
| `/makler/settings` | `(broker)/settings` | P1 |
| `/makler/onboarding/*` | `(broker)/onboarding/*` | P0 |
| `/makler/pozadavky` | `(broker)/workflow` | P1 |

**Nativní vylepšení oproti PWA:**
- **Camera:** Nativní expo-camera pro focení aut (lepší kvalita, burst mode)
- **GPS:** Nativní geolokace pro lokaci vozidla
- **Offline:** expo-sqlite + expo-file-system místo IndexedDB
- **Push:** Nativní FCM/APNs místo Web Push
- **Biometrie:** Face ID / fingerprint login
- **Sdílení:** Native share sheet pro sdílení vozidel

### 3.2 Manager/Admin

| Screen | Popis |
|--------|-------|
| `(admin)/dashboard` | KPI přehled |
| `(admin)/approvals` | Schvalování vozidel |
| `(admin)/team` | Správa makléřů |
| `(admin)/workflow` | Workflow požadavky + eskalace |
| `(admin)/notifications` | Push centrum |

### 3.3 Parts Supplier (Dodavatel dílů)

| Screen | Popis |
|--------|-------|
| `(parts)/dashboard` | Přehled + objednávky |
| `(parts)/my` | Moje díly |
| `(parts)/new` | Přidat díl (fotka + popis) |
| `(parts)/orders` | Objednávky |
| `(parts)/donors` | Donor cars |

### 3.4 Buyer (Kupující)

| Screen | Popis |
|--------|-------|
| `(buyer)/search` | Hledání aut + dílů |
| `(buyer)/favorites` | Oblíbené |
| `(buyer)/inquiries` | Moje poptávky |
| `(buyer)/orders` | Objednávky dílů |
| `(buyer)/garage` | Garáž (moje auta) |

### 3.5 Partner (Autobazar/Vrakoviště)

| Screen | Popis |
|--------|-------|
| `(partner)/dashboard` | Přehled + statistiky |
| `(partner)/leads` | Příchozí leady |
| `(partner)/billing` | Fakturace |

---

## 4. PUSH NOTIFIKACE

### 4.1 Architektura

```
┌─────────────────┐    ┌───────────────┐    ┌─────────────┐
│ Next.js Backend │───→│ Push Service  │───→│ FCM / APNs  │───→ Mobil
│ (event trigger) │    │ (nový modul)  │    │             │
└─────────────────┘    └───────────────┘    └─────────────┘
```

### 4.2 Nový DB model

```prisma
model PushSubscription {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  deviceToken String   // FCM/APNs token
  platform    String   // "ios" | "android" | "web"
  deviceId    String?  // Unique device identifier
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, deviceToken])
  @@index([userId])
  @@index([platform])
}
```

### 4.3 Push events (mapování na existující NotificationPreference.eventType)

| eventType | Push titulek | Trigger |
|-----------|-------------|---------|
| `NEW_LEAD` | "Nový lead: {brand} {model}" | Lead assignment |
| `NEW_INQUIRY` | "Nová poptávka na {vehicleName}" | VehicleInquiry created |
| `VEHICLE_APPROVED` | "Vozidlo schváleno: {name}" | Vehicle status → ACTIVE |
| `VEHICLE_REJECTED` | "Vozidlo zamítnuto: {name}" | Vehicle status → REJECTED |
| `VEHICLE_SOLD` | "Prodáno: {name} 🎉" | Vehicle status → SOLD |
| `DAILY_SUMMARY` | "Denní shrnutí" | Cron job |
| `VEHICLE_30_DAYS` | "{name} je v nabídce 30+ dní" | Cron job |
| `ACHIEVEMENT` | "Nový odznak: {badge}" | Achievement unlock |
| `LEADERBOARD` | "Nová pozice: #{position}" | Leaderboard change |
| `WORKFLOW_ASSIGNED` | "Nový požadavek: {title}" | Workflow assignment |
| `WORKFLOW_ESCALATED` | "Eskalace: {title}" | Workflow escalation |
| `MESSAGE` | "Nová zpráva od {sender}" | Chat/message |

### 4.4 Implementace

```typescript
// lib/push.ts (NOVÝ)
import { prisma } from "./prisma";

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  // 1. Zkontrolovat NotificationPreference.pushEnabled
  // 2. Načíst PushSubscription pro userId
  // 3. Poslat přes Expo Push API (expo-server-sdk)
  //    → Expo automaticky routuje na FCM/APNs
}
```

**SDK:** `expo-server-sdk` na backend straně — jediná závislost, Expo Push Service abstrahuje FCM/APNs.

---

## 5. REAL-TIME KOMUNIKACE

### 5.1 Stávající SSE → Mobile

SSE (`EventSource`) funguje v React Native s polyfillem:
- Package: `react-native-sse` nebo `@microsoft/fetch-event-source`
- Reconnect logika: exponential backoff
- Battery: SSE drží TCP spojení → vyšší spotřeba

### 5.2 Doporučení: Hybrid SSE + Push

| Stav aplikace | Kanál | Důvod |
|---------------|-------|-------|
| **Foreground** | SSE stream | Real-time, low latency |
| **Background** | Push notification | Battery-friendly |
| **Offline** | Queued → sync on reconnect | Offline-first |

```
App State Detection:
  AppState.addEventListener("change", (state) => {
    if (state === "active") → connect SSE
    if (state === "background") → disconnect SSE, rely on push
  })
```

---

## 6. OFFLINE PODPORA

### 6.1 Migrace z IndexedDB na SQLite

| IndexedDB Store | SQLite Table | Expo API |
|-----------------|-------------|----------|
| `drafts` | `vehicle_drafts` | expo-sqlite |
| `vehicles` | `vehicles_cache` | expo-sqlite |
| `pendingActions` | `pending_actions` | expo-sqlite |
| `images` | filesystem | expo-file-system |
| `contacts` | `contacts_cache` | expo-sqlite |
| `vinCache` | `vin_cache` | expo-sqlite |
| `equipmentCatalog` | `equipment_cache` | expo-sqlite |
| `contracts` | `contracts_cache` | expo-sqlite |

### 6.2 Background Sync

```typescript
// mobile/lib/background-sync.ts
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";

TaskManager.defineTask("SYNC_VEHICLES", async () => {
  // 1. Přečíst pending_actions z SQLite
  // 2. POST /api/vehicles (create) nebo PATCH /api/vehicles/[id] (update)
  // 3. Upload images via /api/upload
  // 4. Smazat z pending_actions po úspěchu
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
```

---

## 7. DEPLOYMENT — GOOGLE PLAY + APP STORE

### 7.1 Předpoklady

| Položka | Google Play | App Store |
|---------|-------------|-----------|
| **Účet** | Google Play Console ($25 jednorázově) | Apple Developer Program ($99/rok) |
| **Firma** | D-U-N-S číslo (ORGANIZACE) | D-U-N-S číslo (ORGANIZACE) |
| **Privacy Policy** | Povinná, veřejně dostupná URL | Povinná, veřejně dostupná URL |
| **Ikona** | 512x512 PNG | 1024x1024 PNG |
| **Screenshoty** | Min. 2 (phone), tablet optional | 6.7" + 5.5" povinné, tablet 12.9" |
| **Feature graphic** | 1024x500 PNG | N/A |
| **App name** | "Carmakler" (max 30 znaků) | "Carmakler" (max 30 znaků) |
| **Category** | Auto & Vehicles | Lifestyle / Business |
| **Age rating** | IARC questionnaire | App Store age rating |
| **Build** | AAB (Android App Bundle) | IPA (via EAS Build) |

### 7.2 D-U-N-S číslo

- **Co:** Unikátní identifikátor firmy od Dun & Bradstreet
- **Proč:** Google Play (Organization account) + Apple Developer (Organization) ho vyžadují
- **Jak získat:**
  1. Zkontrolovat na [dnb.com](https://www.dnb.com/duns-number/lookup.html) zda IČO Carmakler má D-U-N-S
  2. Pokud ne → požádat Apple (zdarma, 5-10 pracovních dní): [Apple D-U-N-S lookup](https://developer.apple.com/enroll/duns-lookup/)
  3. Nebo přímo u D&B Czech Republic
- **Časový odhad:** 1-3 týdny (pokud neexistuje)

### 7.3 Privacy Policy

Musí pokrývat:
- Sběr osobních údajů (email, telefon, lokace, fotky)
- Účel zpracování (prodej vozidel, lead management)
- Sdílení s třetími stranami (Stripe, Cloudinary, Resend)
- Práva uživatele (GDPR — přístup, výmaz, přenositelnost)
- Cookie/tracking policy
- Kontaktní údaje správce (Carmakler s.r.o.)
- **URL:** `https://carmakler.cz/ochrana-osobnich-udaju` (existující nebo nová stránka)

### 7.4 EAS Build & Submit

```bash
# Instalace
npx create-expo-app@latest carmakler-mobile
cd carmakler-mobile

# EAS konfigurace
npx eas-cli init
npx eas-cli build:configure

# eas.json
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "...",
        "ascAppId": "...",
        "appleTeamId": "..."
      }
    }
  }
}

# Build
eas build --platform all --profile production

# Submit
eas submit --platform all --profile production
```

### 7.5 OTA Updates

Expo EAS Update umožňuje JS bundle updates bez store review:
```bash
eas update --branch production --message "Fix: workflow notification badge"
```

- **Limit:** Jen JS/TS změny, ne native moduly
- **Výhoda:** Okamžitý deploy bugfixů bez čekání na Apple review (1-3 dny)

---

## 8. SDÍLENÝ KÓD (packages/shared)

### 8.1 Co sdílet

```
packages/shared/
├── validators/          ← Zod schémata z lib/validators/
│   ├── vehicle.ts       ← vehicleSchema, quickVehicleSchema
│   ├── workflow.ts      ← CreateWorkflowRequest
│   ├── contact.ts       ← contactSchema
│   └── notifications.ts ← notificationPreferenceSchema
├── types/
│   ├── user.ts          ← UserRole, UserStatus
│   ├── vehicle.ts       ← VehicleStatus, FuelType, etc.
│   ├── workflow.ts      ← WorkflowType, WorkflowStatus, WorkflowPriority
│   └── commission.ts    ← CommissionStatus
├── constants/
│   ├── roles.ts         ← ADMIN_ROLES, MAKLER_ROLES, etc. (z middleware.ts)
│   ├── workflow.ts      ← WORKFLOW_TYPES, WORKFLOW_STATUSES (z lib/workflow/types.ts)
│   └── vehicle.ts       ← FUEL_TYPES, TRANSMISSION_TYPES, etc.
└── utils/
    ├── format.ts        ← formatPrice(), formatDate(), formatMileage()
    ├── vin.ts           ← VIN validace
    └── slug.ts          ← slugify(), aliasFor()
```

### 8.2 Workspace konfigurace

```json
// root package.json
{
  "workspaces": ["apps/*", "packages/*"],
  "private": true
}
```

---

## 9. FÁZOVANÝ IMPLEMENTAČNÍ PLÁN

### Fáze 0: Příprava (2-3 týdny)

| # | Úkol | Detail |
|---|------|--------|
| 0.1 | D-U-N-S číslo | Ověřit/požádat |
| 0.2 | Apple Developer Account | Registrace (Organization) |
| 0.3 | Google Play Console | Registrace (Organization) |
| 0.4 | Privacy Policy | Stránka na carmakler.cz |
| 0.5 | App Store screenshoty | Design 6.7" + 5.5" + 12.9" |
| 0.6 | App ikona | 1024x1024 (konzistentní s webem) |

### Fáze 1: Základ + Auth (3-4 týdny)

| # | Úkol | Soubory |
|---|------|---------|
| 1.1 | Expo projekt + monorepo setup | `apps/mobile/`, `packages/shared/`, workspace config |
| 1.2 | NativeWind + design tokens | Tailwind config, sdílené barvy (orange #F97316), Outfit font |
| 1.3 | Mobile auth endpoints | `app/api/auth/mobile/login/route.ts`, `app/api/auth/mobile/refresh/route.ts` |
| 1.4 | Auth wrapper (`getAuthUser`) | `lib/auth-mobile.ts` — dual cookie/Bearer support |
| 1.5 | Login/Register screens | `apps/mobile/app/(auth)/login.tsx`, `register.tsx` |
| 1.6 | Secure token storage | expo-secure-store, auto-refresh hook |
| 1.7 | API client | Axios/fetch wrapper s auth interceptorem |
| 1.8 | Navigation shell | Tab navigator (role-based tabs) |
| 1.9 | Biometric login | expo-local-authentication (Face ID / Fingerprint) |

### Fáze 2: Broker Core (4-5 týdnů)

| # | Úkol | API dependency |
|---|------|----------------|
| 2.1 | Dashboard screen | `/api/broker/stats`, `/api/broker/detailed-stats` |
| 2.2 | Vehicle list + detail | `/api/broker/vehicles`, `/api/vehicles/[id]/full` |
| 2.3 | Vehicle nabírání (multi-step) | `/api/vehicles` (POST), `/api/vehicles/[id]/images` |
| 2.4 | Quick nabírání | `/api/vehicles/quick` |
| 2.5 | Camera + foto upload | expo-camera → `/api/upload` → Cloudinary |
| 2.6 | Lead management | `/api/leads`, `/api/leads/[id]` |
| 2.7 | Contact CRM | `/api/contacts`, `/api/contacts/sync` |
| 2.8 | Onboarding flow | `/api/onboarding/quiz`, `/api/auth/register/broker` |

### Fáze 3: Notifikace + Real-time (2-3 týdny)

| # | Úkol | Detail |
|---|------|--------|
| 3.1 | Push subscription model | Prisma migration: `PushSubscription` |
| 3.2 | Push register/unregister API | `/api/push/register`, `/api/push/unregister` |
| 3.3 | Push server module | `lib/push.ts` (expo-server-sdk) |
| 3.4 | Integrace do existujících triggerů | Hook do `createNotification()`, `notifyWorkflow()` |
| 3.5 | expo-notifications setup | Permissions, token handling, notification channels (Android) |
| 3.6 | SSE client pro foreground | react-native-sse, AppState detection |
| 3.7 | In-app notification center | Badge count, mark as read |

### Fáze 4: Workflow + Contracts (2-3 týdny)

| # | Úkol | API dependency |
|---|------|----------------|
| 4.1 | Workflow list + detail | `/api/vehicles/[id]/workflow`, `/api/escalations` |
| 4.2 | Workflow create | Formulář pro nový požadavek |
| 4.3 | Contract viewer | `/api/contracts/[id]` |
| 4.4 | Digital signature | expo-signature-pad nebo react-native-signature-canvas |
| 4.5 | Document upload | expo-document-picker + `/api/upload` |

### Fáze 5: Offline + Sync (2-3 týdny)

| # | Úkol | Detail |
|---|------|--------|
| 5.1 | SQLite schema | Migrace IndexedDB → expo-sqlite |
| 5.2 | Offline draft saving | Vehicle drafts do SQLite |
| 5.3 | Image caching | expo-file-system pro blob storage |
| 5.4 | Background sync | expo-task-manager + expo-background-fetch |
| 5.5 | Offline indicator | Network status bar, queue count |
| 5.6 | Conflict resolution | Server-wins strategy, user notification |

### Fáze 6: Rozšíření rolí (3-4 týdny)

| # | Úkol | Role |
|---|------|------|
| 6.1 | Manager dashboard | MANAGER (schvalování, team, KPI) |
| 6.2 | Parts supplier PWA | PARTS_SUPPLIER (díly, objednávky) |
| 6.3 | Buyer experience | BUYER (search, favorites, inquiries) |
| 6.4 | Partner portal | PARTNER_BAZAR, PARTNER_VRAKOVISTE |
| 6.5 | Marketplace screens | INVESTOR, VERIFIED_DEALER |
| 6.6 | Advertiser screens | ADVERTISER (inzeráty) |

### Fáze 7: Store Submission (1-2 týdny)

| # | Úkol | Detail |
|---|------|--------|
| 7.1 | EAS Build production | `eas build --platform all` |
| 7.2 | App Store review | Screenshoty, popis, metadata |
| 7.3 | Google Play review | Listing, content rating, review |
| 7.4 | Beta testing | TestFlight (iOS) + Internal testing (Android) |
| 7.5 | Production release | Postupný rollout (10% → 50% → 100%) |

### Fáze 8: Post-launch (ongoing)

| # | Úkol | Detail |
|---|------|--------|
| 8.1 | OTA updates | EAS Update pro hotfixy |
| 8.2 | Crash reporting | Sentry React Native SDK |
| 8.3 | Performance monitoring | Startup time, API latency |
| 8.4 | A/B testing | Expo EAS Updates branches |

---

## 10. RIZIKA A MITIGACE

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| Apple review rejection | 1-2 týdny delay | Důsledná příprava privacy policy, screenshotů, metadat |
| D-U-N-S delay | 2-3 týdny blokace | Zahájit ASAP, paralelně vyvíjet |
| NextAuth JWT kompatibilita | Auth nefunguje | Custom auth endpoint, same NEXTAUTH_SECRET |
| SSE na mobilním pozadí | Žere baterii | Hybrid SSE (foreground) + Push (background) |
| Expo managed omezení | Chybějící native modul | EAS build s custom dev clientem, ne bare workflow |
| Offline sync konflikty | Data loss | Server-wins strategy + user notifikace |
| Store rejection (privacy) | Blokace releasu | GDPR compliance, transparent data usage |

---

## 11. METRIKY ÚSPĚCHU

| Metrika | Cíl (3 měsíce po launch) |
|---------|--------------------------|
| Instalace | 200+ (aktivní makléři + dodavatelé) |
| DAU/MAU | 60%+ |
| Push opt-in rate | 80%+ |
| Offline draft → submit rate | 90%+ |
| App Store rating | 4.5+ |
| Crash-free rate | 99.5%+ |
| Nabírání přes mobilní | 50%+ všech nabírání |
| API response time (P95) | < 500ms |

---

## 12. ZÁVISLOSTI NA EXISTUJÍCÍM KÓDU

### Soubory, které se MUSÍ upravit (backend):

| Soubor | Změna | Důvod |
|--------|-------|-------|
| `lib/auth.ts` | Export `verifyJwt()` helper | Mobile token verification |
| `lib/notifications.ts` | Hook na `sendPushNotification()` | Push při create notification |
| `lib/workflow/notifications.ts` | Hook na push | Workflow push notifikace |
| `prisma/schema.prisma` | +PushSubscription model | Device token storage |
| `next.config.ts` | CSP: connect-src + Expo domain | Push service communication |

### Soubory, které se NESMÍ měnit:

- Middleware.ts (role-based routing zůstává web-only)
- Existující API routes (fungují pro web i mobile via Bearer)
- Prisma models (jen přidat PushSubscription, nic neměnit)

---

## 13. DOPORUČENÍ

1. **Začít D-U-N-S + účty HNED** — je to největší blocker (2-3 týdny)
2. **Monorepo od začátku** — sdílené validátory ušetří 30% kódu
3. **Expo managed workflow** — ne bare workflow, EAS Build řeší native dependencies
4. **Expo Push Service** — abstrahuje FCM/APNs, neřešit přímo
5. **Auth: Custom endpoint** — jednodušší než ohýbat NextAuth pro mobile
6. **SSE + Push hybrid** — nejlepší balance real-time vs battery
7. **Postupný rollout** — nejdřív Broker role, pak postupně další
8. **OTA updates** — kritické pro rychlé bugfixy bez store review

---

*Celkový odhad: **18-24 týdnů** (Fáze 0-7) pro MVP s Broker rolí + notifikacemi + offline.*
*Full platform (všechny role): **30-36 týdnů**.*
