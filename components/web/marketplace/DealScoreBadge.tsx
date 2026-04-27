interface DealScoreBadgeProps {
  score: number | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

function getScoreColor(score: number): { bg: string; text: string; ring: string } {
  if (score >= 70) return { bg: "bg-success-50", text: "text-success-600", ring: "ring-success-200" };
  if (score >= 40) return { bg: "bg-yellow-50", text: "text-yellow-600", ring: "ring-yellow-200" };
  return { bg: "bg-error-50", text: "text-error-600", ring: "ring-error-200" };
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Výborný";
  if (score >= 70) return "Dobrý";
  if (score >= 50) return "Průměrný";
  if (score >= 40) return "Podprůměrný";
  return "Rizikový";
}

export function DealScoreBadge({ score, size = "md", className = "" }: DealScoreBadgeProps) {
  if (score === null || score === undefined) return null;

  const colors = getScoreColor(score);
  const label = getScoreLabel(score);

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ring-1 ${colors.bg} ${colors.text} ${colors.ring} ${className}`}
        title={`Deal Score: ${score}/100 — ${label}`}
      >
        {score}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ring-1 ${colors.bg} ${colors.text} ${colors.ring} ${className}`}
      title={`Deal Score: ${score}/100 — ${label}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
      <span className="text-sm font-extrabold">{score}</span>
      <span className="text-xs font-medium opacity-75">{label}</span>
    </div>
  );
}
