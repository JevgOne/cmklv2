import type { WorkflowStatus, WorkflowPriority, WorkflowType } from "@/lib/workflow/types";

// UI interfaces — implementátor napojí na reálné API
export interface WorkflowUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatar?: string | null;
}

export interface WorkflowVehicleContext {
  id: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  thumbnailUrl: string | null;
}

export interface WorkflowContactContext {
  id: string;
  name: string;
  phone: string;
}

export interface WorkflowRequestSummary {
  id: string;
  type: WorkflowType;
  category: string | null;
  title: string;
  description: string;
  priority: WorkflowPriority;
  status: WorkflowStatus;
  createdBy: WorkflowUser;
  assignedTo: WorkflowUser | null;
  assignedRole: string | null;
  vehicleId: string | null;
  vehicleLabel?: string | null;
  vehicleContext?: WorkflowVehicleContext | null;
  contactContext?: WorkflowContactContext | null;
  dueAt: string | null;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
    documents: number;
  };
}

export interface WorkflowStep {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  performedBy: WorkflowUser;
  createdAt: string;
}

export interface WorkflowComment {
  id: string;
  content: string;
  isInternal: boolean;
  author: WorkflowUser;
  parentId: string | null;
  createdAt: string;
}

export interface WorkflowDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  category: string | null;
  size: number;
  uploadedBy: WorkflowUser;
  createdAt: string;
}

export interface WorkflowRequestDetail extends WorkflowRequestSummary {
  resolution: string | null;
  resolvedAt: string | null;
  metadata: Record<string, unknown> | null;
  steps: WorkflowStep[];
  comments: WorkflowComment[];
  documents: WorkflowDocument[];
}

export interface WorkflowStats {
  total: number;
  open: number;
  myAssigned: number;
  slaBreached: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface WorkflowFiltersState {
  type: WorkflowType | "";
  status: WorkflowStatus | "";
  priority: WorkflowPriority | "";
  tab: "my" | "assigned" | "all";
}
