import { cn } from "@/lib/utils";
import { Card } from "./Card";

export interface StatCardProps {
  icon: React.ReactNode;
  iconColor?: "orange" | "green" | "blue" | "red";
  value: string;
  label: string;
  trend?: "up" | "down";
  trendValue?: string;
  className?: string;
}

const iconBgMap = {
  orange: "bg-orange-100",
  green: "bg-success-50",
  blue: "bg-info-50",
  red: "bg-error-50",
};

export function StatCard({ icon, iconColor = "orange", value, label, trend, trendValue, className }: StatCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-[22px]", iconBgMap[iconColor])}>
          {icon}
        </div>
        {trend && trendValue && (
          <div className={cn("flex items-center gap-1 text-[13px] font-semibold", trend === "up" ? "text-success-500" : "text-error-500")}>
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </div>
        )}
      </div>
      <div className="text-[32px] font-extrabold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </Card>
  );
}
