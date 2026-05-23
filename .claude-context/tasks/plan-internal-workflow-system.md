# Plán: Interní Workflow Systém pro PWA Carmakler

**Autor:** Plánovač  
**Datum:** 2026-05-22  
**Status:** NAVRŽENO  
**Priorita:** HIGH  
**Odhadovaná komplexita:** LARGE (6 fází, ~45 souborů)

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

### 1.2 Co CHYBÍ (gap analysis)

| Oblast | Stav | Potřeba |
|--------|------|---------|
| Workflow požadavky | ❌ Neexistuje | Plný CRUD + stavový automat |
| Přiřazovací engine | ❌ Jen manuální manažer | Automatický routing podle typu |
| Interní chat | ❌ Neexistuje | Thread-based na požadavku |
| Dokumenty/přílohy | ❌ Jen escalation attachments (URL) | Upload + kategorizace |
| Audit trail | ⚠️ VehicleChangeLog existuje | Generický WorkflowStep |
| Real-time | ❌ Polling only | Pusher channels |
| SLA/eskalace | ❌ Jen manuální urgency flag | Automatické SLA timery |
| Dashboard workflow | ❌ Neexistuje | Role-based přehled |
| Offline workflow | ❌ Neexistuje | Čtení + queue pro vytváření |

### 1.3 Existující patterns k rozšíření

1. **Escalation model** → základ pro WorkflowRequest (typ, urgency, status, broker→manager)
2. **notifyMarketplace()** → pattern pro notifyWorkflow() (preferences → in-app → email → pusher)
3. **pendingActions IndexedDB** → rozšíření o workflow akce pro offline
4. **VehicleChangeLog** → inspirace pro WorkflowStep (audit trail)
5. **DealComment** → inspirace pro WorkflowComment (threaded comments s parentId)

---

## §2 Architektura — Databázové modely

### 2.1 WorkflowRequest (hlavní požadavek)

```prisma
model WorkflowRequest {
  id          String   @id @default(cuid())
  
  // Typ a kategorie
  type        String   // FINANCING, INSURANCE, DOCUMENT, APPROVAL, SUPPORT, INSPECTION, CLIENT_VERIFICATION, HANDOVER, PRICE_CHANGE, OTHER
  category    String?  // Sub-kategorie (např. FINANCING → LEASING, LOAN, CASH)
  
  // Obsah
  title       String
  description String   @db.Text
  priority    String   @default("NORMAL") // LOW, NORMAL, HIGH, URGENT
  
  // Stav
  status      String   @default("CREATED") // CREATED, ASSIGNED, IN_PROGRESS, WAITING_INFO, WAITING_APPROVAL, RESOLVED, CLOSED, CANCELLED
  
  // Kdo vytvořil
  createdById String
  createdBy   User     @relation("WorkflowCreator", fields: [createdById], references: [id])
  
  // Přiřazeno komu (osoba)
  assignedToId String?
  assignedTo   User?   @relation("WorkflowAssignee", fields: [assignedToId], references: [id])
  
  // Přiřazeno oddělení/roli
  assignedRole String?  // BACKOFFICE, MANAGER, REGIONAL_DIRECTOR, ADMIN — pro routing
  
  // Kontext — polymorfní vazby
  vehicleId    String?
  vehicle      Vehicle? @relation("WorkflowVehicle", fields: [vehicleId], references: [id])
  contactId    String?  // SellerContact ID
  contractId   String?  // Contract ID
  leadId       String?  // Lead ID
  
  // SLA
  dueAt        DateTime?  // Deadline pro vyřízení
  slaBreached  Boolean    @default(false)
  
  // Metadata
  metadata     String?    // JSON — flexibilní data podle typu (např. financing params)
  
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
  @@index([dueAt])
  @@index([slaBreached])
  @@index([createdAt])
}
```

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
  action      String   // CREATED, ASSIGNED, STATUS_CHANGED, PRIORITY_CHANGED, COMMENTED, DOCUMENT_ADDED, REASSIGNED, ESCALATED, RESOLVED, CLOSED, REOPENED
  
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

