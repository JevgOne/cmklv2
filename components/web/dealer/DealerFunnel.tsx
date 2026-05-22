"use client";

interface FunnelData {
  total: number;
  replied: number;
  viewing: number;
  sold: number;
}

export function DealerFunnel({ funnel }: { funnel: FunnelData }) {
  const steps = [
    { label: "Poptávky", value: funnel.total, color: "bg-orange-500" },
    { label: "Odpovězeno", value: funnel.replied, color: "bg-blue-500" },
    { label: "Prohlídky", value: funnel.viewing, color: "bg-purple-500" },
    { label: "Prodáno", value: funnel.sold, color: "bg-green-500" },
  ];

  const max = funnel.total || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Konverzní trychtýř</h3>
      <div className="space-y-3">
        {steps.map((step) => {
          const pct = Math.round((step.value / max) * 100);
          return (
            <div key={step.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">{step.label}</span>
                <span className="text-gray-900 font-medium">
                  {step.value} ({pct}%)
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${step.color} rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
