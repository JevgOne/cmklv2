# Plán: Interní Workflow Systém pro PWA Carmakler

**Autor:** Plánovač  
**Datum:** 2026-05-23 (v2 — aktualizace org struktury)  
**Status:** NAVRŽENO  
**Priorita:** HIGH  
**Odhadovaná komplexita:** LARGE (7 fází, ~74 souborů)

---

## CHANGELOG v2 (2026-05-23)

| Změna | Důvod |
|---|---|
| ALL `defaultRole: "BACKOFFICE"` → `"MANAGER"` | BACKOFFICE role NEEXISTUJE, bude přidána později |
| Nová routing hierarchie: BROKER→REGIONAL_DIRECTOR→MANAGER→ADMIN | Odpovídá skutečné org struktuře |
| +5 nových typů: COMPLAINT, ONBOARDING, INTERNAL_TASK, QUESTION, BUG_REPORT | Kompletní pokrytí firemních procesů |
| +QUEUED stav v state machine | Fronta s claim mechanismem |
| Per-role visibility pravidla | BROKER=vlastní, RD=své brokery, MANAGER/ADMIN=vše |
| Admin dashboard sekce | ADMIN vidí úvěry, vše, system config |
| +inquiryId v WorkflowRequest | Vazba na kupujícího/zájemce |
| BACKOFFICE odstraněn z ROLE_PERMISSIONS | Komentářem zachován pro budoucí návrat |

---

## §1 Analýza aktuálního stavu

### 1.1 Existující infrastruktura

**Notification systém (jednoduchý):**
- Model `Notification` (`prisma/schema.prisma:521-537`) — 4 typy: COMMISSION, VEHICLE, SYSTEM, MESSAGE
- Helper `lib/notifications.ts` — `createNotification()` + `createManagerNotification()`
- Komponenta `components/pwa/NotificationBell.tsx` — polling-based (žádný real-time)
- Dashboard `components/pwa/dashboard/NotificationsList.tsx` — posledních 5 notifikací
- API `app/api/broker/notifications/route.ts` — GET + PATCH (mark as read)
- `NotificationPreference` model — per-event push/email/sms toggles

**Marketplace notifikace (pokročilejší):**
- `lib/marketplace/notifications.ts` — `notifyMarketplace()` s preference checking + email
- Vlastní `MarketplaceNotificationType` enum
- Pattern: check preferences → create in-app → send email — **tento pattern rozšíříme**

**Escalation systém (základ workflow):**
- Model `Escalation` (`prisma/schema.prisma:1690-1717`) — typy, urgency, status (OPEN→IN_PROGRESS→RESOLVED→CLOSED)
- `EscalationForm` komponenta — modal s typem, popisem, urgentností
- API `app/api/escalations/route.ts` — POST vytvoří eskalaci + notifikuje manažera
- Validator `lib/validators/escalation.ts` — Zod schémata
- **Klíčový pattern:** broker vytvoří → systém najde manažera → notifikuje → manažer řeší

**Offline systém:**
- `lib/offline/db.ts` — IndexedDB v4 s stores: drafts, vehicles, pendingActions, images, contacts, vinCache, equipmentCatalog, contracts
- `pendingActions` store — queue pro offline akce s retries
- `components/pwa/offline/SyncButton.tsx` + `OfflineBanner.tsx`

**Real-time:**
- Pusher je v tech stacku (CLAUDE.md), ale **není implementován v kódu** — žádný `lib/pusher.ts`
- Notifikace jsou **polling-based** (fetch v useEffect)

**PWA struktura:**
- `app/(pwa)/makler/` — dashboard, vehicles, contacts, contracts, leads, messages, settings, stats, commissions, leaderboard, financing-calculator, offline, onboarding, profile, provize
- Layout: `app/(pwa)/makler/layout.tsx` — minimální (jen robots noindex)
- TopBar: `components/pwa/TopBar.tsx` s NotificationBell

**Middleware (role-based):**
- `middleware.ts` — MAKLER_ROLES = [BROKER, MANAGER, REGIONAL_DIRECTOR, ADMIN]
- Protected paths: /makler/dashboard, /makler/vehicles, /makler/contacts, etc.
- Pattern: protectedMaklerPaths array → token check → role check → onboarding redirect

### 1.2 Organizační struktura (AKTUÁLNÍ)

**Hierarchie rolí:**

```
ADMIN (systémový administrátor — vidí VŠECHNO)
  └── MANAGER (Kateřina — hlavní manažerka prodeje, řídí celý tým)
       └── REGIONAL_DIRECTOR (regionální manažeři, každý má svůj region)
            └── BROKER (makléři v terénu)
```

**DŮLEŽITÉ:**
- **BACKOFFICE role NEEXISTUJE** — bude přidána v budoucnu
- Až bude BACKOFFICE přidán, stačí změnit `defaultRole` zpět u relevantních typů
- Do té doby vše routuje přes MANAGER/REGIONAL_DIRECTOR/ADMIN hierarchii

### 1.3 Co CHYBÍ (gap analysis)

| Oblast | Stav | Potřeba |
|--------|------|---------|
| Workflow požadavky | ❌ Neexistuje | Plný CRUD + stavový automat |
| Přiřazovací engine | ❌ Jen manuální manažer | Automatický routing podle typu a hierarchie |
| Interní chat | ❌ Neexistuje | Thread-based na požadavku |
| Dokumenty/přílohy | ❌ Jen escalation attachments (URL) | Upload + kategorizace |
| Audit trail | ⚠️ VehicleChangeLog existuje | Generický WorkflowStep |
| Real-time | ❌ Polling only | Pusher channels |
| SLA/eskalace | ❌ Jen manuální urgency flag | Automatické SLA timery |
| Dashboard workflow | ❌ Neexistuje | Role-based přehled |
| Offline workflow | ❌ Neexistuje | Čtení + queue pro vytváření |
| Fronta (queue) | ❌ Neexistuje | QUEUED stav + claim mechanismus |

### 1.4 Existující patterns k rozšíření

1. **Escalation model** → základ pro WorkflowRequest (typ, urgency, status, broker→manager)
2. **notifyMarketplace()** → pattern pro notifyWorkflow() (preferences → in-app → email → pusher)
3. **pendingActions IndexedDB** → rozšíření o workflow akce pro offline
4. **VehicleChangeLog** → inspirace pro WorkflowStep (audit trail)
5. **DealComment** → inspirace pro WorkflowComment (threaded comments s parentId)
6. **User.managerId** → klíčový pro routing: BROKER → jeho REGIONAL_DIRECTOR

---

## §2 Architektura — Databázové modely

### 2.1 WorkflowRequest (hlavní požadavek)

```prisma
model WorkflowRequest {
  id          String   @id @default(cuid())
  
  // Typ a kategorie
  type        String   // FINANCING, INSURANCE, DOCUMENT, APPROVAL, SUPPORT, INSPECTION, CLIENT_VERIFICATION, HANDOVER, PRICE_CHANGE, COMPLAINT, ONBOARDING, INTERNAL_TASK, QUESTION, BUG_REPORT, OTHER
  category    String?  // Sub-kategorie (např. FINANCING → LEASING, LOAN, CASH)
  
  // Obsah
  title       String
  description String   @db.Text
  priority    String   @default("NORMAL") // LOW, NORMAL, HIGH, URGENT
  
  // Stav
  status      String   @default("CREATED") // CREATED, QUEUED, ASSIGNED, IN_PROGRESS, WAITING_INFO, WAITING_APPROVAL, RESOLVED, CLOSED, CANCELLED
  
  // Kdo vytvořil
  createdById String
  createdBy   User     @relation("WorkflowCreator", fields: [createdById], references: [id])
  
  // Přiřazeno komu (osoba)
  assignedToId String?
  assignedTo   User?   @relation("WorkflowAssignee", fields: [assignedToId], references: [id])
  
  // Přiřazeno oddělení/roli
  assignedRole String?  // MANAGER, REGIONAL_DIRECTOR, ADMIN (BACKOFFICE — budoucí)
  
  // Předchozí assignee (pro vrácení po approval)
  previousAssigneeId String?
  
  // Kontext — polymorfní vazby
  vehicleId    String?
  vehicle      Vehicle? @relation("WorkflowVehicle", fields: [vehicleId], references: [id])
  contactId    String?  // SellerContact ID
  contractId   String?  // Contract ID
  leadId       String?  // Lead ID
  inquiryId    String?  // VehicleInquiry ID — vazba na kupujícího/zájemce
  inquiry      VehicleInquiry? @relation(fields: [inquiryId], references: [id])
  
  // SLA
  dueAt        DateTime?  // Deadline pro vyřízení
  slaBreached  Boolean    @default(false)
  
  // Metadata
  metadata     String?    // JSON — flexibilní data podle typu (viz metadata-schemas.ts)
  
  // Řešení
  resolution       String?  @db.Text
  resolvedAt       DateTime?
  resolvedById     String?
  
  // Relace
  steps      WorkflowStep[]
  comments   WorkflowComment[]
  documents  WorkflowDocument[]
  watchers   WorkflowWatcher[]
  
  // Timestamps
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([createdById])
  @@index([assignedToId])
  @@index([assignedRole])
  @@index([status])
  @@index([type])
  @@index([priority])
  @@index([vehicleId])
  @@index([inquiryId])
  @@index([dueAt])
  @@index([slaBreached])
  @@index([createdAt])
}
```

