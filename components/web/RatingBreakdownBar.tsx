interface BreakdownItem {
  stars: number;
  count: number;
  percentage: number;
}

interface Props {
  breakdown: BreakdownItem[];
}

export function RatingBreakdownBar({ breakdown }: Props) {
  const maxCount = Math.max(...breakdown.map((b) => b.count), 1);

  return (
    <div className="space-y-1.5">
      {breakdown.map((item) => (
        <div key={item.stars} className="flex items-center gap-2 text-sm">
          <span className="w-6 text-right text-gray-500 font-medium">{item.stars}★</span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-xs text-gray-400">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
