import type { WorkflowStatus } from "./types";

// Povolené přechody stavů
const TRANSITIONS: Record<string, string[]> = {
  CREATED: ["QUEUED", "ASSIGNED", "CANCELLED"],
  QUEUED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_INFO", "WAITING_APPROVAL", "RESOLVED", "CANCELLED"],
  WAITING_INFO: ["IN_PROGRESS", "CANCELLED"],
  WAITING_APPROVAL: ["RESOLVED", "IN_PROGRESS", "CANCELLED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"], // reopen
  CLOSED: ["CREATED"], // reopen as new
  CANCELLED: [],
};

// Role oprávněné provést přechod
// BACKOFFICE neexistuje — veškeré operace jdou přes MANAGER
const ROLE_PERMISSIONS: Record<string, string[]> = {
  "CREATED->QUEUED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "CREATED->ASSIGNED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"],
  "QUEUED->ASSIGNED": ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"],
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
};

// Kdokoliv s ADMIN rolí může vždy zrušit
const CANCEL_ROLES = ["ADMIN"];

export function canTransition(
  from: string,
  to: string,
  userRole: string,
  isCreator: boolean,
): boolean {
  const allowed = TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) return false;

  // CANCELLED — creator nebo admin
  if (to === "CANCELLED") {
    return isCreator || CANCEL_ROLES.includes(userRole);
  }

  // QUEUED→ASSIGNED — self-claim: broker can claim from queue
  if (from === "QUEUED" && to === "ASSIGNED") {
    return ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"].includes(userRole);
  }

  // CLOSED — creator může zavřít vyřešený
  if (from === "RESOLVED" && to === "CLOSED" && isCreator) return true;

  // REOPEN — creator může znovu otevřít
  if (from === "CLOSED" && to === "CREATED" && isCreator) return true;

  const key = `${from}->${to}`;
  const permittedRoles = ROLE_PERMISSIONS[key];
  if (!permittedRoles) return false;

  return permittedRoles.includes(userRole);
}

export function getAllowedTransitions(
  from: string,
  userRole: string,
  isCreator: boolean,
): WorkflowStatus[] {
  const allowed = TRANSITIONS[from] || [];
  return allowed.filter((to) =>
    canTransition(from, to, userRole, isCreator),
  ) as WorkflowStatus[];
}