**Nové fieldy vs. stávající schema:**
- `inquiryId` + `inquiry` relace — NOVÝ (vazba na kupujícího)
- `previousAssigneeId` — NOVÝ (multi-department handoff)
- `status` default — beze změny (`CREATED`), ale QUEUED přidán do povolených hodnot

### 2.2 WorkflowStep (historie kroků/stavů)

```prisma
model WorkflowStep {
  id          String          @id @default(cuid())
  requestId   String
  request     WorkflowRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  // Kdo provedl akci
  userId      String
  user        User            @relation("WorkflowStepActor", fields: [userId], references: [id])
  
  // Akce
  action      String   // CREATED, QUEUED, ASSIGNED, CLAIMED, STATUS_CHANGED, PRIORITY_CHANGED, COMMENTED, DOCUMENT_ADDED, REASSIGNED, ESCALATED, RESOLVED, CLOSED, REOPENED
  
  // Detaily změny
  fromStatus  String?
  toStatus    String?
  fromAssignee String?
  toAssignee   String?
  note        String?  @db.Text
  
  createdAt   DateTime @default(now())
  
  @@index([requestId])
  @@index([userId])
  @@index([createdAt])
}
```

### 2.3 WorkflowComment (interní komunikace na požadavku)

```prisma
model WorkflowComment {
  id          String          @id @default(cuid())
  requestId   String
  request     WorkflowRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  userId      String
  user        User            @relation("WorkflowCommentAuthor", fields: [userId], references: [id])
  
  content     String   @db.Text
  isInternal  Boolean  @default(false) // Interní poznámka (vidí jen přiřazené oddělení)
  
  // Thread support
  parentId    String?
  parent      WorkflowComment?  @relation("WorkflowCommentReplies", fields: [parentId], references: [id])
  replies     WorkflowComment[] @relation("WorkflowCommentReplies")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([requestId])
  @@index([userId])
  @@index([parentId])
  @@index([createdAt])
}
```

### 2.4 WorkflowDocument (přílohy)

```prisma
model WorkflowDocument {
  id          String          @id @default(cuid())
  requestId   String
  request     WorkflowRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  uploadedById String
  uploadedBy   User           @relation("WorkflowDocUploader", fields: [uploadedById], references: [id])
  
  name        String          // Zobrazovaný název
  fileName    String          // Originální název souboru
  url         String          // Cloudinary URL
  mimeType    String          // application/pdf, image/jpeg, etc.
  size        Int             // Velikost v bytes
  category    String?         // ID_CARD, INCOME_PROOF, CONTRACT, INSURANCE, PHOTO, OTHER
  
  createdAt   DateTime @default(now())
  
  @@index([requestId])
  @@index([uploadedById])
  @@index([category])
}
```

### 2.5 WorkflowWatcher (sledující)

```prisma
model WorkflowWatcher {
  id          String          @id @default(cuid())
  requestId   String
  request     WorkflowRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  userId      String
  user        User            @relation("WorkflowWatchers", fields: [userId], references: [id])
  
  createdAt   DateTime @default(now())
  
  @@unique([requestId, userId])
  @@index([userId])
}
```

### 2.6 User relace (rozšíření existujícího modelu)

```prisma
// Přidat do model User:
  workflowRequestsCreated  WorkflowRequest[]  @relation("WorkflowCreator")
  workflowRequestsAssigned WorkflowRequest[]  @relation("WorkflowAssignee")
  workflowSteps            WorkflowStep[]     @relation("WorkflowStepActor")
  workflowComments         WorkflowComment[]  @relation("WorkflowCommentAuthor")
  workflowDocuments        WorkflowDocument[] @relation("WorkflowDocUploader")
  workflowWatching         WorkflowWatcher[]  @relation("WorkflowWatchers")
```

### 2.7 Vehicle relace (rozšíření)

```prisma
// Přidat do model Vehicle:
  workflowRequests  WorkflowRequest[] @relation("WorkflowVehicle")
```

### 2.8 VehicleInquiry relace (NOVÉ)

```prisma
// Přidat do model VehicleInquiry:
  workflowRequests  WorkflowRequest[]
```

---

## §3 Workflow Engine — Stavový automat

### 3.1 Typy požadavků a automatické přiřazení

```typescript
// lib/workflow/types.ts

export const WORKFLOW_TYPES = {
  FINANCING: {
    label: "Financování",
    icon: "💰",
    defaultRole: "MANAGER",        // ← změněno z BACKOFFICE
    slaHours: 24,
    categories: ["LEASING", "LOAN", "CASH"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  INSURANCE: {
    label: "Pojištění",
    icon: "🛡️",
    defaultRole: "MANAGER",        // ← změněno z BACKOFFICE
    slaHours: 48,
    categories: ["HAVARIJNI", "POVINNE", "GAP"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  DOCUMENT: {
    label: "Dokumenty",
    icon: "📄",
    defaultRole: "MANAGER",        // ← změněno z BACKOFFICE
    slaHours: 24,
    categories: ["SMLOUVA", "PLNA_MOC", "TECHNICAK", "EVIDENCNI_KONTROLA"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  APPROVAL: {
    label: "Schválení",
    icon: "✅",
    defaultRole: "MANAGER",        // beze změny
    slaHours: 12,
    categories: ["VEHICLE", "PRICE_CHANGE", "PAYOUT", "CONTRACT"],
    allowedCreators: ["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  SUPPORT: {
    label: "Podpora",
    icon: "🆘",
    defaultRole: "MANAGER",        // ← změněno z BACKOFFICE
    slaHours: 8,
    categories: ["TECHNICAL", "PROCESS", "CLIENT"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  INSPECTION: {
    label: "Prohlídka/STK",
    icon: "🔍",
    defaultRole: "MANAGER",        // ← změněno z BACKOFFICE
    slaHours: 72,
    categories: ["STK", "PROHLIDKA", "CEBIA"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  CLIENT_VERIFICATION: {
    label: "Ověření klienta",
    icon: "🪪",
    defaultRole: "MANAGER",        // ← změněno z BACKOFFICE
    slaHours: 24,
    categories: ["ID_CHECK", "INCOME_PROOF", "ADDRESS_PROOF"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  HANDOVER: {
    label: "Předání vozidla",
    icon: "🚗",
    defaultRole: "MANAGER",        // beze změny
    slaHours: 48,
    categories: ["BUYER_HANDOVER", "SELLER_PICKUP"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  PRICE_CHANGE: {
    label: "Změna ceny",
    icon: "💲",
    defaultRole: "MANAGER",        // beze změny
    slaHours: 12,
    categories: ["REDUCTION", "INCREASE"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
  // === 5 NOVÝCH TYPŮ ===
  COMPLAINT: {
    label: "Reklamace",
    icon: "⚠️",
    defaultRole: "MANAGER",        // ← MANAGER (ne BACKOFFICE)
    slaHours: 720,                 // 30 dní (zákonná lhůta §19/3 ZOS)
    categories: ["VEHICLE_DEFECT", "MISSING_DOCUMENT", "PRICE_DISPUTE", "WARRANTY"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
    description: "Reklamace prodaného vozidla — kupující hlásí vadu",
  },
  ONBOARDING: {
    label: "Onboarding",
    icon: "🎓",
    defaultRole: "MANAGER",        // beze změny
    slaHours: 168,                 // 7 dní
    categories: ["NEW_BROKER", "DOCUMENT_VERIFICATION", "QUIZ", "CONTRACT_SIGNING", "ACTIVATION"],
    allowedCreators: ["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
    description: "Onboarding nového makléře — ověření, školení, aktivace",
  },
  INTERNAL_TASK: {
    label: "Interní úkol",
    icon: "📋",
    defaultRole: "MANAGER",        // ← MANAGER (ne BACKOFFICE)
    slaHours: 48,
    categories: ["DATA_ENTRY", "PHOTO_EDIT", "LISTING_UPDATE", "RESEARCH", "ADMIN"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
    description: "Ad-hoc interní úkol přiřazený kolegovi",
  },
  QUESTION: {
    label: "Dotaz",
    icon: "❓",
    defaultRole: "MANAGER",
    slaHours: 8,
    categories: ["PROCESS", "CLIENT", "SYSTEM", "GENERAL"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
    description: "Dotaz na kolegu/manažera — nahrazuje WhatsApp/email",
  },
  BUG_REPORT: {
    label: "Chyba v systému",
    icon: "🐛",
    defaultRole: "ADMIN",          // ← vždy ADMIN (dev tým)
    slaHours: 24,
    categories: ["UI_BUG", "DATA_ERROR", "CRASH", "PERFORMANCE", "FEATURE_REQUEST"],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
    description: "Nahlášení chyby nebo problému v aplikaci",
  },
  OTHER: {
    label: "Ostatní",
    icon: "📋",
    defaultRole: "MANAGER",        // ← změněno z BACKOFFICE
    slaHours: 48,
    categories: [],
    allowedCreators: ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"],
  },
} as const;

// Celkem 15 typů workflow
```

