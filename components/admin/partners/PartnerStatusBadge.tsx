import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; variant: "new" | "verified" | "pending" | "top" | "rejected" | "default" }> = {
  NEOSLOVENY: { label: "Neosloveny", variant: "default" },
  PRIRAZENY: { label: "Prirazeny", variant: "new" },
  OSLOVEN: { label: "Osloven", variant: "pending" },
  JEDNAME: { label: "Jedname", variant: "top" },
  AKTIVNI_PARTNER: { label: "Aktivni partner", variant: "verified" },
  ODMITNUTO: { label: "Odmitnuto", variant: "rejected" },
  POZASTAVENO: { label: "Pozastaveno", variant: "default" },
};

export function PartnerStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
