"use client";

import { cn } from "@/lib/utils";
import { calculateCompleteness, gradeFromPercent } from "@/lib/lead-completeness";
import { Card } from "@/components/ui/Card";

interface LeadDataCompletenessProps {
  lead: Record<string, unknown>;
  category: string;
}

export function LeadDataCompleteness({ lead, category }: LeadDataCompletenessProps) {
  const calc = calculateCompleteness(lead, category);
  // Prefer DB completenessScore (scraperový 0-100) if available
  const dbScore = lead.completenessScore as number | null | undefined;
  const percent = dbScore != null && dbScore > 0 ? dbScore : calc.percent;
  const { score, max, fields } = calc;
  const { grade, color: gradeColor } = gradeFromPercent(percent);

  const barColor =
    percent >= 80
      ? "bg-green-500"
      : percent >= 50
        ? "bg-orange-500"
        : "bg-red-500";

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
        Kompletnost dat
      </h3>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0", gradeColor)}>
          {grade}
        </span>
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gray-700 tabular-nums">
          {percent}%
        </span>
        <span className="text-xs text-gray-400">
          ({score}/{max})
        </span>
      </div>

      {/* Field checklist */}
      <div className="flex flex-wrap gap-2">
        {fields.map((field) => (
          <span
            key={field.key}
            className={cn(
              "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              field.present
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {field.present ? "✓" : "✗"} {field.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