**BACKOFFICE → MANAGER přehled:**

| Typ | Původní defaultRole | Nový defaultRole | Důvod |
|---|---|---|---|
| FINANCING | BACKOFFICE | **MANAGER** | BACKOFFICE neexistuje |
| INSURANCE | BACKOFFICE | **MANAGER** | BACKOFFICE neexistuje |
| DOCUMENT | BACKOFFICE | **MANAGER** | BACKOFFICE neexistuje |
| SUPPORT | BACKOFFICE | **MANAGER** | BACKOFFICE neexistuje |
| INSPECTION | BACKOFFICE | **MANAGER** | BACKOFFICE neexistuje |
| CLIENT_VERIFICATION | BACKOFFICE | **MANAGER** | BACKOFFICE neexistuje |
| OTHER | BACKOFFICE | **MANAGER** | BACKOFFICE neexistuje |
| COMPLAINT (NOVÝ) | — | **MANAGER** | BACKOFFICE neexistuje |
| INTERNAL_TASK (NOVÝ) | — | **MANAGER** | BACKOFFICE neexistuje |
| APPROVAL | MANAGER | MANAGER | Beze změny |
| HANDOVER | MANAGER | MANAGER | Beze změny |
| PRICE_CHANGE | MANAGER | MANAGER | Beze změny |
| ONBOARDING (NOVÝ) | — | MANAGER | Beze změny |
| QUESTION (NOVÝ) | — | MANAGER | Beze změny |
| BUG_REPORT (NOVÝ) | — | **ADMIN** | Vždy admin/dev tým |

**Budoucí BACKOFFICE návrat:**
Až bude BACKOFFICE role přidána, stačí v `types.ts` u relevantních typů (FINANCING, INSURANCE, DOCUMENT, SUPPORT, INSPECTION, CLIENT_VERIFICATION, OTHER, COMPLAINT, INTERNAL_TASK) změnit `defaultRole: "MANAGER"` zpět na `"BACKOFFICE"`.

### 3.2 Stavový automat (AKTUALIZOVANÝ — s QUEUED)

```
CREATED ──→ QUEUED ──→ ASSIGNED ──→ IN_PROGRESS ──→ RESOLVED ──→ CLOSED
  │           │           │              │              ↑
  │           │           │              ↓              │
  │           │           │         WAITING_INFO ───────┘
  │           │           │              │
  │           │           │              ↓
  │           │           │         WAITING_APPROVAL ───→ RESOLVED
  │           │           │                                  │
  ↓           ↓           ↓                                  ↓
CANCELLED   CANCELLED   CANCELLED                          CLOSED
```

**QUEUED stav:**
- Požadavek čeká ve frontě na "claim" (převzetí) pracovníkem
- Viditelný pro všechny uživatele s odpovídající rolí (assignedRole)
- Libovolný uživatel s rolí může kliknout "Převzít" → status se změní na ASSIGNED

**Kdy se požadavek dostane do QUEUED vs. ASSIGNED:**
- Pokud auto-routing najde konkrétní osobu → přeskočí QUEUED, jde rovnou na ASSIGNED
- Pokud auto-routing najde jen roli (žádná konkrétní osoba) → QUEUED

**Přechody stavů (kdo může):**

| Z → Na | Kdo | Automaticky? |
|--------|-----|-------------|
| CREATED → QUEUED | Systém | ANO (auto-routing, bez konkrétní osoby) |
| CREATED → ASSIGNED | Systém | ANO (auto-routing, nalezena osoba) |
| QUEUED → ASSIGNED | Uživatel s odpovídající rolí (claim) | NE (manuální "Převzít") |
| ASSIGNED → IN_PROGRESS | Assignee | NE (manuální převzetí) |
| IN_PROGRESS → WAITING_INFO | Assignee | NE |
| WAITING_INFO → IN_PROGRESS | Kdokoliv (odpověď) | ANO (po přidání info) |
| IN_PROGRESS → WAITING_APPROVAL | Assignee | NE |
| WAITING_APPROVAL → RESOLVED | Approver (MANAGER+) | NE |
| IN_PROGRESS → RESOLVED | Assignee | NE |
| RESOLVED → CLOSED | Creator / Auto (7 dní) | HYBRID |
| * → CANCELLED | Creator / ADMIN | NE |
| CLOSED → CREATED | Creator (reopen) | NE |

### 3.3 Auto-routing logic (PŘEPRACOVÁNO)

```typescript
// lib/workflow/router.ts

export async function autoAssignRequest(
  type: string,
  createdById: string,
): Promise<AutoAssignResult> {
  const config = WORKFLOW_TYPES[type as WorkflowType];
  const defaultRole = config?.defaultRole ?? "MANAGER";

  // === SPECIÁLNÍ ROUTING ===
  
  // BUG_REPORT → vždy ADMIN
  if (type === "BUG_REPORT") {
    const admin = await findLeastLoadedUserByRole("ADMIN");
    if (admin) return { assignedToId: admin.id, assignedRole: "ADMIN" };
    return { assignedRole: "ADMIN" }; // → QUEUED
  }

  // QUESTION → pokud makléř zvolil konkrétního kolegu v UI, přiřadit přímo
  // (assignedToId předán z UI, zpracováno v actions.ts, ne zde)

  // === HIERARCHICKÝ ROUTING ===
  // BROKER → REGIONAL_DIRECTOR → MANAGER → ADMIN

  const creator = await prisma.user.findUnique({
    where: { id: createdById },
    select: { 
      role: true, 
      managerId: true,
      manager: { select: { id: true, role: true, status: true } },
    },
  });

  // 1. Pokud BROKER vytváří → route k jeho REGIONAL_DIRECTOR (přes managerId)
  if (creator?.role === "BROKER" && creator.managerId) {
    const rd = creator.manager;
    if (rd && rd.status === "ACTIVE") {
      return { assignedToId: rd.id, assignedRole: rd.role }; // REGIONAL_DIRECTOR
    }
  }

  // 2. Pokud nemá REGIONAL_DIRECTOR nebo REGIONAL_DIRECTOR vytváří → route k MANAGER
  if (defaultRole === "MANAGER" || !creator?.managerId) {
    const manager = await findLeastLoadedUserByRole("MANAGER");
    if (manager) {
      return { assignedToId: manager.id, assignedRole: "MANAGER" };
    }
  }

  // 3. Pokud žádný MANAGER není dostupný → route k ADMIN
  const admin = await findLeastLoadedUserByRole("ADMIN");
  if (admin) {
    return { assignedToId: admin.id, assignedRole: "ADMIN" };
  }

  // 4. Fallback — jen role, žádná konkrétní osoba → QUEUED
  return { assignedRole: defaultRole };
}

// Helper: najde uživatele s nejméně otevřenými požadavky v dané roli
async function findLeastLoadedUserByRole(role: string) {
  const candidates = await prisma.user.findMany({
    where: { role, status: "ACTIVE" },
    select: {
      id: true,
      _count: {
        select: {
          workflowRequestsAssigned: {
            where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "WAITING_INFO"] } },
          },
        },
      },
    },
    orderBy: { workflowRequestsAssigned: { _count: "asc" } },
    take: 1,
  });
  return candidates[0] ?? null;
}
```

**Routing hierarchie (shrnutí):**

