import { Card } from "@/components/ui/Card";

interface StkInfoCardProps {
  stkLines: number | null;
  stkWaitDays: number | null;
  stkOnlineBooking: boolean;
  stkEmissions: boolean;
  stkMotorcycles: boolean;
  stkTrailers: boolean;
  stkHeavy: boolean;
}

export function StkInfoCard({
  stkLines,
  stkWaitDays,
  stkOnlineBooking,
  stkEmissions,
  stkMotorcycles,
  stkTrailers,
  stkHeavy,
}: StkInfoCardProps) {
  const capabilities = [
    { label: "Měření emisí", available: stkEmissions },
    { label: "Motocykly", available: stkMotorcycles },
    { label: "Přívěsy", available: stkTrailers },
    { label: "Nákladní vozy", available: stkHeavy },
    { label: "Online rezervace", available: stkOnlineBooking },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        STK info
      </h2>

      <dl className="space-y-2.5 text-sm">
        {stkLines != null && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Počet linek</dt>
            <dd className="font-medium text-gray-900">{stkLines}</dd>
          </div>
        )}
        {stkWaitDays != null && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Průměrná čekací doba</dt>
            <dd className="font-medium text-gray-900">
              {stkWaitDays === 0 ? "Bez čekání" : `${stkWaitDays} ${stkWaitDays === 1 ? "den" : stkWaitDays < 5 ? "dny" : "dní"}`}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {capabilities.map((cap) => (
          <span
            key={cap.label}
            className={`px-2.5 py-1 text-xs rounded-full ${
              cap.available
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-400 border border-gray-200 line-through"
            }`}
          >
            {cap.available ? "✓" : "✗"} {cap.label}
          </span>
        ))}
      </div>

      {stkWaitDays != null && (
        <p className="text-xs text-gray-400 mt-3">
          Průměrná čekací doba dle recenzí uživatelů
        </p>
      )}
    </Card>
  );
}