---

## §3 Workflow Engine — Stavový automat

### 3.1 Typy požadavků a automatické přiřazení

```typescript
// lib/workflow/types.ts

export const WORKFLOW_TYPES = {
  FINANCING: {
    label: "Financování",
    icon: "💰",
    defaultRole: "BACKOFFICE",
    slaHours: 24,
    categories: ["LEASING", "LOAN", "CASH"],
  },
  INSURANCE: {
    label: "Pojištění",
    icon: "🛡️",
    defaultRole: "BACKOFFICE",
    slaHours: 48,
    categories: ["HAVARIJNI", "POVINNE", "GAP"],
  },
  DOCUMENT: {
    label: "Dokumenty",
    icon: "📄",
    defaultRole: "BACKOFFICE",
    slaHours: 24,
    categories: ["SMLOUVA", "PLNA_MOC", "TECHNICAK", "EVIDENCNI_KONTROLA"],
  },
  APPROVAL: {
    label: "Schválení",
    icon: "✅",
    defaultRole: "MANAGER",
    slaHours: 12,
    categories: ["VEHICLE", "PRICE_CHANGE", "PAYOUT", "CONTRACT"],
  },
  SUPPORT: {
    label: "Podpora",
    icon: "🆘",
    defaultRole: "BACKOFFICE",
    slaHours: 8,
    categories: ["TECHNICAL", "PROCESS", "CLIENT"],
  },
  INSPECTION: {
    label: "Prohlídka/STK",
    icon: "🔍",
    defaultRole: "BACKOFFICE",
    slaHours: 72,
    categories: ["STK", "PROHLÍDKA", "CEBIA"],
  },
  CLIENT_VERIFICATION: {
    label: "Ověření klienta",
    icon: "🪪",
    defaultRole: "BACKOFFICE",
    slaHours: 24,
    categories: ["ID_CHECK", "INCOME_PROOF", "ADDRESS_PROOF"],
  },
  HANDOVER: {
    label: "Předání vozidla",
    icon: "🚗",
    defaultRole: "MANAGER",
    slaHours: 48,
    categories: ["BUYER_HANDOVER", "SELLER_PICKUP"],
  },
  PRICE_CHANGE: {
    label: "Změna ceny",
    icon: "💲",
    defaultRole: "MANAGER",
    slaHours: 12,
    categories: ["REDUCTION", "INCREASE"],
  },
  OTHER: {
    label: "Ostatní",
    icon: "📋",
    defaultRole: "BACKOFFICE",
    slaHours: 48,
    categories: [],
  },
} as const;
```

### 3.2 Stavový automat

```
CREATED ──→ ASSIGNED ──→ IN_PROGRESS ──→ RESOLVED ──→ CLOSED
  │            │              │              ↑
  │            │              ↓              │
  │            │         WAITING_INFO ───────┘
  │            │              │
  │            │              ↓
  │            │         WAITING_APPROVAL ───→ RESOLVED
  │            │                                  │
  ↓            ↓                                  ↓
CANCELLED   CANCELLED                          CLOSED
```

**Přechody stavů (kdo může):**

| Z → Na | Kdo | Automaticky? |
|--------|-----|-------------|
| CREATED → ASSIGNED | Systém | ANO (auto-routing podle typu) |
| ASSIGNED → IN_PROGRESS | Assignee | NE (manuální převzetí) |
| IN_PROGRESS → WAITING_INFO | Assignee | NE |
| WAITING_INFO → IN_PROGRESS | Kdokoliv (odpověď) | ANO (po přidání info) |
| IN_PROGRESS → WAITING_APPROVAL | Assignee | NE |
| WAITING_APPROVAL → RESOLVED | Approver (MANAGER+) | NE |
| IN_PROGRESS → RESOLVED | Assignee | NE |
| RESOLVED → CLOSED | Creator / Auto (7 dní) | HYBRID |
| * → CANCELLED | Creator / ADMIN | NE |
| CLOSED → CREATED | Creator (reopen) | NE |