```
BROKER vytvoří požadavek
    │
    ├── Má managerId? (REGIONAL_DIRECTOR)
    │     ├── ANO → přiřaď REGIONAL_DIRECTOR (ASSIGNED)
    │     └── NE → pokračuj ↓
    │
    ├── Existuje MANAGER s role=ACTIVE?
    │     ├── ANO → přiřaď nejméně vytíženému MANAGER (ASSIGNED)
    │     └── NE → pokračuj ↓
    │
    ├── Existuje ADMIN s role=ACTIVE?
    │     ├── ANO → přiřaď ADMIN (ASSIGNED)
    │     └── NE → pokračuj ↓
    │
    └── Jen assignedRole, bez osoby → status QUEUED (čeká na claim)
```

**Budoucí BACKOFFICE integrace:**
Až bude BACKOFFICE role přidána:
1. Změnit `defaultRole` u relevantních typů zpět na `"BACKOFFICE"`
2. Přidat `findLeastLoadedUserByRole("BACKOFFICE")` jako první krok v routing chain
3. Round-robin mezi BACKOFFICE uživateli (stejný pattern jako nyní MANAGER)

### 3.4 Per-role Visibility (NOVÉ)

| Role | Vidí požadavky | Filtr |
|------|---------------|-------|
| **BROKER** | Pouze vlastní (vytvořené) | `createdById = session.user.id` |
| **REGIONAL_DIRECTOR** | Vlastní + požadavky svých brokerů | `createdById IN (vlastní ID + IDs brokerů kde managerId = session.user.id)` |
| **MANAGER** | VŠECHNY požadavky | Žádný filtr (plný přístup) |
| **ADMIN** | VŠECHNY požadavky + systém config | Žádný filtr + přístup k admin dashboardu |

**Implementace visibility v API:**

```typescript
// app/api/workflow/route.ts — GET

async function getVisibilityFilter(session: Session) {
  const user = session.user;
  
  switch (user.role) {
    case "ADMIN":
    case "MANAGER":
      return {}; // Vidí vše
      
    case "REGIONAL_DIRECTOR":
      // Vlastní + svých brokerů
      const brokerIds = await prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true },
      });
      return {
        OR: [
          { createdById: user.id },
          { assignedToId: user.id },
          { createdById: { in: brokerIds.map(b => b.id) } },
        ],
      };
      
    case "BROKER":
    default:
      return {
        OR: [
          { createdById: user.id },
          { assignedToId: user.id },
        ],
      };
  }
}
```

### 3.5 SLA Engine

```typescript
// lib/workflow/sla.ts

export function calculateDueDate(type: string, priority: string): Date {
  const config = WORKFLOW_TYPES[type];
  let slaHours = config.slaHours;
  
  // Priority multiplier
  if (priority === "URGENT") slaHours = Math.ceil(slaHours * 0.25); // 4x rychleji
  if (priority === "HIGH") slaHours = Math.ceil(slaHours * 0.5);    // 2x rychleji
  if (priority === "LOW") slaHours = slaHours * 2;                   // 2x pomalejší
  
  // Per-category SLA override
  // BUG_REPORT kategorie CRASH → 4h override
  if (type === "BUG_REPORT" && priority === "URGENT") slaHours = 4;
  
  const due = new Date();
  due.setHours(due.getHours() + slaHours);
  return due;
}

// CRON job: app/api/cron/workflow-sla/route.ts
// Každou hodinu zkontroluje breached SLA → notifikace + eskalace
```

### 3.6 State Machine (AKTUALIZOVANÝ — bez BACKOFFICE)

```typescript
// lib/workflow/state-machine.ts

// Povolené přechody stavů
const TRANSITIONS: Record<string, string[]> = {
  CREATED: ["QUEUED", "ASSIGNED", "CANCELLED"],     // +QUEUED
  QUEUED: ["ASSIGNED", "CANCELLED"],                 // NOVÝ
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_INFO", "WAITING_APPROVAL", "RESOLVED", "CANCELLED"],
  WAITING_INFO: ["IN_PROGRESS", "CANCELLED"],
  WAITING_APPROVAL: ["RESOLVED", "IN_PROGRESS", "CANCELLED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"], // reopen
  CLOSED: ["CREATED"], // reopen as new
  CANCELLED: [],
};

// Role oprávněné provést přechod
// BACKOFFICE odstraněn (role neexistuje) — vrátit až bude role přidána
const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Systémové přechody (auto-routing)
  "CREATED->QUEUED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "CREATED->ASSIGNED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  
  // Claim z fronty — kdokoliv s odpovídající rolí
  "QUEUED->ASSIGNED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  
  // Pracovní přechody
  "ASSIGNED->IN_PROGRESS": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"],
  "IN_PROGRESS->WAITING_INFO": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "IN_PROGRESS->WAITING_APPROVAL": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "IN_PROGRESS->RESOLVED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "WAITING_INFO->IN_PROGRESS": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"],
  "WAITING_APPROVAL->RESOLVED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "WAITING_APPROVAL->IN_PROGRESS": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "RESOLVED->CLOSED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"],
  "RESOLVED->IN_PROGRESS": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "CLOSED->CREATED": ["ADMIN", "BROKER"],
  
  // BUDOUCÍ BACKOFFICE (odkomentovat až bude role přidána):
  // "ASSIGNED->IN_PROGRESS": [..., "BACKOFFICE"],
  // "IN_PROGRESS->WAITING_INFO": [..., "BACKOFFICE"],
  // "IN_PROGRESS->WAITING_APPROVAL": [..., "BACKOFFICE"],
  // "IN_PROGRESS->RESOLVED": [..., "BACKOFFICE"],
  // "WAITING_INFO->IN_PROGRESS": [..., "BACKOFFICE"],
  // "WAITING_APPROVAL->IN_PROGRESS": [..., "BACKOFFICE"],
  // "RESOLVED->CLOSED": [..., "BACKOFFICE"],
  // "RESOLVED->IN_PROGRESS": [..., "BACKOFFICE"],
  // "QUEUED->ASSIGNED": [..., "BACKOFFICE"],
};

// Kdo může zrušit — BACKOFFICE odstraněn
const CANCEL_ROLES = ["ADMIN"];
// BUDOUCÍ: const CANCEL_ROLES = ["ADMIN", "BACKOFFICE"];
```

---

## §4 API Struktura

### 4.1 API Routes

```
app/api/workflow/
├── route.ts                        # GET (list) + POST (create)
├── [id]/
│   ├── route.ts                    # GET (detail) + PATCH (update status/assign)
│   ├── claim/
│   │   └── route.ts                # POST (claim z fronty — QUEUED→ASSIGNED)
│   ├── comments/
│   │   └── route.ts                # GET + POST
│   ├── documents/
│   │   └── route.ts                # GET + POST (upload)
│   ├── steps/
│   │   └── route.ts                # GET (history)
│   └── watchers/
│       └── route.ts                # GET + POST + DELETE
├── stats/
│   └── route.ts                    # GET (dashboard stats per role)
├── admin/
│   └── route.ts                    # GET (admin-only system-wide stats)
└── sla-check/
    └── route.ts                    # CRON endpoint
```

### 4.2 Zod Validace (AKTUALIZOVÁNO)

```typescript
// lib/validators/workflow.ts

export const createWorkflowRequestSchema = z.object({
  type: z.enum([
    "FINANCING", "INSURANCE", "DOCUMENT", "APPROVAL", "SUPPORT",
    "INSPECTION", "CLIENT_VERIFICATION", "HANDOVER", "PRICE_CHANGE",
    "COMPLAINT", "ONBOARDING", "INTERNAL_TASK", "QUESTION", "BUG_REPORT",  // +5 nových
    "OTHER",
  ]),
  category: z.string().optional().nullable(),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  vehicleId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  inquiryId: z.string().optional().nullable(),  // NOVÉ — vazba na kupujícího
  metadata: z.record(z.unknown()).optional(),
});

export const updateWorkflowRequestSchema = z.object({
  status: z.enum([
    "QUEUED",                                    // NOVÝ stav
    "ASSIGNED", "IN_PROGRESS", "WAITING_INFO", "WAITING_APPROVAL",
    "RESOLVED", "CLOSED", "CANCELLED",
  ]).optional(),
  assignedToId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  resolution: z.string().optional(),
});

export const createWorkflowCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
  parentId: z.string().optional().nullable(),
});

export const assignWorkflowRequestSchema = z.object({
  assignedToId: z.string().min(1),
});
```

---

## §5 Real-time — Pusher integrace

### 5.1 Server-side

```typescript
// lib/pusher.ts (NOVÝ — neexistuje v kódu)

import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Channel naming convention:
// private-user-{userId}     — osobní notifikace
// private-workflow-{id}     — live updates na požadavku
// private-role-{role}       — broadcast pro celé oddělení
```

### 5.2 Client-side

```typescript
// lib/pusher-client.ts

import PusherClient from "pusher-js";

let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherInstance) {
    pusherInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return pusherInstance;
}
```

### 5.3 Eventy

