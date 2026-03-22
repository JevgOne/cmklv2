import { cn } from "@/lib/utils";

export type ListingBadgeType =
  | "broker"
  | "partner"
  | "private"
  | "top"
  | "discounted"
  | "stk_valid";

interface ListingBadgeProps {
  type: ListingBadgeType;
  /** Datum platnosti STK (pro type="stk_valid") */
  stkDate?: string;
  /** Procento slevy (pro type="discounted") */
  discountPercent?: number;
  className?: string;
}

const badgeConfig: Record<
  ListingBadgeType,
  { label: string; icon: string; className: string }
> = {
  broker: {
    label: "Ověřeno makléřem",
    icon: "✓",
    className:
      "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
  },
  partner: {
    label: "Ověřený partner",
    icon: "✓",
    className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
  },
  private: {
    label: "Soukromý",
    icon: "",
    className: "bg-gray-100 text-gray-600",
  },
  top: {
    label: "TOP",
    icon: "⭐",
    className:
      "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
  },
  discounted: {
    label: "Zlevněno",
    icon: "🏷️",
    className: "bg-green-50 text-green-700 ring-1 ring-green-200",
  },
  stk_valid: {
    label: "STK platná",
    icon: "✅",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
};

export function ListingBadge({
  type,
  stkDate,
  discountPercent,
  className,
}: ListingBadgeProps) {
  const config = badgeConfig[type];

  let label = config.label;
  if (type === "stk_valid" && stkDate) {
    label = `STK do ${stkDate}`;
  }
  if (type === "discounted" && discountPercent) {
    label = `Zlevněno o ${discountPercent} %`;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold whitespace-nowrap",
        config.className,
        className
      )}
    >
      {config.icon && <span>{config.icon}</span>}
      {label}
    </span>
  );
}