### 3.3 Auto-routing logic

```typescript
// lib/workflow/router.ts

export async function autoAssignRequest(request: WorkflowRequest): Promise<{
  assignedToId?: string;
  assignedRole: string;
}> {
  const config = WORKFLOW_TYPES[request.type];
  
  // 1. Pokud má creator manažera a typ vyžaduje MANAGER → přiřaď jeho manažera
  if (config.defaultRole === "MANAGER") {
    const creator = await prisma.user.findUnique({
      where: { id: request.createdById },
      select: { managerId: true },
    });
    if (creator?.managerId) {
      return { assignedToId: creator.managerId, assignedRole: "MANAGER" };
    }
  }
  
  // 2. Round-robin v rámci role (BACKOFFICE)
  // Najdi uživatele s nejméně otevřenými požadavky
  if (config.defaultRole === "BACKOFFICE") {
    const backofficeUsers = await prisma.user.findMany({
      where: { role: "BACKOFFICE", status: "ACTIVE" },
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
    
    if (backofficeUsers[0]) {
      return { assignedToId: backofficeUsers[0].id, assignedRole: "BACKOFFICE" };
    }
  }
  
  // 3. Fallback — přiřaď jen roli (bez konkrétní osoby)
  return { assignedRole: config.defaultRole };
}
```

### 3.4 SLA Engine

```typescript
// lib/workflow/sla.ts

export function calculateDueDate(type: string, priority: string): Date {
  const config = WORKFLOW_TYPES[type];
  let slaHours = config.slaHours;
  
  // Priority multiplier
  if (priority === "URGENT") slaHours = Math.ceil(slaHours * 0.25); // 4x rychleji
  if (priority === "HIGH") slaHours = Math.ceil(slaHours * 0.5);    // 2x rychleji
  if (priority === "LOW") slaHours = slaHours * 2;                   // 2x pomalejší
  
  const due = new Date();
  due.setHours(due.getHours() + slaHours);
  return due;
}

// CRON job: app/api/cron/workflow-sla/route.ts
// Každou hodinu zkontroluje breached SLA → notifikace + eskalace
```

---

## §4 API Struktura

### 4.1 API Routes

```
app/api/workflow/
├── route.ts                        # GET (list) + POST (create)
├── [id]/
│   ├── route.ts                    # GET (detail) + PATCH (update status/assign)
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
└── sla-check/
    └── route.ts                    # CRON endpoint
```

### 4.2 Zod Validace

