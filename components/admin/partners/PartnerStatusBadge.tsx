import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; variant: "new" | "verified" | "pending" | "top" | "rejected" | "default" }> = {
  NEOSLOVENY: { label: "Neoslovený", variant: "default" },
  PRIRAZENY: { label: "Přiřazený", variant: "new" },
  OSLOVEN: { label: "Oslovený", variant: "pending" },
  JEDNAME: { label: "Jednáme", variant: "top" },
  AKTIVNI_PARTNER: { label: "Aktivní partner", variant: "verified" },
  ODMITNUTO: { label: "Odmítnuto", variant: "rejected" },
  POZASTAVENO: { label: "Pozastaveno", variant: "default" },
};

export function PartnerStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
