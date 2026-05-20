"use client";

import { cn } from "@/lib/utils";
import { extractEquipment, type EquipmentTag } from "@/lib/equipment-parser";

interface LeadEquipmentTagsProps {
  title: string | null;
}

const typeStyles: Record<EquipmentTag["type"], string> = {
  transmission: "bg-blue-50 text-blue-700",
  fuel: "bg-blue-50 text-blue-700",
  feature: "bg-green-50 text-green-700",
  condition: "bg-amber-50 text-amber-700",
  negative: "bg-red-50 text-red-700",
};

export function LeadEquipmentTags({ title }: LeadEquipmentTagsProps) {
  const tags = extractEquipment(title);
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {tags.map((tag) => (
        <span
          key={tag.label}
          className={cn(
            "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
            typeStyles[tag.type]
          )}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}