```typescript
// lib/validators/workflow.ts

export const createWorkflowRequestSchema = z.object({
  type: z.enum(["FINANCING", "INSURANCE", "DOCUMENT", "APPROVAL", "SUPPORT", 
                 "INSPECTION", "CLIENT_VERIFICATION", "HANDOVER", "PRICE_CHANGE", "OTHER"]),
  category: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  vehicleId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateWorkflowRequestSchema = z.object({
  status: z.enum(["ASSIGNED", "IN_PROGRESS", "WAITING_INFO", "WAITING_APPROVAL", 
                   "RESOLVED", "CLOSED", "CANCELLED"]).optional(),
  assignedToId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  resolution: z.string().optional(),
});

export const createWorkflowCommentSchema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().default(false),
  parentId: z.string().optional().nullable(),
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
| `workflow:updated` | `private-workflow-{id}` | { status, assignedToId } |
| `workflow:comment` | `private-workflow-{id}` | { commentId, userId, content } |
| `workflow:assigned` | `private-user-{assignedToId}` | { requestId, type, title } |
| `notification:new` | `private-user-{userId}` | { id, title, body, link } |
| `workflow:sla-warning` | `private-user-{assignedToId}` | { requestId, minutesLeft } |

---

## §6 UI Struktura

### 6.1 Nové stránky

```
app/(pwa)/makler/workflow/
├── page.tsx                    # Seznam požadavků (filtrovatelný)
├── loading.tsx
├── error.tsx
├── new/
│   ├── page.tsx                # Vytvoření nového požadavku
│   ├── loading.tsx
│   └── error.tsx
└── [id]/
    ├── page.tsx                # Detail požadavku (timeline + chat + docs)
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
├── WorkflowStatusBadge.tsx     # Barevný badge stavu
├── WorkflowPriorityBadge.tsx   # Badge priority
├── WorkflowActions.tsx         # Akční tlačítka (změna stavu, přiřazení)
├── WorkflowFilters.tsx         # Filtry (typ, stav, priorita, datum)
├── WorkflowStats.tsx           # Statistiky pro dashboard
├── CreateWorkflowForm.tsx      # Formulář pro nový požadavek
├── CreateWorkflowModal.tsx     # Quick-action modal (z detailu vozidla)
├── QuickWorkflowButton.tsx     # FAB/button pro rychlé vytvoření
└── WorkflowNotificationBadge.tsx # Badge s počtem otevřených
```

### 6.3 Rozšíření existujících komponent

| Komponenta | Změna |
|------------|-------|
| `components/pwa/TopBar.tsx` | Přidat WorkflowNotificationBadge vedle NotificationBell |
| `components/pwa/vehicles/VehicleDetailHub.tsx` | Přidat quick-action tlačítka (Financování, Pojištění, Dokumenty) |
| `components/pwa/dashboard/NotificationsList.tsx` | Rozšířit o workflow notifikace |
| `middleware.ts` | Přidat `/makler/workflow` do protectedMaklerPaths |

### 6.4 UI Design

**WorkflowCard (v seznamu):**
```
┌──────────────────────────────────────────┐
│ 💰 Financování — leasing                │
│ Škoda Octavia 2024 (VIN: TMB...)         │
│                                          │
│ [URGENT]  [IN_PROGRESS]   Jan Novák      │
│ Vytvořeno: 22.5. 14:30   SLA: 6h zbývá  │
└──────────────────────────────────────────┘
```

**WorkflowDetail (timeline + chat):**
```
┌──────────────────────────────────────────┐
│ ← Zpět    💰 Financování — leasing      │
│ [URGENT] [IN_PROGRESS]                   │
│                                          │
│ ━━━━━━━━ ČASOVÁ OSA ━━━━━━━━━━          │
│ 🟢 14:30 Vytvořeno — Petr Makléř        │
│ 🔵 14:31 Přiřazeno → Jana BackOffice    │
│ 🟡 14:45 Status: IN_PROGRESS            │
│ 💬 15:00 Komentář: "Klient preferuje..." │
│ 📎 15:10 Dokument: prijem_klienta.pdf   │
│                                          │
│ ━━━━━━━━ KOMENTÁŘE ━━━━━━━━━━           │
│ [text input]              [Odeslat]      │
│                                          │
│ ━━━━━━━━ DOKUMENTY ━━━━━━━━━━           │
│ 📄 prijem_klienta.pdf  [Stáhnout]       │
│ 📄 smlouva_draft.pdf   [Stáhnout]       │
│ [+ Nahrát dokument]                      │
│                                          │
│ [Změnit stav ▼] [Přiřadit ▼] [Zavřít]  │
└──────────────────────────────────────────┘
```

### 6.5 Quick-action ve VehicleDetailHub

```
// V detailu vozidla — pod existujícími akcemi:
┌──────────────────────────────────────────┐
│ Požadavky                                │
│ [💰 Financování] [🛡️ Pojištění]         │
│ [📄 Dokumenty]   [🆘 Podpora]           │
│                                          │
│ Otevřené požadavky (2):                  │
│ • Financování — IN_PROGRESS (3h)         │
│ • Dokumenty — ASSIGNED (1d)              │
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
**Soubory:** ~12 souborů  
**Závislosti:** Žádné

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 1.1 | Prisma modely | `prisma/schema.prisma` | 5 nových modelů (WorkflowRequest, WorkflowStep, WorkflowComment, WorkflowDocument, WorkflowWatcher) + User/Vehicle relace |
| 1.2 | Migrace | `prisma/migrations/` | `npx prisma migrate dev --name add_workflow_models` úspěšně proběhne |
| 1.3 | Zod validátory | `lib/validators/workflow.ts` | Schémata pro create, update, comment, document |
| 1.4 | Workflow types config | `lib/workflow/types.ts` | WORKFLOW_TYPES objekt s 10 typy, SLA, defaultRole |
| 1.5 | API: list + create | `app/api/workflow/route.ts` | GET: filtrování (type, status, priority, assignedToId, createdById), pagination. POST: vytvoření + auto-assign |
| 1.6 | API: detail + update | `app/api/workflow/[id]/route.ts` | GET: detail s includes. PATCH: změna stavu (s validací přechodů), přiřazení, priority |
| 1.7 | API: comments | `app/api/workflow/[id]/comments/route.ts` | GET + POST, threaded (parentId) |
| 1.8 | API: steps (history) | `app/api/workflow/[id]/steps/route.ts` | GET: chronologická historie všech kroků |
| 1.9 | API: documents | `app/api/workflow/[id]/documents/route.ts` | GET + POST (Cloudinary upload) |
| 1.10 | Workflow helper | `lib/workflow/actions.ts` | `createWorkflowRequest()`, `updateWorkflowStatus()`, `addWorkflowStep()` — shared logic |