| Event | Channel | Payload |
|-------|---------|---------|
| `workflow:created` | `private-role-{assignedRole}` | { requestId, type, title, priority } |
| `workflow:queued` | `private-role-{assignedRole}` | { requestId, type, title } (fronta) |
| `workflow:updated` | `private-workflow-{id}` | { status, assignedToId } |
| `workflow:comment` | `private-workflow-{id}` | { commentId, userId, content } |
| `workflow:assigned` | `private-user-{assignedToId}` | { requestId, type, title } |
| `workflow:claimed` | `private-role-{assignedRole}` | { requestId, claimedBy } |
| `notification:new` | `private-user-{userId}` | { id, title, body, link } |
| `workflow:sla-warning` | `private-user-{assignedToId}` | { requestId, minutesLeft } |

### 5.4 Multi-role notifikační flow

Při vytvoření požadavku systém notifikuje VŠECHNY relevantní:

```
Makléř klikne "Odeslat požadavek"
    │
    ▼
POST /api/workflow → createWorkflowRequest()
    │
    ├── 1. autoAssignRequest() → najde assignee
    │
    ├── 2. prisma.workflowRequest.create() → uloží do DB
    │
    ├── 3. prisma.workflowStep.create() → CREATED + ASSIGNED/QUEUED audit trail
    │
    ├── 4. createNotification(assignee) → in-app notifikace assignee (DB záznam)
    │
    ├── 5. pusher.trigger(`private-user-${assigneeId}`, "workflow:assigned", payload)
    │     → OKAMŽITÝ real-time alert v browseru assignee
    │
    ├── 6. pusher.trigger(`private-role-${assignedRole}`, "workflow:created", payload)
    │     → OKAMŽITÝ alert VŠEM členům oddělení (fronta)
    │
    ├── 7. Notifikovat VŠECHNY ADMINy (ADMIN vidí vše)
    │     → createNotification(admin) + pusher per admin
    │
    └── 8. (volitelně) sendEmail() → email backup pro offline uživatele
```

**Pusher je POVINNÝ pro produkci.** Dev může fungovat s polling fallbackem (30s), ale produkce NE — bez Pusheru systém nesplňuje požadavek "okamžitě upozornit správné lidi".

---

## §6 UI Struktura

### 6.1 Nové stránky

```
app/(pwa)/makler/workflow/
├── page.tsx                    # Redirect na role-specific view
├── loading.tsx
├── error.tsx
├── new/
│   ├── page.tsx                # Vytvoření nového požadavku
│   ├── loading.tsx
│   └── error.tsx
├── [id]/
│   ├── page.tsx                # Detail požadavku (timeline + chat + docs)
│   ├── loading.tsx
│   └── error.tsx
├── queue/
│   └── page.tsx                # Fronta — QUEUED požadavky pro claim
└── admin/
    └── page.tsx                # Admin-only: system-wide metriky, SLA, routing stats

app/(admin)/admin/workflow/
├── page.tsx                    # Admin workflow dashboard (viz §6.5)
├── loading.tsx
└── error.tsx
```

### 6.2 Nové komponenty

```
components/pwa/workflow/
├── WorkflowList.tsx            # Seznam požadavků s filtry
├── WorkflowCard.tsx            # Karta požadavku v seznamu
├── WorkflowDetail.tsx          # Detail požadavku
├── WorkflowTimeline.tsx        # Časová osa kroků
├── WorkflowComments.tsx        # Chat/komentáře thread
├── WorkflowCommentForm.tsx     # Formulář pro komentář
├── WorkflowDocuments.tsx       # Seznam dokumentů + upload
├── WorkflowStatusBadge.tsx     # Barevný badge stavu (včetně QUEUED)
├── WorkflowPriorityBadge.tsx   # Badge priority
├── WorkflowActions.tsx         # Akční tlačítka (změna stavu, přiřazení, claim)
├── WorkflowFilters.tsx         # Filtry (typ, stav, priorita, datum)
├── WorkflowStats.tsx           # Statistiky pro dashboard
├── WorkflowQueueList.tsx       # Seznam požadavků ve frontě + "Převzít" tlačítko
├── CreateWorkflowForm.tsx      # Formulář pro nový požadavek (dynamické pole per typ)
├── CreateWorkflowModal.tsx     # Quick-action modal (z detailu vozidla)
├── QuickWorkflowButton.tsx     # FAB/button pro rychlé vytvoření
├── QuickWorkflowFAB.tsx        # FAB na každé stránce PWA
└── WorkflowNotificationBadge.tsx # Badge s počtem otevřených
```

### 6.3 Rozšíření existujících komponent

| Komponenta | Změna |
|------------|-------|
| `components/pwa/TopBar.tsx` | Přidat WorkflowNotificationBadge vedle NotificationBell |
| `components/pwa/vehicles/VehicleDetailHub.tsx` | Přidat quick-action tlačítka (Financování, Pojištění, Dokumenty) |
| `components/pwa/dashboard/NotificationsList.tsx` | Rozšířit o workflow notifikace |
| `middleware.ts` | Přidat `/makler/workflow` do protectedMaklerPaths |

### 6.4 Per-role dashboardy (workflow list views)

| Role | Hlavní pohled | Tabs | KPI widgety |
|---|---|---|---|
| **BROKER** | "Moje požadavky" (vytvořil jsem) | Otevřené / Vyřešené / Všechny | Otevřené / Vyřešené / Průměrná doba |
| **REGIONAL_DIRECTOR** | "Můj tým" (požadavky mých brokerů) | Moje / Tým / Fronta | Otevřené týmu / Moje přiřazené / SLA |
| **MANAGER** | "Vše" (všechny požadavky) | Přiřazené mně / Schvalování / Fronta / Vše | Team KPIs / Approval queue / Avg response |
| **ADMIN** | "System dashboard" | Vše / SLA breach / Routing / Config | Total open / Per-type / SLA compliance % |

**Workflow page.tsx redirect logika:**
```typescript
// app/(pwa)/makler/workflow/page.tsx
// Redirect na role-appropriate view (tabs, ne separátní stránky)
// Role se detekuje ze session, zobrazí odpovídající tabs a KPI widgety
```

### 6.5 Admin Dashboard (ADMIN vidí VŠECHNO)

**Admin specifický dashboard (`app/(admin)/admin/workflow/page.tsx`):**

| Sekce | Obsah |
|---|---|
| **Přehled** | Celkový počet požadavků, otevřené, průměrná doba řešení |
| **Úvěry/Financování** | Všechny FINANCING požadavky — kolik rozpracovaných, kolik schválených, kolik zamítnutých |
| **SLA Compliance** | % požadavků vyřešených včas, per typ, per role |
| **Routing Analytics** | Kolik požadavků jde na koho, průměrné zatížení per osoba |
| **Fronta** | QUEUED požadavky — jak dlouho čekají, kdo je neclaimuje |
| **Reklamace** | COMPLAINT požadavky — zákonné lhůty, blížící se deadlines |
| **Systém Config** | (budoucí) Konfigurace SLA hodin, routing pravidel, typů |

**ADMIN oprávnění:**
- Vidí VŠECHNA data (žádný filtr)
- Může reassignovat komukoliv
- Může měnit priority a SLA
- Může zrušit jakýkoliv požadavek
- Může vidět úvěry (FINANCING), všechny workflow, interní úkoly
- Může konfigurovat systém (budoucí)

### 6.6 UI Design — Claim z fronty

```
┌──────────────────────────────────────────┐
│ Fronta (3 čekající)                      │
│                                          │
│ 💰 Financování — leasing           [!]  │
│ Škoda Octavia 2024                       │
│ Čeká 2h 15min  [URGENT]                 │
│                         [Převzít ▶]      │
│                                          │
│ 📄 Dokumenty — plná moc                 │
│ VW Golf 2023                             │
│ Čeká 45min    [NORMAL]                  │
│                         [Převzít ▶]      │
│                                          │
│ ❓ Dotaz — proces evidenční kontroly    │
│ Od: Jan Novák (makléř)                   │
│ Čeká 30min    [NORMAL]                  │
│                         [Převzít ▶]      │
└──────────────────────────────────────────┘
```

---

## §7 Offline podpora

### 7.1 IndexedDB rozšíření

```typescript
// Rozšíření lib/offline/db.ts — přidat nové stores:

workflowRequests: {
  key: string;
  value: {
    id: string;
    data: WorkflowRequestData;
    syncedAt: number;
  };
  indexes: { "by-status": string; "by-syncedAt": number };
};

workflowDrafts: {
  key: string;
  value: {
    id: string; // local UUID
    data: CreateWorkflowRequestInput;
    createdAt: number;
    synced: boolean;
  };
  indexes: { "by-synced": number };
};
```

