import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  newlyUnlocked?: boolean;
}

const ICON_MAP: Record<string, string> = {
  car: "🚗",
  party: "🎉",
  zap: "⚡",
  hand: "🖐️",
  ten: "🔟",
  money: "💰",
  camera: "📸",
  sparkles: "✨",
  handshake: "🤝",
};

export function AchievementCard({
  name,
  description,
  icon,
  unlocked,
  unlockedAt,
  newlyUnlocked,
}: AchievementCardProps) {
  return (
    <Card
      className={cn(
        "p-4 relative",
        !unlocked && "opacity-50 grayscale",
        newlyUnlocked && "ring-2 ring-orange-500 ring-offset-2"
      )}
    >
      {newlyUnlocked && (
        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          NOVÉ!
        </span>
      )}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
            unlocked ? "bg-orange-50" : "bg-gray-100"
          )}
        >
          {ICON_MAP[icon] ?? "🏆"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          {unlocked && unlockedAt && (
            <p className="text-[10px] text-orange-500 font-medium mt-1">
              Získáno{" "}
              {new Date(unlockedAt).toLocaleDateString("cs-CZ", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        {unlocked && (
          <svg
            className="w-5 h-5 text-green-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </Card>
  );
}
