import { WORKFLOW_TYPES, type WorkflowType } from "./types";

export function calculateDueDate(type: string, priority: string): Date {
  const config = WORKFLOW_TYPES[type as WorkflowType];
  if (!config) {
    // Fallback: 48h
    const due = new Date();
    due.setHours(due.getHours() + 48);
    return due;
  }

  let slaHours: number = config.slaHours;

  // Priority multiplier
  if (priority === "URGENT") slaHours = Math.ceil(slaHours * 0.25);
  if (priority === "HIGH") slaHours = Math.ceil(slaHours * 0.5);
  if (priority === "LOW") slaHours = slaHours * 2;

  const due = new Date();
  due.setHours(due.getHours() + slaHours);
  return due;
}