### 7.2 Offline strategie

| Akce | Online | Offline |
|------|--------|---------|
| Čtení seznamu | API fetch | IndexedDB cache |
| Čtení detailu | API fetch | IndexedDB cache |
| Vytvoření požadavku | POST API | IndexedDB draft → pendingActions queue |
| Přidání komentáře | POST API | pendingActions queue |
| Změna stavu | PATCH API | pendingActions queue |
| Upload dokumentu | POST API | ❌ Vyžaduje online |
| Real-time updates | Pusher | ❌ Polling po reconnect |

---

## §8 Implementační plán — Fáze

### Fáze 1: DB modely + API + základní CRUD
**Soubory:** ~13 souborů  
**Závislosti:** Žádné

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 1.1 | Prisma modely | `prisma/schema.prisma` | 5 nových modelů (WorkflowRequest s inquiryId+previousAssigneeId, WorkflowStep, WorkflowComment, WorkflowDocument, WorkflowWatcher) + User/Vehicle/VehicleInquiry relace |
| 1.2 | Migrace | `prisma/migrations/` | `npx prisma migrate dev --name add_workflow_models` úspěšně proběhne |
| 1.3 | Zod validátory | `lib/validators/workflow.ts` | Schémata pro create (15 typů + inquiryId), update (QUEUED stav), comment, document |
| 1.4 | Workflow types config | `lib/workflow/types.ts` | WORKFLOW_TYPES objekt s **15 typy** (10 původních + 5 nových), ALL defaultRole=MANAGER (kromě BUG_REPORT=ADMIN), +allowedCreators |
| 1.5 | API: list + create | `app/api/workflow/route.ts` | GET: filtrování (type, status, priority, assignedToId, createdById) + **per-role visibility**. POST: vytvoření + auto-assign + allowedCreators check |
| 1.6 | API: detail + update | `app/api/workflow/[id]/route.ts` | GET: detail s includes. PATCH: změna stavu (s validací přechodů + QUEUED), přiřazení, priority |
| 1.7 | API: claim | `app/api/workflow/[id]/claim/route.ts` | POST: claim z fronty (QUEUED→ASSIGNED, nastaví assignedToId = session user) |
| 1.8 | API: comments | `app/api/workflow/[id]/comments/route.ts` | GET + POST, threaded (parentId) |
| 1.9 | API: steps (history) | `app/api/workflow/[id]/steps/route.ts` | GET: chronologická historie všech kroků |
| 1.10 | API: documents | `app/api/workflow/[id]/documents/route.ts` | GET + POST (Cloudinary upload) |
| 1.11 | Workflow helper | `lib/workflow/actions.ts` | `createWorkflowRequest()`, `updateWorkflowStatus()`, `addWorkflowStep()` — **multi-role notifikace** (assignee + oddělení + admin) |
| 1.12 | API: stats | `app/api/workflow/stats/route.ts` | GET: per-role stats |
| 1.13 | API: admin stats | `app/api/workflow/admin/route.ts` | GET: admin-only system-wide stats (financování, SLA, routing) |

**STOP kriterium:** Všech 13 souborů existuje, API routes vrací správné HTTP kódy, Prisma modely jsou migrovány. 15 typů v WORKFLOW_TYPES, QUEUED stav v state machine, per-role visibility funguje. Kontrolor ověří: schema.prisma + POST workflow + GET list (per-role filtr).

---

### Fáze 2: Workflow engine + automatické přiřazení
**Soubory:** ~10 souborů  
**Závislosti:** Fáze 1

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 2.1 | Auto-routing engine | `lib/workflow/router.ts` | `autoAssignRequest()` — hierarchický routing: BROKER→REGIONAL_DIRECTOR(managerId)→MANAGER→ADMIN, BUG_REPORT→ADMIN, fallback→QUEUED |
| 2.2 | State machine validator | `lib/workflow/state-machine.ts` | `canTransition(from, to, userRole)` → boolean. **QUEUED stav** + přechody. **BACKOFFICE odstraněn z ROLE_PERMISSIONS** (komentářem pro budoucí) |
| 2.3 | SLA calculator | `lib/workflow/sla.ts` | `calculateDueDate(type, priority)` s priority multipliers + per-category override |
| 2.4 | SLA cron check | `app/api/cron/workflow-sla/route.ts` | Hodinový cron: najdi breached SLA → notifikuj assignee + manager → nastaví slaBreached=true |
| 2.5 | Metadata schemas | `lib/workflow/metadata-schemas.ts` | Zod schemas per workflow typ (FINANCING: loanAmount, COMPLAINT: defectDescription, ONBOARDING: step, atd.) |
| 2.6 | AllowedCreators check | Integrace do `app/api/workflow/route.ts` | POST kontroluje `session.user.role ∈ WORKFLOW_TYPES[type].allowedCreators` |
| 2.7 | Claim logic | Integrace do `app/api/workflow/[id]/claim/route.ts` | Validace: požadavek musí být QUEUED, user musí mít assignedRole |
| 2.8 | Integrace do API | Úprava workflow API routes | POST volá autoAssign → ASSIGNED nebo QUEUED. PATCH volá canTransition. Oboje vytváří WorkflowStep |

**STOP kriterium:** Auto-routing přiřadí BROKER→REGIONAL_DIRECTOR (přes managerId). Pokud RD nemá → route na MANAGER. State machine odmítne nevalidní přechod. QUEUED→ASSIGNED claim funguje. BUG_REPORT jde na ADMIN.

---

### Fáze 3: Real-time notifikace (Pusher)
**Soubory:** ~7 souborů  
**Závislosti:** Fáze 1, 2

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 3.1 | Pusher server lib | `lib/pusher.ts` | Pusher instance s env vars |
| 3.2 | Pusher client lib | `lib/pusher-client.ts` | Singleton PusherClient s auth endpoint |
| 3.3 | Pusher auth endpoint | `app/api/pusher/auth/route.ts` | Autorizace private channels (user-{id}, workflow-{id}, role-{role}) |
| 3.4 | Workflow notifikace helper | `lib/workflow/notifications.ts` | `notifyWorkflow()` — multi-role: assignee + oddělení + ADMIN. Pusher + in-app + email fallback |
| 3.5 | Integrace do workflow API | Úprava workflow API routes | Každá akce (create, update, comment, claim) triggeruje notifyWorkflow() + Pusher event |
| 3.6 | usePusher hook | `hooks/usePusher.ts` | React hook pro subscribe/unsubscribe na Pusher channels |
| 3.7 | Pusher env validation | Startup check | Produkce: Pusher env vars POVINNÉ. Dev: graceful fallback na polling |

**STOP kriterium:** Po vytvoření požadavku přijde Pusher event do kanálu přiřazeného uživatele + do kanálu role + do kanálu ADMINa. NotificationBell se aktualizuje bez refreshe.

**Poznámka:** Pusher je POVINNÝ pro produkci. V dev může fungovat polling fallback (30s).

---

