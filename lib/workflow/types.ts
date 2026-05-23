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
    categories: ["STK", "PROHLIDKA", "CEBIA"],
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

export type WorkflowType = keyof typeof WORKFLOW_TYPES;

export const WORKFLOW_STATUSES = [
  "CREATED",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_INFO",
  "WAITING_APPROVAL",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const WORKFLOW_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type WorkflowPriority = (typeof WORKFLOW_PRIORITIES)[number];

export const WORKFLOW_STEP_ACTIONS = [
  "CREATED",
  "ASSIGNED",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "COMMENTED",
  "DOCUMENT_ADDED",
  "REASSIGNED",
  "ESCALATED",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
] as const;
