import { cn } from "@/lib/utils";

export interface TrustScoreProps {
  value: number;
  className?: string;
}

export function TrustScore({ value, className }: TrustScoreProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 bg-white px-3.5 py-2.5 rounded-xl shadow-lg", className)}>
      <span className="text-2xl font-extrabold bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">
        {value}
      </span>
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
        Trust<br />Score
      </span>
    </div>
  );
}