**STOP kriterium:** Všech 10 souborů existuje, API routes vrací správné HTTP kódy, Prisma modely jsou migrovány. Kontrolor ověří: schema.prisma + 1 API route (POST + GET workflow).

---

### Fáze 2: Workflow engine + automatické přiřazení
**Soubory:** ~5 souborů  
**Závislosti:** Fáze 1

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 2.1 | Auto-routing engine | `lib/workflow/router.ts` | `autoAssignRequest()` — routing podle typu→role, round-robin pro BACKOFFICE, manažer-lookup pro MANAGER |
| 2.2 | State machine validator | `lib/workflow/state-machine.ts` | `canTransition(from, to, userRole)` → boolean. Validace povolených přechodů podle role |
| 2.3 | SLA calculator | `lib/workflow/sla.ts` | `calculateDueDate(type, priority)` s priority multipliers |
| 2.4 | SLA cron check | `app/api/cron/workflow-sla/route.ts` | Hodinový cron: najdi breached SLA → notifikuj assignee + manager → nastaví slaBreached=true |
| 2.5 | Integrace do API | Úprava `app/api/workflow/route.ts` + `[id]/route.ts` | POST volá autoAssign. PATCH volá canTransition. Oboje vytváří WorkflowStep |

**STOP kriterium:** Auto-routing přiřadí BACKOFFICE typu FINANCING nejméně vytíženému backoffice userovi. State machine odmítne nevalidní přechod (např. CREATED→RESOLVED). SLA cron najde expired requests.

---

### Fáze 3: Real-time notifikace (Pusher)
**Soubory:** ~6 souborů  
**Závislosti:** Fáze 1, 2

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 3.1 | Pusher server lib | `lib/pusher.ts` | Pusher instance s env vars |
| 3.2 | Pusher client lib | `lib/pusher-client.ts` | Singleton PusherClient s auth endpoint |
| 3.3 | Pusher auth endpoint | `app/api/pusher/auth/route.ts` | Autorizace private channels (user-{id}, workflow-{id}, role-{role}) |
| 3.4 | Workflow notifikace helper | `lib/workflow/notifications.ts` | `notifyWorkflow()` — pattern z marketplace: check prefs → in-app notification → Pusher event → email (optional) |
| 3.5 | Integrace do workflow API | Úprava workflow API routes | Každá akce (create, update, comment) triggeruje notifyWorkflow() + Pusher event |
| 3.6 | usePusher hook | `hooks/usePusher.ts` | React hook pro subscribe/unsubscribe na Pusher channels |

