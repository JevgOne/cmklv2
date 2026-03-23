interface Communication {
  id: string;
  type: string;
  direction: string | null;
  summary: string;
  duration: number | null;
  result: string | null;
  createdAt: string;
}

interface CommunicationTimelineProps {
  communications: Communication[];
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  CALL: { icon: "tel", label: "Hovor", color: "bg-success-50 text-success-500" },
  SMS: { icon: "sms", label: "SMS", color: "bg-info-50 text-info-500" },
  EMAIL: { icon: "email", label: "Email", color: "bg-purple-50 text-purple-500" },
  MEETING: { icon: "meeting", label: "Schůzka", color: "bg-orange-50 text-orange-500" },
  NOTE: { icon: "note", label: "Poznámka", color: "bg-gray-100 text-gray-500" },
};

const RESULT_LABELS: Record<string, { label: string; variant: string }> = {
  INTERESTED: { label: "Zájem", variant: "text-success-500" },
  NOT_NOW: { label: "Teď ne", variant: "text-warning-500" },
  REJECTED: { label: "Odmítnutí", variant: "text-error-500" },
  FOLLOW_UP: { label: "Follow-up", variant: "text-info-500" },
};

function TypeIcon({ type }: { type: string }) {
  if (type === "CALL") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
      </svg>
    );
  }
  if (type === "SMS") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z" clipRule="evenodd" />
      </svg>
    );
  }
  if (type === "EMAIL") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.161V6a2 2 0 00-2-2H3z" />
        <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
      </svg>
    );
  }
  if (type === "MEETING") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
      </svg>
    );
  }
  // NOTE
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
    </svg>
  );
}

export function CommunicationTimeline({ communications }: CommunicationTimelineProps) {
  if (communications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Zatím žádná komunikace
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {communications.map((comm) => {
        const config = TYPE_CONFIG[comm.type] ?? TYPE_CONFIG.NOTE;
        const resultInfo = comm.result ? RESULT_LABELS[comm.result] : null;

        return (
          <div key={comm.id} className="flex gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}
            >
              <TypeIcon type={comm.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {config.label}
                </span>
                {comm.direction && (
                  <span className="text-xs text-gray-400">
                    {comm.direction === "OUTGOING" ? "Odchozí" : "Příchozí"}
                  </span>
                )}
                {resultInfo && (
                  <span className={`text-xs font-semibold ${resultInfo.variant}`}>
                    {resultInfo.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{comm.summary}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{formatDate(comm.createdAt)}</span>
                {comm.duration != null && comm.duration > 0 && (
                  <span>{formatDuration(comm.duration)}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("cs-CZ") + " " + date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}
