interface QualityChecklistProps {
  vehicle: {
    vinLocked: boolean;
    images: { id: string }[];
    overallRating: number | null;
    description: string | null;
    contracts: { status: string }[];
  };
}

interface CheckItem {
  label: string;
  passed: boolean;
}

export function QualityChecklist({ vehicle }: QualityChecklistProps) {
  const checks: CheckItem[] = [
    {
      label: "VIN dekódován",
      passed: vehicle.vinLocked,
    },
    {
      label: `Minimálně 12 fotek (${vehicle.images.length}/12)`,
      passed: vehicle.images.length >= 12,
    },
    {
      label: `Prohlídka provedena (hodnocení ${vehicle.overallRating ?? 0}/5, min. 3)`,
      passed: (vehicle.overallRating ?? 0) >= 3,
    },
    {
      label: `Popis min. 50 znaků (${(vehicle.description ?? "").length}/50)`,
      passed: (vehicle.description ?? "").length >= 50,
    },
    {
      label: "Smlouva podepsána",
      passed: vehicle.contracts.some((c) => c.status === "SIGNED"),
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Kontrolní seznam
        </span>
        <span className="text-xs font-semibold text-gray-600">
          {passedCount}/{checks.length}
        </span>
      </div>
      {checks.map((check, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className={check.passed ? "text-success-500" : "text-error-500"}>
            {check.passed ? "\u2705" : "\u274C"}
          </span>
          <span className={check.passed ? "text-gray-700" : "text-gray-500"}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
}
