"use client";

interface ActivitySignalProps {
  avgResponseMinutes: number | null;
  responseRate: number | null;
  lastActiveAt: string | null;
}

function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} d`;
}

function formatLastActive(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = diff / 3600000;
  if (hours < 1) return "právě teď";
  if (hours < 24) return "dnes";
  const days = Math.floor(hours / 24);
  if (days === 1) return "včera";
  if (days < 7) return `před ${days} dny`;
  return `před ${Math.floor(days / 7)} týdny`;
}

export function ActivitySignal({
  avgResponseMinutes,
  responseRate,
  lastActiveAt,
}: ActivitySignalProps) {
  const signals: { icon: string; text: string }[] = [];

  if (avgResponseMinutes !== null) {
    signals.push({
      icon: "⚡",
      text: `Odpovídá do ${formatResponseTime(avgResponseMinutes)}`,
    });
  }

  if (responseRate !== null && responseRate > 0) {
    signals.push({
      icon: "📊",
      text: `Odpovědnost ${responseRate}%`,
    });
  }

  if (lastActiveAt) {
    signals.push({
      icon: "🟢",
      text: `Aktivní ${formatLastActive(lastActiveAt)}`,
    });
  }

  if (signals.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {signals.map((s, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 text-xs text-gray-500"
        >
          <span>{s.icon}</span>
          {s.text}
        </span>
      ))}
    </div>
  );
}