### Fáze 4: UI komponenty + stránky
**Soubory:** ~30 souborů  
**Závislosti:** Fáze 1, 2, 3

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 4.1 | Status + Priority badges | `WorkflowStatusBadge.tsx`, `WorkflowPriorityBadge.tsx` | Barevné badges včetně QUEUED stavu |
| 4.2 | WorkflowCard | `WorkflowCard.tsx` | Karta s typem, titulem, statusem, prioritou, assignee, SLA countdown |
| 4.3 | WorkflowFilters | `WorkflowFilters.tsx` | Filtry: typ (15), stav (9 včetně QUEUED), priorita + mobilní swipeable chips |
| 4.4 | WorkflowList | `WorkflowList.tsx` | Client component: fetch + filtry + per-role tabs + empty state |
| 4.5 | WorkflowQueueList | `WorkflowQueueList.tsx` | Fronta: QUEUED požadavky + "Převzít" tlačítko |
| 4.6 | Seznam stránka | `app/(pwa)/makler/workflow/page.tsx` + loading + error | Per-role view s odpovídajícími tabs a KPI widgety |
| 4.7 | Queue stránka | `app/(pwa)/makler/workflow/queue/page.tsx` | Fronta pro MANAGER/RD — QUEUED požadavky |
| 4.8 | WorkflowTimeline | `WorkflowTimeline.tsx` | Vertikální timeline s ikonami, barvami, timestamps (včetně QUEUED→CLAIMED) |
| 4.9 | WorkflowComments | `WorkflowComments.tsx` + `WorkflowCommentForm.tsx` | Thread komentáře s real-time (Pusher), internal flag, @mention |
| 4.10 | WorkflowDocuments | `WorkflowDocuments.tsx` | Seznam dokumentů, upload button, preview/download |
| 4.11 | WorkflowActions | `WorkflowActions.tsx` | Dropdown pro změnu stavu, přiřazení, priority, **claim** |
| 4.12 | WorkflowDetail | `WorkflowDetail.tsx` | Kompozice: header + timeline + comments + docs + actions |
| 4.13 | Detail stránka | `app/(pwa)/makler/workflow/[id]/page.tsx` + loading + error | Server component s full detail |
| 4.14 | CreateWorkflowForm | `CreateWorkflowForm.tsx` | Multi-step: typ→detail→kontext (vehicle/contact/inquiry)→odeslat. **Dynamické pole per typ** (metadata schemas) |
| 4.15 | Create stránka | `app/(pwa)/makler/workflow/new/page.tsx` + loading + error | Server component, allowedCreators check |
| 4.16 | CreateWorkflowModal | `CreateWorkflowModal.tsx` | Quick-action modal pro použití z VehicleDetailHub |
| 4.17 | QuickWorkflowButton | `QuickWorkflowButton.tsx` | FAB button v dolním rohu pro rychlé vytvoření |
| 4.18 | QuickWorkflowFAB | `QuickWorkflowFAB.tsx` | Floating action button na KAŽDÉ stránce PWA (3-tap vytvoření) |
| 4.19 | WorkflowStats | `WorkflowStats.tsx` | Per-role KPI widgety |
| 4.20 | Admin workflow stránka | `app/(admin)/admin/workflow/page.tsx` + loading + error | Admin dashboard: úvěry, SLA, routing, fronta, reklamace |
| 4.21 | Rozšíření TopBar | Úprava `components/pwa/TopBar.tsx` | Přidat workflow badge (počet přiřazených) |
| 4.22 | Rozšíření VehicleDetailHub | Úprava `components/pwa/vehicles/VehicleDetailHub.tsx` | Quick-action buttons + seznam otevřených požadavků na vozidle |
| 4.23 | Rozšíření middleware | Úprava `middleware.ts` | Přidat `/makler/workflow` do protectedMaklerPaths |
| 4.24 | Rozšíření dashboard | Úprava `app/(pwa)/makler/dashboard/page.tsx` | WorkflowStats widget na dashboardu (jako PRVNÍ sekce) |
| 4.25 | @mention UI | V WorkflowCommentForm | @username autocomplete → notifikace zmíněnému uživateli |

**STOP kriterium:** Makléř může vytvořit požadavek z /makler/workflow/new i z detailu vozidla. Seznam požadavků se filtruje per-role. QUEUED požadavky se zobrazují ve frontě s "Převzít". Detail ukazuje timeline + komentáře. Admin vidí úvěry, SLA, všechna data. Real-time update při novém komentáři.

---

### Fáze 5: Interní chat (rozšíření komentářů)
**Soubory:** ~4 soubory  
**Závislosti:** Fáze 3, 4

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 5.1 | Chat UI | `components/pwa/workflow/WorkflowChat.tsx` | Messenger-style chat UI (bubbles, timestamps, typing indicator) |
| 5.2 | Real-time chat | Integrace Pusher do WorkflowChat | Nové zprávy se zobrazí okamžitě bez refreshe |
| 5.3 | Typing indicator | Rozšíření `hooks/usePusher.ts` | `workflow:typing` event na kanálu |
| 5.4 | Chat v detailu | Úprava WorkflowDetail | Tab: Timeline / Chat / Dokumenty |

**STOP kriterium:** Dva uživatelé otevřou stejný požadavek → jeden napíše zprávu → druhý ji vidí okamžitě. Typing indicator se zobrazuje.

---

### Fáze 6: Dokumenty + přílohy + offline
**Soubory:** ~5 souborů  
**Závislosti:** Fáze 4

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 6.1 | Document upload component | `components/pwa/workflow/DocumentUpload.tsx` | Drag & drop + file picker, progress bar, category select |
| 6.2 | Document preview | `components/pwa/workflow/DocumentPreview.tsx` | In-app preview pro obrázky a PDF (iframe), download pro ostatní |
| 6.3 | Offline IndexedDB rozšíření | Úprava `lib/offline/db.ts` | Nové stores: workflowRequests, workflowDrafts (version bump) |
| 6.4 | Offline sync logic | `lib/offline/workflow-sync.ts` | Sync workflow requests z API do IndexedDB. Queue offline-created requests do pendingActions |
| 6.5 | Offline UI indikátory | Úprava workflow komponent | Offline banner v workflow seznamu, "Bude odesláno po připojení" badge na draftech |

**STOP kriterium:** Dokument se nahraje přes drag & drop, zobrazí se v seznamu s kategorií. V offline režimu se zobrazí cached požadavky, nový požadavek se uloží jako draft a odešle po připojení.

---

### Fáze 7: Integrace s existujícími modely (NOVÁ)
**Soubory:** ~5 souborů  
**Závislosti:** Fáze 2, 4

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 7.1 | Escalation → Workflow migrace | `lib/workflow/migrations/escalation-to-workflow.ts` | Jednorázový skript: starý Escalation → WorkflowRequest typ COMPLAINT/SUPPORT |
| 7.2 | EscalationForm → CreateWorkflowForm | Úprava `components/pwa/escalation/EscalationForm.tsx` | Redirect na CreateWorkflowForm s type=COMPLAINT |
| 7.3 | PriceReduction trigger | Úprava `lib/price-reduction-checker.ts` | Automatické workflow: systém navrhne snížení → vytvoří WorkflowRequest typ PRICE_CHANGE |
| 7.4 | Onboarding tracking | Integrace `lib/workflow/actions.ts` | ONBOARDING workflow sleduje proces, User.onboardingStep zůstává source-of-truth |
| 7.5 | Escalation model deprecation | Dokumentace + read-only API | Starý Escalation model: read-only pro historické záznamy |

**STOP kriterium:** Nové eskalace se vytváří jako WorkflowRequest typ COMPLAINT. PriceReduction automaticky vytváří PRICE_CHANGE workflow. Onboarding workflow trackuje kroky nového makléře.

---

## §9 Acceptance Criteria (celkové)

### Musí fungovat (P0):
1. Makléř vytvoří požadavek typu FINANCING z detailu vozidla
2. Systém automaticky přiřadí požadavek **REGIONAL_DIRECTOR** (přes managerId) nebo **MANAGER** (fallback)
3. Přiřazená osoba dostane **okamžitou** notifikaci (Pusher real-time + in-app)
4. **ADMIN dostane notifikaci o KAŽDÉM novém požadavku**
5. Přiřazená osoba změní stav na IN_PROGRESS
6. Přiřazená osoba přidá komentář — makléř vidí aktualizaci
7. Přiřazená osoba nahraje dokument (smlouva, potvrzení)
8. Přiřazená osoba změní stav na RESOLVED
9. Makléř vidí řešení, potvrdí → CLOSED
10. Celá historie je dohledatelná (WorkflowStep audit trail)
11. Dashboard ukazuje počty otevřených/přiřazených požadavků
12. **Per-role visibility:** BROKER vidí jen své, RD vidí své brokery, MANAGER/ADMIN vidí vše
13. **QUEUED stav:** Pokud auto-routing nenajde osobu → požadavek ve frontě, kdokoliv s rolí si ho "claimne"
14. **15 typů workflow** funguje (včetně COMPLAINT, ONBOARDING, INTERNAL_TASK, QUESTION, BUG_REPORT)
15. **Admin dashboard** ukazuje úvěry (FINANCING), všechny workflow, SLA compliance, routing stats
16. **inquiryId** — workflow požadavek lze svázat s dotazem kupujícího (VehicleInquiry)

### Mělo by fungovat (P1):
17. SLA timer — varování při blížícím se deadline
18. Automatická eskalace při breached SLA
19. Real-time Pusher updates (komentáře, status changes, claim)
20. Offline čtení cached požadavků
21. Offline vytvoření požadavku (queue)
22. Quick-action buttons ve VehicleDetailHub
23. Filtry a vyhledávání v seznamu požadavků
24. Multi-department handoff: WAITING_APPROVAL → automatický return k previousAssignee
25. Per-type metadata formuláře (FINANCING: částka, COMPLAINT: popis vady, atd.)
26. @mention v komentáři → notifikace zmíněnému uživateli
27. PriceReduction automaticky vytváří PRICE_CHANGE workflow request

### Bonus (P2 — neimplementovat v první iteraci):
28. Messenger-style chat (Fáze 5 — QUESTION typ pokrývá 90% potřeb)
29. Typing indicator
30. Šablony požadavků
31. Automatické workflow pro schvalování cen (integration s PriceReduction)
32. Bulk akce (přiřadit více požadavků najednou)
33. Web Push API (push notifikace i když je app zavřená)

