"use client";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  user: { firstName: string; lastName: string };
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  POZNAMKA: "📝",
  TELEFONAT: "📞",
  EMAIL: "📧",
  ZMENA_STAVU: "🔄",
  SYSTEM: "⚙️",
  KONVERZE: "✅",
};

export function ScoutLeadActivityLog({
  activities,
}: {
  activities: Activity[];
}) {
  if (activities.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">
        Zatím žádná aktivita
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div
          key={a.id}
          className="flex gap-3 text-sm border-b border-gray-50 pb-3 last:border-0"
        >
          <div className="text-lg">{typeIcons[a.type] || "📋"}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">{a.title}</div>
            {a.description && (
              <div className="text-gray-500 mt-0.5">{a.description}</div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              {a.user.firstName} {a.user.lastName} &middot;{" "}
              {new Date(a.createdAt).toLocaleString("cs-CZ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
