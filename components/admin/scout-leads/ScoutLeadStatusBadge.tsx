import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<
  string,
  {
    label: string;
    variant:
      | "new"
      | "verified"
      | "pending"
      | "top"
      | "rejected"
      | "default";
  }
> = {
  NEW: { label: "Nový", variant: "new" },
  CONTACTED: { label: "Kontaktován", variant: "pending" },
  QUALIFIED: { label: "Kvalifikován", variant: "top" },
  REJECTED: { label: "Odmítnut", variant: "rejected" },
  WON: { label: "Konvertován", variant: "verified" },
  LOST: { label: "Ztracen", variant: "default" },
};

export function ScoutLeadStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