---

## §10 Dependency Chain

```
Fáze 1 (DB + API + 15 typů)
    ├── Fáze 2 (Engine + routing + QUEUED + state machine)
    │         ├──→ Fáze 3 (Pusher + multi-role notifikace)
    │         │           ├──→ Fáze 4 (UI + per-role views + admin dashboard)
    │         │           └──→ Fáze 5 (Chat — odložené)
    │         └──→ Fáze 7 (Integrace — Escalation, PriceReduction)
    │
    └── Fáze 6 (Docs + Offline) — po Fázi 4
```

**Kritická cesta:** Fáze 1 → Fáze 2 → Fáze 3 → Fáze 4
**Paralelizovatelné:** Fáze 6 (Docs+Offline) a Fáze 7 (Integrace) mohou běžet paralelně po Fázi 2/4.

---

## §11 Rizika a mitigace

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| Pusher env vars nejsou nastaveny | Real-time nefunguje | POVINNÉ pro produkci. Dev: graceful degradation na polling (30s) |
| Schema drift při migraci | `migrate dev` fail | Standardní reset postup (viz MEMORY: recurring tsvector drift) |
| Velký počet notifikací | Performance | Pagination, batch reads, index na [userId, read] |
| Offline conflict resolution | Data inconsistency | Last-write-wins + UI indikátor "požadavek se změnil od posledního načtení" |
| Cloudinary upload limit | Document upload fail | Max 10MB per file, validace na frontendu |
| BACKOFFICE role přidání v budoucnu | Nutné přepracovat routing | Minimální zásah: změna defaultRole + odkomentování ROLE_PERMISSIONS |
| Admin overload notifikacemi | Admin ignoruje notifikace | Admin vidí agregovaný dashboard, ne každý detail. Daily digest email. |

---

## §12 Env proměnné (nové)

```env
# Pusher (POVINNÉ pro produkci, optional pro dev)
PUSHER_APP_ID=
NEXT_PUBLIC_PUSHER_KEY=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

---

## §13 NPM závislosti (nové)

```bash
npm install pusher pusher-js
```

Žádné další nové závislosti — vše ostatní (Zod, Prisma, Cloudinary, Next.js) již v projektu existuje.

---

## §14 Metadata Schemas per typ

```typescript
// lib/workflow/metadata-schemas.ts

export const WORKFLOW_METADATA_SCHEMAS = {
  FINANCING: z.object({
    loanAmount: z.number().optional(),
    loanTerm: z.number().optional(),       // měsíce
    provider: z.string().optional(),        // ESSOX, COFIDIS, bank
    interestRate: z.number().optional(),
    monthlyPayment: z.number().optional(),
    clientIncome: z.number().optional(),
    clientIdVerified: z.boolean().default(false),
  }),
  
  INSURANCE: z.object({
    coverageType: z.enum(["HAVARIJNI", "POVINNE", "GAP"]).optional(),
    insurer: z.string().optional(),
    annualPremium: z.number().optional(),
    startDate: z.string().optional(),
  }),
  
  COMPLAINT: z.object({
    defectDescription: z.string(),
    discoveredDate: z.string().optional(),
    requestedResolution: z.enum(["REPAIR", "REPLACEMENT", "REFUND", "DISCOUNT"]).optional(),
    estimatedCost: z.number().optional(),
  }),
  
  ONBOARDING: z.object({
    step: z.number(),
    documentsVerified: z.boolean().default(false),
    quizPassed: z.boolean().default(false),
    contractSigned: z.boolean().default(false),
    trainerUserId: z.string().optional(),
  }),
  
  INTERNAL_TASK: z.object({
    taskDescription: z.string(),
    expectedOutput: z.string().optional(),
    relatedUrl: z.string().optional(),
  }),
  
  BUG_REPORT: z.object({
    stepsToReproduce: z.string().optional(),
    expectedBehavior: z.string().optional(),
    actualBehavior: z.string().optional(),
    browserInfo: z.string().optional(),
    screenshotUrl: z.string().optional(),
  }),
  
  // Ostatní typy: volné metadata
} as const;
```

---

## §15 Soubory k úpravě v existujícím kódu

### Soubory které JIŽ EXISTUJÍ a potřebují update:

| Soubor | Aktuální stav | Potřebná změna |
|---|---|---|
| `lib/workflow/types.ts` | 10 typů, BACKOFFICE defaultRole | +5 typů, ALL defaultRole→MANAGER (kromě BUG_REPORT→ADMIN), +allowedCreators, +QUEUED stav |
| `lib/workflow/router.ts` | Round-robin, BACKOFFICE routing | Hierarchický: BROKER→RD→MANAGER→ADMIN, BUG_REPORT→ADMIN |
| `lib/workflow/state-machine.ts` | 8 stavů, BACKOFFICE v permissions | +QUEUED stav, BACKOFFICE odstraněn (komentář), +QUEUED přechody |
| `lib/workflow/actions.ts` | Notifikuje jen assignee | +multi-role notifikace (oddělení + admin) |
| `lib/workflow/sla.ts` | Priority multiplier only | +per-category SLA override (BUG_REPORT CRASH → 4h) |
| `prisma/schema.prisma` | WorkflowRequest bez inquiryId | +previousAssigneeId, +inquiryId, +VehicleInquiry relace, +QUEUED v komentáři |
| `lib/validators/workflow.ts` | 10 typů, bez inquiryId | +5 typů, +inquiryId, +QUEUED v update schema |

### Nové soubory potřebné:

| Soubor | Účel |
|---|---|
| `lib/workflow/metadata-schemas.ts` | Zod schemas per workflow typ |
| `lib/workflow/notifications.ts` | notifyWorkflow() — multi-role + Pusher + email |
| `lib/pusher.ts` | Pusher server instance |
| `lib/pusher-client.ts` | Pusher client singleton |
| `app/api/pusher/auth/route.ts` | Pusher auth endpoint |
| `app/api/workflow/[id]/claim/route.ts` | Claim z fronty endpoint |
| `app/api/workflow/admin/route.ts` | Admin-only stats endpoint |
| `hooks/usePusher.ts` | React hook pro real-time subscriptions |
| `components/pwa/workflow/QuickWorkflowFAB.tsx` | FAB na každé stránce |
| `components/pwa/workflow/WorkflowQueueList.tsx` | Fronta s claim tlačítky |

---

## §16 STOP Pravidla

1. **STOP-1:** Všech 15 typů musí být v WORKFLOW_TYPES. Žádný defaultRole nesmí být "BACKOFFICE".
2. **STOP-2:** Auto-routing MUSÍ používat hierarchii BROKER→RD(managerId)→MANAGER→ADMIN. Nikdy round-robin pro BACKOFFICE.
3. **STOP-3:** QUEUED stav MUSÍ existovat v state machine. Claim mechanismus MUSÍ fungovat.
4. **STOP-4:** Per-role visibility MUSÍ být implementováno v GET /api/workflow. BROKER nesmí vidět cizí požadavky.
5. **STOP-5:** ADMIN MUSÍ být notifikován o každém novém požadavku.
6. **STOP-6:** BUG_REPORT se NIKDY ne-routuje na BACKOFFICE/MANAGER — vždy na ADMIN.
7. **STOP-7:** Pusher env vars MUSÍ být nastaveny v produkci. Dev může fungovat s pollingem.
8. **STOP-8:** QUESTION typ NESMÍ vyžadovat kategorii nebo přílohy — musí být co nejrychlejší k vytvoření.
9. **STOP-9:** Workflow dashboard NESMÍ nahradit /makler/dashboard v MVP — přidá se jako widget. Plné nahrazení = fáze 2.
10. **STOP-10:** NEIMPLEMENTOVAT Web Push API v první iteraci — Pusher in-app eventy stačí.

---

## §17 Celkový scope

| Fáze | Souborů | Popis |
|---|---|---|
| Fáze 1 (DB + API) | ~13 | Schema + 15 typů + QUEUED + inquiryId + per-role visibility |
| Fáze 2 (Engine) | ~10 | Hierarchický routing + state machine + metadata schemas |
| Fáze 3 (Pusher) | ~7 | Real-time + multi-role notifikace |
| Fáze 4 (UI) | ~30 | Per-role views + admin dashboard + queue + claim + FAB |
| Fáze 5 (Chat) | ~4 | Messenger-style (odloženo) |
| Fáze 6 (Docs + Offline) | ~5 | Upload, preview, IndexedDB cache |
| Fáze 7 (Integrace) | ~5 | Escalation migration, PriceReduction trigger |
| **CELKEM** | **~74** | |