**STOP kriterium:** Po vytvoření požadavku přijde Pusher event do kanálu přiřazeného uživatele. NotificationBell se aktualizuje bez refreshe.

**Poznámka:** Pokud Pusher env vars nejsou nastaveny, systém MUSÍ fungovat i bez něj (graceful degradation na polling). `lib/pusher.ts` exportuje null pokud env chybí, `notifyWorkflow()` přeskočí Pusher eventy.

---

### Fáze 4: UI komponenty + stránky
**Soubory:** ~20 souborů  
**Závislosti:** Fáze 1, 2, 3

| # | Úkol | Soubory | AC |
|---|------|---------|-----|
| 4.1 | Status + Priority badges | `components/pwa/workflow/WorkflowStatusBadge.tsx`, `WorkflowPriorityBadge.tsx` | Barevné badges se správnými barvami a ikonami |
| 4.2 | WorkflowCard | `components/pwa/workflow/WorkflowCard.tsx` | Karta s typem, titulem, statusem, prioritou, assignee, SLA countdown |
| 4.3 | WorkflowFilters | `components/pwa/workflow/WorkflowFilters.tsx` | Filtry: typ, stav, priorita + mobilní swipeable chips |
| 4.4 | WorkflowList | `components/pwa/workflow/WorkflowList.tsx` | Client component: fetch + filtry + empty state |
| 4.5 | Seznam stránka | `app/(pwa)/makler/workflow/page.tsx` + loading + error | Server component s initial data, tabs (Moje/Všechny/Přiřazené) |
| 4.6 | WorkflowTimeline | `components/pwa/workflow/WorkflowTimeline.tsx` | Vertikální timeline s ikonami, barvami, timestamps |
| 4.7 | WorkflowComments | `components/pwa/workflow/WorkflowComments.tsx` + `WorkflowCommentForm.tsx` | Thread komentáře s real-time (Pusher), internal flag |
| 4.8 | WorkflowDocuments | `components/pwa/workflow/WorkflowDocuments.tsx` | Seznam dokumentů, upload button, preview/download |
| 4.9 | WorkflowActions | `components/pwa/workflow/WorkflowActions.tsx` | Dropdown pro změnu stavu, přiřazení, priority |
| 4.10 | WorkflowDetail | `components/pwa/workflow/WorkflowDetail.tsx` | Kompozice: header + timeline + comments + docs + actions |
| 4.11 | Detail stránka | `app/(pwa)/makler/workflow/[id]/page.tsx` + loading + error | Server component s full detail |
| 4.12 | CreateWorkflowForm | `components/pwa/workflow/CreateWorkflowForm.tsx` | Multi-step: typ→detail→kontext (vehicle/contact)→odeslat |
| 4.13 | Create stránka | `app/(pwa)/makler/workflow/new/page.tsx` + loading + error | Server component |
| 4.14 | CreateWorkflowModal | `components/pwa/workflow/CreateWorkflowModal.tsx` | Quick-action modal pro použití z VehicleDetailHub |
| 4.15 | QuickWorkflowButton | `components/pwa/workflow/QuickWorkflowButton.tsx` | FAB button v dolním rohu pro rychlé vytvoření |
| 4.16 | WorkflowStats | `components/pwa/workflow/WorkflowStats.tsx` | Počty: otevřené, moje přiřazené, breached SLA |
| 4.17 | Rozšíření TopBar | Úprava `components/pwa/TopBar.tsx` | Přidat workflow badge (počet přiřazených) |
| 4.18 | Rozšíření VehicleDetailHub | Úprava `components/pwa/vehicles/VehicleDetailHub.tsx` | Quick-action buttons + seznam otevřených požadavků na vozidle |
| 4.19 | Rozšíření middleware | Úprava `middleware.ts` | Přidat `/makler/workflow` do protectedMaklerPaths |
| 4.20 | Rozšíření dashboard | Úprava `app/(pwa)/makler/dashboard/page.tsx` | WorkflowStats widget na dashboardu |

**STOP kriterium:** Makléř může vytvořit požadavek z /makler/workflow/new i z detailu vozidla. Seznam požadavků se filtruje. Detail ukazuje timeline + komentáře. Manager vidí přiřazené požadavky. Real-time update při novém komentáři.

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
| 6.3 | Offline IndexedDB rozšíření | Úprava `lib/offline/db.ts` | Nové stores: workflowRequests, workflowDrafts (version bump na 4) |
| 6.4 | Offline sync logic | `lib/offline/workflow-sync.ts` | Sync workflow requests z API do IndexedDB. Queue offline-created requests do pendingActions |
| 6.5 | Offline UI indikátory | Úprava workflow komponent | Offline banner v workflow seznamu, "Bude odesláno po připojení" badge na draftech |

**STOP kriterium:** Dokument se nahraje přes drag & drop, zobrazí se v seznamu s kategorií. V offline režimu se zobrazí cached požadavky, nový požadavek se uloží jako draft a odešle po připojení.

---

## §9 Acceptance Criteria (celkové)

### Musí fungovat (P0):
1. Makléř vytvoří požadavek typu FINANCING z detailu vozidla
2. Systém automaticky přiřadí požadavek backoffice pracovníkovi
3. Backoffice dostane notifikaci (in-app + optional email)
4. Backoffice změní stav na IN_PROGRESS
5. Backoffice přidá komentář — makléř vidí aktualizaci
6. Backoffice nahraje dokument (smlouva, potvrzení)
7. Backoffice změní stav na RESOLVED
8. Makléř vidí řešení, potvrdí → CLOSED
9. Celá historie je dohledatelná (WorkflowStep audit trail)
10. Dashboard ukazuje počty otevřených/přiřazených požadavků

### Mělo by fungovat (P1):
11. SLA timer — varování při blížícím se deadline
12. Automatická eskalace při breached SLA
13. Real-time Pusher updates (komentáře, status changes)
14. Offline čtení cached požadavků
15. Offline vytvoření požadavku (queue)
16. Quick-action buttons ve VehicleDetailHub
17. Filtry a vyhledávání v seznamu požadavků

### Bonus (P2 — neimplementovat v první iteraci):
18. Messenger-style chat (Fáze 5 — může být odloženo)
19. Typing indicator
20. Šablony požadavků
21. Automatické workflow pro schvalování cen (integration s PriceReduction)
22. Bulk akce (přiřadit více požadavků najednou)

---

## §10 Dependency Chain

```
Fáze 1 (DB + API)
    ├── Fáze 2 (Engine) ──→ Fáze 3 (Pusher) ──→ Fáze 5 (Chat)
    │                                │
    └── Fáze 6 (Docs + Offline) ◄────┤
                                      │
                                      └──→ Fáze 4 (UI)
```

**Kritická cesta:** Fáze 1 → Fáze 2 → Fáze 4 (UI potřebuje engine + API)
**Paralelizovatelné:** Fáze 3 (Pusher) a Fáze 6 (Docs+Offline) mohou běžet paralelně po Fázi 1.

---

## §11 Rizika a mitigace

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| Pusher env vars nejsou nastaveny | Real-time nefunguje | Graceful degradation na polling (30s interval) |
| Schema drift při migraci | `migrate dev` fail | Standardní reset postup (viz MEMORY: recurring tsvector drift) |
| Velký počet notifikací | Performance | Pagination, batch reads, index na [userId, read] |
| Offline conflict resolution | Data inconsistency | Last-write-wins + UI indikátor "požadavek se změnil od posledního načtení" |
| Cloudinary upload limit | Document upload fail | Max 10MB per file, validace na frontendu |

---

## §12 Env proměnné (nové)

```env
# Pusher (optional — systém funguje i bez)
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
